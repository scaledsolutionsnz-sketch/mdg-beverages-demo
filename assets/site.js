/* Shared behaviour for every page on the site: the age gate, the Brands
   dropdown, shop links, scroll reveals and the footer bits.
   Page-specific work (the homepage hero, a brand profile gallery) stays on
   the page that needs it. */

/* ─────────────────────────────────────────────────────────────
   THE BRANDS. One list, used by the nav dropdown on every page.

   url   : the profile page on this site
   site  : that brand's own consumer site, when it has one. Leave empty
           and the profile page simply does not show an outbound link.
   soon  : true means it appears in the menu greyed out, with no page yet.
   ───────────────────────────────────────────────────────────── */
const MDG_BRANDS = [
  { key:"solara",  name:"Solara",       note:"Sparkling mimosa",  url:"/brands/solara.html",  site:"",
    tag:"By invitation.",          shot:"/img/solara.jpg" },
  { key:"vanta",   name:"Vanta",        note:"Sparkling ros\u00e9",    url:"/brands/vanta.html",   site:"",
    tag:"Tonight we Vanta.",       shot:"/img/vanta.jpg" },
  { key:"bespoke", name:"Bespoke",      note:"Private label",     url:"/brands/bespoke.html", site:"",
    tag:"Your drink, built properly.", shot:"" },
  { key:"onlycans",name:"ONLYCANS",     note:"Coming soon", soon:true },
  { key:"divot",   name:"Divot",        note:"Coming soon", soon:true },
  { key:"house",   name:"House Spirits",note:"Coming soon", soon:true }
];

/* ─────────────────────────────────────────────────────────────
   SHOPIFY LINKS: paste the store URLs here when the shop is live.
   Leave a value empty ("") and its button shows "Store opening soon"
   instead of linking anywhere.
   ───────────────────────────────────────────────────────────── */
const SHOP = {
  store:    "",
  solara:   "",
  vanta:    "",
  bespoke:  ""
};

/* Build the Brands dropdown into any <div class="brands-menu"> in the header. */
function buildBrandsMenu(){
  const host = document.querySelector('.brands-menu');
  if(!host) return;
  const current = host.dataset.current || '';

  host.innerHTML = `
    <button class="brands-trigger" type="button" aria-expanded="false" aria-haspopup="true">
      Brands <span class="caret" aria-hidden="true"></span>
    </button>
    <div class="brands-panel" role="menu">
      ${MDG_BRANDS.map(b => b.soon
        ? `<span class="soon" role="menuitem" aria-disabled="true">${b.name}<em>${b.note}</em></span>`
        : `<a role="menuitem" href="${b.url}"${b.key === current ? ' aria-current="page"' : ''}>${b.name}<em>${b.note}</em></a>`
      ).join('')}
    </div>`;

  const trigger = host.querySelector('.brands-trigger');
  const panel   = host.querySelector('.brands-panel');
  const open  = () => trigger.setAttribute('aria-expanded','true');
  const close = () => trigger.setAttribute('aria-expanded','false');
  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

  trigger.addEventListener('click', e => { e.stopPropagation(); isOpen() ? close() : open(); });
  host.addEventListener('mouseenter', open);
  host.addEventListener('mouseleave', close);
  document.addEventListener('click', e => { if(!host.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && isOpen()){ close(); trigger.focus(); } });
  panel.addEventListener('click', e => { if(e.target.closest('a')) close(); });
}

/* Buy buttons point at Shopify once SHOP has URLs in it, and say so when it does not. */
function wireShop(){
  document.querySelectorAll('[data-shop]').forEach(el=>{
    const url = SHOP[el.dataset.shop] || '';
    const label = el.querySelector('.shop-label') || el;
    if(url){
      el.href = url; el.target = '_blank'; el.rel = 'noopener';
      el.classList.remove('soon'); el.removeAttribute('aria-disabled');
      label.textContent = el.dataset.buy || 'Buy online';
    } else {
      el.href = '#'; el.removeAttribute('target');
      el.classList.add('soon'); el.setAttribute('aria-disabled','true');
      label.textContent = 'Store opening soon';
      el.onclick = ev => ev.preventDefault();
    }
  });
}

/* R18 gate. Confirmed once per browser session. */
function wireGate(){
  const gate = document.getElementById('gate');
  if(!gate) return;
  try{ if(sessionStorage.getItem('mdg-age')==='ok'){ gate.style.display='none'; } }catch(e){}
  const yes = document.getElementById('gyes'), no = document.getElementById('gno');
  if(yes) yes.onclick = ()=>{
    try{ sessionStorage.setItem('mdg-age','ok'); }catch(e){}
    gate.classList.add('away');
    setTimeout(()=>{ gate.style.display='none'; }, 850);
  };
  if(no) no.onclick = ()=>{ const m=document.getElementById('gmsg'); if(m) m.style.display='block'; };
}

/* Scroll reveals, skipped for reduced motion. */
function wireReveals(){
  const els = document.querySelectorAll('.reveal');
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window){
    const io = new IntersectionObserver(es=>{
      es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    },{threshold:.12});
    els.forEach(el=>io.observe(el));
  } else {
    els.forEach(el=>el.classList.add('in'));
  }
}

/* Footer: the year, and an email address assembled in JS so it is never
   literal in the HTML for scrapers to lift. */
function wireFooter(){
  const yr = document.getElementById('yr');
  if(yr) yr.textContent = new Date().getFullYear();
  const a = document.getElementById('femail');
  if(!a) return;
  const to = a.dataset.u + '@' + a.dataset.d;
  a.textContent = to;
  a.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(to);
  a.target = '_blank'; a.rel = 'noopener';
}

/* The browser chrome follows the page's palette. */
function wireThemeColour(){
  const meta = document.querySelector('meta[name="theme-color"]');
  if(!meta) return;
  const sync = ()=>{ meta.content = getComputedStyle(document.body).backgroundColor; };
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-brand']});
  sync();
}

/* The trade enquiry form opens a pre-filled compose window, so the message
   reaches MDG without a form backend. */
function wireEnquiry(){
  const form = document.getElementById('enq');
  if(!form) return;
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const f = e.target;
    const to = ['hello','mdgbeverages.com'].join('@');
    const su = encodeURIComponent(f.reason.value + ' - ' + (f.company.value || f.name.value));
    const body = encodeURIComponent(
      'Name: ' + f.name.value + '\n' +
      'Email: ' + f.email.value + '\n' +
      'Venue/company: ' + (f.company.value || '-') + '\n' +
      'Reason: ' + f.reason.value + '\n\n' +
      f.msg.value);
    window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(to) +
                '&su=' + su + '&body=' + body, '_blank', 'noopener');
    const sent = document.getElementById('sent');
    if(sent) sent.style.display = 'block';
    f.reset();
  });
}

/* On a brand profile page, the "Visit the brand site" button only appears once
   that brand has a `site` URL in MDG_BRANDS. Until then the profile simply does
   not offer a dead link. */
function wireBrandSite(){
  const slot = document.querySelector('[data-brand-site]');
  if(!slot) return;
  const b = MDG_BRANDS.find(x => x.key === slot.dataset.brandSite);
  if(!b || !b.site){ slot.remove(); return; }
  const a = document.createElement('a');
  a.className = 'cta solid';
  a.href = b.site; a.target = '_blank'; a.rel = 'noopener';
  a.textContent = 'Visit ' + b.name;
  slot.replaceWith(a);
}

function initSite(){
  buildBrandsMenu();
  wireShop();
  wireGate();
  wireReveals();
  wireFooter();
  wireThemeColour();
  wireEnquiry();
  wireBrandSite();
}
