// netlify/functions/sendNotification.js — Email notification to info@rewall.nz
// Uses Nodemailer + SMTP — sends directly through your own email server (no middleman)
// Falls back to Resend API if SMTP is not configured (optional)
//
// TWO trigger modes:
//   A) Supabase Database Webhook (primary) — fires on INSERT to Re_wall_anon_users
//      Payload shape: { type: "INSERT", table: "Re_wall_anon_users", record: { ... } }
//   B) Direct client call (fallback) — from quote.html after submission
//      Payload shape: { quoteId, clientName, clientEmail, ... }
//
// Required env vars (SMTP — preferred, no middleman):
//   SMTP_HOST          — SMTP server (e.g. mail.rewall.nz, smtp.gmail.com)
//   SMTP_PORT          — SMTP port (587 for TLS, 465 for SSL)
//   SMTP_USER          — SMTP login (usually your full email, e.g. info@rewall.nz)
//   SMTP_PASS          — SMTP password or app password
//
// Optional env vars:
//   RESEND_API_KEY     — Resend API key (fallback only, used if SMTP vars are missing)
//   NOTIFICATION_EMAIL — Target email (default: info@rewall.nz)
//   API_URL            — Supabase project URL (for storage links)
//   WEBHOOK_SECRET     — Shared secret to verify Supabase webhook calls

const nodemailer = require('nodemailer');

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

  // ---- Email transport config ----
  const SMTP_HOST          = process.env.SMTP_HOST;
  const SMTP_PORT          = parseInt(process.env.SMTP_PORT || '587', 10);
  const SMTP_USER          = process.env.SMTP_USER;
  const SMTP_PASS          = process.env.SMTP_PASS;
  const RESEND_API_KEY     = process.env.RESEND_API_KEY;     // fallback only
  const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'info@rewall.nz';
  const SUPABASE_URL       = process.env.API_URL || '';
  const WEBHOOK_SECRET     = process.env.WEBHOOK_SECRET || '';

  const useSmtp   = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
  const useResend = !useSmtp && !!RESEND_API_KEY;

  if (!useSmtp && !useResend) {
    console.error('[sendNotification] No email transport configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY.');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Email service not configured. Set SMTP or RESEND_API_KEY env vars.' }),
    };
  }

  console.log(`[sendNotification] Email transport: ${useSmtp ? 'SMTP (' + SMTP_HOST + ')' : 'Resend API (fallback)'}`);

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
      const r = body.record;
      quoteData = {
        quoteId:        r.id,
        clientName:     r.name,
        clientEmail:    r.email,
        clientPhone:    r.phone,
        companyProject: r.company_project,
        address:        r.address,
        wallType:       r.wall_type,
        wallData:       r.wall_data,
        haveGeos:       r.have_geos,
        wantGeos:       r.want_geos,
        notes:          r.notes,
        hasAttachments: r.attachments,
        services:       r.services,         // CSV string from DB
        createdAt:      r.created_at,
      };
    } else {
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
        services:       body.services,       // Array of service names
      };
    }

    const d = quoteData;
    console.log(`[sendNotification] Preparing email for quote #${d.quoteId} → ${NOTIFICATION_EMAIL}`);

    // ---- Build wall measurements summary ----
    let wallSection = '';
    if (d.wallData && typeof d.wallData === 'object') {
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
      storageLink = `${SUPABASE_URL}/storage/v1/object/public/ReWallClientBucket/web_app_uploads/`;
    }

    // ---- Attachment summary (clearly shows if files were attached or not) ----
    let attachmentHtml = '';
    if (d.hasAttachments) {
      if (d.attachmentUrls && d.attachmentUrls.length > 0) {
        const fileList = d.attachmentUrls.map(a => `<li>📄 ${a.name} (${a.sizeFormatted})</li>`).join('');
        attachmentHtml = `<p>📎 <strong>${d.attachmentUrls.length} file(s) attached:</strong></p><ul style="margin:4px 0 8px 0;padding-left:20px;">${fileList}</ul>`;
      } else {
        attachmentHtml = `<p>📎 <strong>File(s) attached</strong> — uploaded to Supabase storage</p>`;
      }
      if (storageLink) {
        attachmentHtml += `<p style="margin:8px 0;">🔗 <a href="${storageLink}" style="color:#4A90A4;font-weight:600;">View / Download Files in Supabase Storage →</a></p>`;
      }
      attachmentHtml += `<p style="font-size:12px;color:#888;">Log in to <strong>Supabase Dashboard → Storage → ReWallClientBucket</strong> to download</p>`;
    } else {
      attachmentHtml = `<p style="color:#999;">No files attached</p>`;
    }

    // ---- Services list ----
    let servicesHtml = '';
    if (d.services) {
      const servicesList = Array.isArray(d.services)
        ? d.services
        : d.services.split(',').map(s => s.trim()).filter(Boolean);
      if (servicesList.length > 0) {
        servicesHtml = servicesList.map(s => `<li style="padding:2px 0;">✓ ${s}</li>`).join('');
        servicesHtml = `<ul style="list-style:none;padding:0;margin:0;">${servicesHtml}</ul>`;
      }
    }
    if (!servicesHtml) {
      servicesHtml = '<p style="color:#999;">No specific services selected</p>';
    }

    // ---- Geotech status ----
    let geotechText = 'Not specified';
    if (d.haveGeos === true) geotechText = '✅ Has geotechnical report';
    else if (d.wantGeos === true) geotechText = '📋 Include geotech in quote';
    else if (d.haveGeos === false) geotechText = '❌ No report';
    else if (typeof d.haveGeos === 'string') geotechText = d.haveGeos;

    // ---- Timestamp ----
    const timestamp = d.createdAt
      ? new Date(d.createdAt).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })
      : new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' });

    // ---- Supabase dashboard link ----
    const supabaseProjectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
    const dashboardLink = supabaseProjectRef
      ? `https://supabase.com/dashboard/project/${supabaseProjectRef}/editor`
      : '';

    // ---- Build HTML email (mirrors the quote summary layout) ----
    const emailSubject = `🏗️ Quote #${d.quoteId} — ${d.clientName} — ${d.address || 'New Project'}${d.hasAttachments ? ' 📎' : ''}`;

    const htmlBody = `
      <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:linear-gradient(135deg,#1a2a3a 0%,#2a3a4a 100%);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">🏗️ New Quote Request</h1>
          <p style="color:#4A90A4;margin:8px 0 0;font-size:16px;">Reference #${d.quoteId}</p>
        </div>
        
        <div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">

          <!-- Selected Services -->
          <h3 style="color:#1a2a3a;margin:0 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">🔧 Selected Services</h3>
          ${servicesHtml}

          <!-- Contact Details -->
          <h3 style="color:#1a2a3a;margin:20px 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">👤 Contact Details</h3>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;width:140px;"><strong>Name</strong></td><td style="padding:6px 0;">${d.clientName}</td></tr>
            <tr><td style="padding:6px 0;color:#666;"><strong>Email</strong></td><td style="padding:6px 0;"><a href="mailto:${d.clientEmail}" style="color:#4A90A4;">${d.clientEmail}</a></td></tr>
            ${d.clientPhone ? `<tr><td style="padding:6px 0;color:#666;"><strong>Phone</strong></td><td style="padding:6px 0;"><a href="tel:${d.clientPhone}" style="color:#4A90A4;">${d.clientPhone}</a></td></tr>` : ''}
            ${d.companyProject ? `<tr><td style="padding:6px 0;color:#666;"><strong>Company</strong></td><td style="padding:6px 0;">${d.companyProject}</td></tr>` : ''}
          </table>

          <!-- Site Location -->
          <h3 style="color:#1a2a3a;margin:20px 0 12px;border-bottom:2px solid #4A90A4;padding-bottom:8px;">📍 Site Location</h3>
          <p style="font-size:14px;">${d.address || 'Not specified'}</p>

          <!-- Wall Measurements -->
          ${wallSection || '<h3 style="color:#1a2a3a;margin:20px 0 8px;">🧱 Wall Measurements</h3><p style="color:#999;">No walls drawn on map</p>'}

          <!-- Wall Types -->
          <h3 style="color:#1a2a3a;margin:20px 0 8px;">🏗️ Wall Types</h3>
          <p style="font-size:14px;">${d.wallType || 'Not specified'}</p>

          <!-- Geotech Report -->
          <h3 style="color:#1a2a3a;margin:20px 0 8px;">📄 Geotechnical Report</h3>
          <p style="font-size:14px;">${geotechText}</p>

          <!-- Project Notes -->
          ${d.notes ? `<h3 style="color:#1a2a3a;margin:20px 0 8px;">📝 Project Notes</h3><p style="background:#f9f9f9;padding:12px;border-radius:6px;font-size:14px;color:#333;">${d.notes}</p>` : ''}

          <!-- Attachments — clearly shown -->
          <h3 style="color:#1a2a3a;margin:20px 0 8px;">📎 Attachments</h3>
          ${attachmentHtml}

          <div style="margin-top:24px;padding:16px;background:#f0f4f8;border-radius:8px;font-size:13px;color:#666;">
            <p style="margin:0 0 4px;"><strong>Submitted:</strong> ${timestamp}</p>
            <p style="margin:0 0 4px;"><strong>Transport:</strong> ${useSmtp ? 'SMTP (direct)' : 'Resend API'}</p>
            ${dashboardLink ? `<p style="margin:0;"><a href="${dashboardLink}" style="color:#4A90A4;">Open Supabase Dashboard →</a></p>` : ''}
          </div>
        </div>
      </div>`;

    // ==================================================================
    // SEND EMAIL — SMTP (primary) or Resend (fallback)
    // ==================================================================
    let emailResult;

    if (useSmtp) {
      // ---- Nodemailer SMTP — direct, no middleman ----
      console.log(`[sendNotification] Sending via SMTP → ${SMTP_HOST}:${SMTP_PORT}`);

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,       // SSL on 465, STARTTLS on 587
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        tls: { rejectUnauthorized: false },  // allow self-signed certs
      });

      const info = await transporter.sendMail({
        from:    `"ReWall Quotes" <${NOTIFICATION_EMAIL}>`,
        sender:  SMTP_USER,
        to:      NOTIFICATION_EMAIL,
        replyTo: d.clientEmail,
        subject: emailSubject,
        html:    htmlBody,
      });

      console.log('[sendNotification] SMTP email sent — messageId:', info.messageId);
      emailResult = { messageId: info.messageId, transport: 'smtp' };

    } else {
      // ---- Resend API fallback ----
      console.log('[sendNotification] Sending via Resend API (fallback)…');
      const axios = require('axios');

      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: 'ReWall Quotes <notifications@rewall.nz>',
          to: [NOTIFICATION_EMAIL],
          reply_to: d.clientEmail,
          subject: emailSubject,
          html: htmlBody,
        },
        {
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: 12000,
        }
      );

      console.log('[sendNotification] Resend response:', response.status, JSON.stringify(response.data));
      emailResult = { emailId: response.data.id, transport: 'resend' };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Notification email sent to ${NOTIFICATION_EMAIL}`,
        ...emailResult,
      }),
    };

  } catch (err) {
    const errDetails = err.response
      ? { status: err.response.status, data: err.response.data }
      : { message: err.message, code: err.code || null };

    console.error('[sendNotification] ERROR:', JSON.stringify(errDetails));

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Email notification failed', details: errDetails }),
    };
  }
};
