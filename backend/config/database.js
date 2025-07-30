const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file path
const dbPath = path.join(__dirname, '../../database/epass_system.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ SQLite database connection failed:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
const initializeDatabase = () => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables
    const createTables = `
        -- Students table
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            room_number TEXT,
            parent_name TEXT,
            parent_phone TEXT,
            parent_email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Wardens table
        CREATE TABLE IF NOT EXISTS wardens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            warden_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            role TEXT DEFAULT 'assistant_warden',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Watchmen table
        CREATE TABLE IF NOT EXISTS watchmen (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            watchman_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            shift TEXT DEFAULT 'morning',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Outpass requests table
        CREATE TABLE IF NOT EXISTS outpass_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            from_date TEXT NOT NULL,
            from_time TEXT NOT NULL,
            to_date TEXT NOT NULL,
            to_time TEXT NOT NULL,
            parent_contact TEXT,
            status TEXT DEFAULT 'pending',
            approved_by INTEGER,
            approved_at DATETIME,
            rejection_reason TEXT,
            qr_code TEXT,
            qr_expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (approved_by) REFERENCES wardens(id)
        );

        -- Entry/Exit logs table
        CREATE TABLE IF NOT EXISTS entry_exit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            outpass_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            exit_time DATETIME,
            entry_time DATETIME,
            exit_verified_by INTEGER,
            entry_verified_by INTEGER,
            return_status TEXT DEFAULT 'pending',
            late_minutes INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (outpass_id) REFERENCES outpass_requests(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (exit_verified_by) REFERENCES watchmen(id),
            FOREIGN KEY (entry_verified_by) REFERENCES watchmen(id)
        );

        -- Notifications table
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            sent_via TEXT DEFAULT 'both',
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        );
    `;

    db.exec(createTables, (err) => {
        if (err) {
            console.error('❌ Error creating tables:', err.message);
        } else {
            console.log('✅ Database tables created successfully');
            insertSampleData();
        }
    });
};

// Insert sample data
const insertSampleData = () => {
    const bcrypt = require('bcryptjs');
    
    // Sample warden data
    const wardenPassword = bcrypt.hashSync('warden123', 12);
    db.run(`
        INSERT OR IGNORE INTO wardens (warden_id, name, email, password, phone, role) 
        VALUES ('W001', 'Mrs. Sarah Johnson', 'sarah.johnson@college.edu', ?, '+1234567890', 'senior_warden')
    `, [wardenPassword]);

    // Sample watchman data
    const watchmanPassword = bcrypt.hashSync('watchman123', 12);
    db.run(`
        INSERT OR IGNORE INTO watchmen (watchman_id, name, email, password, phone, shift) 
        VALUES ('WM001', 'John Smith', 'john.smith@college.edu', ?, '+1234567892', 'morning')
    `, [watchmanPassword]);

    console.log('✅ Sample data inserted successfully');
};

// Test database connection
const testConnection = () => {
    db.get('SELECT 1', (err, row) => {
        if (err) {
            console.error('❌ Database connection test failed:', err.message);
        } else {
            console.log('✅ Database connection test successful');
        }
    });
};

// Export database instance and helper functions
module.exports = {
    db,
    testConnection,
    // Helper function to run queries with promises
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    },
    // Helper function to get single row
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },
    // Helper function to get multiple rows
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}; 