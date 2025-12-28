# File Upload Implementation Guide

## Overview
This backend now supports file uploads for membership applications. The system uses **local file storage** for development and can be configured to use **AWS S3** for production.

## Current Implementation (Local Storage)

### Setup
1. Install required packages:
   ```bash
   npm install multer
   ```

2. Files are stored in: `backend/uploads/memberships/`

3. Files are served statically at: `/uploads/memberships/{filename}`

### How It Works
- Files are uploaded via `multipart/form-data` (FormData)
- Multer middleware handles file uploads
- Files are saved with unique names: `{sanitized-name}-{timestamp}-{random}.{ext}`
- File paths are stored in MongoDB
- Files are served via Express static middleware

## Production Setup (AWS S3)

### Why AWS S3?
- **Cost-effective**: Pay only for what you use
- **Free tier**: 5GB storage, 20,000 GET requests, 2,000 PUT requests per month for 12 months
- **Scalable**: Handles any amount of traffic
- **Reliable**: 99.999999999% (11 9's) durability
- **CDN-ready**: Can integrate with CloudFront for faster delivery

### Estimated Costs (After Free Tier)
- **Storage**: ~$0.023 per GB/month (first 50TB)
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data transfer out**: First 1GB free, then $0.09/GB

**Example**: For 1000 memberships/month with 3 files each (3GB total):
- Storage: ~$0.07/month
- PUT requests (3000): ~$0.015/month
- GET requests (1000): ~$0.0004/month
- **Total: ~$0.10/month** (very cheap!)

### Setup Steps

1. **Create AWS Account** (if you don't have one)
   - Go to https://aws.amazon.com/
   - Sign up (requires credit card, but free tier covers most usage)

2. **Create S3 Bucket**
   ```bash
   # Using AWS CLI (or use AWS Console)
   aws s3 mb s3://zariya-uploads --region us-east-1
   ```

3. **Configure IAM User**
   - Go to AWS IAM Console
   - Create a new user with programmatic access
   - Attach policy: `AmazonS3FullAccess` (or create custom policy with limited permissions)
   - Save Access Key ID and Secret Access Key

4. **Update Environment Variables**
   Add to your `.env` file:
   ```env
   NODE_ENV=production
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=zariya-uploads
   ```

5. **Install Additional Package** (for S3 support)
   ```bash
   npm install multer-s3 aws-sdk
   ```

6. **Update Configuration**
   The system will automatically use S3 when:
   - `NODE_ENV=production`
   - `AWS_ACCESS_KEY_ID` is set

## Alternative Cloud Storage Options

### 1. **DigitalOcean Spaces** (Cheaper than S3)
- $5/month for 250GB storage + 1TB transfer
- Similar API to S3
- Good for predictable usage

### 2. **Backblaze B2** (Very cheap)
- $5/month for 1TB storage
- Free egress (data transfer out)
- Good for high-traffic applications

### 3. **Cloudinary** (Free tier available)
- Free: 25GB storage, 25GB bandwidth/month
- Built-in image optimization
- Good for image-heavy applications

## File Upload Fields

The membership form uploads three files:
1. **aadharUpload** - Aadhar card (image or PDF, max 50KB)
2. **panUpload** - PAN card (image or PDF, max 50KB)
3. **passportPhoto** - Passport size photo (image only, max 50KB)

## API Usage

### Upload Files
```javascript
const formData = new FormData();
formData.append('fullName', 'John Doe');
formData.append('aadharUpload', file1);
formData.append('panUpload', file2);
formData.append('passportPhoto', file3);
// ... other fields

fetch('/api/memberships', {
  method: 'POST',
  body: formData
});
```

### Access Uploaded Files
- **Local storage**: `http://localhost:5000/uploads/memberships/{filename}`
- **S3**: Full URL stored in database (e.g., `https://bucket.s3.region.amazonaws.com/path/file.jpg`)

## Security Considerations

1. **File Type Validation**: Only images (JPEG, PNG, GIF, WEBP) and PDFs allowed
2. **File Size Limit**: 50KB maximum per file
3. **Filename Sanitization**: Original filenames are sanitized to prevent path traversal
4. **Unique Filenames**: Timestamp + random number prevents overwrites

## Troubleshooting

### Files not uploading
- Check multer middleware is applied before validation
- Verify `Content-Type: multipart/form-data` in request
- Check file size is under 50KB
- Verify file type is allowed

### Files not accessible
- **Local**: Check `uploads/` directory exists and has proper permissions
- **S3**: Verify bucket policy allows public read access (or use signed URLs)

### S3 not working
- Verify AWS credentials are correct
- Check bucket name matches `AWS_S3_BUCKET_NAME`
- Verify region is correct
- Check IAM user has S3 permissions

