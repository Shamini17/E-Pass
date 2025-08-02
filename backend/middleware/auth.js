const jwt = require('jsonwebtoken');
const { get } = require('../config/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const authorizeStudent = async (req, res, next) => {
    try {
        const student = await get(
            'SELECT * FROM students WHERE id = ?',
            [req.user.id]
        );
        
        if (!student) {
            return res.status(403).json({ error: 'Student access required' });
        }
        
        req.student = student;
        next();
    } catch (error) {
        console.error('Student authorization error:', error);
        res.status(500).json({ error: 'Authorization failed' });
    }
};

const authorizeWarden = async (req, res, next) => {
    try {
        const warden = await get(
            'SELECT * FROM wardens WHERE id = ?',
            [req.user.id]
        );
        
        if (!warden) {
            return res.status(403).json({ error: 'Warden access required' });
        }
        
        req.warden = warden;
        next();
    } catch (error) {
        console.error('Warden authorization error:', error);
        res.status(500).json({ error: 'Authorization failed' });
    }
};

const authorizeWatchman = async (req, res, next) => {
    try {
        const watchman = await get(
            'SELECT * FROM watchmen WHERE id = ?',
            [req.user.id]
        );
        
        if (!watchman) {
            return res.status(403).json({ error: 'Watchman access required' });
        }
        
        req.watchman = watchman;
        next();
    } catch (error) {
        console.error('Watchman authorization error:', error);
        res.status(500).json({ error: 'Authorization failed' });
    }
};

module.exports = {
    authenticateToken,
    authorizeStudent,
    authorizeWarden,
    authorizeWatchman
}; 