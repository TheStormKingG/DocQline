// Supabase configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
}

// Optional: Validate configuration
if (import.meta.env.DEV && (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey)) {
  console.warn('⚠ Supabase not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file')
}

// Twilio serverless function for WhatsApp / SMS notifications
// This URL is not a secret — credentials live inside Twilio's servers.
export const TWILIO_FUNCTION_URL =
  import.meta.env.VITE_TWILIO_FUNCTION_URL ||
  'https://docqline-notify-5611.twil.io/send-whatsapp';
