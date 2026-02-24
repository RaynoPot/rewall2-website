// netlify/functions/submitQuote.js — Save quote data into Re_wall_anon_users

const { createClient } = require('@supabase/supabase-js');

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

  // ---------- ENV ----------
  const API_URL        = process.env.API_URL;
  const API_SECRET_KEY = process.env.API_SECRET_KEY;
  const TABLE_VISITS   = process.env.TABLE_VISITS || 'Re_wall_visits';
  const TABLE_USERS    = process.env.TABLE_USERS  || 'Re_wall_anon_users';

  if (!API_URL || !API_SECRET_KEY) {
    console.error('[submitQuote] Missing env vars');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
  }

  const supabase = createClient(API_URL, API_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = JSON.parse(event.body);
    const {
      visitId,        // foreign key → Re_wall_visits.id
      address,
      name,
      email,
      phone,
      company_project,
      notes,
      have_geos,
      want_geos,
      attachments,    // boolean — true if files were uploaded
      wall_type,      // CSV string of selected wall types
      wall_data,      // GeoJSON object
      services,       // CSV string of selected services
    } = body;

    console.log('[submitQuote] Received quote submission');
    console.log(`[submitQuote]   visitId: ${visitId}, name: ${name}, email: ${email}`);

    if (!visitId || !name || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: visitId, name, email' }),
      };
    }

    // Grab IP from Netlify headers
    const ip_address =
      event.headers['x-nf-client-connection-ip'] ||
      event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      null;

    // ---- IP rate limit: max 5 submissions per 30-minute window ----
    if (ip_address) {
      const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count, error: countErr } = await supabase
        .from(TABLE_USERS)
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ip_address)
        .gte('created_at', windowStart);
      if (!countErr && count !== null && count >= 5) {
        console.warn(`[submitQuote] Rate limit hit — IP ${ip_address} has ${count} submissions in last 30 min`);
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: 'Too many submissions in the last 30 minutes. Please wait a bit or contact us at info@rewall.nz / 027 394 1127.' }),
        };
      }
    }

    // Build the row — id is the foreign key to Re_wall_visits
    const row = {
      id: visitId,
      address:         address || null,
      name:            name,
      email:           email,
      phone:           phone || null,
      ip_address:      ip_address,
      company_project: company_project || null,
      notes:           notes || null,
      have_geos:       typeof have_geos === 'boolean' ? have_geos : null,
      want_geos:       typeof want_geos === 'boolean' ? want_geos : null,
      attachments:     typeof attachments === 'boolean' ? attachments : false,
      wall_type:       wall_type || null,
      wall_data:       wall_data || null,
      services:        services || null,
    };

    console.log('[submitQuote] Inserting row:', JSON.stringify(row, null, 2));

    const { data, error } = await supabase
      .from(TABLE_USERS)
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('[submitQuote] Supabase error:', JSON.stringify(error));
      return { statusCode: 400, headers, body: JSON.stringify({ error: error.message, details: error }) };
    }

    console.log('[submitQuote] Quote saved successfully — id:', data.id);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, quoteId: data.id }),
    };
  } catch (err) {
    console.error('[submitQuote] Unhandled error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
