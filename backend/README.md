# College ERP System - Backend

A production-ready backend for a College ERP System built with Node.js, Express.js, MongoDB, and JWT authentication.

## Features

- ✅ User authentication (Register & Login)
- ✅ JWT token-based authorization
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (Admin, Faculty, Student)
- ✅ MongoDB integration with Mongoose
- ✅ CORS enabled for frontend integration
- ✅ ES Modules support
- ✅ Environment variable configuration
- ✅ Error handling and validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   - Copy `.env.example` to `.env`
   - Update the following values:
     ```env
     MONGODB_URI=mongodb://localhost:27017/college-erp
     PORT=5000
     JWT_SECRET=your_secret_key_change_this_in_production
     JWT_EXPIRE=7d
     CORS_ORIGIN=http://localhost:3000
     ```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

#### 1. Register User
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGc...",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
  ```

#### 2. Login User
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGc...",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
  ```

#### 3. Get Current User
- **Endpoint:** `GET /api/auth/me`
- **Access:** Protected (requires JWT token)
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
  ```

#### 4. Logout User
- **Endpoint:** `POST /api/auth/logout`
- **Access:** Protected (requires JWT token)
- **Headers:**
  ```
  Authorization: Bearer <token>
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Logout successful. Please remove the token from your client."
  }
  ```

### Health Check

- **Endpoint:** `GET /api/health`
- **Access:** Public
- **Response:**
  ```json
  {
    "success": true,
    "message": "Server is running",
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

## User Roles

- **Admin:** Full system access and management capabilities
- **Faculty:** Can manage courses, grades, and student information
- **Student:** Can view courses, grades, and personal information

## Project Structure

```
backend/
├── server.js              # Express server setup and MongoDB connection
├── package.json           # Project dependencies
├── .env.example           # Environment variables template
├── README.md              # Project documentation
├── models/
│   └── User.js           # User schema and model
├── controllers/
│   └── authController.js # Authentication business logic
├── routes/
│   └── authRoutes.js     # Authentication routes
└── middleware/
    └── authMiddleware.js # JWT verification and role checking
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Status codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

## Security Features

- ✅ Password hashing with bcryptjs (salt rounds: 10)
- ✅ JWT token-based authentication
- ✅ CORS enabled for specified origins
- ✅ Environment variable protection
- ✅ Input validation and sanitization
- ✅ Unique email constraint at database level

## Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] Refresh token mechanism
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Two-factor authentication
- [ ] Admin user management endpoints
- [ ] Faculty and Student specific routes

## Contributing

1. Follow the existing code structure
2. Use ES Modules syntax
3. Add proper error handling
4. Write meaningful comments
5. Test before pushing

## License

MIT
