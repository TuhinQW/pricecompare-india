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

function render(list = currentProducts, live = false) {
  const results = document.querySelector("#results");
  if (!results) return;
  results.innerHTML = list.length ? (live ? list.map(liveCard).join("") : list.map(demoCard).join("")) : `<div class="empty">No matching product found. Try a more specific search.</div>`;
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

function normalizeLive(provider) {
  const results = provider?.data?.results || {};
  const groups = new Map();
  Object.entries(results).forEach(([platform, items]) => {
    (Array.isArray(items) ? items : []).forEach(item => {
      const name = String(item.name || "").trim();
      if (!name) return;
      const key = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!groups.has(key)) groups.set(key, { name, brand: item.brand || "", quantity: item.quantity || "", image: item.images?.[0] || item.image || "", offers: [] });
      groups.get(key).offers.push({ platform: item.platform?.name || platform, price: item.offer_price ?? item.price, mrp: item.mrp, available: item.available ?? item.in_stock ?? true, quantity: item.quantity, image: item.images?.[0] || item.image, url: item.deeplink || item.url || "", sla: item.platform?.sla || "" });
    });
  });
  return [...groups.values()].sort((a,b) => {
    const ap = Math.min(...a.offers.map(o => Number(o.price)).filter(Number.isFinite));
    const bp = Math.min(...b.offers.map(o => Number(o.price)).filter(Number.isFinite));
    return ap - bp;
  }).slice(0, 12);
}

async function liveSearch(q) {
  const clean = q.trim();
  if (clean.length < 2) { showStatus("Enter at least 2 characters to search.", "error"); return; }
  showStatus("Getting your location and checking live marketplace prices…");
  try {
    const loc = await getLocation();
    const params = new URLSearchParams({ q: clean, lat: loc.lat.toFixed(6), lon: loc.lon.toFixed(6), platforms: "BlinkIt,Zepto,Swiggy,BigBasket,Amazon,Flipkart" });
    const response = await fetch(`/api/compare?${params.toString()}`, { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Live comparison failed.");
    const groups = normalizeLive(payload.provider);
    if (!groups.length) { showStatus("No live matching products were returned. Try a more specific product name.", "info"); render([], true); return; }
    render(groups, true);
    showStatus(`Live prices found across ${payload.provider?.data?.platforms?.length || 0} marketplaces.`, "success");
    document.querySelector("#deals")?.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error(error);
    showStatus(error.message || "Live comparison is unavailable right now.", "error");
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
  if (topbar) topbar.textContent = "Live marketplace comparison for Indian shoppers · Prices and availability update when you search.";

  const heroNote = document.querySelector(".hero-card .tiny");
  if (heroNote) heroNote.textContent = "Live comparison powered by connected marketplace data.";

  const dealNote = document.querySelector("#deals .section-head .muted");
  if (dealNote) dealNote.textContent = "Live marketplace data · location-aware results";

  const newsletterText = document.querySelector(".newsletter p");
  if (newsletterText) newsletterText.textContent = "Live price comparison is now connected. Price-drop intelligence and alerts are planned next.";
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
