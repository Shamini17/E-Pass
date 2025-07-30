const express = require('express');
const moment = require('moment');
const { authenticateToken, authorizeWarden } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', [authenticateToken, authorizeWarden], async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');
        const thisMonth = moment().format('YYYY-MM');

        // Today's statistics
        const [todayStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_outpasses,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_outpasses,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_outpasses,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_outpasses
             FROM outpass_requests 
             WHERE DATE(created_at) = ?`,
            [today]
        );

        // This month's statistics
        const [monthStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_outpasses,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_outpasses,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_outpasses,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_outpasses
             FROM outpass_requests 
             WHERE DATE_FORMAT(created_at, '%Y-%m') = ?`,
            [thisMonth]
        );

        // Late returns today
        const [lateReturnsToday] = await pool.execute(
            `SELECT COUNT(*) as late_returns_today
             FROM entry_exit_logs eel
             JOIN outpass_requests o ON eel.outpass_id = o.id
             WHERE DATE(eel.created_at) = ? AND eel.return_status = 'late'`,
            [today]
        );

        // Pending returns
        const [pendingReturns] = await pool.execute(
            `SELECT COUNT(*) as pending_returns
             FROM entry_exit_logs 
             WHERE exit_time IS NOT NULL AND entry_time IS NULL`
        );

        // Total students
        const [totalStudents] = await pool.execute('SELECT COUNT(*) as total_students FROM students');

        res.json({
            today: todayStats[0],
            thisMonth: monthStats[0],
            lateReturnsToday: lateReturnsToday[0].late_returns_today,
            pendingReturns: pendingReturns[0].pending_returns,
            totalStudents: totalStudents[0].total_students
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

module.exports = router; 