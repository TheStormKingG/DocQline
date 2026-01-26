# GitHub Repository Setup & Deployment Guide

## Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (if installed)
```bash
gh repo create DocQline --public --source=. --remote=origin --push
```

### Option B: Using GitHub Website (Recommended)

1. **Go to GitHub**: https://github.com/new

2. **Fill in repository details**:
   - **Repository name**: `DocQline` (or your preferred name)
   - **Description**: "Virtual clinic queue management system with Supabase integration"
   - **Visibility**: 
     - ✅ **Public** (recommended for GitHub Pages - free hosting)
     - ⚠️ **Private** (requires GitHub Pro for Pages, or use other hosting)
   - **Important**: 
     - ❌ Do NOT check "Add a README file"
     - ❌ Do NOT check "Add .gitignore"
     - ❌ Do NOT check "Choose a license"
   - Click **"Create repository"**

3. **After creating**, GitHub will show you setup instructions. **Don't follow them** - we'll do it differently.

## Step 2: Connect Local Repository to GitHub

Once you have your repository URL (e.g., `https://github.com/YOUR_USERNAME/DocQline`), run:

```bash
# Add remote (replace YOUR_USERNAME and DocQline with your actual values)
git remote add origin https://github.com/YOUR_USERNAME/DocQline.git

# Verify remote is set
git remote -v

# Push code to GitHub
git push -u origin main
```

## Step 3: Configure GitHub Secrets

These secrets are used by GitHub Actions to build and deploy your app.

1. **Go to your repository on GitHub**
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **"New repository secret"** and add these three secrets:

   **Secret 1: VITE_SUPABASE_URL**
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase Project URL (from `.env` file)
     - Example: `https://abcdefghijklmnop.supabase.co`
   - Click **"Add secret"**

   **Secret 2: VITE_SUPABASE_ANON_KEY**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key (from `.env` file)
     - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)
   - Click **"Add secret"**

   **Secret 3: GEMINI_API_KEY** (if you use Gemini API)
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key (from `.env` file)
   - Click **"Add secret"**

## Step 4: Enable GitHub Pages

1. **Still in Settings**, click **Pages** (left sidebar)
2. Under **Source**, select: **GitHub Actions**
3. Click **Save**

## Step 5: Trigger Deployment

The deployment will automatically trigger when you push to `main` branch. If you've already pushed, you can manually trigger it:

1. Go to **Actions** tab in your repository
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** → **"Run workflow"** button

Or simply make a small change and push:
```bash
# Make a small change
echo "" >> README.md

# Commit and push
git add README.md
git commit -m "Trigger deployment"
git push
```

## Step 6: Monitor Deployment

1. Go to **Actions** tab
2. Click on the running workflow
3. Watch the build process (takes ~2-3 minutes)
4. Once complete, you'll see a green checkmark ✅

## Step 7: Access Your Live App

After successful deployment, your app will be available at:
```
https://YOUR_USERNAME.github.io/DocQline/
```

(Replace `YOUR_USERNAME` and `DocQline` with your actual values)

## 🔍 Troubleshooting

### Build Fails
- Check **Actions** tab for error details
- Verify all secrets are set correctly (Settings → Secrets)
- Ensure secrets don't have quotes or extra spaces

### 404 Error on GitHub Pages
- Wait 2-3 minutes after deployment completes
- Check that `vite.config.ts` has `base: './'` (already configured)
- Verify the workflow completed successfully in Actions tab

### Secrets Not Working
- Double-check secret names match exactly (case-sensitive)
- Ensure values don't have quotes around them
- Restart the workflow after adding secrets

## 📝 Quick Commands Reference

```bash
# Check git status
git status

# Add remote (one time only)
git remote add origin https://github.com/YOUR_USERNAME/DocQline.git

# Push code
git push -u origin main

# View remotes
git remote -v

# Check Actions workflow
# (Go to GitHub website → Actions tab)
```

## ✅ Checklist

- [ ] GitHub repository created
- [ ] Local repository connected to GitHub remote
- [ ] Code pushed to GitHub
- [ ] GitHub secrets added (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] GitHub Pages enabled (Source: GitHub Actions)
- [ ] Deployment workflow running in Actions tab
- [ ] App accessible at https://YOUR_USERNAME.github.io/DocQline/
