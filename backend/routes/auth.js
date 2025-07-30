const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { run, get, all } = require('../config/database');

const router = express.Router();

// Student Registration
router.post('/register', [
    body('student_id').notEmpty().withMessage('Student ID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/).withMessage('Valid phone number required'),
    body('room_number').notEmpty().withMessage('Room number is required'),
    body('parent_name').notEmpty().withMessage('Parent name is required'),
    body('parent_phone').matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/).withMessage('Valid parent phone required'),
    body('parent_email').optional().isEmail().withMessage('Valid parent email required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { student_id, name, email, password, phone, room_number, parent_name, parent_phone, parent_email } = req.body;

        // Check if student already exists
        const existingStudent = await get(
            'SELECT * FROM students WHERE email = ? OR student_id = ?',
            [email, student_id]
        );

        if (existingStudent) {
            return res.status(400).json({ error: 'Student already exists with this email or ID' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert new student
        const result = await run(
            'INSERT INTO students (student_id, name, email, password, phone, room_number, parent_name, parent_phone, parent_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [student_id, name, email, hashedPassword, phone, room_number, parent_name, parent_phone, parent_email || null]
        );

        // Generate JWT token
        const token = jwt.sign(
            { id: result.id, email, role: 'student' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            message: 'Student registered successfully',
            token,
            user: {
                id: result.id,
                student_id,
                name,
                email,
                role: 'student'
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login (for all user types)
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(['student', 'warden', 'watchman']).withMessage('Valid role is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role } = req.body;

        let table, roleField;
        switch (role) {
            case 'student':
                table = 'students';
                roleField = 'student_id';
                break;
            case 'warden':
                table = 'wardens';
                roleField = 'warden_id';
                break;
            case 'watchman':
                table = 'watchmen';
                roleField = 'watchman_id';
                break;
            default:
                return res.status(400).json({ error: 'Invalid role' });
        }

        // Find user
        const user = await get(`SELECT * FROM ${table} WHERE email = ?`, [email]);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role,
                [roleField]: user[roleField]
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role,
                [roleField]: user[roleField]
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router; 