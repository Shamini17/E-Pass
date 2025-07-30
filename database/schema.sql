-- E-Pass Management System Database Schema

CREATE DATABASE IF NOT EXISTS epass_system;
USE epass_system;

-- Students table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    room_number VARCHAR(10),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(15),
    parent_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Wardens table
CREATE TABLE wardens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    warden_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role ENUM('senior_warden', 'assistant_warden') DEFAULT 'assistant_warden',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Watchmen table
CREATE TABLE watchmen (
    id INT PRIMARY KEY AUTO_INCREMENT,
    watchman_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    shift ENUM('morning', 'evening', 'night') DEFAULT 'morning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outpass requests table
CREATE TABLE outpass_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    reason TEXT NOT NULL,
    from_date DATE NOT NULL,
    from_time TIME NOT NULL,
    to_date DATE NOT NULL,
    to_time TIME NOT NULL,
    parent_contact VARCHAR(15),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,
    qr_code VARCHAR(255),
    qr_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES wardens(id)
);

-- Entry/Exit logs table
CREATE TABLE entry_exit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    outpass_id INT NOT NULL,
    student_id INT NOT NULL,
    exit_time TIMESTAMP NULL,
    entry_time TIMESTAMP NULL,
    exit_verified_by INT,
    entry_verified_by INT,
    return_status ENUM('on_time', 'late', 'pending') DEFAULT 'pending',
    late_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (outpass_id) REFERENCES outpass_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (exit_verified_by) REFERENCES watchmen(id),
    FOREIGN KEY (entry_verified_by) REFERENCES watchmen(id)
);

-- Notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    type ENUM('outpass_applied', 'outpass_approved', 'outpass_rejected', 'exit_logged', 'entry_logged', 'late_return') NOT NULL,
    message TEXT NOT NULL,
    sent_via ENUM('sms', 'email', 'both') DEFAULT 'both',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO wardens (warden_id, name, email, password, phone, role) VALUES
('W001', 'Mrs. Sarah Johnson', 'sarah.johnson@college.edu', '$2b$10$example_hash', '+1234567890', 'senior_warden'),
('W002', 'Ms. Emily Davis', 'emily.davis@college.edu', '$2b$10$example_hash', '+1234567891', 'assistant_warden');

INSERT INTO watchmen (watchman_id, name, email, password, phone, shift) VALUES
('WM001', 'John Smith', 'john.smith@college.edu', '$2b$10$example_hash', '+1234567892', 'morning'),
('WM002', 'Mike Wilson', 'mike.wilson@college.edu', '$2b$10$example_hash', '+1234567893', 'evening');

-- Create indexes for better performance
CREATE INDEX idx_student_email ON students(email);
CREATE INDEX idx_outpass_status ON outpass_requests(status);
CREATE INDEX idx_outpass_student ON outpass_requests(student_id);
CREATE INDEX idx_logs_outpass ON entry_exit_logs(outpass_id);
CREATE INDEX idx_notifications_student ON notifications(student_id); 