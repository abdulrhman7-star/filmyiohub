// Netlify Function: tmdb
// Keeps the TMDB Read Access Token server-side.

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  try {
    const token = process.env.TMDB_ACCESS_TOKEN;
    if (!token) return { statusCode: 500, headers, body: JSON.stringify({ error: 'TMDB_ACCESS_TOKEN is not configured' }) };

    const path = event.queryStringParameters?.path || '/configuration';
    if (!/^\/(search|movie|tv|discover|genre|configuration)/.test(path)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'TMDB path is not allowed' }) };
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    params.delete('path');
    const url = `https://api.themoviedb.org/3${path}?${params.toString()}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const text = await r.text();
    return { statusCode: r.status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' }, body: text };
  } catch (e) {
    console.error('[tmdb]', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'TMDB request failed' }) };
  }
};
