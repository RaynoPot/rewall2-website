// netlify/functions/supabaseUpload.js
// Returns a signed upload URL so the browser uploads directly to Supabase Storage.
// This bypasses the Netlify 6MB body limit — supports files up to 20MB+.

const { createClient } = require('@supabase/supabase-js');

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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

  const API_URL        = process.env.API_URL;
  const API_SECRET_KEY = process.env.API_SECRET_KEY;

  if (!API_URL || !API_SECRET_KEY) {
    console.error('[supabaseUpload] Missing env vars');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
  }

  const supabase = createClient(API_URL, API_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = JSON.parse(event.body);
    const { sessionId, fileName, fileType, fileSize } = body;

    // ---- IP rate limit: max 20 upload sessions per IP ----
    const upload_ip =
      event.headers['x-nf-client-connection-ip'] ||
      event.headers['x-forwarded-for']?.split(',')[0]?.trim() || null;
    if (upload_ip) {
      const TABLE_USERS = 'Re_wall_anon_users';
      const { count, error: countErr } = await supabase
        .from(TABLE_USERS)
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', upload_ip);
      if (!countErr && count !== null && count >= 20) {
        console.warn(`[supabaseUpload] Rate limit hit — IP ${upload_ip} has ${count} submissions`);
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: 'Upload limit reached for this IP address. Contact info@rewall.nz directly.' }),
        };
      }
    }

    if (!sessionId || !fileName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: sessionId, fileName' }) };
    }

    // Server-side 20MB size validation
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return {
        statusCode: 413,
        headers,
        body: JSON.stringify({ error: `File too large. Maximum is ${MAX_FILE_SIZE / 1024 / 1024}MB.` }),
      };
    }

    const BUCKET = 'ReWallClientBucket';
    const storagePath = `web_app_uploads/${sessionId}/${fileName}`;

    console.log(`[supabaseUpload] Creating signed URL for: ${BUCKET}/${storagePath} (${fileType || 'unknown'}, ${fileSize ? (fileSize / 1024).toFixed(1) + 'KB' : 'unknown size'})`);

    // Create a signed URL valid for 5 minutes
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error('[supabaseUpload] Signed URL error:', JSON.stringify(error));
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Failed to create upload URL', details: error.message }) };
    }

    // Build the public URL for later reference
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData?.publicUrl || `${API_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;

    console.log(`[supabaseUpload] Signed URL created successfully`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        signedUrl: data.signedUrl,
        token: data.token,
        path: storagePath,
        publicUrl,
      }),
    };
  } catch (err) {
    console.error('[supabaseUpload] Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
