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
    body('place').notEmpty().withMessage('Place/Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('from_date').isDate().withMessage('Valid from date is required'),
    body('from_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid from time is required (HH:MM format)'),
    body('to_date').isDate().withMessage('Valid to date is required'),
    body('to_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid to time is required (HH:MM format)'),
    body('parent_contact').notEmpty().withMessage('Parent contact is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: errors.array().map(err => `${err.param}: ${err.msg}`)
            });
        }

        const { reason, place, city, from_date, from_time, to_date, to_time, parent_contact } = req.body;
        const studentId = req.student.id;

        // Validate date/time logic
        const fromDateTime = new Date(`${from_date} ${from_time}`);
        const toDateTime = new Date(`${to_date} ${to_time}`);
        const now = new Date();

        if (fromDateTime <= now) {
            return res.status(400).json({ error: 'From date/time must be in the future. Please select a future date and time.' });
        }

        if (toDateTime <= fromDateTime) {
            return res.status(400).json({ error: 'To date/time must be after from date/time. Please ensure the end time is after the start time.' });
        }

        // Insert outpass request
        const result = await run(
            'INSERT INTO outpass_requests (student_id, reason, place, city, from_date, from_time, to_date, to_time, parent_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [studentId, reason, place, city, from_date, from_time, to_date, to_time, parent_contact]
        );

        // Send notification to parents
        try {
            await sendNotification({
                studentId,
                type: 'outpass_applied',
                message: `Your daughter ${req.student.name} has applied for an outpass to ${place}, ${city} from ${from_date} ${from_time} to ${to_date} ${to_time}. Reason: ${reason}`
            });
        } catch (notificationError) {
            console.error('Notification sending failed:', notificationError);
            // Don't fail the request if notification fails
        }

        res.status(201).json({
            message: 'Outpass application submitted successfully',
            outpassId: result.id
        });

    } catch (error) {
        console.error('Outpass application error:', error);
        res.status(500).json({ error: 'Failed to submit outpass application. Please try again.' });
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
        const student = await get('SELECT * FROM students WHERE id = ?', [studentId]);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({
            user: {
                id: student.id,
                student_id: student.student_id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                room_number: student.room_number,
                current_year: student.current_year,
                department: student.department,
                branch: student.branch,
                batch: student.batch,
                college_name: student.college_name,
                warden_name: student.warden_name,
                warden_contact: student.warden_contact,
                date_of_birth: student.date_of_birth,
                blood_group: student.blood_group,
                gender: student.gender,
                home_town: student.home_town,
                permanent_address: student.permanent_address,
                emergency_address: student.emergency_address,
                id_proof_type: student.id_proof_type,
                id_proof_number: student.id_proof_number,
                parent_name: student.parent_name,
                parent_phone: student.parent_phone,
                parent_email: student.parent_email,
                parent_occupation: student.parent_occupation,
                role: 'student'
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update student profile
router.put('/profile', [authenticateToken, authorizeStudent], async (req, res) => {
    try {
        const {
            phone, room_number,
            current_year, department, branch, batch, college_name,
            warden_name, warden_contact,
            date_of_birth, blood_group, gender,
            home_town, permanent_address, emergency_address,
            id_proof_type, id_proof_number,
            parent_phone, parent_email, parent_occupation
        } = req.body;

        const studentId = req.student.id;

        // Update student profile
        await run(`
            UPDATE students SET 
                phone = ?, room_number = ?,
                current_year = ?, department = ?, branch = ?, batch = ?, college_name = ?,
                warden_name = ?, warden_contact = ?,
                date_of_birth = ?, blood_group = ?, gender = ?,
                home_town = ?, permanent_address = ?, emergency_address = ?,
                id_proof_type = ?, id_proof_number = ?,
                parent_phone = ?, parent_email = ?, parent_occupation = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            phone, room_number,
            current_year, department, branch, batch, college_name,
            warden_name, warden_contact,
            date_of_birth, blood_group, gender,
            home_town, permanent_address, emergency_address,
            id_proof_type, id_proof_number,
            parent_phone, parent_email || null, parent_occupation,
            studentId
        ]);

        // Get updated student data
        const updatedStudent = await get('SELECT * FROM students WHERE id = ?', [studentId]);

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedStudent.id,
                student_id: updatedStudent.student_id,
                name: updatedStudent.name,
                email: updatedStudent.email,
                phone: updatedStudent.phone,
                room_number: updatedStudent.room_number,
                current_year: updatedStudent.current_year,
                department: updatedStudent.department,
                branch: updatedStudent.branch,
                batch: updatedStudent.batch,
                college_name: updatedStudent.college_name,
                warden_name: updatedStudent.warden_name,
                warden_contact: updatedStudent.warden_contact,
                date_of_birth: updatedStudent.date_of_birth,
                blood_group: updatedStudent.blood_group,
                gender: updatedStudent.gender,
                home_town: updatedStudent.home_town,
                permanent_address: updatedStudent.permanent_address,
                emergency_address: updatedStudent.emergency_address,
                id_proof_type: updatedStudent.id_proof_type,
                id_proof_number: updatedStudent.id_proof_number,
                parent_name: updatedStudent.parent_name,
                parent_phone: updatedStudent.parent_phone,
                parent_email: updatedStudent.parent_email,
                parent_occupation: updatedStudent.parent_occupation,
                role: 'student'
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
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

// Generate QR code for student
router.get('/qr/:studentId', [authenticateToken], async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Get student details
        const student = await get(
            'SELECT id, student_id, name, email, phone, room_number FROM students WHERE student_id = ?',
            [studentId]
        );

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get current entry/exit status
        const currentStatus = await get(`
            SELECT 
                o.id as outpass_id,
                o.status as outpass_status,
                o.from_date, o.from_time, o.to_date, o.to_time,
                eel.exit_time, eel.entry_time, eel.return_status
            FROM outpass_requests o
            LEFT JOIN entry_exit_logs eel ON o.id = eel.outpass_id
            WHERE o.student_id = ? 
            AND o.status = 'approved'
            AND o.to_date >= DATE('now')
            ORDER BY o.created_at DESC
            LIMIT 1
        `, [student.id]);

        // Determine current status
        let entryExitStatus = 'inside';
        let currentOutpass = null;

        if (currentStatus) {
            currentOutpass = currentStatus;
            if (currentStatus.exit_time && !currentStatus.entry_time) {
                entryExitStatus = 'outside';
            } else if (currentStatus.exit_time && currentStatus.entry_time) {
                entryExitStatus = 'returned';
            }
        }

        // Create QR data
        const qrData = {
            student_id: student.student_id,
            name: student.name,
            entry_exit_status: entryExitStatus,
            timestamp: new Date().toISOString(),
            outpass_id: currentOutpass?.outpass_id || null,
            valid_until: currentOutpass ? new Date(`${currentOutpass.to_date} ${currentOutpass.to_time}`).toISOString() : null
        };

        // Generate QR code
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            width: 256
        });

        res.json({
            success: true,
            qr_code: qrCode,
            student_data: {
                student_id: student.student_id,
                name: student.name,
                room_number: student.room_number,
                current_status: entryExitStatus,
                outpass_details: currentOutpass ? {
                    from: `${currentOutpass.from_date} ${currentOutpass.from_time}`,
                    to: `${currentOutpass.to_date} ${currentOutpass.to_time}`,
                    valid_until: currentOutpass.valid_until
                } : null
            }
        });

    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Generate QR code with validation (expires after 5 minutes)
router.post('/qr/generate', [authenticateToken, authorizeStudent], async (req, res) => {
    try {
        const studentId = req.student.id;
        
        // Get student details
        const student = await get(
            'SELECT id, student_id, name, email, phone, room_number FROM students WHERE id = ?',
            [studentId]
        );

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Check if student has an active approved outpass
        const activeOutpass = await get(`
            SELECT 
                id, from_date, from_time, to_date, to_time, reason, place, city
            FROM outpass_requests 
            WHERE student_id = ? 
            AND status = 'approved'
            AND to_date >= DATE('now')
            AND to_time >= TIME('now')
            ORDER BY created_at DESC
            LIMIT 1
        `, [studentId]);

        if (!activeOutpass) {
            return res.status(400).json({ 
                error: 'No active outpass found. Please apply for an outpass first.' 
            });
        }

        // Check if QR code already exists and is still valid (5 minutes)
        const existingQR = await get(`
            SELECT qr_code, qr_expires_at 
            FROM outpass_requests 
            WHERE id = ? AND qr_code IS NOT NULL AND qr_expires_at > datetime('now')
        `, [activeOutpass.id]);

        if (existingQR) {
            return res.json({
                success: true,
                qr_code: existingQR.qr_code,
                expires_at: existingQR.qr_expires_at,
                message: 'Using existing QR code'
            });
        }

        // Create QR data with expiration
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        const qrData = {
            student_id: student.student_id,
            name: student.name,
            outpass_id: activeOutpass.id,
            from_date: activeOutpass.from_date,
            from_time: activeOutpass.from_time,
            to_date: activeOutpass.to_date,
            to_time: activeOutpass.to_time,
            reason: activeOutpass.reason,
            place: activeOutpass.place,
            city: activeOutpass.city,
            generated_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            type: 'outpass_qr'
        };

        // Generate QR code
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            width: 256
        });

        // Store QR code in database
        await run(
            'UPDATE outpass_requests SET qr_code = ?, qr_expires_at = ? WHERE id = ?',
            [qrCode, expiresAt.toISOString(), activeOutpass.id]
        );

        res.json({
            success: true,
            qr_code: qrCode,
            expires_at: expiresAt.toISOString(),
            outpass_details: {
                id: activeOutpass.id,
                from: `${activeOutpass.from_date} ${activeOutpass.from_time}`,
                to: `${activeOutpass.to_date} ${activeOutpass.to_time}`,
                reason: activeOutpass.reason,
                place: activeOutpass.place,
                city: activeOutpass.city
            }
        });

    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Validate QR code (for watchmen to scan)
router.post('/qr/validate', [authenticateToken], async (req, res) => {
    try {
        const { qr_data, action } = req.body; // action: 'exit' or 'entry'

        if (!qr_data || !action) {
            return res.status(400).json({ error: 'QR data and action are required' });
        }

        let parsedData;
        try {
            parsedData = JSON.parse(qr_data);
        } catch (parseError) {
            return res.status(400).json({ error: 'Invalid QR code format' });
        }

        // Validate QR code expiration
        if (parsedData.expires_at && new Date(parsedData.expires_at) < new Date()) {
            return res.status(400).json({ error: 'QR code has expired' });
        }

        // Get student details
        const student = await get(
            'SELECT id, student_id, name, room_number FROM students WHERE student_id = ?',
            [parsedData.student_id]
        );

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get outpass details
        const outpass = await get(
            'SELECT * FROM outpass_requests WHERE id = ? AND status = "approved"',
            [parsedData.outpass_id]
        );

        if (!outpass) {
            return res.status(400).json({ error: 'Invalid outpass' });
        }

        // Check if outpass is still valid
        const now = new Date();
        const outpassEndTime = new Date(`${outpass.to_date} ${outpass.to_time}`);
        
        if (now > outpassEndTime) {
            return res.status(400).json({ error: 'Outpass has expired' });
        }

        // Check current entry/exit status
        const currentLog = await get(
            'SELECT * FROM entry_exit_logs WHERE outpass_id = ? ORDER BY created_at DESC LIMIT 1',
            [outpass.id]
        );

        let canProceed = false;
        let message = '';

        if (action === 'exit') {
            if (!currentLog || !currentLog.exit_time) {
                canProceed = true;
                message = 'Student can exit';
            } else if (currentLog.exit_time && currentLog.entry_time) {
                canProceed = false;
                message = 'Student has already completed this outpass';
            } else {
                canProceed = false;
                message = 'Student has already exited';
            }
        } else if (action === 'entry') {
            if (currentLog && currentLog.exit_time && !currentLog.entry_time) {
                canProceed = true;
                message = 'Student can enter';
            } else if (!currentLog || !currentLog.exit_time) {
                canProceed = false;
                message = 'Student must exit first';
            } else {
                canProceed = false;
                message = 'Student has already entered';
            }
        }

        res.json({
            success: true,
            can_proceed: canProceed,
            message: message,
            student: {
                id: student.id,
                student_id: student.student_id,
                name: student.name,
                room_number: student.room_number
            },
            outpass: {
                id: outpass.id,
                from: `${outpass.from_date} ${outpass.from_time}`,
                to: `${outpass.to_date} ${outpass.to_time}`,
                reason: outpass.reason,
                place: outpass.place,
                city: outpass.city
            },
            current_status: currentLog ? {
                exit_time: currentLog.exit_time,
                entry_time: currentLog.entry_time,
                return_status: currentLog.return_status
            } : null
        });

    } catch (error) {
        console.error('QR validation error:', error);
        res.status(500).json({ error: 'Failed to validate QR code' });
    }
});

// Get student's current QR code status
router.get('/qr/status', [authenticateToken, authorizeStudent], async (req, res) => {
    try {
        const studentId = req.student.id;

        // Get current active outpass
        const activeOutpass = await get(`
            SELECT 
                id, from_date, from_time, to_date, to_time, reason, place, city,
                qr_code, qr_expires_at, status
            FROM outpass_requests 
            WHERE student_id = ? 
            AND status = 'approved'
            AND to_date >= DATE('now')
            ORDER BY created_at DESC
            LIMIT 1
        `, [studentId]);

        if (!activeOutpass) {
            return res.json({
                has_active_outpass: false,
                message: 'No active outpass found'
            });
        }

        // Get current entry/exit status
        const currentLog = await get(`
            SELECT exit_time, entry_time, return_status
            FROM entry_exit_logs 
            WHERE outpass_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        `, [activeOutpass.id]);

        let currentStatus = 'inside';
        if (currentLog) {
            if (currentLog.exit_time && !currentLog.entry_time) {
                currentStatus = 'outside';
            } else if (currentLog.exit_time && currentLog.entry_time) {
                currentStatus = 'returned';
            }
        }

        // Check if QR code is valid
        const qrValid = activeOutpass.qr_code && 
                       activeOutpass.qr_expires_at && 
                       new Date(activeOutpass.qr_expires_at) > new Date();

        res.json({
            has_active_outpass: true,
            current_status: currentStatus,
            qr_code_valid: qrValid,
            outpass_details: {
                id: activeOutpass.id,
                from: `${activeOutpass.from_date} ${activeOutpass.from_time}`,
                to: `${activeOutpass.to_date} ${activeOutpass.to_time}`,
                reason: activeOutpass.reason,
                place: activeOutpass.place,
                city: activeOutpass.city
            },
            entry_exit_log: currentLog || null
        });

    } catch (error) {
        console.error('QR status error:', error);
        res.status(500).json({ error: 'Failed to get QR status' });
    }
});

module.exports = router; 