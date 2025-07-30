const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const authorizeStudent = async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM students WHERE id = ?',
            [req.user.id]
        );
        
        if (rows.length === 0) {
            return res.status(403).json({ error: 'Student access required' });
        }
        
        req.student = rows[0];
        next();
    } catch (error) {
        res.status(500).json({ error: 'Authorization failed' });
    }
};

const authorizeWarden = async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM wardens WHERE id = ?',
            [req.user.id]
        );
        
        if (rows.length === 0) {
            return res.status(403).json({ error: 'Warden access required' });
        }
        
        req.warden = rows[0];
        next();
    } catch (error) {
        res.status(500).json({ error: 'Authorization failed' });
    }
};

const authorizeWatchman = async (req, res, next) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM watchmen WHERE id = ?',
            [req.user.id]
        );
        
        if (rows.length === 0) {
            return res.status(403).json({ error: 'Watchman access required' });
        }
        
        req.watchman = rows[0];
        next();
    } catch (error) {
        res.status(500).json({ error: 'Authorization failed' });
    }
};

module.exports = {
    authenticateToken,
    authorizeStudent,
    authorizeWarden,
    authorizeWatchman
}; 