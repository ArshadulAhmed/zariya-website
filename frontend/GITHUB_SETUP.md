# How to Push to GitHub

Follow these steps to push your Zariya website to GitHub:

## Step 1: Initialize Git Repository

Open your terminal in the `frontend` directory and run:

```powershell
git init
```

## Step 2: Add All Files

```powershell
git add .
```

## Step 3: Create Initial Commit

```powershell
git commit -m "Initial commit: Zariya microfinance website"
```

## Step 4: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Name your repository (e.g., `zariya-website`)
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

## Step 5: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these (replace `YOUR_USERNAME` and `YOUR_REPO_NAME`):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Alternative: Using SSH (if you have SSH keys set up)

If you prefer SSH:

```powershell
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Quick Command Summary

```powershell
# Navigate to frontend directory
cd frontend

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Zariya microfinance website"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Future Updates

After making changes to your code:

```powershell
git add .
git commit -m "Description of your changes"
git push
```

## Troubleshooting

### If you get authentication errors:
- Use a Personal Access Token instead of password
- Or set up SSH keys for GitHub

### If you need to change the remote URL:
```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### If you need to see your remote:
```powershell
git remote -v
```

