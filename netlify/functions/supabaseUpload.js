// netlify/functions/supabaseUpload.js - Supabase Storage Upload (SDK version)

const { createClient } = require('@supabase/supabase-js');

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
  // API_URL         → Supabase project URL  (https://xxx.supabase.co)
  // API_KEY         → publishable / anon key
  // API_SECRET_KEY  → secret key (service-role level, bypasses RLS)
  const API_URL        = process.env.API_URL;
  const API_KEY        = process.env.API_KEY;
  const API_SECRET_KEY = process.env.API_SECRET_KEY;

  console.log('[supabaseUpload] Checking ENV vars …');
  console.log(`[supabaseUpload]   API_URL          : ${API_URL ? API_URL : '*** MISSING ***'}`);
  console.log(`[supabaseUpload]   API_KEY          : ${API_KEY ? API_KEY.substring(0, 12) + '…' : '*** MISSING ***'}`);
  console.log(`[supabaseUpload]   API_SECRET_KEY   : ${API_SECRET_KEY ? API_SECRET_KEY.substring(0, 12) + '…' : '*** MISSING ***'}`);

  if (!API_URL || !API_SECRET_KEY) {
    console.error('[supabaseUpload] Missing required env vars (API_URL and/or API_SECRET_KEY).');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server misconfiguration – missing env vars (API_URL, API_SECRET_KEY).' }),
    };
  }

  // ---------- Initialise Supabase client with the secret key ----------
  // Using the secret key as both the "anon" key gives full service-role access
  // and lets the SDK handle auth headers correctly for new + legacy key formats.
  const supabase = createClient(API_URL, API_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  console.log('[supabaseUpload] Supabase client initialised');

  // ---------- Parse body ----------
  try {
    const body = JSON.parse(event.body);
    const { sessionId, fileName, fileType, fileBase64 } = body;

    console.log('[supabaseUpload] Received upload request');
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

    // ---------- Upload via Supabase JS SDK ----------
    console.log('[supabaseUpload] Uploading via Supabase SDK …');

    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: fileType || 'application/octet-stream',
        upsert: true,           // overwrite if same name
        duplex: 'half',         // required for Node stream/buffer uploads
      });

    if (uploadError) {
      console.error('[supabaseUpload] SDK upload error:', JSON.stringify(uploadError));
      return {
        statusCode: uploadError.statusCode ? parseInt(uploadError.statusCode, 10) : 400,
        headers,
        body: JSON.stringify({
          error: 'Upload failed',
          details: uploadError.message || uploadError,
        }),
      };
    }

    console.log('[supabaseUpload] Upload successful:', JSON.stringify(data));

    // ---------- Build public URL ----------
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData?.publicUrl || `${API_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    console.log(`[supabaseUpload] Public URL: ${publicUrl}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        path: storagePath,
        publicUrl,
        supabaseData: data,
      }),
    };
  } catch (err) {
    console.error('[supabaseUpload] UNHANDLED ERROR:', err.message);
    console.error('[supabaseUpload] Stack:', err.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Upload failed (unhandled)',
        details: err.message,
      }),
    };
  }
};
