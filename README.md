# Real Estate Application

A modern full-stack real estate platform built with React, Node.js, Express.js, MySQL, and Socket.IO featuring property management, real-time chat, and comprehensive security.

## 🚀 Features

### Authentication & Security
- **Universal Access**: All users can both buy and sell properties
- **Secure Authentication**: Password hashing with bcrypt, session management
- **Input Validation**: express-validator to prevent SQL injection & XSS
- **Rate Limiting**: Protection against brute-force attacks
- **CORS Protection**: Secure cross-origin requests
- **Security Headers**: Helmet.js for HTTP header security

### Property Management
- **Add Property**: Title, description, location, price, property details
- **Edit/Delete Property**: Full CRUD operations for property owners
- **Image Upload**: Secure file upload with multer and validation
- **Advanced Search**: Filter by location, price range, property type
- **Property Details**: Comprehensive property information with image galleries

### Real-Time Chat
- **Buyer-Seller Communication**: Direct 1-on-1 conversations
- **Real-time Messaging**: Socket.IO powered instant messaging
- **Chat History**: Persistent message storage in MySQL
- **Property-Specific Chats**: Conversations linked to specific properties
- **Message Notifications**: Real-time message alerts

### Modern UI/UX
- **React Frontend**: Modern, responsive single-page application
- **Material-UI**: Professional, accessible design components
- **Responsive Design**: Mobile-first approach for all devices
- **Real-time Updates**: Instant UI updates via Socket.IO

## 🛠 Tech Stack

### Frontend
- **React 19.1.1** - Modern frontend framework
- **Material-UI 7.3.1** - Professional component library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - Server-side runtime
- **Express.js** - Web framework for REST APIs
- **MySQL** - Relational database with mysql2 client
- **Socket.IO** - Real-time communication server

### Security & Utilities
- **bcrypt** - Password hashing
- **express-session** - Session management
- **helmet** - Security headers
- **express-validator** - Input validation
- **multer** - File upload handling
- **multer** - File upload handling
- **rate-limiter-flexible** - Rate limiting
- **dotenv** - Environment configuration

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd real-estate-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE real_estate_db;
   
   # Import schema
   mysql -u root -p real_estate_db < config/schema.sql
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   ```

5. **Configure Environment Variables**
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=real_estate_db
   
   # Security
   SESSION_SECRET=your_super_secret_key
   
   # File Upload
   MAX_FILE_SIZE=2097152
   UPLOAD_DIR=uploads/properties
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
real-estate-app/
├── config/
│   ├── database.js          # Database connection
│   └── schema.sql           # Database schema
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── rateLimiter.js       # Rate limiting
│   ├── upload.js            # File upload handling
│   └── validation.js        # Input validation
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── chat.js              # Chat functionality
│   └── properties.js        # Property management
├── socket/
│   └── socketAuth.js        # Socket.IO authentication
├── views/
│   ├── auth/                # Authentication templates
│   ├── chat/                # Chat templates
│   ├── properties/          # Property templates
│   └── partials/            # Reusable components
├── public/
│   ├── css/                 # Stylesheets
│   └── js/                  # Client-side JavaScript
├── uploads/                 # File upload directory
├── server.js                # Main application file
└── package.json             # Dependencies and scripts
```

## 🔒 Security Features

- **Password Security**: bcrypt with salt rounds
- **Session Security**: Secure session configuration
- **Input Sanitization**: XSS and SQL injection prevention
- **File Upload Security**: Type and size validation
- **Rate Limiting**: Brute force attack prevention
- **CSRF Protection**: Cross-site request forgery prevention
- **Security Headers**: Comprehensive HTTP security headers

## 👥 User Roles

### Property Owner
- Register as property seller
- Add, edit, delete properties
- Upload property images
- Chat with interested buyers
- View property statistics

### Buyer
- Register as property buyer
- Search and filter properties
- View property details
- Chat with property owners
- Save favorite properties

## 💬 Chat System

- Real-time messaging between buyers and sellers
- Conversation management per property
- Message history persistence
- Typing indicators
- Read receipts
- Online status tracking

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - User profile

### Properties
- `GET /properties` - List all properties
- `GET /properties/:id` - Get property details
- `POST /properties/add` - Add new property (Owner only)
- `PUT /properties/:id` - Update property (Owner only)
- `DELETE /properties/:id` - Delete property (Owner only)

### Chat
- `GET /chat/conversations` - List user conversations
- `GET /chat/:id` - Get conversation messages
- `POST /chat/:id/messages` - Send message

## 🎨 Customization

### Styling
- Modify `public/css/style.css` for custom styles
- Bootstrap 5 variables can be overridden
- Responsive design included

### Database
- Extend schema in `config/schema.sql`
- Add migrations as needed
- Configure indexes for performance

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL service is running
   - Verify database credentials in .env
   - Ensure database exists

2. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure allowed file types

3. **Session Issues**
   - Check SESSION_SECRET in .env
   - Verify session store configuration

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📧 Support

For support and questions, please open an issue in the repository.
