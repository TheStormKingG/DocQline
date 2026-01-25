<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DocQline - Virtual Clinic Queue

A virtual clinic queue management system for managing patient appointments and queue status.

View your app in AI Studio: https://ai.studio/apps/drive/1Wcg4cKe3DGIRE8QT2opa_SuM786KO252

## Setup

### Prerequisites
- Node.js 18+ installed
- Git installed
- GitHub account
- Supabase account (sign up at https://supabase.com)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example.txt .env
   ```
   
   Edit `.env` and add your credentials:
   - `VITE_SUPABASE_URL`: Your Supabase project URL (from Dashboard > Settings > API)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key (from Dashboard > Settings > API)
   - `GEMINI_API_KEY`: Your Gemini API key

3. **Set up Supabase database:**
   - Create a new project at https://app.supabase.com
   - Run the SQL schema from `supabase-schema.sql` in the SQL Editor
   - Configure Row Level Security (RLS) policies as needed

4. **Run the app:**
   ```bash
   npm run dev
   ```

## Deployment

This app automatically deploys to GitHub Pages on push to `main` branch.

### GitHub Setup

1. **Create a GitHub repository** (if not already created)
2. **Add GitHub Secrets** (Settings → Secrets and variables → Actions):
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `GEMINI_API_KEY`: Your Gemini API key (if needed for build)

3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: GitHub Actions
   - Save

4. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

The app will be automatically deployed and available at:
`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Features

- Patient queue management
- Real-time status updates
- Receptionist dashboard
- Doctor interface
- Supabase integration with localStorage fallback
