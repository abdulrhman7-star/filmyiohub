// Netlify Function: subtitle-file
// Proxies a temporary OpenSubtitles subtitle URL and converts SRT to WebVTT.

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
  };
}

function srtToVtt(srt) {
  let text = String(srt || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.replace(/^(\d+\s*\n)?/s, '');
  text = text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return `WEBVTT\n\n${text.trim()}\n`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' };
  try {
    const url = event.queryStringParameters?.url;
    if (!url) return { statusCode: 400, headers: cors(), body: 'Missing url' };

    const parsed = new URL(url);
    if (parsed.hostname !== 'www.opensubtitles.com') {
      return { statusCode: 400, headers: cors(), body: 'Only OpenSubtitles URLs are allowed' };
    }

    const r = await fetch(parsed.toString(), { headers: { Accept: '*/*' } });
    if (!r.ok) return { statusCode: r.status, headers: cors(), body: 'Subtitle download failed' };
    const text = await r.text();
    return {
      statusCode: 200,
      headers: { ...cors(), 'Content-Type': 'text/vtt; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
      body: srtToVtt(text),
    };
  } catch (e) {
    console.error('[subtitle-file]', e);
    return { statusCode: 500, headers: cors(), body: 'Subtitle proxy failed' };
  }
};
