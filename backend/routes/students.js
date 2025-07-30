const express = require('express');
const { body, validationResult } = require('express-validator');
const QRCode = require('qrcode');
const { authenticateToken, authorizeStudent } = require('../middleware/auth');
const { run, get, all } = require('../config/database');
const { sendNotification } = require('../utils/notifications');

const router = express.Router();

// Apply for outpass
router.post('/outpass', [
    authenticateToken,
    authorizeStudent,
    body('reason').notEmpty().withMessage('Reason is required'),
    body('from_date').isDate().withMessage('Valid from date is required'),
    body('from_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid from time is required'),
    body('to_date').isDate().withMessage('Valid to date is required'),
    body('to_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid to time is required'),
    body('parent_contact').notEmpty().withMessage('Parent contact is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { reason, from_date, from_time, to_date, to_time, parent_contact } = req.body;
        const studentId = req.student.id;

        // Validate date/time logic
        const fromDateTime = new Date(`${from_date} ${from_time}`);
        const toDateTime = new Date(`${to_date} ${to_time}`);
        const now = new Date();

        if (fromDateTime <= now) {
            return res.status(400).json({ error: 'From date/time must be in the future' });
        }

        if (toDateTime <= fromDateTime) {
            return res.status(400).json({ error: 'To date/time must be after from date/time' });
        }

        // Insert outpass request
        const result = await run(
            'INSERT INTO outpass_requests (student_id, reason, from_date, from_time, to_date, to_time, parent_contact) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [studentId, reason, from_date, from_time, to_date, to_time, parent_contact]
        );

        // Send notification to parents
        await sendNotification({
            studentId,
            type: 'outpass_applied',
            message: `Your daughter ${req.student.name} has applied for an outpass from ${from_date} ${from_time} to ${to_date} ${to_time}. Reason: ${reason}`
        });

        res.status(201).json({
            message: 'Outpass application submitted successfully',
            outpassId: result.id
        });

    } catch (error) {
        console.error('Outpass application error:', error);
        res.status(500).json({ error: 'Failed to submit outpass application' });
    }
});

// Get student's outpass history
router.get('/outpass', [authenticateToken, authorizeStudent], async (req, res) => {
    try {
        const studentId = req.student.id;
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.*, w.name as approved_by_name, eel.exit_time, eel.entry_time, eel.return_status
            FROM outpass_requests o
            LEFT JOIN wardens w ON o.approved_by = w.id
            LEFT JOIN entry_exit_logs eel ON o.id = eel.outpass_id
            WHERE o.student_id = ?
        `;
        let params = [studentId];

        if (status) {
            query += ' AND o.status = ?';
            params.push(status);
        }

        query += ' ORDER BY o.created_at DESC';
        
        if (limit !== 'all') {
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);
        }

        const outpasses = await all(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM outpass_requests WHERE student_id = ?';
        let countParams = [studentId];

        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }

        const countResult = await get(countQuery, countParams);

        res.json({
            outpasses,
            pagination: {
                current: parseInt(page),
                total: countResult.total,
                pages: Math.ceil(countResult.total / limit)
            }
        });

    } catch (error) {
        console.error('Get outpass history error:', error);
        res.status(500).json({ error: 'Failed to fetch outpass history' });
    }
});

// Get active outpass
router.get('/outpass/active', [authenticateToken, authorizeStudent], async (req, res) => {
    try {
        const studentId = req.student.id;
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const activeOutpass = await get(`
            SELECT o.*, w.name as approved_by_name
            FROM outpass_requests o
            LEFT JOIN wardens w ON o.approved_by = w.id
            WHERE o.student_id = ? 
            AND o.status = 'approved'
            AND o.qr_expires_at > ?
            ORDER BY o.created_at DESC
            LIMIT 1
        `, [studentId, now]);

        res.json({ activeOutpass });

    } catch (error) {
        console.error('Get active outpass error:', error);
        res.status(500).json({ error: 'Failed to fetch active outpass' });
    }
});

// Get specific outpass details with QR code
router.get('/outpass/:id', [authenticateToken, authorizeStudent], async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.student.id;

        const outpass = await get(`
            SELECT o.*, w.name as approved_by_name, eel.exit_time, eel.entry_time, eel.return_status
            FROM outpass_requests o
            LEFT JOIN wardens w ON o.approved_by = w.id
            LEFT JOIN entry_exit_logs eel ON o.id = eel.outpass_id
            WHERE o.id = ? AND o.student_id = ?
        `, [id, studentId]);

        if (!outpass) {
            return res.status(404).json({ error: 'Outpass not found' });
        }

        // Generate QR code if approved
        if (outpass.status === 'approved' && outpass.qr_code) {
            try {
                const qrCodeDataURL = await QRCode.toDataURL(outpass.qr_code);
                outpass.qr_code_image = qrCodeDataURL;
            } catch (error) {
                console.error('QR code generation error:', error);
            }
        }

        res.json({ outpass });

    } catch (error) {
        console.error('Get outpass details error:', error);
        res.status(500).json({ error: 'Failed to fetch outpass details' });
    }
});

// Get student profile
router.get('/profile', [authenticateToken, authorizeStudent], async (req, res) => {
    try {
        const studentId = req.student.id;

        const student = await get(
            'SELECT id, student_id, name, email, phone, room_number, parent_name, parent_phone, parent_email, created_at FROM students WHERE id = ?',
            [studentId]
        );

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ student });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update student profile
router.put('/profile', [
    authenticateToken,
    authorizeStudent,
    body('phone').optional().matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/).withMessage('Valid phone number required'),
    body('parent_phone').optional().matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/).withMessage('Valid parent phone required'),
    body('parent_email').optional().isEmail().withMessage('Valid parent email required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const studentId = req.student.id;
        const { phone, parent_phone, parent_email } = req.body;

        const result = await run(
            'UPDATE students SET phone = ?, parent_phone = ?, parent_email = ? WHERE id = ?',
            [phone, parent_phone, parent_email, studentId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get notifications
router.get('/notifications', [authenticateToken, authorizeStudent], async (req, res) => {
    try {
        const studentId = req.student.id;
        const { limit = 10 } = req.query;

        const notifications = await all(`
            SELECT * FROM notifications 
            WHERE student_id = ? 
            ORDER BY sent_at DESC 
            LIMIT ?
        `, [studentId, parseInt(limit)]);

        res.json({ notifications });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Confirm return manually (if QR was not scanned)
router.post('/return-confirm/:outpassId', [authenticateToken, authorizeStudent], async (req, res) => {
    try {
        const { outpassId } = req.params;
        const studentId = req.student.id;

        // Check if outpass exists and belongs to student
        const outpass = await get(
            'SELECT * FROM outpass_requests WHERE id = ? AND student_id = ? AND status = "approved"',
            [outpassId, studentId]
        );

        if (!outpass) {
            return res.status(404).json({ error: 'Outpass not found or not approved' });
        }

        // Check if entry log already exists
        const existingLog = await get(
            'SELECT * FROM entry_exit_logs WHERE outpass_id = ?',
            [outpassId]
        );

        if (existingLog && existingLog.entry_time) {
            return res.status(400).json({ error: 'Return already confirmed' });
        }

        // Create or update entry log
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const toDateTime = new Date(`${outpass.to_date} ${outpass.to_time}`);
        const isLate = new Date() > toDateTime;
        const lateMinutes = isLate ? Math.floor((new Date() - toDateTime) / (1000 * 60)) : 0;

        if (existingLog) {
            await run(
                `UPDATE entry_exit_logs 
                 SET entry_time = ?, return_status = ?, late_minutes = ?
                 WHERE outpass_id = ?`,
                [now, isLate ? 'late' : 'on_time', lateMinutes, outpassId]
            );
        } else {
            await run(
                `INSERT INTO entry_exit_logs (outpass_id, student_id, entry_time, return_status, late_minutes)
                 VALUES (?, ?, ?, ?, ?)`,
                [outpassId, studentId, now, isLate ? 'late' : 'on_time', lateMinutes]
            );
        }

        // Send notification
        const message = isLate
            ? `Your daughter ${req.student.name} has confirmed return at ${now}. She was ${lateMinutes} minutes late.`
            : `Your daughter ${req.student.name} has confirmed return on time at ${now}.`;

        await sendNotification({
            studentId,
            type: isLate ? 'late_return' : 'entry_logged',
            message
        });

        res.json({
            message: 'Return confirmed successfully',
            isLate,
            lateMinutes
        });

    } catch (error) {
        console.error('Return confirmation error:', error);
        res.status(500).json({ error: 'Failed to confirm return' });
    }
});

// Get student statistics
router.get('/stats', [authenticateToken, authorizeStudent], async (req, res) => {
    try {
        const studentId = req.student.id;

        const stats = await get(`
            SELECT 
                COUNT(*) as total_outpasses,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_outpasses,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_outpasses,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_outpasses,
                COUNT(CASE WHEN eel.return_status = 'late' THEN 1 END) as late_returns
            FROM outpass_requests o
            LEFT JOIN entry_exit_logs eel ON o.id = eel.outpass_id
            WHERE o.student_id = ?
        `, [studentId]);

        res.json({ stats });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router; 