const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeWatchman } = require('../middleware/auth');
const { run, get, all } = require('../config/database');
const moment = require('moment');
const QRCode = require('qrcode');

// Get watchman dashboard data
router.get('/dashboard', [authenticateToken, authorizeWatchman], async (req, res) => {
    try {
        const watchmanId = req.watchman.id;
        const today = moment().format('YYYY-MM-DD');

        // Get today's exits
        const todayExits = await all(`
            SELECT COUNT(*) as count FROM entry_exit_logs 
            WHERE exit_verified_by = ? AND DATE(exit_time) = ?
        `, [watchmanId, today]);

        // Get today's entries
        const todayEntries = await all(`
            SELECT COUNT(*) as count FROM entry_exit_logs 
            WHERE entry_verified_by = ? AND DATE(entry_time) = ?
        `, [watchmanId, today]);

        // Get pending returns
        const pendingReturns = await all(`
            SELECT COUNT(*) as count FROM entry_exit_logs 
            WHERE exit_time IS NOT NULL AND entry_time IS NULL
        `);

        res.json({
            stats: {
                todayExits: todayExits[0]?.count || 0,
                todayEntries: todayEntries[0]?.count || 0,
                pendingReturns: pendingReturns[0]?.count || 0
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Scan QR code for entry/exit
router.post('/scan-qr', [authenticateToken, authorizeWatchman], async (req, res) => {
    try {
        const { qrData, action } = req.body; // action: 'exit' or 'entry'
        const watchmanId = req.watchman.id;

        if (!qrData || !action) {
            return res.status(400).json({ error: 'QR data and action are required' });
        }

        // Parse QR data to get outpass ID
        let outpassId;
        try {
            const parsedData = JSON.parse(qrData);
            outpassId = parsedData.outpass_id;
        } catch (error) {
            return res.status(400).json({ error: 'Invalid QR code format' });
        }

        // Get outpass details
        const outpass = await get(`
            SELECT o.*, s.name as student_name, s.student_id, s.room_number 
            FROM outpass_requests o 
            JOIN students s ON o.student_id = s.id 
            WHERE o.id = ? AND o.status = 'approved'
        `, [outpassId]);

        if (!outpass) {
            return res.status(404).json({ error: 'Outpass not found or not approved' });
        }

        // Check if outpass is valid for current time
        const now = moment();
        const fromDateTime = moment(`${outpass.from_date} ${outpass.from_time}`);
        const toDateTime = moment(`${outpass.to_date} ${outpass.to_time}`);

        if (now.isBefore(fromDateTime) || now.isAfter(toDateTime)) {
            return res.status(400).json({ 
                error: 'Outpass is not valid for current time',
                validFrom: fromDateTime.format('YYYY-MM-DD HH:mm'),
                validTo: toDateTime.format('YYYY-MM-DD HH:mm'),
                currentTime: now.format('YYYY-MM-DD HH:mm')
            });
        }

        // Check if log already exists
        let log = await get(`
            SELECT * FROM entry_exit_logs 
            WHERE outpass_id = ? AND student_id = ?
        `, [outpassId, outpass.student_id]);

        if (!log) {
            // Create new log entry
            const result = await run(`
                INSERT INTO entry_exit_logs (outpass_id, student_id, exit_verified_by, exit_time, created_at)
                VALUES (?, ?, ?, ?, ?)
            `, [outpassId, outpass.student_id, watchmanId, moment().format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')]);
            
            log = { id: result.id };
        }

        let returnMessage = '';
        let isLate = false;

        if (action === 'entry') {
            // Log entry
            const entryTime = moment();
            const approvedToTime = moment(`${outpass.to_date} ${outpass.to_time}`);
            
            isLate = entryTime.isAfter(approvedToTime);
            
            await run(`
                UPDATE entry_exit_logs 
                SET entry_verified_by = ?, entry_time = ?, return_status = ?
                WHERE id = ?
            `, [watchmanId, entryTime.format('YYYY-MM-DD HH:mm:ss'), isLate ? 'late' : 'on_time', log.id]);

            returnMessage = isLate ? 
                `Student returned late at ${entryTime.format('HH:mm')}` : 
                `Student returned on time at ${entryTime.format('HH:mm')}`;

            // Send notification to parent
            try {
                const { sendNotification } = require('../utils/notifications');
                await sendNotification({
                    type: isLate ? 'late_return' : 'entry_logged',
                    message: returnMessage
                });
            } catch (notificationError) {
                console.error('Notification error:', notificationError);
            }
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

        const logs = await all(`
            SELECT eel.*, s.name as student_name, s.student_id, s.room_number, 
                    o.from_date, o.to_date, o.from_time, o.to_time, o.reason,
                    w1.name as exit_verified_by_name, w2.name as entry_verified_by_name
             FROM entry_exit_logs eel
             JOIN students s ON eel.student_id = s.id
             JOIN outpass_requests o ON eel.outpass_id = o.id
             LEFT JOIN watchmen w1 ON eel.exit_verified_by = w1.id
             LEFT JOIN watchmen w2 ON eel.entry_verified_by = w2.id
             WHERE DATE(eel.created_at) = ?
             ORDER BY eel.created_at DESC
        `, [today]);

        res.json({ logs: logs || [] });

    } catch (error) {
        console.error('Get today logs error:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s logs' });
    }
});

// Get pending returns (students who have exited but not returned)
router.get('/pending-returns', [authenticateToken, authorizeWatchman], async (req, res) => {
    try {
        const pendingReturns = await all(`
            SELECT eel.*, s.name as student_name, s.student_id, s.room_number,
                    o.from_date, o.to_date, o.from_time, o.to_time, o.reason,
                    w.name as exit_verified_by_name
             FROM entry_exit_logs eel
             JOIN students s ON eel.student_id = s.id
             JOIN outpass_requests o ON eel.outpass_id = o.id
             LEFT JOIN watchmen w ON eel.exit_verified_by = w.id
             WHERE eel.exit_time IS NOT NULL AND eel.entry_time IS NULL
             ORDER BY eel.exit_time ASC
        `);

        res.json({ pendingReturns: pendingReturns || [] });

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

        const logs = await all(`
            SELECT eel.*, s.name as student_name, s.student_id, s.room_number,
                    o.from_date, o.to_date, o.from_time, o.to_time, o.reason
             FROM entry_exit_logs eel
             JOIN students s ON eel.student_id = s.id
             JOIN outpass_requests o ON eel.outpass_id = o.id
             WHERE (eel.exit_verified_by = ? OR eel.entry_verified_by = ?)
             AND DATE(eel.created_at) = ?
             ORDER BY eel.created_at DESC
        `, [watchmanId, watchmanId, targetDate]);

        res.json({ logs: logs || [] });

    } catch (error) {
        console.error('Get my logs error:', error);
        res.status(500).json({ error: 'Failed to fetch your logs' });
    }
});

module.exports = router; 