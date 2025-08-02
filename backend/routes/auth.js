const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { run, get, all } = require('../config/database');

const router = express.Router();

// Student registration
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('student_id').notEmpty().withMessage('Student ID is required'),
    body('phone').matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/).withMessage('Valid phone number required'),
    body('room_number').notEmpty().withMessage('Room number is required'),
    body('department').notEmpty().withMessage('Department is required'),
    
    // Parent Information
    body('parent_name').notEmpty().withMessage('Parent name is required'),
    body('parent_phone').matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/).withMessage('Valid parent phone required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name, email, password, student_id, phone, room_number, department,
            parent_name, parent_phone, parent_email
        } = req.body;

        // Manual validation for parent_email
        if (parent_email && parent_email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(parent_email)) {
                return res.status(400).json({ 
                    errors: [{
                        type: 'field',
                        value: parent_email,
                        msg: 'Valid parent email required if provided',
                        path: 'parent_email',
                        location: 'body'
                    }]
                });
            }
        }

        // Check if student already exists
        const existingStudent = await get('SELECT * FROM students WHERE email = ? OR student_id = ?', [email, student_id]);
        if (existingStudent) {
            return res.status(400).json({ error: 'Student with this email or student ID already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert new student with default values for optional fields
        const result = await run(`
            INSERT INTO students (
                student_id, name, email, password, phone, room_number, department,
                current_year, branch, batch, college_name,
                warden_name, warden_contact,
                date_of_birth, blood_group, gender,
                home_town, permanent_address, emergency_address,
                id_proof_type, id_proof_number,
                parent_name, parent_phone, parent_email, parent_occupation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            student_id, name, email, hashedPassword, phone, room_number, department,
            1, // default current_year
            department, // use department as branch
            '2024', // default batch
            'ABC College', // default college_name
            'Mrs. Sarah Johnson', // default warden_name
            '9876543210', // default warden_contact
            '2000-01-01', // default date_of_birth
            'A+', // default blood_group
            'Female', // default gender
            'Not specified', // default home_town
            'Not specified', // default permanent_address
            'Not specified', // default emergency_address
            'College ID', // default id_proof_type
            student_id, // use student_id as id_proof_number
            parent_name, parent_phone, parent_email || null, 'Not specified' // default parent_occupation
        ]);

        // Get the created student
        const newStudent = await get('SELECT * FROM students WHERE id = ?', [result.id]);

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newStudent.id, 
                email: newStudent.email, 
                role: 'student',
                student_id: newStudent.student_id
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Student registered successfully',
            token,
            user: {
                id: newStudent.id,
                email: newStudent.email,
                name: newStudent.name,
                role: 'student',
                student_id: newStudent.student_id
            }
        });

    } catch (error) {
        console.error('Student registration error:', error);
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