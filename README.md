# 🏫 E-Pass Management System

A comprehensive digital outpass management system for college girls' hostel, built with React.js frontend and Node.js backend.

## 🚀 Features

### 👨‍🎓 Student Module
- **Secure Registration & Login**: JWT-based authentication
- **Dashboard Overview**: Active e-pass status, student info, notifications
- **Apply Outpass**: Digital application form with reason, dates, and parent contact
- **My Outpasses**: Complete history with status tracking and QR codes
- **Profile Management**: Update contact information and password
- **Settings**: Notification preferences and theme customization

### 👩‍🏫 Warden Module
- **Dashboard**: Real-time statistics and recent activity
- **Pending Requests**: Review and approve/reject outpass applications
- **All Outpasses**: Complete overview with filtering options
- **Student Management**: View student details and outpass history
- **QR Code Generation**: Automatic QR code creation for approved passes

### 🚪 Watchman Module
- **QR Code Scanner**: Verify student outpasses at entry/exit
- **Entry/Exit Logging**: Track student movements with timestamps
- **Return Status**: Mark students as on-time or late
- **Today's Logs**: View current day's activity

### 🔔 Notification System
- **SMS Notifications**: Via Twilio API (configurable)
- **Email Notifications**: Via Nodemailer
- **Real-time Updates**: Instant notifications for status changes

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Datepicker** - Date selection
- **QRCode.react** - QR code generation
- **React Toastify** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (with MySQL support)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Multer** - File uploads
- **QRCode** - QR code generation
- **Twilio** - SMS notifications
- **Nodemailer** - Email notifications

### Security Features
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt encryption
- **Input Validation** - Comprehensive validation
- **Rate Limiting** - API protection
- **CORS Configuration** - Cross-origin security
- **Helmet** - Security headers

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd e-pass-management-system
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install && cd ..
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # The system will automatically create SQLite database
   # For MySQL, update database configuration in .env
   ```

5. **Start the application**
   ```bash
   # Start backend server
   npm start
   
   # In another terminal, start frontend
   cd frontend && npm start
   ```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (SQLite by default)
DB_TYPE=sqlite
DB_PATH=./database/epass_system.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Configuration (Optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone

# QR Code Configuration
QR_EXPIRY_HOURS=24

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🗄️ Database Schema

The system uses the following main tables:

- **students** - Student information and credentials
- **wardens** - Warden/admin accounts
- **watchmen** - Security guard accounts
- **outpass_requests** - Outpass applications and status
- **entry_exit_logs** - Entry/exit tracking
- **notifications** - Notification history

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - User login

### Student Routes
- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update profile
- `POST /api/students/outpass` - Apply for outpass
- `GET /api/students/outpass` - Get outpass history
- `GET /api/students/outpass/active` - Get active outpass
- `GET /api/students/notifications` - Get notifications
- `POST /api/students/return-confirm` - Confirm return

### Warden Routes
- `GET /api/wardens/pending` - Get pending requests
- `PUT /api/wardens/outpass/:id` - Approve/reject outpass
- `GET /api/wardens/outpass` - Get all outpasses
- `GET /api/wardens/dashboard` - Get dashboard stats

### Watchman Routes
- `POST /api/watchmen/scan` - Scan QR code
- `GET /api/watchmen/logs` - Get entry/exit logs

## 📱 Usage

### For Students
1. Register with student details
2. Login to access dashboard
3. Apply for outpass with reason and dates
4. Track application status
5. Use QR code for entry/exit
6. Confirm return manually if needed

### For Wardens
1. Login with warden credentials
2. View pending outpass requests
3. Review and approve/reject applications
4. Monitor student activity
5. Generate reports

### For Watchmen
1. Login with watchman credentials
2. Scan student QR codes
3. Log entry and exit times
4. Mark return status (on-time/late)

## 🔧 Development

### Project Structure
```
app/
├── backend/           # Node.js backend
│   ├── config/       # Database configuration
│   ├── middleware/   # Authentication middleware
│   ├── routes/       # API routes
│   └── utils/        # Utility functions
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   └── services/    # API services
│   └── public/          # Static files
├── database/         # Database files
└── docs/            # Documentation
```

### Available Scripts

```bash
# Development
npm run dev          # Start backend in development mode
npm run client       # Start frontend development server
npm run build        # Build frontend for production

# Database
npm run setup        # Setup database and sample data

# Production
npm start            # Start production server
```

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd frontend && npm test
```

## 📊 Monitoring

The system includes:
- **Health Check**: `GET /api/health`
- **Error Logging**: Comprehensive error tracking
- **Performance Monitoring**: Request timing and statistics

## 🔒 Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens have expiration times
- Input validation on all endpoints
- Rate limiting to prevent abuse
- CORS configuration for security
- Environment variables for sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with college ERP systems
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] Real-time notifications
- [ ] Offline mode support

---

**Built with ❤️ for better hostel management** 