# E-Pass Management System

A comprehensive Digital Outpass Management System for College Girls' Hostel, built with React.js frontend and Node.js backend.

## 🚀 Features

### 👩‍🎓 Student Module
- **Simple Registration**: Easy registration with essential information only
- **Outpass Application**: Apply for outpasses with reason, dates, and place details
- **Status Tracking**: View application status (Pending/Approved/Rejected)
- **QR Code Access**: View QR codes for approved outpasses
- **Profile Management**: Update basic profile information

### 👩‍🏫 Warden Module
- **Dashboard**: Overview of pending requests and statistics
- **Request Management**: Approve or reject outpass applications
- **Student Information**: View comprehensive student details
- **QR Code Generation**: Generate QR codes for approved outpasses
- **Notifications**: Automatic parent notifications

### 🧑‍✈️ Watchman Module
- **QR Scanner**: Scan student QR codes for entry/exit
- **Log Management**: Record entry and exit times
- **Status Tracking**: Monitor return status (on time/late)

## 🛠️ Tech Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express
- **Database**: SQLite (for easy setup)
- **Authentication**: JWT tokens
- **QR Codes**: qrcode library
- **Notifications**: Email (Nodemailer) and SMS (Twilio - optional)

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the servers**
   ```bash
   # Terminal 1 - Backend
   npm start
   
   # Terminal 2 - Frontend
   npm run client
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 👥 User Roles & Access

### 🎓 Student Registration
**Simple Registration Form** - Only essential fields required:
- Full Name
- Student ID
- Email & Password
- Phone Number
- Room Number
- Department
- Parent Information (Name, Phone, Optional Email)

### 👩‍🏫 Warden Access
**Pre-configured accounts only** - No public registration:
- **Email**: `sarah.johnson@college.edu`
- **Password**: `warden123`
- **Role**: `warden`

### 🧑‍✈️ Watchman Access
**Pre-configured accounts only** - No public registration:
- **Email**: `john.doe@college.edu`
- **Password**: `watchman123`
- **Role**: `watchman`

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DB_TYPE=sqlite
DB_PATH=./database/epass_system.db

# JWT
JWT_SECRET=your-secret-key

# Email (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Twilio (Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

## 📊 Database Schema

### Students Table
Essential fields for student registration and management.

### Outpass Requests Table
Complete outpass application tracking with status and QR codes.

### Wardens & Watchmen Tables
Pre-configured administrative accounts.

## 🔐 Security Features

- **Role-based Authentication**: Different access levels for students, wardens, and watchmen
- **JWT Token Protection**: Secure API access
- **Input Validation**: Server-side validation for all inputs
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Protection**: Configured for secure cross-origin requests

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - User login

### Student Routes
- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update profile
- `POST /api/students/outpass` - Apply for outpass
- `GET /api/students/outpasses` - Get outpass history

### Warden Routes
- `GET /api/wardens/dashboard` - Dashboard statistics
- `GET /api/wardens/pending` - Pending requests
- `PUT /api/wardens/outpass/:id` - Approve/reject outpass

### Watchman Routes
- `POST /api/watchmen/scan` - Scan QR code
- `GET /api/watchmen/logs` - View entry/exit logs

## 🎯 Key Improvements

### ✅ Simplified Student Registration
- **Removed Complex Fields**: No more overwhelming registration form
- **Essential Information Only**: Name, ID, contact, department, parent info
- **Default Values**: System automatically fills optional fields
- **User-Friendly**: Quick and easy registration process

### ✅ Clear Role Access
- **Student Registration**: Open for new students
- **Warden Access**: Pre-configured accounts only
- **Watchman Access**: Pre-configured accounts only
- **Clear Messaging**: Users understand role restrictions

## 🚀 Development

### Project Structure
```
app/
├── backend/          # Node.js Express server
├── frontend/         # React.js application
├── database/         # SQLite database files
└── setup files
```

### Available Scripts
- `npm start` - Start backend server
- `npm run client` - Start frontend development server
- `npm run dev` - Start backend with nodemon
- `npm run install-all` - Install all dependencies

## 📞 Support

For issues or questions, please check the documentation or contact the development team.

---

**E-Pass Management System** - Making hostel outpass management digital, secure, and efficient! 🎓✨ 