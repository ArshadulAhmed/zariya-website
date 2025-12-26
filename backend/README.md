# Zariya Loan Management System - Backend API

Backend API for managing loans, memberships, and users.

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Features

- ✅ User authentication and authorization (JWT-based)
- ✅ Role-based access control (Admin, Employee, User)
- ✅ Membership creation and management
- ✅ Loan application and approval workflow
- ✅ Secure data handling
- ✅ Input validation
- ✅ Error handling

## Project Structure

```
backend/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware (auth, validation)
├── models/          # Mongoose models
├── routes/          # API routes
├── utils/           # Utility functions
├── .env.example     # Environment variables template
├── .gitignore       # Git ignore file
├── package.json     # Dependencies
└── server.js        # Entry point
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/zariya
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# If MongoDB is installed locally
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Memberships

- `POST /api/memberships` - Create membership (Public)
- `GET /api/memberships` - Get all memberships (Admin/Employee)
- `GET /api/memberships/:id` - Get single membership (Admin/Employee)
- `GET /api/memberships/user/:userId` - Get membership by User ID (Admin/Employee)
- `PUT /api/memberships/:id/review` - Review membership (Approve/Reject) (Admin/Employee)

### Loans

- `POST /api/loans` - Create loan application (Admin/Employee)
- `GET /api/loans` - Get all loans (Admin/Employee)
- `GET /api/loans/:id` - Get single loan (Admin/Employee)
- `GET /api/loans/account/:loanAccountNumber` - Get loan by account number (Admin/Employee)
- `PUT /api/loans/:id` - Update loan details (Admin only for approved/active/closed loans, Admin/Employee for pending/rejected)
- `PUT /api/loans/:id/review` - Review loan (Approve/Reject) (Admin only)

## User Roles

### Admin
- Full access to all endpoints
- Can create and manage users
- Can approve/reject loans and memberships
- **Only admin can approve loans**
- **Only admin can modify approved/active/closed loans**

### Employee (Staff)
- Can view memberships and loans
- Can create loan applications
- Can update pending/rejected loan applications
- Can review memberships (approve/reject)
- Cannot review loans (only admin can)
- Cannot modify approved/active/closed loans (only admin can)

### User (Normal User)
- No direct system access
- Can create membership applications (public endpoint)

## Database Models

### User
- Authentication and authorization
- Role-based access

### Membership
- Personal information
- Address details
- Unique User ID generation (ZAR-YYYYMMDD-XXXX)
- Status: pending, approved, rejected

### Loan
- Loan details (amount, tenure, purpose, etc.)
- Primary applicant (linked via membership)
- Co-applicant information (optional)
  - Full name, Father's/Husband's name
  - Mobile number, Email (optional)
  - Complete address
- Nominee information
- Guarantor information
- Unique Loan Account Number generation (LOAN-YYYYMMDD-XXXX)
- Status: pending, approved, rejected, active, closed
- **Security:** Only admin can approve loans. Once approved, only admin can modify the loan.

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Input validation
- Secure error handling
- CORS enabled

## Creating First Admin User

You'll need to create the first admin user manually. You can do this by:

1. Using MongoDB Compass or mongo shell
2. Creating a user document directly in the database
3. Or using a script (can be created if needed)

Example admin user structure:
```javascript
{
  username: "admin",
  email: "admin@zariya.com",
  password: "hashed_password", // Use bcrypt to hash
  role: "admin",
  fullName: "Administrator",
  isActive: true
}
```

## Future Enhancements (Phase 2)

- Reporting features
- Loan repayment tracking
- Installment management
- Custom user roles with permissions
- Audit logs
- Email notifications

## Development

### Health Check

```bash
GET http://localhost:5000/api/health
```

### Testing with Postman/Thunder Client

1. Register/Login to get JWT token
2. Use token in Authorization header: `Bearer <token>`
3. Test endpoints based on role permissions

## Notes

- All timestamps are automatically managed by Mongoose
- Unique IDs (User ID, Loan Account Number) are auto-generated
- Passwords are never returned in API responses
- Sensitive data should be encrypted in production
