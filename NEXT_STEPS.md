# Next Steps Guide

## ✅ Completed
- [x] Installed `@supabase/supabase-js` package
- [x] Created `.env` file from template
- [x] Initialized git repository

## 📝 Action Required

### Step 1: Add Supabase Credentials to .env

Edit the `.env` file and add your Supabase credentials:

1. **Create a Supabase Project** (if you haven't already):
   - Go to https://app.supabase.com
   - Click "New Project"
   - Fill in:
     - Project name: `docqline` (or your preferred name)
     - Database password: Create a strong password (save it!)
     - Region: Choose closest to your users
     - Pricing plan: Free tier is fine for development
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

2. **Get Your Supabase Credentials**:
   - In Supabase Dashboard, go to **Settings → API**
   - Copy these values:
     - **Project URL**: `https://xxxxx.supabase.co`
     - **anon/public key**: Long string starting with `eyJ...`

3. **Update .env file**:
   ```bash
   # Open .env in your editor and update:
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   GEMINI_API_KEY=your-gemini-api-key-here  # If you have one
   ```

### Step 2: Set Up Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from this project
3. Copy all the SQL code
4. Paste it into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify the `tickets` table was created (check Table Editor)

### Step 3: Test Locally

```bash
npm run dev
```

Open your browser console and look for:
- `✓ Supabase connected: https://...` (if configured correctly)
- `⚠ Supabase not configured...` (if credentials are missing)

The app will work with localStorage fallback even without Supabase configured.

### Step 4: Set Up GitHub Repository

**Option A: Create New Repository**
1. Go to https://github.com/new
2. Repository name: `DocQline` (or your preferred name)
3. Description: "Virtual clinic queue management system"
4. Visibility: Public or Private
5. **Do NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

**Option B: Use Existing Repository**
If you already have a GitHub repository, skip to Step 5.

### Step 5: Connect Local Repository to GitHub

```bash
# Add remote (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Verify remote is set
git remote -v
```

### Step 6: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"** and add:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase Project URL (from .env)

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key (from .env)

   **Secret 3 (if needed):**
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key (if you use it)

### Step 7: Enable GitHub Pages

1. In your GitHub repository, go to **Settings → Pages**
2. Under **Source**, select: **GitHub Actions**
3. Click **Save**

### Step 8: Commit and Push

```bash
# Stage all files
git add .

# Commit
git commit -m "Initial commit with Supabase integration"

# Push to main branch
git push -u origin main
```

### Step 9: Monitor Deployment

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Watch the workflow run (takes ~2-3 minutes)
4. Once complete, your app will be live at:
   `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## 🔍 Troubleshooting

- **Supabase connection fails**: Double-check `.env` file has correct values (no quotes, no spaces)
- **GitHub Actions fails**: Verify secrets are set correctly (Settings → Secrets)
- **404 on GitHub Pages**: Ensure `vite.config.ts` has `base: './'` (already done)
- **Database errors**: Make sure you ran the SQL schema in Supabase SQL Editor

## 📚 Quick Reference

- Supabase Dashboard: https://app.supabase.com
- GitHub: https://github.com
- Your app will work locally even without Supabase (uses localStorage fallback)
