// netlify/functions/supabaseUpload.js - Supabase Storage Upload

const axios = require('axios');
const { randomUUID } = require('crypto');

exports.handler = async function (event, context) {
  // ---------- CORS ----------
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-session-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('[supabaseUpload] Preflight OPTIONS request');
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    console.warn(`[supabaseUpload] Rejected method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  // ---------- ENV ----------
  const API_URL    = process.env.API_URL;     // e.g. https://xyz.supabase.co
  const API_KEY    = process.env.API_KEY;      // anon / public key
  const SECRET_KEY = process.env.SECRET_KEY;   // service_role key

  if (!API_URL || !API_KEY || !SECRET_KEY) {
    console.error('[supabaseUpload] Missing environment variables. Ensure API_URL, API_KEY and SECRET_KEY are set.');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server misconfiguration – missing env vars.' }),
    };
  }

  console.log('[supabaseUpload] ENV check passed');
  console.log(`[supabaseUpload] API_URL = ${API_URL}`);

  // ---------- Parse body ----------
  try {
    // Expect JSON: { sessionId, fileName, fileType, fileBase64 }
    const body = JSON.parse(event.body);
    const { sessionId, fileName, fileType, fileBase64 } = body;

    console.log(`[supabaseUpload] Received upload request`);
    console.log(`[supabaseUpload]   sessionId : ${sessionId}`);
    console.log(`[supabaseUpload]   fileName  : ${fileName}`);
    console.log(`[supabaseUpload]   fileType  : ${fileType}`);
    console.log(`[supabaseUpload]   base64 len: ${fileBase64 ? fileBase64.length : 0}`);

    if (!sessionId || !fileName || !fileBase64) {
      console.warn('[supabaseUpload] Missing required fields in body');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: sessionId, fileName, fileBase64' }),
      };
    }

    // ---------- Build storage path ----------
    const BUCKET = 'ReWallClientBucket';
    const storagePath = `web_app_uploads/${sessionId}/${fileName}`;
    console.log(`[supabaseUpload] Target path: ${BUCKET}/${storagePath}`);

    // Convert base64 → Buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    console.log(`[supabaseUpload] Decoded buffer size: ${fileBuffer.length} bytes`);

    // ---------- Upload via Supabase Storage REST API ----------
    const uploadUrl = `${API_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
    console.log(`[supabaseUpload] Upload URL: ${uploadUrl}`);

    const response = await axios.post(uploadUrl, fileBuffer, {
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'apikey': API_KEY,
        'Content-Type': fileType || 'application/octet-stream',
        'x-upsert': 'true',           // overwrite if same name
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log(`[supabaseUpload] Supabase response status: ${response.status}`);
    console.log(`[supabaseUpload] Supabase response data:`, JSON.stringify(response.data));

    // ---------- Build public URL (optional – works if bucket is public) ----------
    const publicUrl = `${API_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    console.log(`[supabaseUpload] Public URL: ${publicUrl}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        path: storagePath,
        publicUrl,
        supabaseResponse: response.data,
      }),
    };
  } catch (err) {
    console.error('[supabaseUpload] ERROR:', err.message);
    if (err.response) {
      console.error('[supabaseUpload] Supabase status:', err.response.status);
      console.error('[supabaseUpload] Supabase body  :', JSON.stringify(err.response.data));
    }
    return {
      statusCode: err.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: 'Upload failed',
        details: err.response?.data || err.message,
      }),
    };
  }
};
