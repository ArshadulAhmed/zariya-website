# Quick Setup Guide

## 1. Install Dependencies

```bash
cd backend
npm install
```

## 2. Create Environment File

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/zariya
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

**Important:** Change `JWT_SECRET` to a strong random string in production!

## 3. Start MongoDB

Make sure MongoDB is running:

- **Local MongoDB:** Start `mongod` service
- **MongoDB Atlas:** Update `MONGODB_URI` in `.env` with your connection string

## 4. Create First Admin User

```bash
npm run create-admin
```

This will create an admin user with:
- **Username:** `admin`
- **Email:** `admin@zariya.com`
- **Password:** `Admin@123`

⚠️ **Change the password immediately after first login!**

## 5. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 6. Test the API

### Health Check
```bash
GET http://localhost:5000/api/health
```

### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

You'll receive a JWT token. Use it in the `Authorization` header for protected routes:
```
Authorization: Bearer <your-token>
```

## Next Steps

1. Login and get your JWT token
2. Create additional users (admin/employee) using the `/api/auth/register` endpoint
3. Test membership creation at `/api/memberships`
4. Test loan application at `/api/loans`

See `README.md` for full API documentation.

