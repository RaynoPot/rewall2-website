// netlify/functions/sendNotification.js — Email notification to info@rewall.nz
// Uses Resend API (https://resend.com) — free tier: 100 emails/day
//
// TWO trigger modes:
//   A) Supabase Database Webhook (primary) — fires on INSERT to Re_wall_anon_users
//      Payload shape: { type: "INSERT", table: "Re_wall_anon_users", record: { ... } }
//   B) Direct client call (fallback) — from quote.html after submission
//      Payload shape: { quoteId, clientName, clientEmail, ... }
//
// Required env vars:
//   RESEND_API_KEY     — API key from https://resend.com/api-keys
//   NOTIFICATION_EMAIL — Target email (default: info@rewall.nz)
//   API_URL            — Supabase project URL (for storage links)
//   WEBHOOK_SECRET     — (optional) shared secret to verify Supabase webhook calls

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
  const SUPABASE_URL       = process.env.API_URL || '';
  const WEBHOOK_SECRET     = process.env.WEBHOOK_SECRET || '';

  if (!RESEND_API_KEY) {
    console.error('[sendNotification] Missing RESEND_API_KEY env var');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Email service not configured (missing RESEND_API_KEY)' }) };
  }

  try {
    const body = JSON.parse(event.body);

    // ---- Detect source: Supabase Webhook vs Direct Client call ----
    const isWebhook = body.type === 'INSERT' && body.record;
    console.log(`[sendNotification] Source: ${isWebhook ? 'Supabase Webhook' : 'Direct client call'}`);

    // ---- Optional: verify webhook secret ----
    if (isWebhook && WEBHOOK_SECRET) {
      const incomingSecret = event.headers['x-webhook-secret'] || event.headers['authorization'];
      if (incomingSecret !== WEBHOOK_SECRET && incomingSecret !== `Bearer ${WEBHOOK_SECRET}`) {
        console.error('[sendNotification] Webhook secret mismatch');
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
    }

    // ---- Normalize data from either source ----
    let quoteData;
    if (isWebhook) {
      // Supabase webhook payload — record matches Re_wall_anon_users columns
      const r = body.record;
      quoteData = {
        quoteId:        r.id,
        clientName:     r.name,
        clientEmail:    r.email,
        clientPhone:    r.phone,
        companyProject: r.company_project,
        address:        r.address,
        wallType:       r.wall_type,
        wallData:       r.wall_data,       // GeoJSON object or null
        haveGeos:       r.have_geos,
        wantGeos:       r.want_geos,
        notes:          r.notes,
        hasAttachments: r.attachments,
        createdAt:      r.created_at,
      };
    } else {
      // Direct client call — same payload shape as before
      quoteData = {
        quoteId:        body.quoteId,
        clientName:     body.clientName,
        clientEmail:    body.clientEmail,
        clientPhone:    body.clientPhone,
        companyProject: body.companyProject,
        address:        body.address,
        wallType:       body.wallTypes,
        wallData:       null,
        walls:          body.walls,
        numberOfWalls:  body.numberOfWalls,
        totalWallLength:body.totalWallLength,
        haveGeos:       body.geotechStatus,
        notes:          body.notes,
        hasAttachments: body.hasAttachments,
        attachmentUrls: body.attachmentUrls,
        bucketSessionId:body.bucketSessionId,
        services:       body.services,
      };
    }

    const d = quoteData;
    console.log(`[sendNotification] Preparing email for quote #${d.quoteId} → ${NOTIFICATION_EMAIL}`);

    // ---- Build wall measurements summary ----
    let wallSection = '';
    if (d.wallData && typeof d.wallData === 'object') {
      // Extract from GeoJSON stored in DB
      const features = d.wallData.features || [];
      if (features.length > 0) {
        const wallLines = features.map((f, i) => {
          const props = f.properties || {};
          return `<tr><td style="padding:6px 12px;border:1px solid #e0e0e0;">Wall #${i + 1}</td><td style="padding:6px 12px;border:1px solid #e0e0e0;">${props.lengthFormatted || 'N/A'}</td><td style="padding:6px 12px;border:1px solid #e0e0e0;">${props.heightFormatted || 'N/A'}</td><td style="padding:6px 12px;border:1px solid #e0e0e0;">${props.wallType || 'N/A'}</td></tr>`;
        }).join('');
        wallSection = `
          <h3 style="color:#1a2a3a;margin:20px 0 8px;">🧱 Wall Measurements</h3>
          <table style="border-collapse:collapse;width:100%;font-size:14px;">
            <tr style="background:#f0f4f8;"><th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Wall</th><th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Length</th><th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Height</th><th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Type</th></tr>
            ${wallLines}
          </table>`;
      }
    } else if (d.walls && d.walls.length > 0) {
      // Direct client call with pre-formatted wall data
      const wallLines = d.walls.map(w =>
        `<tr><td style="padding:6px 12px;border:1px solid #e0e0e0;">Wall #${w.id}</td><td style="padding:6px 12px;border:1px solid #e0e0e0;">${w.lengthFormatted}</td><td style="padding:6px 12px;border:1px solid #e0e0e0;">${w.heightFormatted || 'N/A'}</td></tr>`
      ).join('');
      wallSection = `
        <h3 style="color:#1a2a3a;margin:20px 0 8px;">🧱 Wall Measurements</h3>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">
          <tr style="background:#f0f4f8;"><th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Wall</th><th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Length</th><th style="padding:8px 12px;border:1px solid #e0e0e0;text-align:left;">Height</th></tr>
          ${wallLines}
        </table>
        <p style="font-size:13px;color:#666;">Total: ${d.numberOfWalls} wall(s), ~${d.totalWallLength}</p>`;
    }

    // ---- Supabase storage link ----
    let storageLink = '';
    if (d.quoteId && SUPABASE_URL) {
      storageLink = `${SUPABASE_URL}/storage/v1/object/public/ReWallClientBucket/web_app_uploads/${d.quoteId}/`;
    }

    // ---- Attachment summary ----
    let attachmentHtml = '';
    if (d.hasAttachments) {
      if (d.attachmentUrls && d.attachmentUrls.length > 0) {
        const fileList = d.attachmentUrls.map(a => `${a.name} (${a.sizeFormatted})`).join(', ');
        attachmentHtml = `<p>📎 <strong>Files:</strong> ${fileList}</p>`;
      } else {
        attachmentHtml = `<p>📎 <strong>Files uploaded</strong> to storage</p>`;
      }
      if (storageLink) {
        attachmentHtml += `<p>🔗 <a href="${storageLink}" style="color:#4A90A4;">View Uploaded Files</a></p>`;
      }
    }

    // ---- Services (from direct call only) ----
    let servicesText = '';
    if (d.services && d.services.length > 0) {
      servicesText = d.services.join(', ');
    }

    // ---- Timestamp ----
    const timestamp = d.createdAt
      ? new Date(d.createdAt).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })
      : new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' });

    // ---- Build Supabase dashboard link ----
    const supabaseProjectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
    const dashboardLink = supabaseProjectRef
      ? `https://supabase.com/dashboard/project/${supabaseProjectRef}/editor`
      : '';

    // ---- Build HTML email ----
    const htmlBody = `
      <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:linear-gradient(135deg,#1a2a3a 0%,#2a3a4a 100%);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">🏗️ New Quote Request</h1>
          <p style="color:#4A90A4;margin:8px 0 0;font-size:16px;">Reference #${d.quoteId}</p>
        </div>
        
        <div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
          <h3 style="color:#1a2a3a;margin:0 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">👤 Client Details</h3>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;width:140px;"><strong>Name</strong></td><td style="padding:6px 0;">${d.clientName}</td></tr>
            <tr><td style="padding:6px 0;color:#666;"><strong>Email</strong></td><td style="padding:6px 0;"><a href="mailto:${d.clientEmail}" style="color:#4A90A4;">${d.clientEmail}</a></td></tr>
            ${d.clientPhone ? `<tr><td style="padding:6px 0;color:#666;"><strong>Phone</strong></td><td style="padding:6px 0;"><a href="tel:${d.clientPhone}" style="color:#4A90A4;">${d.clientPhone}</a></td></tr>` : ''}
            ${d.companyProject ? `<tr><td style="padding:6px 0;color:#666;"><strong>Company</strong></td><td style="padding:6px 0;">${d.companyProject}</td></tr>` : ''}
          </table>

          <h3 style="color:#1a2a3a;margin:20px 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">📍 Project Details</h3>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;width:140px;"><strong>Site Address</strong></td><td style="padding:6px 0;">${d.address || 'Not specified'}</td></tr>
            ${d.wallType ? `<tr><td style="padding:6px 0;color:#666;"><strong>Wall Types</strong></td><td style="padding:6px 0;">${d.wallType}</td></tr>` : ''}
            ${servicesText ? `<tr><td style="padding:6px 0;color:#666;"><strong>Services</strong></td><td style="padding:6px 0;">${servicesText}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#666;"><strong>Geotech Report</strong></td><td style="padding:6px 0;">${d.haveGeos === true ? 'Has report' : d.haveGeos === false ? 'No report' : (d.haveGeos || 'Not specified')}</td></tr>
          </table>

          ${wallSection}

          ${d.notes ? `<h3 style="color:#1a2a3a;margin:20px 0 8px;">📝 Notes</h3><p style="background:#f9f9f9;padding:12px;border-radius:6px;font-size:14px;color:#333;">${d.notes}</p>` : ''}

          ${attachmentHtml}

          <div style="margin-top:24px;padding:16px;background:#f0f4f8;border-radius:8px;font-size:13px;color:#666;">
            <p style="margin:0 0 4px;"><strong>Submitted:</strong> ${timestamp}</p>
            <p style="margin:0 0 4px;"><strong>Source:</strong> ${isWebhook ? 'Supabase Webhook (auto)' : 'Direct submission'}</p>
            ${dashboardLink ? `<p style="margin:0;"><a href="${dashboardLink}" style="color:#4A90A4;">Open Supabase Dashboard →</a></p>` : ''}
          </div>
        </div>
      </div>`;

    // ---- Send via Resend API ----
    console.log('[sendNotification] Sending via Resend API…');

    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'ReWall Quotes <notifications@rewall.nz>',
        to: [NOTIFICATION_EMAIL],
        reply_to: d.clientEmail,
        subject: `🏗️ Quote #${d.quoteId} — ${d.clientName} — ${d.address || 'New Project'}`,
        html: htmlBody,
      },
      {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      }
    );

    console.log('[sendNotification] Resend response status:', response.status);
    console.log('[sendNotification] Resend response data:', JSON.stringify(response.data));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Notification email sent to ' + NOTIFICATION_EMAIL,
        emailId: response.data.id,
      }),
    };

  } catch (err) {
    const errDetails = err.response
      ? { status: err.response.status, data: err.response.data }
      : { message: err.message };

    console.error('[sendNotification] ERROR:', JSON.stringify(errDetails));

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Email notification failed',
        details: errDetails,
      }),
    };
  }
};
