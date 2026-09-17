function json(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.json(body);
}

function buildAmazonAffiliateUrl(asin, tag) {
  if (!asin || !tag) return null;
  return `https://www.amazon.in/dp/${encodeURIComponent(asin)}/?tag=${encodeURIComponent(tag)}`;
}

function normalizeResult(item, tag) {
  const asin = String(item?.asin || '').trim();
  const affiliateUrl = buildAmazonAffiliateUrl(asin, tag);

  return {
    asin,
    title: String(item?.title || '').trim(),
    price: item?.price ?? null,
    extracted_price: item?.extracted_price ?? null,
    old_price: item?.old_price ?? null,
    extracted_old_price: item?.extracted_old_price ?? null,
    rating: item?.rating ?? null,
    reviews: item?.reviews ?? null,
    availability: item?.availability ?? null,
    delivery: Array.isArray(item?.delivery) ? item.delivery : [],
    image: item?.thumbnail || item?.image || null,
    source_url: item?.link_clean || item?.link || null,
    affiliate_url: affiliateUrl,
    affiliate_enabled: Boolean(affiliateUrl)
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

  const apiKey = process.env.SERPAPI_KEY;
  const amazonTag = process.env.AMAZON_ASSOCIATE_TAG;

  if (!apiKey) {
    return json(res, 503, {
      ok: false,
      code: 'SERPAPI_NOT_CONFIGURED',
      error: 'SerpApi is not configured on the server.'
    });
  }

  if (!amazonTag) {
    return json(res, 503, {
      ok: false,
      code: 'AMAZON_ASSOCIATE_TAG_NOT_CONFIGURED',
      error: 'Amazon Associates tracking ID is not configured on the server.'
    });
  }

  const q = String(req.query?.q || '').trim();
  if (q.length < 2 || q.length > 120) {
    return json(res, 400, { ok: false, error: 'Search must be between 2 and 120 characters.' });
  }

  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('engine', 'amazon');
  url.searchParams.set('amazon_domain', 'amazon.in');
  url.searchParams.set('language', 'en_IN');
  url.searchParams.set('k', q);
  url.searchParams.set('device', 'desktop');
  url.searchParams.set('page', '1');

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`
      }
    });

    const text = await upstream.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) {}

    if (!upstream.ok) {
      console.error('SerpApi Amazon error:', upstream.status, data || text.slice(0, 300));
      return json(res, upstream.status >= 500 ? 502 : upstream.status, {
        ok: false,
        error: data?.error || data?.message || 'Amazon search provider returned an error.'
      });
    }

    const results = Array.isArray(data?.organic_results)
      ? data.organic_results.map(item => normalizeResult(item, amazonTag)).filter(item => item.asin && item.title)
      : [];

    return json(res, 200, {
      ok: true,
      marketplace: 'Amazon India',
      affiliate_tag_applied: true,
      results
    });
  } catch (error) {
    console.error('SerpApi request error:', error);
    return json(res, 502, { ok: false, error: 'Amazon live search could not be reached.' });
  }
};
