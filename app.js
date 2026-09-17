const SUPABASE_URL = "https://vssthkgpibacnxczrlgp.supabase.co";
const SUPABASE_KEY = "sb_publishable_fvSXFcuJcsY_6gNGrRctmA_ftvpmKUK";

const demoProducts = [
  { id: 1, name: "boAt Airdopes 141", category: "earbuds", icon: "🎧", rating: "4.2", reviews: "25.4K", amazon: 1199, flipkart: 1099, summary: "Strong everyday value for calls, music and casual use.", a: "https://www.amazon.in/", f: "https://www.flipkart.com/" },
  { id: 2, name: "Casio Enticer Men's Watch", category: "watch", icon: "⌚", rating: "4.4", reviews: "8.9K", amazon: 2399, flipkart: 2299, summary: "A classic everyday watch with a strong value proposition.", a: "https://www.amazon.in/", f: "https://www.flipkart.com/" },
  { id: 3, name: "Portronics Power Bank 10000mAh", category: "power bank", icon: "🔋", rating: "4.1", reviews: "6.7K", amazon: 899, flipkart: 849, summary: "Compact capacity-focused option for daily backup charging.", a: "https://www.amazon.in/", f: "https://www.flipkart.com/" },
  { id: 4, name: "ASUS Vivobook 15", category: "laptop", icon: "💻", rating: "4.3", reviews: "3.2K", amazon: 52990, flipkart: 51990, summary: "Balanced productivity laptop for study and office workloads.", a: "https://www.amazon.in/", f: "https://www.flipkart.com/" }
];

let currentProducts = [...demoProducts];
const money = n => Number.isFinite(Number(n)) ? "₹" + Number(n).toLocaleString("en-IN") : "—";
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));

function demoCard(p) {
  const low = Math.min(p.amazon, p.flipkart);
  const diff = Math.abs(p.amazon - p.flipkart);
  return `<article class="product-card"><div class="pimg">${p.icon}</div><div class="pbody"><div class="tag">${escapeHtml(p.category)}</div><h3>${escapeHtml(p.name)}</h3><div class="rating">★ ${escapeHtml(p.rating)} <span>· ${escapeHtml(p.reviews)} reviews</span></div><p>${escapeHtml(p.summary)}</p><div class="compare-row"><div><small>Amazon</small><strong>${money(p.amazon)}</strong><a href="${p.a}" target="_blank" rel="nofollow sponsored noopener">View price ↗</a></div><div><small>Flipkart</small><strong>${money(p.flipkart)}</strong><a href="${p.f}" target="_blank" rel="nofollow sponsored noopener">View price ↗</a></div></div><div class="best">Best listed price <b>${money(low)}</b><span>${diff ? `· ${money(diff)} lower` : ""}</span></div></div></article>`;
}

function liveCard(group) {
  const offers = group.offers.filter(o => o.available && Number.isFinite(Number(o.price)));
  const lowest = offers.length ? Math.min(...offers.map(o => Number(o.price))) : null;
  const mrp = offers.map(o => Number(o.mrp)).filter(Number.isFinite).sort((a,b) => b-a)[0] || null;
  const savings = mrp && lowest && mrp > lowest ? mrp - lowest : 0;
  const image = group.image ? `<img src="${escapeHtml(group.image)}" alt="" loading="lazy" style="max-width:100%;max-height:100px;object-fit:contain">` : "🛍️";
  const rows = group.offers.map(o => `<div class="live-offer"><div><strong>${escapeHtml(o.platform)}</strong><small>${o.available ? (o.sla ? `Delivery ${escapeHtml(o.sla)}` : "Available") : "Currently unavailable"}</small></div><div><strong>${money(o.price)}</strong>${o.mrp && Number(o.mrp) > Number(o.price) ? `<small>MRP ${money(o.mrp)}</small>` : ""}</div><a href="${escapeHtml(o.url || '#')}" target="_blank" rel="nofollow sponsored noopener">View ↗</a></div>`).join("");
  return `<article class="product-card live-card"><div class="pimg">${image}</div><div class="pbody"><div class="tag">LIVE COMPARISON</div><h3>${escapeHtml(group.name)}</h3>${group.brand ? `<div class="rating">${escapeHtml(group.brand)}${group.quantity ? ` · ${escapeHtml(group.quantity)}` : ""}</div>` : ""}<div class="live-offers">${rows}</div><div class="best">Best available price <b>${money(lowest)}</b>${savings ? `<span> · ${money(savings)} below MRP</span>` : ""}</div></div></article>`;
}

function amazonCard(item) {
  const price = item.extracted_price ?? item.price;
  const oldPrice = item.extracted_old_price ?? item.old_price;
  const image = item.image ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy" style="max-width:100%;max-height:110px;object-fit:contain">` : "🛒";
  const rating = item.rating != null ? `★ ${escapeHtml(item.rating)}` : "";
  const reviews = item.reviews != null ? ` · ${escapeHtml(item.reviews)} reviews` : "";
  const availability = item.availability ? escapeHtml(item.availability) : "Availability not provided";
  const delivery = Array.isArray(item.delivery) && item.delivery.length ? escapeHtml(item.delivery.join(" · ")) : "";
  const affiliate = item.affiliate_url || "#";
  const old = oldPrice != null && Number(oldPrice) > Number(price) ? `<small>MRP/old price ${money(oldPrice)}</small>` : "";
  return `<article class="product-card live-card"><div class="pimg">${image}</div><div class="pbody"><div class="tag">AMAZON INDIA · LIVE SEARCH</div><h3>${escapeHtml(item.title)}</h3><div class="rating">${rating}${reviews}</div><div class="live-offer"><div><small>${availability}</small>${delivery ? `<small>${delivery}</small>` : ""}</div><div><strong>${money(price)}</strong>${old}</div><a href="${escapeHtml(affiliate)}" target="_blank" rel="nofollow sponsored noopener">Buy on Amazon ↗</a></div><div class="best">Affiliate link <b>${item.affiliate_enabled ? "Verified tag applied by server" : "Not configured"}</b></div></div></article>`;
}

function render(list = currentProducts, live = false) {
  const results = document.querySelector("#results");
  if (!results) return;
  results.innerHTML = list.length ? (live ? list.map(amazonCard).join("") : list.map(demoCard).join("")) : `<div class="empty">No matching product found. Try a more specific search.</div>`;
}

function showStatus(message, type = "info") {
  let el = document.querySelector("#liveStatus");
  if (!el) {
    el = document.createElement("div");
    el.id = "liveStatus";
    el.style.cssText = "max-width:1180px;margin:0 auto;padding:12px 24px;font-size:13px";
    const deals = document.querySelector("#deals");
    if (deals) deals.parentNode.insertBefore(el, deals);
  }
  el.textContent = message;
  el.dataset.type = type;
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported by this browser."));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(new Error(err.code === 1 ? "Location permission is required for live comparison." : "Could not determine your location.")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(true wireless|tws|bluetooth|wireless|earbuds|earphone|headphones|headset|in ear|with mic|smartphone|mobile phone)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value) {
  return new Set(normalizeToken(value).split(" ").filter(t => t.length > 1));
}

function numericTokens(value) {
  return (String(value || "").toLowerCase().match(/[a-z]*\d+[a-z\d-]*/g) || []).map(t => t.replace(/[^a-z0-9]/g, ""));
}

function brandCompatible(a, b) {
  const aa = normalizeToken(a.brand);
  const bb = normalizeToken(b.brand);
  return !aa || !bb || aa === bb;
}

function quantityCompatible(a, b) {
  if (!a.quantity || !b.quantity) return true;
  const an = numericTokens(a.quantity);
  const bn = numericTokens(b.quantity);
  return !an.length || !bn.length || an.some(t => bn.includes(t));
}

function shouldMergeItems(a, b) {
  if (!brandCompatible(a, b) || !quantityCompatible(a, b)) return false;
  const aNums = numericTokens(a.name);
  const bNums = numericTokens(b.name);
  if (aNums.length && bNums.length && !aNums.some(t => bNums.includes(t))) return false;
  const at = tokenSet(a.name);
  const bt = tokenSet(b.name);
  if (!at.size || !bt.size) return false;
  const overlap = [...at].filter(t => bt.has(t)).length;
  const union = new Set([...at, ...bt]).size;
  return overlap / union >= 0.82;
}

function findCompatibleGroup(groups, item) {
  const exact = normalizeToken(item.name);
  for (const group of groups) {
    if (group.key === exact) return group;
  }
  for (const group of groups) {
    if (shouldMergeItems(group.matchItem, item)) return group;
  }
  return null;
}

function normalizeLive(provider) {
  const results = provider?.data?.results || {};
  const groups = [];
  Object.entries(results).forEach(([platform, items]) => {
    (Array.isArray(items) ? items : []).forEach(item => {
      const name = String(item.name || "").trim();
      if (!name) return;
      const normalizedItem = { name, brand: item.brand || "", quantity: item.quantity || "" };
      let group = findCompatibleGroup(groups, normalizedItem);
      if (!group) {
        group = { key: normalizeToken(name), name, brand: item.brand || "", quantity: item.quantity || "", image: item.images?.[0] || item.image || "", matchItem: normalizedItem, offers: [] };
        groups.push(group);
      }
      group.offers.push({
        platform: item.platform?.name || platform,
        price: item.offer_price ?? item.price,
        mrp: item.mrp,
        available: item.available ?? item.in_stock ?? true,
        quantity: item.quantity,
        image: item.images?.[0] || item.image,
        url: item.deeplink || item.url || "",
        sla: item.platform?.sla || ""
      });
    });
  });
  return groups.sort((a,b) => {
    const ap = Math.min(...a.offers.map(o => Number(o.price)).filter(Number.isFinite));
    const bp = Math.min(...b.offers.map(o => Number(o.price)).filter(Number.isFinite));
    return (Number.isFinite(ap) ? ap : Infinity) - (Number.isFinite(bp) ? bp : Infinity);
  }).slice(0, 12);
}

async function liveSearch(q) {
  const clean = q.trim();
  if (clean.length < 2) { showStatus("Enter at least 2 characters to search.", "error"); return; }
  showStatus("Checking live Amazon results…");
  try {
    const params = new URLSearchParams({ q: clean });
    const response = await fetch(`/api/amazon-search?${params.toString()}`, { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Live Amazon search failed.");
    const results = Array.isArray(payload.results) ? payload.results : [];
    if (!results.length) { showStatus("No live Amazon matching products were returned. Try a more specific product name.", "info"); render([], true); return; }
    render(results, true);
    showStatus(`Live Amazon results found: ${results.length}.`, "success");
    document.querySelector("#deals")?.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error(error);
    showStatus(error.message || "Live Amazon comparison is unavailable right now.", "error");
    render(currentProducts, false);
  }
}

function searchProducts() {
  const input = document.querySelector("#searchInput");
  if (!input) return;
  const q = input.value.toLowerCase().trim();
  if (!q) { currentProducts = [...demoProducts]; render(); document.querySelector("#deals")?.scrollIntoView({ behavior: "smooth" }); return; }
  liveSearch(q);
}

function quick(q) {
  const input = document.querySelector("#searchInput");
  if (!input) return;
  input.value = q;
  searchProducts();
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector("#searchInput");
  if (input) input.addEventListener("keydown", e => { if (e.key === "Enter") searchProducts(); });
  render();
  loadProductsFromSupabase();
  applyLiveCopy();
});

function applyLiveCopy() {
  const topbar = document.querySelector(".topbar");
  if (topbar) topbar.textContent = "Live Amazon marketplace search · Prices and availability are checked when you search.";

  const heroNote = document.querySelector(".hero-card .tiny");
  if (heroNote) heroNote.textContent = "Live Amazon results are fetched server-side.";

  const dealNote = document.querySelector("#deals .section-head .muted");
  if (dealNote) dealNote.textContent = "Live Amazon data · server-side search";

  const newsletterText = document.querySelector(".newsletter p");
  if (newsletterText) newsletterText.textContent = "Live Amazon product search is now connected. Multi-marketplace comparison can be added next.";
}

async function loadProductsFromSupabase() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=id.asc`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) return;
    data.forEach(dbProduct => {
      const p = currentProducts.find(product => product.id === dbProduct.id);
      if (p) Object.assign(p, { brand: dbProduct.brand, image: dbProduct.image_url, description: dbProduct.description });
    });
    render(currentProducts);
  } catch (error) { console.error("Supabase connection error:", error); }
}
