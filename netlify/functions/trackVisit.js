// netlify/functions/trackVisit.js — Insert a row into Re_wall_visits

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

  if (!API_URL || !API_SECRET_KEY) {
    console.error('[trackVisit] Missing env vars');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
  }

  const supabase = createClient(API_URL, API_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = JSON.parse(event.body);
    const { pages_visited, user_agent, referrer } = body;

    // Grab IP from headers (Netlify provides x-nf-client-connection-ip)
    const ip_address =
      event.headers['x-nf-client-connection-ip'] ||
      event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      event.headers['client-ip'] ||
      null;

    console.log(`[trackVisit] Inserting visit — page: ${pages_visited}, ip: ${ip_address}`);

    const { data, error } = await supabase
      .from(TABLE_VISITS)
      .insert({
        pages_visited: pages_visited || null,
        ip_address: ip_address,
        user_agent: user_agent || null,
        referrer: referrer || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[trackVisit] Supabase error:', JSON.stringify(error));
      return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
    }

    console.log(`[trackVisit] Visit recorded — id: ${data.id}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ visitId: data.id }),
    };
  } catch (err) {
    console.error('[trackVisit] Unhandled error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
