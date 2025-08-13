# 🏠 Real Estate Application - Quick Start Guide

## Prerequisites Checklist
- [ ] Node.js (v14+) installed
- [ ] MySQL (v8.0+) installed and running
- [ ] Git installed (optional)

## 🚀 Quick Setup (5 minutes)

### 1. Database Setup
```sql
-- Start MySQL and create database
mysql -u root -p

CREATE DATABASE real_estate_db;
USE real_estate_db;

-- Import the schema
SOURCE config/schema.sql;

-- Exit MySQL
EXIT;
```

### 2. Environment Configuration
The `.env` file is already created with development defaults. Update these values:

```env
# Update your MySQL password
DB_PASSWORD=your_mysql_password_here

# Optional: Change other settings
DB_USER=root
DB_NAME=real_estate_db
```

### 3. Start the Application
```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

### 4. Access the Application
- **URL**: http://localhost:3000
- **Register**: Create an account as Owner or Buyer
- **Test**: Add properties, chat with users

## 🎯 Test Scenarios

### For Property Owners:
1. Register as "Owner"
2. Add a new property with images
3. View "My Properties" dashboard
4. Wait for buyer messages

### For Buyers:
1. Register as "Buyer" 
2. Browse properties
3. View property details
4. Click "Chat with Owner"
5. Send messages in real-time

## 🛠 Development Commands

```bash
# Development with auto-reload
npm run dev

# Production mode
npm start

# View logs
tail -f logs/app.log
```

## 📊 Sample Data

The schema includes sample users and properties for testing:

**Sample Accounts** (password: test123A for all):
- `john@example.com` (Owner)
- `jane@example.com` (Buyer)  
- `mike@example.com` (Owner)

## 🔧 Troubleshooting

### Database Connection Issues:
```bash
# Check MySQL service
mysqld --version

# Test connection
mysql -u root -p -e "SELECT 1"
```

### Port Already in Use:
```bash
# Change port in .env
PORT=3000
```

### Permission Issues:
```bash
# Fix upload directory permissions (Linux/Mac)
chmod 755 uploads/
chmod 755 uploads/properties/
```

## 🎉 Features to Test

✅ **Authentication**: Registration, login, sessions
✅ **Property Management**: CRUD operations for owners
✅ **Image Upload**: Multiple property images
✅ **Real-time Chat**: Instant messaging between users
✅ **Search & Filter**: Find properties by criteria
✅ **Security**: Rate limiting, validation, CSRF protection
✅ **Responsive Design**: Works on mobile and desktop

## 📱 Mobile Testing

The application is responsive. Test on mobile by:
1. Opening http://localhost:3000 on your phone
2. Or use browser dev tools (F12 → Mobile view)

## 🔒 Security Features Active

- Password hashing with bcrypt
- Session-based authentication
- Input validation and sanitization
- File upload restrictions (images only, 2MB max)
- Rate limiting on auth routes
- SQL injection prevention
- XSS protection

## 🚀 Next Steps

After testing, you can:
1. Deploy to production server
2. Add more property types
3. Implement email notifications
4. Add property favorites
5. Create admin dashboard
6. Add payment integration

## 📞 Need Help?

Check the detailed README.md file for comprehensive documentation!

Happy coding! 🎉
