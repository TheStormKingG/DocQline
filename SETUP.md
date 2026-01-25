# Setup Checklist

## ✅ Completed Files
- [x] `.gitignore` - Git ignore rules
- [x] `env.example.txt` - Environment variable template
- [x] `README.md` - Updated with setup instructions
- [x] `config.ts` - Supabase configuration
- [x] `supabase.ts` - Supabase client and helper functions
- [x] `supabase-schema.sql` - Database schema
- [x] `.github/workflows/pages.yml` - GitHub Actions workflow
- [x] `vite.config.ts` - Updated with `base: './'` for GitHub Pages
- [x] `App.tsx` - Integrated with Supabase

## 📋 Next Steps

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Set Up Environment Variables
```bash
cp env.example.txt .env
# Edit .env and add your Supabase credentials
```

### 3. Create Supabase Project
1. Go to https://app.supabase.com
2. Create a new project
3. Copy your Project URL and anon key from Settings → API
4. Add them to your `.env` file

### 4. Set Up Database
1. Go to SQL Editor in Supabase Dashboard
2. Run the SQL from `supabase-schema.sql`
3. Verify the `tickets` table was created

### 5. GitHub Repository Setup
1. Create a new repository on GitHub (if not already created)
2. Initialize git (if not already done):
   ```bash
   git init
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

### 6. Add GitHub Secrets
Go to your repository → Settings → Secrets and variables → Actions:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `GEMINI_API_KEY` - Your Gemini API key (if needed)

### 7. Enable GitHub Pages
1. Go to Settings → Pages
2. Source: GitHub Actions
3. Save

### 8. Test Locally
```bash
npm run dev
```
Check browser console for Supabase connection status.

### 9. Deploy
```bash
git add .
git commit -m "Add Supabase integration"
git push origin main
```

The app will automatically deploy via GitHub Actions. Check the Actions tab for deployment status.

## 🔍 Troubleshooting

- **Supabase not connecting**: Check `.env` file exists and has correct values
- **Build fails**: Verify GitHub secrets are set correctly
- **404 on GitHub Pages**: Ensure `vite.config.ts` has `base: './'`
- **Column name errors**: The code handles snake_case ↔ camelCase conversion automatically
