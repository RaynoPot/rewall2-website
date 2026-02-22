// netlify/functions/sendNotification.js — Email notification to info@rewall.nz
// Uses FormSubmit.co API (no SMTP server needed) — sends a POST with JSON

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

  const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'info@rewall.nz';

  try {
    const body = JSON.parse(event.body);
    const {
      quoteId,
      clientName,
      clientEmail,
      clientPhone,
      companyProject,
      address,
      services,
      wallTypes,
      numberOfWalls,
      totalWallLength,
      walls,
      geotechStatus,
      notes,
      hasAttachments,
      attachmentUrls,
      bucketSessionId,
    } = body;

    console.log(`[sendNotification] Preparing email for quote #${quoteId}`);

    // Build the email body
    let emailHtml = `
      <h2 style="color:#2C5F7F;">New Quote Request #${quoteId}</h2>
      <hr style="border:1px solid #4A90A4;">
      
      <h3>Client Details</h3>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:6px;font-weight:bold;width:150px;">Name:</td><td style="padding:6px;">${clientName}</td></tr>
        <tr><td style="padding:6px;font-weight:bold;">Email:</td><td style="padding:6px;"><a href="mailto:${clientEmail}">${clientEmail}</a></td></tr>
        <tr><td style="padding:6px;font-weight:bold;">Phone:</td><td style="padding:6px;">${clientPhone || 'Not provided'}</td></tr>
        <tr><td style="padding:6px;font-weight:bold;">Company/Project:</td><td style="padding:6px;">${companyProject || 'Not specified'}</td></tr>
      </table>
      
      <h3>Site Location</h3>
      <p>${address || 'Not specified'}</p>
      
      <h3>Services Requested</h3>
      <p>${services && services.length > 0 ? services.join(', ') : 'None selected'}</p>
      
      <h3>Wall Types</h3>
      <p>${wallTypes || 'Not specified'}</p>
      
      <h3>Wall Measurements (Estimated)*</h3>
    `;

    if (walls && walls.length > 0) {
      emailHtml += '<ul>';
      walls.forEach(w => {
        emailHtml += `<li>Wall #${w.id}: ~${w.lengthFormatted}` +
          (w.heightFormatted !== 'Not specified' ? `, ${w.heightFormatted}` : '') +
          `</li>`;
      });
      emailHtml += '</ul>';
      emailHtml += `<p><strong>Total walls:</strong> ${numberOfWalls} | <strong>Total length:</strong> ~${totalWallLength}</p>`;
      emailHtml += `<p style="font-size:0.85em;color:#666;">*Approximate measurements from map drawings.</p>`;
    } else {
      emailHtml += '<p>No walls drawn on map</p>';
    }

    emailHtml += `
      <h3>Geotechnical Report</h3>
      <p>${geotechStatus || 'Not specified'}</p>
      
      <h3>Project Notes</h3>
      <p>${notes || 'No notes provided'}</p>
      
      <h3>Attachments</h3>
    `;

    if (hasAttachments && attachmentUrls && attachmentUrls.length > 0) {
      emailHtml += '<ul>';
      attachmentUrls.forEach(a => {
        emailHtml += `<li><a href="${a.url}" target="_blank">${a.name}</a> (${a.sizeFormatted})</li>`;
      });
      emailHtml += '</ul>';
    } else if (hasAttachments && bucketSessionId) {
      emailHtml += `<p>Files uploaded to storage — Session: <strong>${bucketSessionId}</strong></p>`;
      emailHtml += `<p><a href="${process.env.API_URL || ''}/storage/v1/object/public/ReWallClientBucket/web_app_uploads/${bucketSessionId}/" target="_blank">View uploads in Supabase Storage</a></p>`;
    } else {
      emailHtml += '<p>No files attached</p>';
    }

    emailHtml += `
      <hr style="border:1px solid #4A90A4;">
      <p style="font-size:0.85em;color:#888;">Quote ID: ${quoteId} | Submitted: ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}</p>
    `;

    // Send via FormSubmit.co API (JSON endpoint)
    const formsubmitPayload = {
      name: clientName,
      email: clientEmail,
      phone: clientPhone || 'Not provided',
      message: emailHtml,
      _subject: `ReWall Quote #${quoteId} — ${clientName} — ${address || 'New Project'}`,
      _captcha: 'false',
      _template: 'box',
      _replyto: clientEmail,
    };

    console.log('[sendNotification] Sending via FormSubmit.co…');

    const response = await fetch(`https://formsubmit.co/ajax/${NOTIFICATION_EMAIL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(formsubmitPayload),
    });

    const result = await response.json();
    console.log('[sendNotification] FormSubmit response:', JSON.stringify(result));

    if (!response.ok) {
      console.error('[sendNotification] FormSubmit error:', result);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Email send failed', details: result }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Notification sent' }),
    };
  } catch (err) {
    console.error('[sendNotification] Unhandled error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
