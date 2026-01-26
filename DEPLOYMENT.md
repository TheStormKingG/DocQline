# 🚀 GitHub Deployment - Quick Setup Guide

## ✅ Completed
- [x] Repository created: https://github.com/TheStormKingG/DocQline
- [x] Code pushed to GitHub
- [x] Initial commit completed

## 📋 Next Steps

### Step 1: Add GitHub Secrets (Required for Build)

Your app needs these secrets to build correctly. Go to:
**https://github.com/TheStormKingG/DocQline/settings/secrets/actions**

Click **"New repository secret"** and add:

#### Secret 1: VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: Your Supabase Project URL
  - Get it from: Supabase Dashboard → Settings → API → Project URL
  - Example: `https://abcdefghijklmnop.supabase.co`

#### Secret 2: VITE_SUPABASE_ANON_KEY  
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon key
  - Get it from: Supabase Dashboard → Settings → API → anon/public key
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

#### Secret 3: GEMINI_API_KEY (Optional - only if you use Gemini API)
- **Name**: `GEMINI_API_KEY`
- **Value**: Your Gemini API key (if applicable)

**Important**: 
- Copy values directly from your `.env` file (without quotes)
- No spaces before/after values
- Names are case-sensitive

### Step 2: Enable GitHub Pages

1. Go to: **https://github.com/TheStormKingG/DocQline/settings/pages**
2. Under **Source**, select: **GitHub Actions**
3. Click **Save**

### Step 3: Trigger Deployment

After adding secrets and enabling Pages, trigger the deployment:

**Option A: Manual Trigger**
1. Go to: **https://github.com/TheStormKingG/DocQline/actions**
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** dropdown → **"Run workflow"** button

**Option B: Push a Change**
```bash
# Make a small change
echo "" >> README.md
git add README.md
git commit -m "Trigger deployment"
git push
```

### Step 4: Monitor Deployment

1. Go to: **https://github.com/TheStormKingG/DocQline/actions**
2. Click on the running workflow
3. Watch the build process:
   - ✅ Green checkmark = Success
   - ❌ Red X = Error (check logs)

### Step 5: Access Your Live App

Once deployment succeeds, your app will be live at:
**https://thestormkingg.github.io/DocQline/**

(It may take 1-2 minutes after the workflow completes)

## 🔍 Quick Links

- **Repository**: https://github.com/TheStormKingG/DocQline
- **Add Secrets**: https://github.com/TheStormKingG/DocQline/settings/secrets/actions
- **Enable Pages**: https://github.com/TheStormKingG/DocQline/settings/pages
- **View Actions**: https://github.com/TheStormKingG/DocQline/actions
- **Live App**: https://thestormkingg.github.io/DocQline/ (after deployment)

## ⚠️ Troubleshooting

**Build fails?**
- Check Actions tab for error details
- Verify secrets are set correctly (no typos, no quotes)
- Ensure all three secrets are added

**404 Error?**
- Wait 2-3 minutes after deployment
- Check Actions tab - workflow must complete successfully
- Verify Pages source is set to "GitHub Actions"

**Secrets not working?**
- Double-check secret names (case-sensitive)
- Ensure values match your `.env` file exactly
- Restart workflow after adding secrets

## 📝 Current Status

- ✅ Repository: Created and pushed
- ⏳ Secrets: Need to be added (Step 1)
- ⏳ Pages: Need to be enabled (Step 2)
- ⏳ Deployment: Will trigger after Steps 1 & 2
