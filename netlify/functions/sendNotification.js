// netlify/functions/sendNotification.js
// ─────────────────────────────────────
// Sends a quote-summary email to info@rewall.nz via Resend API.
// This is SEPARATE from the Supabase database save (submitQuote.js).
// Supabase data is untouched — this is purely the email notification.
//
// Required env var:  RESEND_API_KEY
// Optional env var:  NOTIFICATION_EMAIL  (default: info@rewall.nz)

const axios = require('axios');

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const RESEND_API_KEY     = process.env.RESEND_API_KEY;
  const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'info@rewall.nz';

  if (!RESEND_API_KEY) {
    console.error('[sendNotification] RESEND_API_KEY not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'RESEND_API_KEY env var is missing' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('[sendNotification] Received payload keys:', Object.keys(body).join(', '));

    // ---- Extract fields from the client payload ----
    const clientName     = body.clientName     || 'Unknown';
    const clientEmail    = body.clientEmail     || '';
    const clientPhone    = body.clientPhone     || '';
    const companyProject = body.companyProject  || '';
    const address        = body.address         || 'Not specified';
    const wallTypes      = body.wallTypes       || 'Not specified';
    const numberOfWalls  = body.numberOfWalls   || 0;
    const totalWallLength= body.totalWallLength || '';
    const geotechStatus  = body.geotechStatus   || 'Not specified';
    const notes          = body.notes           || '';
    const quoteId        = body.quoteId         || 'N/A';
    const hasAttachments = body.hasAttachments   || false;
    const attachmentUrls = body.attachmentUrls   || [];
    const services       = body.services         || [];

    // ---- Services list ----
    let servicesHtml = '';
    const servicesList = Array.isArray(services)
      ? services
      : String(services).split(',').map(s => s.trim()).filter(Boolean);
    if (servicesList.length > 0) {
      servicesHtml = servicesList.map(s => `<li style="padding:2px 0;">&#10003; ${s}</li>`).join('');
      servicesHtml = `<ul style="list-style:none;padding:0;margin:0;">${servicesHtml}</ul>`;
    } else {
      servicesHtml = '<p style="color:#999;">No specific services selected</p>';
    }

    // ---- Wall measurements ----
    let wallSection = '';
    const walls = body.walls || [];
    if (walls.length > 0) {
      const rows = walls.map(w =>
        `<tr>
          <td style="padding:6px 12px;border:1px solid #e0e0e0;">Wall #${w.id}</td>
          <td style="padding:6px 12px;border:1px solid #e0e0e0;">${w.lengthFormatted || 'N/A'}</td>
          <td style="padding:6px 12px;border:1px solid #e0e0e0;">${w.heightFormatted || 'N/A'}</td>
        </tr>`
      ).join('');
      wallSection = `
        <h3 style="color:#1a2a3a;margin:20px 0 8px;">Wall Measurements</h3>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">
          <tr style="background:#f0f4f8;">
            <th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Wall</th>
            <th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Length</th>
            <th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Height</th>
          </tr>
          ${rows}
        </table>
        <p style="font-size:13px;color:#666;">Total: ${numberOfWalls} wall(s), ~${totalWallLength}</p>`;
    } else {
      wallSection = '<h3 style="color:#1a2a3a;margin:20px 0 8px;">Wall Measurements</h3><p style="color:#999;">No walls drawn on map</p>';
    }

    // ---- Attachments section — clearly indicates YES or NO ----
    let attachmentHtml = '';
    if (hasAttachments && attachmentUrls.length > 0) {
      const fileList = attachmentUrls.map(a =>
        `<li style="padding:2px 0;">${a.name} (${a.sizeFormatted || 'unknown size'})</li>`
      ).join('');
      attachmentHtml = `
        <div style="background:#fff8e1;padding:12px 16px;border-radius:8px;border-left:4px solid #f9a825;margin-top:8px;">
          <p style="margin:0 0 6px;font-weight:600;">${attachmentUrls.length} file(s) attached</p>
          <ul style="margin:0;padding-left:20px;">${fileList}</ul>
          <p style="margin:8px 0 0;font-size:12px;color:#888;">Files uploaded to <strong>Supabase Storage - ReWallClientBucket</strong></p>
        </div>`;
    } else if (hasAttachments) {
      attachmentHtml = `
        <div style="background:#fff8e1;padding:12px 16px;border-radius:8px;border-left:4px solid #f9a825;margin-top:8px;">
          <p style="margin:0;font-weight:600;">File(s) uploaded to Supabase Storage</p>
          <p style="margin:4px 0 0;font-size:12px;color:#888;">Check <strong>Supabase Dashboard - Storage - ReWallClientBucket</strong></p>
        </div>`;
    } else {
      attachmentHtml = `
        <div style="background:#f5f5f5;padding:12px 16px;border-radius:8px;border-left:4px solid #bdbdbd;margin-top:8px;">
          <p style="margin:0;color:#999;">No attachments - client did not upload any files</p>
        </div>`;
    }

    // ---- Geotech display ----
    let geotechText = String(geotechStatus);
    if (geotechStatus === true || geotechStatus === 'true') geotechText = 'Has geotechnical report';
    else if (geotechStatus === false || geotechStatus === 'false') geotechText = 'No report';
    else if (geotechStatus === 'want') geotechText = 'Include geotech in quote';

    const timestamp = new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' });

    // ---- Subject line — includes indicator if attachments ----
    const subject = `New Quote #${quoteId} - ${clientName} - ${address}${hasAttachments ? ' [FILES ATTACHED]' : ''}`;

    // ---- HTML email body ----
    const htmlBody = `
<div style="font-family:'Segoe UI',Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:linear-gradient(135deg,#1a2a3a 0%,#2a3a4a 100%);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">New Quote Request</h1>
    <p style="color:#4A90A4;margin:8px 0 0;font-size:16px;">Reference #${quoteId}</p>
  </div>
  <div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">

    <h3 style="color:#1a2a3a;margin:0 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">Selected Services</h3>
    ${servicesHtml}

    <h3 style="color:#1a2a3a;margin:20px 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">Contact Details</h3>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#666;width:140px;"><strong>Name</strong></td><td>${clientName}</td></tr>
      <tr><td style="padding:6px 0;color:#666;"><strong>Email</strong></td><td><a href="mailto:${clientEmail}" style="color:#4A90A4;">${clientEmail}</a></td></tr>
      ${clientPhone ? `<tr><td style="padding:6px 0;color:#666;"><strong>Phone</strong></td><td><a href="tel:${clientPhone}" style="color:#4A90A4;">${clientPhone}</a></td></tr>` : ''}
      ${companyProject ? `<tr><td style="padding:6px 0;color:#666;"><strong>Company</strong></td><td>${companyProject}</td></tr>` : ''}
    </table>

    <h3 style="color:#1a2a3a;margin:20px 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">Site Location</h3>
    <p style="font-size:14px;">${address}</p>

    ${wallSection}

    <h3 style="color:#1a2a3a;margin:20px 0 8px;">Wall Types</h3>
    <p style="font-size:14px;">${wallTypes}</p>

    <h3 style="color:#1a2a3a;margin:20px 0 8px;">Geotechnical Report</h3>
    <p style="font-size:14px;">${geotechText}</p>

    ${notes ? `<h3 style="color:#1a2a3a;margin:20px 0 8px;">Project Notes</h3><p style="background:#f9f9f9;padding:12px;border-radius:6px;font-size:14px;color:#333;">${notes}</p>` : ''}

    <h3 style="color:#1a2a3a;margin:20px 0 8px;">Attachments</h3>
    ${attachmentHtml}

    <div style="margin-top:24px;padding:16px;background:#f0f4f8;border-radius:8px;font-size:13px;color:#666;">
      <p style="margin:0 0 4px;"><strong>Submitted:</strong> ${timestamp}</p>
      <p style="margin:0;"><strong>Email sent via:</strong> Resend API</p>
    </div>
  </div>
</div>`;

    // ================================================================
    // SEND via Resend API — single HTTP POST
    // ================================================================
    console.log(`[sendNotification] Sending to ${NOTIFICATION_EMAIL} via Resend…`);

    const resendResponse = await axios.post(
      'https://api.resend.com/emails',
      {
        from:     'ReWall Quotes <onboarding@resend.dev>',
        to:       [NOTIFICATION_EMAIL],
        reply_to: clientEmail,
        subject:  subject,
        html:     htmlBody,
      },
      {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('[sendNotification] Resend response:', resendResponse.status, JSON.stringify(resendResponse.data));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success:   true,
        message:   `Email sent to ${NOTIFICATION_EMAIL}`,
        emailId:   resendResponse.data.id,
        transport: 'resend',
      }),
    };

  } catch (err) {
    // ---- Detailed error for diagnostics ----
    let errDetails;
    if (err.response) {
      errDetails = {
        source:  'resend_api',
        status:  err.response.status,
        data:    err.response.data,
        message: err.response.data?.message || err.message,
      };
    } else if (err.request) {
      errDetails = {
        source:  'network',
        message: err.message,
        code:    err.code || null,
      };
    } else {
      errDetails = {
        source:  'unknown',
        message: err.message,
      };
    }

    console.error('[sendNotification] FAILED:', JSON.stringify(errDetails));

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:   'Email notification failed',
        details: errDetails,
      }),
    };
  }
};
