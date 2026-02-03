// netlify/functions/linzApi.js - WFS Dynamic Layer Version

const axios = require('axios');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get parameters from query string
    const { bbox, layer, count } = event.queryStringParameters || {};
    
    if (!bbox) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing bbox parameter' })
      };
    }

    // Parse and validate bbox
    const [west, south, east, north] = bbox.split(',').map(parseFloat);
    
    if ([west, south, east, north].some(isNaN)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid bbox format. Expected: west,south,east,north' 
        })
      };
    }

    // Default to Property Parcels (layer-50772)
    const targetLayer = layer || 'layer-50772';
    const featureCount = count || '1500';

    // LINZ API key from environment variable
    const apiKey = process.env.LINZ_API_KEY || '92c1e6a03cf849e4a836ea1c5e017e6e';
    
    // Construct WFS request URL
    const linzUrl = `https://data.linz.govt.nz/services;key=${apiKey}/wfs/${targetLayer}/?` +
      'service=WFS&' +
      'version=2.0.0&' +
      'request=GetFeature&' +
      `typeName=${targetLayer}&` +
      'outputFormat=json&' +
      'srsName=EPSG:4326&' +
      `count=${featureCount}&` +
      `bbox=${bbox},EPSG:4326`;

    console.log(`Fetching LINZ Layer: ${targetLayer}`);
    console.log('LINZ API URL:', linzUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    // Make request to LINZ with timeout
    const response = await axios.get(linzUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'ReWall-NZ/1.0'
      }
    });
    
    const returnedFeatureCount = response.data.features ? response.data.features.length : 0;
    console.log(`LINZ API returned ${returnedFeatureCount} features`);
    
    // Return GeoJSON response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error fetching LINZ data:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error fetching LINZ data',
        message: error.message,
        details: error.response?.data || null
      })
    };
  }
};
