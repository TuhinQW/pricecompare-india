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

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

  const apiKey = process.env.QUICKCOMMERCE_API_KEY;
  if (!apiKey) return json(res, 503, { ok: false, code: 'PROVIDER_NOT_CONFIGURED', error: 'Live marketplace provider is not configured yet.' });

  const q = String(req.query?.q || '').trim();
  const lat = Number(req.query?.lat);
  const lon = Number(req.query?.lon);
  const requested = String(req.query?.platforms || 'BlinkIt,Zepto,Swiggy,BigBasket,Amazon,Flipkart')
    .split(',').map(s => s.trim()).filter(Boolean);
  const platforms = [...new Set(requested)].filter(p => ALLOWED_PLATFORMS.has(p));

  if (q.length < 2 || q.length > 120) return json(res, 400, { ok: false, error: 'Search must be between 2 and 120 characters.' });
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return json(res, 400, { ok: false, code: 'LOCATION_REQUIRED', error: 'A valid location is required for live comparison.' });
  }
  if (!platforms.length) return json(res, 400, { ok: false, error: 'No supported marketplace selected.' });

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
    return json(res, 200, { ok: true, provider: data });
  } catch (error) {
    console.error('QuickCommerce API error:', error);
    return json(res, 502, { ok: false, error: 'Live marketplace service could not be reached.' });
  }
};
