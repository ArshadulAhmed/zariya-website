# Deployment Guide - GitHub Pages

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Install gh-pages Package

```bash
npm install --save-dev gh-pages
```

## Step 3: Build the Project

```bash
npm run build
```

This will create a `dist` folder with all the production files.

## Step 4: Deploy to GitHub Pages

Run the deployment command:

```bash
npm run deploy
```

This will:
1. Build your project
2. Deploy the `dist` folder to the `gh-pages` branch
3. Make your site available at: `https://arshadulahmed.github.io/zariya-website/`

## Step 5: Enable GitHub Pages (if not already enabled)

1. Go to your GitHub repository: https://github.com/ArshadulAhmed/zariya-website
2. Click on **Settings**
3. Scroll down to **Pages** section
4. Under **Source**, select **Deploy from a branch**
5. Select **gh-pages** branch and **/ (root)** folder
6. Click **Save**

## Step 6: Access Your Live Site

Your website will be available at:
**https://arshadulahmed.github.io/zariya-website/**

## Important Notes:

- The base path in `vite.config.js` is set to `/zariya-website/` to match your repository name
- If you change your repository name, update the `base` path in `vite.config.js`
- After deployment, it may take a few minutes for the site to be live
- You can share the link: `https://arshadulahmed.github.io/zariya-website/`

## Future Deployments

Whenever you make changes and want to deploy:

```bash
npm run deploy
```

That's it! Your changes will be live in a few minutes.

