// netlify/functions/sendNotification.js
// Sends quote-summary email to info@rewall.nz via Resend API.
// ZERO npm dependencies — uses only Node.js built-in https module.
// Completely separate from database (submitQuote.js handles Supabase).
//
// Required env var: RESEND_API_KEY
// Optional env var: NOTIFICATION_EMAIL (default: info@rewall.nz)

const https = require('https');

/**
 * POST JSON to a URL. Returns { statusCode, body } or throws.
 * Uses only Node.js built-in https — no axios, no node-fetch.
 */
function postJSON(url, data, authHeader) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const parsed = new URL(url);

    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': authHeader,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Request timed out after 12s'));
    });

    req.write(payload);
    req.end();
  });
}

exports.handler = async function (event) {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: h, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: h, body: '{"error":"Method not allowed"}' };

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL   = process.env.NOTIFICATION_EMAIL || 'info@rewall.nz';

  if (!RESEND_KEY) {
    console.error('[email] RESEND_API_KEY is not set!');
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) };
  }

  console.log('[email] Function invoked. RESEND_API_KEY starts with:', RESEND_KEY.substring(0, 8) + '...');
  console.log('[email] Sending to:', TO_EMAIL);

  try {
    const b = JSON.parse(event.body);

    // ---- Extract data with safe defaults ----
    const name      = b.clientName     || 'Unknown';
    const email     = b.clientEmail    || '';
    const phone     = b.clientPhone    || '';
    const company   = b.companyProject || '';
    const address   = b.address        || 'Not specified';
    const wallTypes = b.wallTypes      || 'Not specified';
    const nWalls    = b.numberOfWalls  || 0;
    const totalLen  = b.totalWallLength|| '';
    const geotech   = b.geotechStatus  || 'Not specified';
    const notes     = b.notes          || '';
    const quoteId   = b.quoteId        || 'N/A';
    const hasFiles  = b.hasAttachments || false;
    const fileUrls  = b.attachmentUrls || [];
    const services  = b.services       || [];
    const walls     = b.walls          || [];

    // ---- Build services HTML ----
    const svcList = Array.isArray(services) ? services : String(services).split(',').map(s => s.trim()).filter(Boolean);
    const svcHtml = svcList.length > 0
      ? '<ul style="list-style:none;padding:0;margin:0;">' + svcList.map(s => '<li style="padding:2px 0;">&#10003; ' + s + '</li>').join('') + '</ul>'
      : '<p style="color:#999;">No services selected</p>';

    // ---- Build walls table ----
    let wallHtml = '<p style="color:#999;">No walls drawn</p>';
    if (walls.length > 0) {
      const rows = walls.map(w =>
        '<tr><td style="padding:6px 12px;border:1px solid #e0e0e0;">Wall #' + w.id + '</td>' +
        '<td style="padding:6px 12px;border:1px solid #e0e0e0;">' + (w.lengthFormatted || 'N/A') + '</td>' +
        '<td style="padding:6px 12px;border:1px solid #e0e0e0;">' + (w.heightFormatted || 'N/A') + '</td></tr>'
      ).join('');
      wallHtml =
        '<table style="border-collapse:collapse;width:100%;font-size:14px;">' +
        '<tr style="background:#f0f4f8;"><th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Wall</th><th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Length</th><th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Height</th></tr>' +
        rows + '</table>' +
        '<p style="font-size:13px;color:#666;">Total: ' + nWalls + ' wall(s), ~' + totalLen + '</p>';
    }

    // ---- Build attachments HTML ----
    let fileHtml;
    if (hasFiles && fileUrls.length > 0) {
      const items = fileUrls.map(a => '<li>' + a.name + ' (' + (a.sizeFormatted || '?') + ')</li>').join('');
      fileHtml =
        '<div style="background:#fff8e1;padding:12px 16px;border-radius:8px;border-left:4px solid #f9a825;">' +
        '<p style="margin:0 0 6px;font-weight:bold;">' + fileUrls.length + ' file(s) attached</p>' +
        '<ul style="margin:0;padding-left:20px;">' + items + '</ul>' +
        '<p style="margin:6px 0 0;font-size:12px;color:#888;">Files in Supabase Storage &gt; ReWallClientBucket</p></div>';
    } else if (hasFiles) {
      fileHtml =
        '<div style="background:#fff8e1;padding:12px 16px;border-radius:8px;border-left:4px solid #f9a825;">' +
        '<p style="margin:0;font-weight:bold;">Files uploaded to Supabase Storage</p></div>';
    } else {
      fileHtml =
        '<div style="background:#f5f5f5;padding:12px 16px;border-radius:8px;border-left:4px solid #bdbdbd;">' +
        '<p style="margin:0;color:#999;">No attachments</p></div>';
    }

    // ---- Geotech ----
    let geoText = String(geotech);
    if (geotech === true || geotech === 'true') geoText = 'Has geotechnical report';
    else if (geotech === false || geotech === 'false') geoText = 'No report';

    const time = new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' });

    const subject = 'New Quote #' + quoteId + ' - ' + name + ' - ' + address + (hasFiles ? ' [FILES]' : '');

    const html =
      '<div style="font-family:Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">' +
        '<div style="background:linear-gradient(135deg,#1a2a3a,#2a3a4a);padding:30px;text-align:center;border-radius:8px 8px 0 0;">' +
          '<h1 style="color:#fff;margin:0;font-size:24px;">New Quote Request</h1>' +
          '<p style="color:#4A90A4;margin:8px 0 0;font-size:16px;">Reference #' + quoteId + '</p>' +
        '</div>' +
        '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">' +
          '<h3 style="color:#1a2a3a;margin:0 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">Selected Services</h3>' + svcHtml +
          '<h3 style="color:#1a2a3a;margin:20px 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">Contact Details</h3>' +
          '<table style="width:100%;font-size:14px;border-collapse:collapse;">' +
            '<tr><td style="padding:6px 0;color:#666;width:130px;"><b>Name</b></td><td>' + name + '</td></tr>' +
            '<tr><td style="padding:6px 0;color:#666;"><b>Email</b></td><td><a href="mailto:' + email + '" style="color:#4A90A4;">' + email + '</a></td></tr>' +
            (phone ? '<tr><td style="padding:6px 0;color:#666;"><b>Phone</b></td><td>' + phone + '</td></tr>' : '') +
            (company ? '<tr><td style="padding:6px 0;color:#666;"><b>Company</b></td><td>' + company + '</td></tr>' : '') +
          '</table>' +
          '<h3 style="color:#1a2a3a;margin:20px 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">Site Location</h3>' +
          '<p style="font-size:14px;">' + address + '</p>' +
          '<h3 style="color:#1a2a3a;margin:20px 0 8px;">Wall Measurements</h3>' + wallHtml +
          '<h3 style="color:#1a2a3a;margin:20px 0 8px;">Wall Types</h3><p style="font-size:14px;">' + wallTypes + '</p>' +
          '<h3 style="color:#1a2a3a;margin:20px 0 8px;">Geotechnical Report</h3><p style="font-size:14px;">' + geoText + '</p>' +
          (notes ? '<h3 style="color:#1a2a3a;margin:20px 0 8px;">Project Notes</h3><p style="background:#f9f9f9;padding:12px;border-radius:6px;font-size:14px;color:#333;">' + notes + '</p>' : '') +
          '<h3 style="color:#1a2a3a;margin:20px 0 8px;">Attachments</h3>' + fileHtml +
          '<div style="margin-top:24px;padding:16px;background:#f0f4f8;border-radius:8px;font-size:13px;color:#666;">' +
            '<p style="margin:0 0 4px;"><b>Submitted:</b> ' + time + '</p>' +
            '<p style="margin:0;"><b>Email via:</b> Resend API</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    // ---- POST to Resend ----
    console.log('[email] Posting to Resend API...');

    const result = await postJSON('https://api.resend.com/emails', {
      from:     'ReWall Quotes <onboarding@resend.dev>',
      to:       [TO_EMAIL],
      reply_to: email || undefined,
      subject:  subject,
      html:     html,
    }, 'Bearer ' + RESEND_KEY);

    console.log('[email] Resend response:', result.statusCode, JSON.stringify(result.body));

    if (result.statusCode >= 200 && result.statusCode < 300) {
      return {
        statusCode: 200,
        headers: h,
        body: JSON.stringify({
          success: true,
          message: 'Email sent to ' + TO_EMAIL,
          emailId: result.body.id,
          resendStatus: result.statusCode,
        }),
      };
    }

    // Resend returned an error
    return {
      statusCode: 502,
      headers: h,
      body: JSON.stringify({
        error: 'Resend API returned ' + result.statusCode,
        details: result.body,
      }),
    };

  } catch (err) {
    console.error('[email] ERROR:', err.message, err.stack);
    return {
      statusCode: 500,
      headers: h,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
