# Admin User Creation Script

## Overview

The `createAdmin.js` script is used to create the initial admin user for the Zariya application. This is a **one-time setup script** that should be run after deploying the application.

## Security Best Practices

### ✅ DO:
- **Use environment variables** for admin credentials in production
- **Run the script once** after initial deployment
- **Change the password** immediately after first login
- **Keep the script in the repository** (it's a standard practice for initial setup)

### ❌ DON'T:
- **Don't hardcode credentials** in production
- **Don't commit `.env` files** with real credentials
- **Don't run the script multiple times** (it checks for existing admin)

## Usage

### Local Development

```bash
# Set environment variables (optional for local dev)
export ADMIN_USERNAME=admin
export ADMIN_EMAIL=admin@zariya.com
export ADMIN_PASSWORD=YourSecurePassword123!
export ADMIN_FULL_NAME="System Administrator"

# Run the script
npm run create-admin
```

### Production (Render/Railway)

1. **Set environment variables** in your hosting platform:
   - `ADMIN_USERNAME` (optional, defaults to 'admin')
   - `ADMIN_EMAIL` (optional, defaults to 'admin@zariya.com')
   - `ADMIN_PASSWORD` (**REQUIRED in production**)
   - `ADMIN_FULL_NAME` (optional, defaults to 'System Administrator')

2. **Run the script** using the platform's shell:
   ```bash
   npm run create-admin
   ```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ Yes | - | MongoDB connection string |
| `ADMIN_USERNAME` | ❌ No | `admin` | Admin username |
| `ADMIN_EMAIL` | ❌ No | `admin@zariya.com` | Admin email |
| `ADMIN_PASSWORD` | ⚠️ Production | `Admin@123` | Admin password (REQUIRED in production) |
| `ADMIN_FULL_NAME` | ❌ No | `System Administrator` | Admin full name |
| `NODE_ENV` | ❌ No | `development` | Environment mode |

## Security Notes

1. **The script is safe to keep in the repository** because:
   - It doesn't expose credentials (uses env variables)
   - It checks for existing admin (won't overwrite)
   - It's a standard pattern for initial setup

2. **Credentials are NOT exposed** because:
   - Production requires `ADMIN_PASSWORD` from environment
   - Default password is only for local development
   - Script warns if using defaults in production

3. **Best practice workflow**:
   ```
   Deploy → Set env vars → Run script once → Change password via UI
   ```

## Alternative: Manual Database Creation

If you prefer not to use the script, you can manually create an admin user:

1. Connect to MongoDB
2. Insert a user document with:
   - `role: 'admin'`
   - Hashed password (use bcrypt)
   - `isActive: true`

However, the script is **recommended** as it:
- Handles password hashing automatically
- Checks for existing admin
- Provides clear feedback
- Is easier to use

## Troubleshooting

**Error: Admin already exists**
- This is normal if you've already created an admin
- The script will exit safely without creating a duplicate

**Error: ADMIN_PASSWORD required**
- Set `ADMIN_PASSWORD` environment variable in production
- Never use default password in production

**Error: MongoDB connection failed**
- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas IP whitelist

