// netlify/functions/linzTiles.js - Proxy for LINZ tile requests (keeps API key secure)

const axios = require('axios');

exports.handler = async function(event, context) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { layer, z, x, y } = event.queryStringParameters || {};

    if (!layer || !z || !x || !y) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        body: 'Missing required parameters: layer, z, x, y'
      };
    }

    const apiKey = process.env.LINZ_API_KEY;

    if (!apiKey) {
      console.error('LINZ_API_KEY environment variable not set');
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        body: 'LINZ API key not configured'
      };
    }

    // Construct LINZ tile URL
    const tileUrl = `https://data.linz.govt.nz/services;key=${apiKey}/tiles/v4/layer=${layer}/EPSG:3857/${z}/${x}/${y}.png`;

    console.log(`Fetching LINZ tile: layer=${layer} z=${z} x=${x} y=${y}`);

    const response = await axios.get(tileUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'ReWall-NZ/1.0'
      }
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400' // Cache tiles for 24 hours
      },
      body: response.data.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error fetching LINZ tile:', error.message);

    // Return a transparent 1x1 PNG on error (so map doesn't break)
    const transparentPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300' // Cache errors for 5 min
      },
      body: transparentPng,
      isBase64Encoded: true
    };
  }
};
