const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up E-Pass Management System Database...\n');

async function setupDatabase() {
    let connection;
    
    try {
        // Try to connect with default credentials
        console.log('📡 Attempting to connect to MySQL...');
        
        const configs = [
            { host: 'localhost', user: 'root', password: '' },
            { host: 'localhost', user: 'root', password: 'root' },
            { host: 'localhost', user: 'root', password: 'password' },
            { host: 'localhost', user: 'root', password: 'admin' },
            { host: '127.0.0.1', user: 'root', password: '' },
            { host: '127.0.0.1', user: 'root', password: 'root' }
        ];

        let connected = false;
        
        for (const config of configs) {
            try {
                console.log(`🔍 Trying ${config.user}@${config.host}...`);
                connection = await mysql.createConnection(config);
                console.log(`✅ Connected successfully with ${config.user}@${config.host}`);
                connected = true;
                break;
            } catch (error) {
                console.log(`❌ Failed: ${error.message}`);
            }
        }

        if (!connected) {
            console.log('\n❌ Could not connect to MySQL with default credentials.');
            console.log('📝 Please manually configure your database:');
            console.log('1. Make sure MySQL is running');
            console.log('2. Update the .env file with your MySQL credentials');
            console.log('3. Create the database manually: mysql -u root -p < database/schema.sql');
            return;
        }

        // Create database if it doesn't exist
        console.log('\n🗄️ Creating database...');
        await connection.execute('CREATE DATABASE IF NOT EXISTS epass_system');
        await connection.execute('USE epass_system');

        // Read and execute schema
        console.log('📋 Executing database schema...');
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            const statements = schema.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await connection.execute(statement);
                    } catch (error) {
                        if (!error.message.includes('already exists')) {
                            console.log(`⚠️ Warning: ${error.message}`);
                        }
                    }
                }
            }
            console.log('✅ Database schema executed successfully');
        } else {
            console.log('⚠️ Schema file not found at database/schema.sql');
        }

        // Update .env file with working credentials
        console.log('\n📝 Updating .env file...');
        const envPath = path.join(__dirname, '.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        } else {
            envContent = fs.readFileSync(path.join(__dirname, 'env.example'), 'utf8');
        }

        // Update database credentials
        envContent = envContent.replace(/DB_HOST=.*/g, `DB_HOST=${connection.config.host}`);
        envContent = envContent.replace(/DB_USER=.*/g, `DB_USER=${connection.config.user}`);
        envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${connection.config.password || ''}`);
        envContent = envContent.replace(/DB_NAME=.*/g, 'DB_NAME=epass_system');

        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file updated with working database credentials');

        console.log('\n🎉 Database setup completed successfully!');
        console.log('📊 Database: epass_system');
        console.log('👤 User: ' + connection.config.user);
        console.log('🏠 Host: ' + connection.config.host);

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.log('\n📝 Manual setup instructions:');
        console.log('1. Install MySQL if not already installed');
        console.log('2. Start MySQL service');
        console.log('3. Create a database user or use root');
        console.log('4. Update .env file with correct credentials');
        console.log('5. Run: mysql -u root -p < database/schema.sql');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase(); 