/* ORO PARFUME standalone interactions. STORE_DATA and WHATSAPP_NUMBER are above. */
const products = STORE_DATA.filter(p => p.type === 'product');
const $ = s => document.querySelector(s);
const money = n => Math.round(n).toLocaleString('en-US') + ' MAD';
const unit = (p, size) => Math.round(p.price * (size === 50 ? .65 : 1));
const net = (p, size) => Math.round(unit(p, size) * (1 - p.discount / 100));
let cart = [], category = 'All fragrances', favorites = [], favoriteOnly = false, selected = null, size = 100, quantity = 1, checkout = false;
try { cart = JSON.parse(localStorage.getItem('oro-cart') || '[]').filter(i => products.some(p => p.id === i.id) && [50,100].includes(i.size) && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 99); } catch {}
function total() {
 let subtotal=0, productDiscount=0, prices=[];
 cart.forEach(i => {const p=products.find(p=>p.id===i.id); subtotal+=unit(p,i.size)*i.quantity; productDiscount+=(unit(p,i.size)-net(p,i.size))*i.quantity; for(let j=0;j<i.quantity;j++)prices.push(net(p,i.size));});
 prices.sort((a,b)=>a-b); const bundleDiscount=prices.slice(0,Math.floor(prices.length/3)).reduce((a,b)=>a+b,0);
 return {subtotal,productDiscount,bundleDiscount,discount:productDiscount+bundleDiscount,total:subtotal-productDiscount-bundleDiscount};
}
function save() { try {localStorage.setItem('oro-cart',JSON.stringify(cart));} catch {} const count=cart.reduce((n,i)=>n+i.quantity,0); $('.cart-count').textContent=count; $('.cart-trigger').setAttribute('aria-label',`Open shopping bag, ${count} items`); }
let toastTimer;
function toast(text) {const el=$('.toast');el.textContent=text;el.classList.add('toast-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('toast-visible'),2500);}
function add(p,s=100,q=1) {const existing=cart.find(i=>i.id===p.id&&i.size===s);if(existing)existing.quantity=Math.min(99,existing.quantity+q);else cart.push({id:p.id,size:s,quantity:q});save();toast(p.name+' added to your bag');}
function escapeHTML(text) {return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function control(text,action,cls='',label='') {return `<button type="button" class="${cls}" data-action="${action}" ${label?`aria-label="${escapeHTML(label)}"`:''}>${text}</button>`;}
const dialog=document.createElement('dialog');dialog.className='standalone-dialog';document.body.append(dialog);
let returnFocus;
function close() {dialog.close();document.body.style.overflow='';returnFocus?.focus();}
function openPanel(title,html,drawer=false) {if(!dialog.open)returnFocus=document.activeElement;dialog.className='standalone-dialog '+(drawer?'standalone-drawer':'');dialog.innerHTML=`<div class="panel-heading"><h2>${title}</h2>${control('×','close','','Close')}</div>${html}`;if(!dialog.open)dialog.showModal();document.body.style.overflow='hidden';}
dialog.addEventListener('cancel',()=>{document.body.style.overflow='';});
function productDetail() {
 const p=selected;
 openPanel(p.name,`<div class="product-detail"><img src="${p.image}" alt="${p.name}"/><div><span class="eyebrow">${p.category} · EAU DE PARFUM</span><h2>${p.name}</h2><p class="detail-family">${p.family}</p><div class="notes">${p.notes.map((n,i)=>`<div><span>${['TOP NOTES','HEART NOTES','BASE NOTES'][i]}</span><p>${n}</p></div>`).join('')}</div><p class="field-label">Size</p><div class="size-options">${[50,100].map(v=>control(v+' ml','size-'+v,size===v?'selected-size':'')).join('')}</div><div class="detail-purchase"><div class="quantity-control">${control('−','qty-minus','','Decrease quantity')}<span>${quantity}</span>${control('+','qty-plus','','Increase quantity')}</div><strong>${money(net(p,size))}</strong></div>${control('ADD TO BAG','detail-add','primary-cta w-full')}</div></div>`);
}
function renderCart() {
 const t=total();let html='';
 if(!cart.length)html=`<div class="empty-bag"><h3>A little luxury awaits.</h3><p>Your bag is waiting for its first signature scent.</p>${control('EXPLORE THE COLLECTION','close','primary-cta')}</div>`;
 else html=`${checkout?control('← Back to bag','back','back-to-bag'):''}<div class="cart-items">${cart.map((i,index)=>{const p=products.find(p=>p.id===i.id);return `<div class="cart-item"><img src="${p.image}" alt="${p.name}"/><div><h3>${p.name}</h3><p>${i.size} ml · ${p.category}</p><strong>${money(net(p,i.size)*i.quantity)}</strong><div class="cart-item-controls"><div class="quantity-control">${control('−','minus-'+index,'','Decrease '+p.name+' quantity')}<span>${i.quantity}</span>${control('+','plus-'+index,'','Increase '+p.name+' quantity')}</div>${control('Remove','remove-'+index)}</div></div></div>`;}).join('')}</div><div class="cart-totals"><div><span>Subtotal</span><span>${money(t.subtotal)}</span></div><div><span>Fragrance savings</span><span>−${money(t.productDiscount)}</span></div>${t.bundleDiscount?`<div><span>Buy 2, get 1 free</span><span>−${money(t.bundleDiscount)}</span></div>`:''}<div class="total-line"><strong>Total</strong><strong>${money(t.total)}</strong></div><p>Delivery in Nador only · fee confirmed on WhatsApp.</p></div>${checkout?`<form class="checkout-form">${[['name','Full name','text'],['phone','Phone number','tel'],['address','Delivery address','text']].map(([name,label,type])=>`<label>${label}<input name="${name}" type="${type}" required minlength="${name==='phone'?8:2}" maxlength="200"/></label>`).join('')}<label>Delivery city<select name="city" required><option value="Nador">Nador only</option></select></label><p>Payment: cash on delivery or as agreed on WhatsApp. Delivery is available in Nador only.</p><button type="submit" class="primary-cta w-full">SEND ORDER ON WHATSAPP</button></form>`:control('ORDER VIA WHATSAPP','checkout','primary-cta w-full')}`;
 openPanel(checkout?'Your delivery details':`Your bag (${cart.reduce((n,i)=>n+i.quantity,0)})`,`<div class="cart-body">${html}</div>`,true);
}
function contact(message='') {const phone=WHATSAPP_NUMBER.replace(/\D/g,'');if(!phone){openPanel('WhatsApp ordering opens soon','<div class="setup-message"><p>Our WhatsApp number is not connected yet. Your bag is saved and ready for when ordering opens.</p>'+control('Continue exploring','close')+'</div>');return;}window.open('https://wa.me/'+phone+(message?'?text='+encodeURIComponent(message):''),'_blank','noopener,noreferrer');}
document.addEventListener('submit',e=>{if(!e.target.matches('.checkout-form'))return;e.preventDefault();const data=new FormData(e.target);const t=total();contact(['ORO PARFUME — New order','',...cart.map(i=>{const p=products.find(p=>p.id===i.id);return `${p.name} · ${i.size} ml × ${i.quantity} — ${money(net(p,i.size)*i.quantity)}`;}),'',`Subtotal: ${money(t.subtotal)}`,`Discount: ${money(t.discount)}`,`Total: ${money(t.total)}`,'Delivery area: Nador only — fee confirmed on WhatsApp','',`Full name: ${data.get('name')}`,`Phone: ${data.get('phone')}`,`City: ${data.get('city')}`,`Address: ${data.get('address')}`,'','Payment: cash on delivery or as agreed on WhatsApp. Delivery is available in Nador only.'].join('\n'));});
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
 if(action==='close')close();
 else if(action==='checkout'){checkout=true;renderCart();}
 else if(action==='back'){checkout=false;renderCart();}
 else if(action==='detail-add'){add(selected,size,quantity);close();}
 else if(action.startsWith('size-')){size=Number(action.split('-')[1]);productDetail();}
 else if(action==='qty-minus'){quantity=Math.max(1,quantity-1);productDetail();}
 else if(action==='qty-plus'){quantity=Math.min(99,quantity+1);productDetail();}
 else if(/^(minus|plus|remove)-/.test(action)){const [kind,n]=action.split('-');const i=cart[Number(n)];if(kind==='remove')cart.splice(Number(n),1);else i.quantity=Math.min(99,i.quantity+(kind==='plus'?1:-1));cart=cart.filter(i=>i.quantity>0);save();renderCart();}
});
$('.cart-trigger').onclick=()=>{checkout=false;renderCart();};
$('.floating-whatsapp').onclick=()=>contact();
$('.footer-links button').onclick=()=>contact();
$('.header-search').onclick=()=>{$('#perfumes').scrollIntoView();$('#fragrance-search').focus({preventScroll:true});};
const cards=Array.from(document.querySelectorAll('.product-card'));
cards.forEach((card,i)=>{const p=products[i];card.querySelectorAll('.product-image a,.product-name').forEach(a=>a.onclick=e=>{e.preventDefault();selected=p;size=100;quantity=1;productDetail();});card.querySelector('.add-button').onclick=()=>add(p);card.querySelector('.product-heart').onclick=()=>{favorites.includes(p.id)?favorites=favorites.filter(id=>id!==p.id):favorites.push(p.id);card.querySelector('.product-heart').classList.toggle('favorite-active',favorites.includes(p.id));filter();};});
function filter(){let found=0;cards.forEach((card,i)=>{const p=products[i];const visible=(category==='All fragrances'||p.category===category)&&(!favoriteOnly||favorites.includes(p.id))&&(p.name+' '+p.family).toLowerCase().includes($('#fragrance-search').value.toLowerCase());card.hidden=!visible;if(visible)found++;});$('.standalone-no-results').hidden=found>0;}
const noResults=document.createElement('div');noResults.className='empty-results standalone-no-results';noResults.hidden=true;noResults.textContent='No fragrances found. Try another name or category.';$('.product-grid').after(noResults);
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{category=b.textContent;document.querySelectorAll('.filter').forEach(el=>el.classList.toggle('active-filter',el===b));filter();});
$('#fragrance-search').oninput=filter;
document.querySelector('[aria-label="Show favorite fragrances"]').onclick=e=>{favoriteOnly=!favoriteOnly;e.currentTarget.classList.toggle('favorite-active',favoriteOnly);filter();$('#perfumes').scrollIntoView();};
$('.mobile-menu').onclick=()=>{let nav=$('.mobile-nav');if(nav){nav.remove();return;}nav=document.createElement('nav');nav.className='mobile-nav';nav.setAttribute('aria-label','Mobile navigation');nav.innerHTML=[['Home','home'],['Perfumes','perfumes'],['Offers','offers'],['About','about'],['Contact','contact']].map(([name,id])=>`<a href="#${id}">${name} ↗</a>`).join('');nav.onclick=()=>nav.remove();$('.site-header').append(nav);};
function countdown(){let seconds=Math.max(0,Math.floor((new Date(OFFER_END)-Date.now())/1000));$('.countdown').innerHTML=seconds===0?'Offer ended':[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60].map((v,i)=>`<span><b>${String(v).padStart(2,'0')}</b><small>${['DAYS','HRS','MIN','SEC'][i]}</small></span>`).join('');}
countdown();setInterval(countdown,1000);
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
save();