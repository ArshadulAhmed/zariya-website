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

---

## Sync production data to local (syncProdToLocal.js)

Use this script to copy data from the **production** MongoDB into your **local/test** database so you can test with real-like data without touching prod. Images in the app still point to Cloudinary (prod or test folder depending on env).

### Requirements

- **MONGODB_URI_SOURCE** – Production MongoDB connection string (read-only user recommended).
- **MONGODB_URI_TARGET** – Local/test MongoDB (e.g. `mongodb://localhost:27017/zariya-test`).

### Usage

```bash
# From backend directory
export MONGODB_URI_SOURCE="mongodb+srv://user:pass@cluster.mongodb.net/zariya?retryWrites=true"
export MONGODB_URI_TARGET="mongodb://localhost:27017/zariya-test"

npm run sync-prod-to-local
```

Or one-off without changing `.env`:

```bash
MONGODB_URI_SOURCE="mongodb+srv://..." MONGODB_URI_TARGET="mongodb://localhost:27017/zariya-test" npm run sync-prod-to-local
```

### Optional env

| Variable | Description |
|----------|-------------|
| `SYNC_COLLECTIONS` | Comma-separated list, e.g. `users,memberships,loans`. Default: all (users, counters, memberships, loanapplications, loans, repayments). |
| `SYNC_DROP_FIRST` | Set to `0` or `false` to **not** drop target collections before insert (default: drop then insert). |

### Safe use

- Use a **read-only** MongoDB user for `MONGODB_URI_SOURCE` in production so the script never writes to prod.
- Run the script only from your machine or a CI job that has access to prod URI; do not set prod URI in shared or committed env files.

