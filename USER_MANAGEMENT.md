# 👥 User Management Guide - E-Pass System

## 📋 **Current Available Accounts**

### 👩‍🏫 **Warden Accounts**

| Name | Email | Password | ID | Status |
|------|-------|----------|----|--------|
| Mrs. Sarah Johnson | `sarah.johnson@college.edu` | `warden123` | W001 | ✅ Active |
| Mrs. Priya Sharma | `priya.sharma@college.edu` | `warden456` | W002 | ✅ Active |
| Mr. Rajesh Kumar | `rajesh.kumar@college.edu` | `warden789` | W003 | ✅ Active |

### 🧑‍✈️ **Watchman Accounts**

| Name | Email | Password | ID | Status |
|------|-------|----------|----|--------|
| Mr. John Doe | `john.doe@college.edu` | `watchman123` | WM001 | ✅ Active |
| Mr. Amit Singh | `amit.singh@college.edu` | `watchman456` | WM002 | ✅ Active |
| Mr. Suresh Patel | `suresh.patel@college.edu` | `watchman789` | WM003 | ✅ Active |

## 🛠️ **How to Add New Accounts**

### **Method 1: Using the Script (Recommended)**

1. **Edit the script** `add-users.js`:
   ```javascript
   // Add new warden accounts
   await addUser('New Warden Name', 'new.warden@college.edu', 'newpassword', 'warden', 'W004');
   
   // Add new watchman accounts
   await addUser('New Watchman Name', 'new.watchman@college.edu', 'newpassword', 'watchman', 'WM004');
   ```

2. **Run the script**:
   ```bash
   node add-users.js
   ```

### **Method 2: Direct Database Insert**

```sql
-- Add new warden
INSERT INTO wardens (warden_id, name, email, password) 
VALUES ('W004', 'New Warden Name', 'new.warden@college.edu', 'hashed_password');

-- Add new watchman
INSERT INTO watchmen (watchman_id, name, email, password) 
VALUES ('WM004', 'New Watchman Name', 'new.watchman@college.edu', 'hashed_password');
```

### **Method 3: Using API (Future Enhancement)**

```bash
# Add warden (when API is implemented)
curl -X POST http://localhost:5000/api/admin/add-warden \
  -H "Content-Type: application/json" \
  -d '{"name":"New Warden","email":"new@college.edu","password":"password123"}'
```

## 🔐 **Password Security**

### **Password Requirements:**
- Minimum 6 characters
- Recommended: Mix of letters, numbers, and symbols
- Never use default passwords in production

### **Password Hashing:**
- All passwords are hashed using bcryptjs
- Salt rounds: 12
- Cannot be reversed to plain text

## 📊 **Account Management Best Practices**

### ✅ **Do's:**
- Use strong, unique passwords
- Use college email addresses
- Follow naming convention for IDs (W001, W002, etc.)
- Keep account list updated
- Document all account changes

### ❌ **Don'ts:**
- Share passwords between users
- Use weak passwords (123456, password, etc.)
- Create accounts without proper authorization
- Forget to update this documentation

## 🔄 **Account Status Management**

### **Active Accounts:**
- Can log in and access system
- Have full permissions for their role
- Should be regularly monitored

### **Inactive Accounts:**
- Can be disabled by setting `active = 0` in database
- Should be archived after user leaves
- Can be reactivated if needed

## 📝 **Account Information Fields**

### **Warden Fields:**
- `warden_id` - Unique identifier (W001, W002, etc.)
- `name` - Full name
- `email` - College email address
- `password` - Hashed password
- `phone` - Contact number (optional)
- `role` - Default: 'assistant_warden'
- `created_at` - Account creation timestamp

### **Watchman Fields:**
- `watchman_id` - Unique identifier (WM001, WM002, etc.)
- `name` - Full name
- `email` - College email address
- `password` - Hashed password
- `phone` - Contact number (optional)
- `shift` - Default: 'morning'
- `created_at` - Account creation timestamp

## 🚨 **Emergency Procedures**

### **Password Reset:**
1. Identify the user account
2. Generate new secure password
3. Hash the new password
4. Update database
5. Notify user securely

### **Account Lockout:**
1. Disable account in database
2. Investigate security concern
3. Reset password if needed
4. Re-enable account after verification

### **Account Deletion:**
1. Backup user data
2. Remove from active users
3. Archive in separate table
4. Update documentation

## 📞 **Support Contacts**

For account management issues:
- **System Administrator**: admin@college.edu
- **IT Support**: it-support@college.edu
- **Emergency**: +91-9876543210

## 🔍 **Monitoring & Auditing**

### **Login Monitoring:**
- Track failed login attempts
- Monitor unusual access patterns
- Log all authentication events

### **Activity Logging:**
- Record all user actions
- Maintain audit trail
- Regular security reviews

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintained by**: System Administrator 