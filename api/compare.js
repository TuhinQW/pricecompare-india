const ALLOWED_PLATFORMS = new Set([
  'BlinkIt', 'Zepto', 'Swiggy', 'BigBasket', 'DMart', 'JioMart', 'Minutes',
  'Amazon', 'Nykaa', 'Myntra', 'Flipkart'
]);

function json(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.json(body);
}

function validCoordinate(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

  const apiKey = process.env.QUICKCOMMERCE_API_KEY;
  if (!apiKey) return json(res, 503, { ok: false, code: 'PROVIDER_NOT_CONFIGURED', error: 'Live marketplace provider is not configured yet.' });

  const q = String(req.query?.q || '').trim();
  const requested = String(req.query?.platforms || 'BlinkIt,Zepto,Swiggy,BigBasket,Amazon,Flipkart')
    .split(',').map(s => s.trim()).filter(Boolean);
  const platforms = [...new Set(requested)].filter(p => ALLOWED_PLATFORMS.has(p));

  if (q.length < 2 || q.length > 120) return json(res, 400, { ok: false, error: 'Search must be between 2 and 120 characters.' });
  if (!platforms.length) return json(res, 400, { ok: false, error: 'No supported marketplace selected.' });

  let lat = validCoordinate(req.query?.lat, -90, 90);
  let lon = validCoordinate(req.query?.lon, -180, 180);
  let locationSource = 'browser';

  if (lat === null || lon === null) {
    lat = validCoordinate(req.headers['x-vercel-ip-latitude'], -90, 90);
    lon = validCoordinate(req.headers['x-vercel-ip-longitude'], -180, 180);
    locationSource = 'vercel-ip';
  }

  if (lat === null || lon === null) {
    lat = 22.5726;
    lon = 88.3639;
    locationSource = 'default-kolkata';
  }

  const url = new URL('https://api.quickcommerceapi.com/v1/groupsearch');
  url.searchParams.set('q', q);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('platforms', platforms.join(','));

  try {
    const upstream = await fetch(url, { headers: { 'X-API-Key': apiKey, Accept: 'application/json' } });
    const text = await upstream.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) {}
    if (!upstream.ok) return json(res, upstream.status >= 500 ? 502 : upstream.status, { ok: false, error: data?.error || data?.message || 'Marketplace provider returned an error.' });
    return json(res, 200, { ok: true, locationSource, provider: data });
  } catch (error) {
    console.error('QuickCommerce API error:', error);
    return json(res, 502, { ok: false, error: 'Live marketplace service could not be reached.' });
  }
};
