const twilio = require('twilio');
const nodemailer = require('nodemailer');
const { pool } = require('../config/database');

// Initialize Twilio client only if credentials are properly configured
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
    try {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('✅ Twilio client initialized successfully');
    } catch (error) {
        console.warn('⚠️ Twilio client initialization failed:', error.message);
        twilioClient = null;
    }
} else {
    console.log('ℹ️ Twilio credentials not configured, SMS notifications disabled');
}

// Initialize email transporter only if credentials are properly configured
let emailTransporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
        emailTransporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log('✅ Email transporter initialized successfully');
    } catch (error) {
        console.warn('⚠️ Email transporter initialization failed:', error.message);
        emailTransporter = null;
    }
} else {
    console.log('ℹ️ Email credentials not configured, email notifications disabled');
}

// Send notification to parents
const sendNotification = async ({ studentId, type, message }) => {
    try {
        // Get student and parent details
        const [students] = await pool.execute(
            'SELECT name, parent_phone, parent_email FROM students WHERE id = ?',
            [studentId]
        );

        if (students.length === 0) {
            console.error('Student not found for notification:', studentId);
            return;
        }

        const student = students[0];

        // Log notification in database
        const [notificationResult] = await pool.execute(
            'INSERT INTO notifications (student_id, type, message) VALUES (?, ?, ?)',
            [studentId, type, message]
        );

        let smsSent = false;
        let emailSent = false;

        // Send SMS if Twilio is configured and parent phone exists
        if (twilioClient && student.parent_phone) {
            try {
                await twilioClient.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: student.parent_phone
                });
                smsSent = true;
                console.log(`SMS sent to ${student.parent_phone} for student ${student.name}`);
            } catch (error) {
                console.error('SMS sending failed:', error.message);
            }
        }

        // Send email if email is configured and parent email exists
        if (emailTransporter && student.parent_email) {
            try {
                await emailTransporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: student.parent_email,
                    subject: `E-Pass Update: ${student.name}`,
                    html: `
                        <h2>E-Pass Management System Notification</h2>
                        <p><strong>Student:</strong> ${student.name}</p>
                        <p><strong>Message:</strong> ${message}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <hr>
                        <p><small>This is an automated message from the E-Pass Management System.</small></p>
                    `
                });
                emailSent = true;
                console.log(`Email sent to ${student.parent_email} for student ${student.name}`);
            } catch (error) {
                console.error('Email sending failed:', error.message);
            }
        }

        // Update notification status
        const sentVia = smsSent && emailSent ? 'both' : smsSent ? 'sms' : emailSent ? 'email' : 'none';
        const status = (smsSent || emailSent) ? 'sent' : 'failed';

        await pool.execute(
            'UPDATE notifications SET sent_via = ?, status = ? WHERE id = ?',
            [sentVia, status, notificationResult.insertId]
        );

        return {
            notificationId: notificationResult.insertId,
            smsSent,
            emailSent,
            status
        };

    } catch (error) {
        console.error('Notification sending error:', error);
        throw error;
    }
};

module.exports = {
    sendNotification
}; 