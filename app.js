const products=[
{id:1,name:"boAt Airdopes 141",category:"earbuds",icon:"🎧",rating:"4.2",reviews:"25.4K",amazon:1199,flipkart:1099,summary:"Strong everyday value for calls, music and casual use.",a:"https://www.amazon.in/",f:"https://www.flipkart.com/"},
{id:2,name:"Casio Enticer Men's Watch",category:"watch",icon:"⌚",rating:"4.4",reviews:"8.9K",amazon:2399,flipkart:2299,summary:"A classic everyday watch with a strong value proposition.",a:"https://www.amazon.in/",f:"https://www.flipkart.com/"},
{id:3,name:"Portronics Power Bank 10000mAh",category:"power bank",icon:"🔋",rating:"4.1",reviews:"6.7K",amazon:899,flipkart:849,summary:"Compact capacity-focused option for daily backup charging.",a:"https://www.amazon.in/",f:"https://www.flipkart.com/"},
{id:4,name:"ASUS Vivobook 15",category:"laptop",icon:"💻",rating:"4.3",reviews:"3.2K",amazon:52990,flipkart:51990,summary:"Balanced productivity laptop for study and office workloads.",a:"https://www.amazon.in/",f:"https://www.flipkart.com/"}
];
const money=n=>"₹"+n.toLocaleString("en-IN");
function card(p){
 const low=Math.min(p.amazon,p.flipkart), diff=Math.abs(p.amazon-p.flipkart);
 return `<article class="product-card"><div class="pimg">${p.icon}</div><div class="pbody"><div class="tag">${p.category}</div><h3>${p.name}</h3><div class="rating">★ ${p.rating} <span>· ${p.reviews} reviews</span></div><p>${p.summary}</p><div class="compare-row"><div><small>Amazon</small><strong>${money(p.amazon)}</strong><a href="${p.a}" target="_blank" rel="nofollow sponsored noopener">View price ↗</a></div><div><small>Flipkart</small><strong>${money(p.flipkart)}</strong><a href="${p.f}" target="_blank" rel="nofollow sponsored noopener">View price ↗</a></div></div><div class="best">Best listed price <b>${money(low)}</b> <span>${diff?`· ₹${diff.toLocaleString("en-IN")} lower`:''}</span></div></div></article>`;
}
function render(list=products){document.querySelector("#results").innerHTML=list.length?list.map(card).join(""):`<div class="empty">No matching demo product yet. Try another category.</div>`}
function searchProducts(){const q=document.querySelector("#searchInput").value.toLowerCase().trim();render(q?products.filter(p=>(p.name+" "+p.category).includes(q)):products);document.querySelector("#deals").scrollIntoView({behavior:"smooth"})}
function quick(q){document.querySelector("#searchInput").value=q;searchProducts()}
document.querySelector("#searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchProducts()});render();