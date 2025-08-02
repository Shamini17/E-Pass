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
            
            -- Academic Information
            current_year INTEGER,
            department TEXT,
            branch TEXT,
            batch TEXT,
            college_name TEXT,
            
            -- Administrative Information
            warden_name TEXT,
            warden_contact TEXT,
            
            -- Personal Information
            date_of_birth TEXT,
            blood_group TEXT,
            gender TEXT,
            
            -- Address Information
            home_town TEXT,
            permanent_address TEXT,
            emergency_address TEXT,
            
            -- Identity Information
            id_proof_type TEXT,
            id_proof_number TEXT,
            
            -- Parent Information
            parent_name TEXT,
            parent_phone TEXT,
            parent_email TEXT,
            parent_occupation TEXT,
            
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
            place TEXT NOT NULL,
            city TEXT NOT NULL,
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
            // Add migration for place and city columns
            addPlaceCityColumns();
            addStudentProfileColumns(); // Add this line to call the new migration
            insertSampleData();
        }
    });
};

// Migration to add place and city columns
const addPlaceCityColumns = () => {
    // Check if place column exists
    db.get("PRAGMA table_info(outpass_requests)", (err, rows) => {
        if (err) {
            console.error('Error checking table schema:', err);
            return;
        }
        
        db.all("PRAGMA table_info(outpass_requests)", (err, columns) => {
            if (err) {
                console.error('Error getting table info:', err);
                return;
            }
            
            const hasPlace = columns.some(col => col.name === 'place');
            const hasCity = columns.some(col => col.name === 'city');
            
            if (!hasPlace) {
                db.run('ALTER TABLE outpass_requests ADD COLUMN place TEXT DEFAULT "Not specified"', (err) => {
                    if (err) {
                        console.error('Error adding place column:', err);
                    } else {
                        console.log('✅ Added place column to outpass_requests table');
                    }
                });
            }
            
            if (!hasCity) {
                db.run('ALTER TABLE outpass_requests ADD COLUMN city TEXT DEFAULT "Not specified"', (err) => {
                    if (err) {
                        console.error('Error adding city column:', err);
                    } else {
                        console.log('✅ Added city column to outpass_requests table');
                    }
                });
            }
        });
    });
};

// Migration to add comprehensive student profile columns
const addStudentProfileColumns = () => {
    db.all("PRAGMA table_info(students)", (err, columns) => {
        if (err) {
            console.error('Error getting students table info:', err);
            return;
        }
        
        const newColumns = [
            { name: 'current_year', type: 'INTEGER', default: '1' },
            { name: 'department', type: 'TEXT', default: 'Not specified' },
            { name: 'branch', type: 'TEXT', default: 'Not specified' },
            { name: 'batch', type: 'TEXT', default: 'Not specified' },
            { name: 'college_name', type: 'TEXT', default: 'Not specified' },
            { name: 'warden_name', type: 'TEXT', default: 'Not specified' },
            { name: 'warden_contact', type: 'TEXT', default: 'Not specified' },
            { name: 'date_of_birth', type: 'TEXT', default: 'Not specified' },
            { name: 'blood_group', type: 'TEXT', default: 'Not specified' },
            { name: 'gender', type: 'TEXT', default: 'Not specified' },
            { name: 'home_town', type: 'TEXT', default: 'Not specified' },
            { name: 'permanent_address', type: 'TEXT', default: 'Not specified' },
            { name: 'emergency_address', type: 'TEXT', default: 'Not specified' },
            { name: 'id_proof_type', type: 'TEXT', default: 'Not specified' },
            { name: 'id_proof_number', type: 'TEXT', default: 'Not specified' },
            { name: 'parent_occupation', type: 'TEXT', default: 'Not specified' }
        ];
        
        newColumns.forEach(column => {
            const exists = columns.some(col => col.name === column.name);
            if (!exists) {
                const defaultValue = column.default ? `DEFAULT "${column.default}"` : '';
                db.run(`ALTER TABLE students ADD COLUMN ${column.name} ${column.type} ${defaultValue}`, (err) => {
                    if (err) {
                        console.error(`Error adding ${column.name} column:`, err);
                    } else {
                        console.log(`✅ Added ${column.name} column to students table`);
                    }
                });
            }
        });
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