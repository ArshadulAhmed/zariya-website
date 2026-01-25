# Resend Email Service Setup Guide

## Resend - 3,000 emails/month free

We use Resend API in production and Gmail SMTP in development.

### Step 1: Sign Up
1. Go to https://resend.com/signup
2. Create a free account
3. Verify your email address

### Step 2: Get API Key
1. After login, go to **API Keys** section
2. Click **Create API Key**
3. Name it (e.g., "Zariya Production")
4. **Copy the API key** (starts with `re_`)
   - ⚠️ **Important**: Copy it immediately - you won't be able to see it again!

### Step 3: Verify Domain (Optional for testing)
- For testing, you can use `onboarding@resend.dev` as the sender
- For production, verify your domain to use custom email addresses
  1. Go to **Domains** → **Add Domain**
  2. Add your domain (e.g., `zariya.com`)
  3. Add the DNS records provided by Resend
  4. Wait for verification (usually takes a few minutes)

### Step 4: Add Environment Variables to Render (Production)

Go to your Render backend service → **Environment** tab and add:

```
NODE_ENV=production
ADMIN_EMAIL=zariyatcs@gmail.com
RESEND_API_KEY=re_your-api-key-here
RESEND_FROM=onboarding@resend.dev
SMTP_FROM_NAME=Zariya
```

**Important Notes:**
- `RESEND_API_KEY`: The API key you generated in Step 2 (starts with `re_`)
- `RESEND_FROM`: Use `onboarding@resend.dev` for testing, or your verified domain email for production
- `SMTP_FROM_NAME`: Display name for the sender (defaults to "Zariya")
- `ADMIN_EMAIL`: Where you want to receive contact form submissions

### Step 5: Add Environment Variables for Local Development

For local development, add to your `.env` file:

```
NODE_ENV=development
ADMIN_EMAIL=zariyatcs@gmail.com
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use that App Password as `EMAIL_PASS`

### Step 6: Install Resend Package

Run in your backend directory:
```bash
npm install resend
```

### Step 7: Deploy and Test
1. Save the environment variables in Render
2. Render will automatically redeploy your service
3. Wait for deployment to complete
4. Submit the contact form on your website
5. Check your `ADMIN_EMAIL` inbox for the contact form submission

---

## Troubleshooting

### API Key Invalid
- Verify `RESEND_API_KEY` is correct (starts with `re_`)
- Ensure the API key hasn't been revoked in Resend dashboard
- Regenerate the API key if needed

### Sender Not Verified Error
- For testing: Use `onboarding@resend.dev` as `RESEND_FROM`
- For production: Verify your domain in Resend dashboard
- The sender email must match your verified domain or use `onboarding@resend.dev`

### Emails Not Received
- Check spam/junk folder
- Verify `ADMIN_EMAIL` is correct
- Check Resend dashboard → **Logs** for delivery status
- Review Render logs for email send errors

### API Rate Limits
- Free tier: 3,000 emails per month
- If you exceed the limit, you'll get a rate limit error
- Check Resend dashboard for your usage statistics

### Still Having Issues?
The contact form will still work even if email fails - submissions are logged to Render console. Check your Render logs to see contact form data.

---

## Resend Free Tier Limits
- **3,000 emails per month** (100 per day)
- Unlimited contacts
- Email support
- REST API access included

For higher limits, consider upgrading to a paid plan.

---

## Migration from Brevo to Resend

If you were previously using Brevo:
1. Remove old Brevo environment variables (`BREVO_API_KEY`, `SMTP_HOST`, etc.)
2. Add `RESEND_API_KEY` instead
3. Keep `ADMIN_EMAIL` and `SMTP_FROM_NAME` (they're still needed)
4. Install `resend` package: `npm install resend`
5. Redeploy your backend service
