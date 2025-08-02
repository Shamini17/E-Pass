const express = require('express');
const { body, validationResult } = require('express-validator');
const QRCode = require('qrcode');
const { authenticateToken, authorizeWarden } = require('../middleware/auth');
const { run, get, all } = require('../config/database');
const { sendNotification } = require('../utils/notifications');

const router = express.Router();

// Get pending outpass requests
router.get('/pending', [authenticateToken, authorizeWarden], async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const pendingRequests = await all(`
            SELECT o.*, s.name as student_name, s.student_id, s.room_number, s.parent_phone, s.parent_email
            FROM outpass_requests o
            JOIN students s ON o.student_id = s.id
            WHERE o.status = 'pending'
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), offset]);

        // Get total count
        const countResult = await get(
            'SELECT COUNT(*) as total FROM outpass_requests WHERE status = "pending"'
        );

        res.json({
            requests: pendingRequests,
            pagination: {
                current: parseInt(page),
                total: countResult.total,
                pages: Math.ceil(countResult.total / limit)
            }
        });

    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
});

// Get all outpasses with filters
router.get('/outpass', [authenticateToken, authorizeWarden], async (req, res) => {
    try {
        const { status, student_id, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.*, s.name as student_name, s.student_id, s.room_number, w.name as approved_by_name
            FROM outpass_requests o
            JOIN students s ON o.student_id = s.id
            LEFT JOIN wardens w ON o.approved_by = w.id
        `;
        let params = [];

        const conditions = [];
        if (status) {
            conditions.push('o.status = ?');
            params.push(status);
        }
        if (student_id) {
            conditions.push('s.student_id = ?');
            params.push(student_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const outpasses = await all(query, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM outpass_requests o
            JOIN students s ON o.student_id = s.id
        `;
        let countParams = [];

        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
            countParams = params.slice(0, -2); // Remove limit and offset
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
        console.error('Get all outpasses error:', error);
        res.status(500).json({ error: 'Failed to fetch outpasses' });
    }
});

// Approve or reject outpass
router.put('/outpass/:id', [
    authenticateToken,
    authorizeWarden,
    body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    body('rejection_reason').optional().notEmpty().withMessage('Rejection reason is required when rejecting')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { action, rejection_reason } = req.body;
        const wardenId = req.warden.id;

        // Get outpass details
        const outpass = await get(`
            SELECT o.*, s.name as student_name, s.parent_phone, s.parent_email
            FROM outpass_requests o
            JOIN students s ON o.student_id = s.id
            WHERE o.id = ?
        `, [id]);

        if (!outpass) {
            return res.status(404).json({ error: 'Outpass not found' });
        }

        if (outpass.status !== 'pending') {
            return res.status(400).json({ error: 'Outpass is not pending' });
        }

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (action === 'approve') {
            // Generate QR code
            const qrData = JSON.stringify({
                outpass_id: outpass.id,
                student_id: outpass.student_id,
                from_date: outpass.from_date,
                to_date: outpass.to_date,
                timestamp: now
            });

            const qrCode = await QRCode.toDataURL(qrData);
            
            // Set expiry time (24 hours from now)
            const expiryTime = new Date();
            expiryTime.setHours(expiryTime.getHours() + 24);
            const qrExpiresAt = expiryTime.toISOString().slice(0, 19).replace('T', ' ');

            // Update outpass
            await run(
                `UPDATE outpass_requests 
                 SET status = 'approved', approved_by = ?, approved_at = ?, qr_code = ?, qr_expires_at = ?
                 WHERE id = ?`,
                [wardenId, now, qrCode, qrExpiresAt, id]
            );

            // Send notification to student and parents
            await sendNotification({
                studentId: outpass.student_id,
                type: 'outpass_approved',
                message: `Your outpass application for ${outpass.from_date} to ${outpass.to_date} has been approved. You can now view your QR code.`
            });

            res.json({
                message: 'Outpass approved successfully',
                qrCode: qrCode
            });

        } else if (action === 'reject') {
            if (!rejection_reason) {
                return res.status(400).json({ error: 'Rejection reason is required' });
            }

            // Update outpass
            await run(
                `UPDATE outpass_requests 
                 SET status = 'rejected', approved_by = ?, approved_at = ?, rejection_reason = ?
                 WHERE id = ?`,
                [wardenId, now, rejection_reason, id]
            );

            // Send notification to student and parents
            await sendNotification({
                studentId: outpass.student_id,
                type: 'outpass_rejected',
                message: `Your outpass application for ${outpass.from_date} to ${outpass.to_date} has been rejected. Reason: ${rejection_reason}`
            });

            res.json({
                message: 'Outpass rejected successfully'
            });
        }

    } catch (error) {
        console.error('Approve/reject outpass error:', error);
        res.status(500).json({ error: 'Failed to process outpass request' });
    }
});

// Get student details
router.get('/students/:studentId', [authenticateToken, authorizeWarden], async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await get(`
            SELECT s.*, 
                   COUNT(o.id) as total_outpasses,
                   COUNT(CASE WHEN o.status = 'approved' THEN 1 END) as approved_outpasses,
                   COUNT(CASE WHEN o.status = 'rejected' THEN 1 END) as rejected_outpasses
            FROM students s
            LEFT JOIN outpass_requests o ON s.id = o.student_id
            WHERE s.student_id = ?
            GROUP BY s.id
        `, [studentId]);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get recent outpasses
        const recentOutpasses = await all(`
            SELECT o.*, w.name as approved_by_name
            FROM outpass_requests o
            LEFT JOIN wardens w ON o.approved_by = w.id
            WHERE o.student_id = ?
            ORDER BY o.created_at DESC
            LIMIT 10
        `, [student.id]);

        res.json({
            student,
            recentOutpasses
        });

    } catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({ error: 'Failed to fetch student details' });
    }
});

// Get warden dashboard statistics
router.get('/dashboard', [authenticateToken, authorizeWarden], async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);

        const stats = await get(`
            SELECT 
                COUNT(*) as total_outpasses,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_outpasses,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_outpasses,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_outpasses,
                COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) as today_outpasses
            FROM outpass_requests
        `, [today]);

        // Get recent activity
        const recentActivity = await all(`
            SELECT o.*, s.name as student_name, s.student_id, w.name as warden_name
            FROM outpass_requests o
            JOIN students s ON o.student_id = s.id
            LEFT JOIN wardens w ON o.approved_by = w.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);

        res.json({
            stats,
            recentActivity
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

module.exports = router; 