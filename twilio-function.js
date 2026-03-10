/**
 * DocQline — Twilio Serverless Function
 * ─────────────────────────────────────
 * Deploy this inside the Twilio Console:
 *   Console → Develop → Functions & Assets → Services
 *   → Create Service "docqline-notify" → Add Function "/send-whatsapp"
 *   → Paste this code → Save → Deploy All
 *
 * After deploying, copy the function URL (looks like:
 *   https://docqline-notify-XXXX.twil.io/send-whatsapp
 * ) and paste it as VITE_TWILIO_FUNCTION_URL in your .env file.
 *
 * The sandbox FROM number is: whatsapp:+14155238886
 * For production, replace with your approved WhatsApp sender number.
 */

exports.handler = function (context, event, callback) {
  const response = new Twilio.Response();

  // ── CORS headers so the React app (GitHub Pages) can call this ──
  response.setHeaders({
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  });

  // Handle pre-flight OPTIONS request
  if (event.request && event.request.method === 'OPTIONS') {
    response.setStatusCode(200);
    response.setBody('{}');
    return callback(null, response);
  }

  const to      = event.to;
  const message = event.message;
  const channel = (event.channel || 'WHATSAPP').toUpperCase();

  if (!to || !message) {
    response.setStatusCode(400);
    response.setBody(JSON.stringify({ error: 'Missing required fields: to, message' }));
    return callback(null, response);
  }

  const client = context.getTwilioClient();

  // WhatsApp numbers must be prefixed with "whatsapp:"
  const toFormatted   = channel === 'WHATSAPP' ? `whatsapp:${to}` : to;
  const fromFormatted = channel === 'WHATSAPP'
    ? 'whatsapp:+14155238886'   // ← Twilio sandbox number (change for production)
    : context.TWILIO_PHONE_NUMBER || '+14155238886';

  client.messages
    .create({ body: message, from: fromFormatted, to: toFormatted })
    .then((msg) => {
      response.setStatusCode(200);
      response.setBody(JSON.stringify({ success: true, sid: msg.sid }));
      callback(null, response);
    })
    .catch((err) => {
      console.error('Twilio send error:', err.message);
      response.setStatusCode(500);
      response.setBody(JSON.stringify({ error: err.message }));
      callback(null, response);
    });
};
