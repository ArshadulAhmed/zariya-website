# Brevo Email Service Setup Guide

## Brevo (formerly Sendinblue) - 300 emails/day free

### Step 1: Sign Up
1. Go to https://www.brevo.com/
2. Click **Sign Up Free**
3. Create a free account
4. Verify your email address

### Step 2: Get SMTP Credentials
1. After login, go to **SMTP & API** in the left sidebar
2. Click on **SMTP** tab
3. Click **Generate New SMTP Key**
4. Give it a name (e.g., "Zariya Production")
5. **Copy the SMTP key** - you'll need this for `SMTP_PASSWORD`
6. Note your Brevo account email - this is your `SMTP_USER`

### Step 3: Verify Sender Email (Important)
1. Go to **Senders & IP** → **Senders**
2. Click **Add a sender**
3. Enter your email address (the one you want to send from)
4. Verify the email by clicking the verification link sent to your inbox
5. This verified email will be your `SMTP_FROM`

### Step 4: Add Environment Variables to Render

Go to your Render backend service → **Environment** tab and add:

```
ADMIN_EMAIL=zariyatcs@gmail.com
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-account-email@example.com
SMTP_PASSWORD=your-smtp-key-here
SMTP_FROM=your-verified-sender-email@example.com
```

**Important Notes:**
- `SMTP_USER`: Your Brevo account email (the one you signed up with)
- `SMTP_PASSWORD`: The SMTP key you generated in Step 2
- `SMTP_FROM`: Must be a verified sender email from Step 3
- `ADMIN_EMAIL`: Where you want to receive contact form submissions

### Step 5: Deploy and Test
1. Save the environment variables in Render
2. Render will automatically redeploy your service
3. Wait for deployment to complete
4. Submit the contact form on your website
5. Check your `ADMIN_EMAIL` inbox for the contact form submission

---

## Troubleshooting

### Connection Timeout
- Verify all environment variables are set correctly in Render
- Check that `SMTP_HOST` is exactly `smtp-relay.brevo.com`
- Ensure `SMTP_PORT` is `587` and `SMTP_SECURE` is `false`
- Verify your SMTP key is correct (regenerate if needed)
- Check Render logs for detailed error messages

### Authentication Failed
- Verify `SMTP_USER` matches your Brevo account email exactly
- Ensure `SMTP_PASSWORD` is the correct SMTP key (not your account password)
- Check that the SMTP key hasn't been revoked in Brevo dashboard

### Emails Not Received
- Check spam/junk folder
- Verify `ADMIN_EMAIL` is correct
- Ensure `SMTP_FROM` is a verified sender in Brevo
- Check Brevo dashboard → **Statistics** → **Emails** for delivery status
- Review Render logs for email send errors

### Sender Not Verified Error
- Go to Brevo → **Senders & IP** → **Senders**
- Verify that your `SMTP_FROM` email is listed and verified
- If not verified, click the verification link sent to that email

### Still Having Issues?
The contact form will still work even if email fails - submissions are logged to Render console. Check your Render logs to see contact form data.

---

## Brevo Free Tier Limits
- **300 emails per day** (9,000 per month)
- Unlimited contacts
- Email support
- SMTP access included

For higher limits, consider upgrading to a paid plan.
