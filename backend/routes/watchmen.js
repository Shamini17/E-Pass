const express = require('express');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const { authenticateToken, authorizeWatchman } = require('../middleware/auth');
const { pool } = require('../config/database');
const { sendNotification } = require('../utils/notifications');

const router = express.Router();

// Scan QR code and validate outpass
router.post('/scan', [
    authenticateToken,
    authorizeWatchman,
    body('qr_data').notEmpty().withMessage('QR data is required'),
    body('action').isIn(['exit', 'entry']).withMessage('Action must be exit or entry')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { qr_data, action } = req.body;
        const watchmanId = req.watchman.id;

        let qrData;
        try {
            qrData = JSON.parse(qr_data);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid QR code data' });
        }

        const { outpassId, studentId, fromDate, toDate, fromTime, toTime } = qrData;

        // Get outpass details
        const [outpasses] = await pool.execute(
            `SELECT o.*, s.name as student_name, s.student_id, s.room_number, s.parent_phone, s.parent_email
             FROM outpass_requests o 
             JOIN students s ON o.student_id = s.id 
             WHERE o.id = ? AND o.student_id = ? AND o.status = 'approved'`,
            [outpassId, studentId]
        );

        if (outpasses.length === 0) {
            return res.status(404).json({ error: 'Outpass not found or not approved' });
        }

        const outpass = outpasses[0];

        // Check if QR code is expired
        const now = moment();
        const validUntil = moment(`${outpass.to_date} ${outpass.to_time}`);
        
        if (now.isAfter(validUntil)) {
            return res.status(400).json({ error: 'Outpass has expired' });
        }

        // Check if outpass is valid for current date/time
        const fromDateTime = moment(`${outpass.from_date} ${outpass.from_time}`);
        const toDateTime = moment(`${outpass.to_date} ${outpass.to_time}`);
        
        if (now.isBefore(fromDateTime) || now.isAfter(toDateTime)) {
            return res.status(400).json({ 
                error: 'Outpass is not valid for current date/time',
                validFrom: fromDateTime.format('YYYY-MM-DD HH:mm'),
                validTo: toDateTime.format('YYYY-MM-DD HH:mm')
            });
        }

        // Check if entry/exit log already exists
        const [existingLogs] = await pool.execute(
            'SELECT * FROM entry_exit_logs WHERE outpass_id = ?',
            [outpassId]
        );

        let logId;
        if (existingLogs.length === 0) {
            // Create new log entry
            const [logResult] = await pool.execute(
                'INSERT INTO entry_exit_logs (outpass_id, student_id) VALUES (?, ?)',
                [outpassId, studentId]
            );
            logId = logResult.insertId;
        } else {
            logId = existingLogs[0].id;
        }

        // Update log based on action
        if (action === 'exit') {
            if (existingLogs.length > 0 && existingLogs[0].exit_time) {
                return res.status(400).json({ error: 'Student has already exited' });
            }

            await pool.execute(
                'UPDATE entry_exit_logs SET exit_time = NOW(), exit_verified_by = ? WHERE id = ?',
                [watchmanId, logId]
            );

            // Send notification to parents
            await sendNotification({
                studentId,
                type: 'exit_logged',
                message: `Your daughter ${outpass.student_name} has exited the hostel at ${moment().format('YYYY-MM-DD HH:mm')}. Expected return: ${toDateTime.format('YYYY-MM-DD HH:mm')}`
            });

        } else if (action === 'entry') {
            if (existingLogs.length === 0 || !existingLogs[0].exit_time) {
                return res.status(400).json({ error: 'Student must exit before entering' });
            }

            if (existingLogs[0].entry_time) {
                return res.status(400).json({ error: 'Student has already returned' });
            }

            // Calculate if return is late
            const actualReturnTime = moment();
            const isLate = actualReturnTime.isAfter(toDateTime);
            const lateMinutes = isLate ? actualReturnTime.diff(toDateTime, 'minutes') : 0;

            await pool.execute(
                `UPDATE entry_exit_logs 
                 SET entry_time = NOW(), entry_verified_by = ?, return_status = ?, late_minutes = ?
                 WHERE id = ?`,
                [watchmanId, isLate ? 'late' : 'on_time', lateMinutes, logId]
            );

            // Send notification to parents
            const returnMessage = isLate 
                ? `Your daughter ${outpass.student_name} has returned to the hostel at ${actualReturnTime.format('YYYY-MM-DD HH:mm')}. She was ${lateMinutes} minutes late.`
                : `Your daughter ${outpass.student_name} has returned to the hostel on time at ${actualReturnTime.format('YYYY-MM-DD HH:mm')}.`;

            await sendNotification({
                studentId,
                type: isLate ? 'late_return' : 'entry_logged',
                message: returnMessage
            });
        }

        res.json({
            message: `Student ${action} logged successfully`,
            student: {
                name: outpass.student_name,
                student_id: outpass.student_id,
                room_number: outpass.room_number
            },
            action,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        });

    } catch (error) {
        console.error('QR scan error:', error);
        res.status(500).json({ error: 'Failed to process QR scan' });
    }
});

// Get today's entry/exit logs
router.get('/logs/today', [authenticateToken, authorizeWatchman], async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');

        const [logs] = await pool.execute(
            `SELECT eel.*, s.name as student_name, s.student_id, s.room_number, 
                    o.from_date, o.to_date, o.from_time, o.to_time, o.reason,
                    w1.name as exit_verified_by_name, w2.name as entry_verified_by_name
             FROM entry_exit_logs eel
             JOIN students s ON eel.student_id = s.id
             JOIN outpass_requests o ON eel.outpass_id = o.id
             LEFT JOIN watchmen w1 ON eel.exit_verified_by = w1.id
             LEFT JOIN watchmen w2 ON eel.entry_verified_by = w2.id
             WHERE DATE(eel.created_at) = ?
             ORDER BY eel.created_at DESC`,
            [today]
        );

        res.json({ logs });

    } catch (error) {
        console.error('Get today logs error:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s logs' });
    }
});

// Get pending returns (students who have exited but not returned)
router.get('/pending-returns', [authenticateToken, authorizeWatchman], async (req, res) => {
    try {
        const [pendingReturns] = await pool.execute(
            `SELECT eel.*, s.name as student_name, s.student_id, s.room_number,
                    o.from_date, o.to_date, o.from_time, o.to_time, o.reason,
                    w.name as exit_verified_by_name
             FROM entry_exit_logs eel
             JOIN students s ON eel.student_id = s.id
             JOIN outpass_requests o ON eel.outpass_id = o.id
             LEFT JOIN watchmen w ON eel.exit_verified_by = w.id
             WHERE eel.exit_time IS NOT NULL AND eel.entry_time IS NULL
             ORDER BY eel.exit_time ASC`
        );

        res.json({ pendingReturns });

    } catch (error) {
        console.error('Get pending returns error:', error);
        res.status(500).json({ error: 'Failed to fetch pending returns' });
    }
});

// Get watchman's shift logs
router.get('/my-logs', [authenticateToken, authorizeWatchman], async (req, res) => {
    try {
        const watchmanId = req.watchman.id;
        const { date } = req.query;
        const targetDate = date || moment().format('YYYY-MM-DD');

        const [logs] = await pool.execute(
            `SELECT eel.*, s.name as student_name, s.student_id, s.room_number,
                    o.from_date, o.to_date, o.from_time, o.to_time, o.reason
             FROM entry_exit_logs eel
             JOIN students s ON eel.student_id = s.id
             JOIN outpass_requests o ON eel.outpass_id = o.id
             WHERE (eel.exit_verified_by = ? OR eel.entry_verified_by = ?)
             AND DATE(eel.created_at) = ?
             ORDER BY eel.created_at DESC`,
            [watchmanId, watchmanId, targetDate]
        );

        res.json({ logs });

    } catch (error) {
        console.error('Get my logs error:', error);
        res.status(500).json({ error: 'Failed to fetch your logs' });
    }
});

module.exports = router; 