import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Heart, Menu, MessageCircle, Minus, Plus, Search, Share2, ShieldCheck, ShoppingBag, Sparkles, Truck, Trash2, Wallet, X, icons } from 'lucide-react';
import { FragranceProfile } from '@/components/fragrance-profile';
import { ProductNewBadge } from '@/components/product-new-badge';
import { Button } from '@/components/ui/button';
import { FALLBACK_STORE, DEFAULT_PRODUCT_DISPLAY, resolveImage, productImages, money, totals, unitPrice, orderMessage, DELIVERY_CITY, PRODUCT_HASH_PREFIX, ORDER_HASH_PREFIX, productHash, productPriceBreakdown, defaultProductSize, collectionProducts, type Characteristic, type Product, type CartItem, type StoreData } from '@/lib/catalog';

// Renders a characteristic badge; unknown icon names fall back to Sparkles.
function CharBadge({ characteristic }: { characteristic: Characteristic }) {
  const key = characteristic.icon.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') as keyof typeof icons;
  const Icon = icons[key] ?? Sparkles;
  return <span className="char-badge"><Icon size={13} strokeWidth={1.8} />{characteristic.label}</span>;
}
import { supabase } from '@/integrations/supabase/client';
import hero from '@/assets/oro-hero.jpg';

const links = [['Home', '#home'], ['Perfumes', '#perfumes'], ['Offers', '#offers'], ['About', '#about'], ['Contact', '#contact']];
function Brand() { return <a className="brand" href="#home" aria-label="ORO Parfume home"><span>ORO<span className="brand-star">✦</span></span><small>PARFUME</small></a>; }
function Countdown({ end }: { end: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => { const update = () => setRemaining(Math.max(0, new Date(end).getTime() - Date.now())); update(); const timer = setInterval(update, 1000); return () => clearInterval(timer); }, [end]);
  const seconds = Math.floor((remaining ?? 0) / 1000);
  return <div className="countdown" aria-label="Offer time remaining">{remaining === 0 ? <span>Offer ended</span> : [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60].map((v, i) => <span key={i}><b>{remaining === null ? '—' : String(v).padStart(2, '0')}</b><small>{['DAYS','HRS','MIN','SEC'][i]}</small></span>)}</div>;
}

type OfferBanner = { image: string; offer: StoreData['offers'][number] };
function OfferImageCarousel({ banners, onSelect }: { banners: OfferBanner[]; onSelect: (offer: StoreData['offers'][number]) => void }) {
  const images = banners.map(banner => banner.image);
  const viewport = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const moveTo = (next: number) => {
    const track = viewport.current;
    if (!track) return;
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    const start = track.scrollLeft;
    const target = next * track.clientWidth;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { track.scrollLeft = target; return; }
    const duration = 1450;
    let startTime: number | null = null;
    const animate = (time: number) => {
      if (startTime === null) startTime = time;
      const progress = Math.min(1, (time - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      track.scrollLeft = start + (target - start) * eased;
      if (progress < 1) animationFrame.current = requestAnimationFrame(animate);
      else animationFrame.current = null;
    };
    animationFrame.current = requestAnimationFrame(animate);
  };
  const show = (index: number) => {
    const next = (index + images.length) % images.length;
    activeIndexRef.current = next;
    setActiveIndex(next);
    moveTo(next);
  };
  useEffect(() => {
    if (images.length < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      const next = (activeIndexRef.current + 1) % images.length;
      activeIndexRef.current = next;
      setActiveIndex(next);
      moveTo(next);
    }, 7200);
    return () => window.clearInterval(timer);
  }, [images.length, paused]);
  useEffect(() => () => { if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current); }, []);
  return <div className="offer-image-carousel" aria-label="Offer banners" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
    <div className="offer-image-viewport" ref={viewport} onPointerDown={() => { if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current); animationFrame.current = null; setPaused(true); }} onPointerUp={() => setPaused(false)} onPointerCancel={() => setPaused(false)} onScroll={event => { const width = event.currentTarget.clientWidth; if (width) { const index = Math.min(images.length - 1, Math.round(event.currentTarget.scrollLeft / width)); activeIndexRef.current = index; setActiveIndex(current => current === index ? current : index); } }}>
      {banners.map((banner, index) => <button type="button" className={index === activeIndex ? 'offer-image-slide is-active' : 'offer-image-slide'} key={`${banner.offer.id}-${index}`} onClick={() => onSelect(banner.offer)} aria-label={`View products in offer ${banner.offer.name}`}><img src={banner.image} alt={`Offer: ${banner.offer.name}`} loading={index === 0 ? 'eager' : 'lazy'} /></button>)}
    </div>
    {images.length > 1 && <>
      <Button type="button" variant="ghost" className="offer-carousel-arrow offer-carousel-prev" onClick={() => show(activeIndex - 1)} aria-label="Previous offer image"><ChevronLeft size={20}/></Button>
      <Button type="button" variant="ghost" className="offer-carousel-arrow offer-carousel-next" onClick={() => show(activeIndex + 1)} aria-label="Next offer image"><ChevronRight size={20}/></Button>
      <div className="offer-carousel-dots">{images.map((_, index) => <button type="button" key={index} className={index === activeIndex ? 'is-active' : ''} onClick={() => show(index)} aria-label={`Show offer image ${index + 1}`} aria-current={index === activeIndex} />)}</div>
    </>}
  </div>;
}
function Panel({ open, onOpenChange, title, children, drawer = false }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; children: React.ReactNode; drawer?: boolean }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="panel-overlay"/><Dialog.Content className={drawer ? 'panel cart-panel' : 'panel product-panel'} aria-describedby={undefined}><div className="panel-heading"><Dialog.Title>{title}</Dialog.Title><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close"><X/></Button></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
export function Storefront({ data = FALLBACK_STORE }: { data?: StoreData }) {
  const { products: ALL_PRODUCTS, offers: OFFERS, settings } = data;
  const PRODUCTS = useMemo(() => collectionProducts(ALL_PRODUCTS), [ALL_PRODUCTS]);
  const WHATSAPP_NUMBER = settings.whatsappNumber; const INSTAGRAM_URL = settings.instagramUrl;
  const bundleActive = OFFERS.some(o => o.kind === 'bundle');
  const maxDiscount = Math.max(0, ...PRODUCTS.map(p => p.discount));
  const offerBanners = OFFERS.flatMap(offer => (offer.images ?? []).filter(image => typeof image === 'string' && image.length > 0).map(image => ({ image, offer })));
  const [selectedOffer, setSelectedOffer] = useState<StoreData['offers'][number] | null>(null);
  // Live visitor presence and a daily visit record for the admin dashboard.
  useEffect(() => {
    if (!sessionStorage.getItem('oro-visit')) { sessionStorage.setItem('oro-visit', '1'); void supabase.from('visits').insert({}); }
    const channel = supabase.channel('site-presence', { config: { presence: { key: crypto.randomUUID() } } });
    channel.subscribe(status => { if (status === 'SUBSCRIBED') void channel.track({ at: new Date().toISOString() }); });
    return () => { void supabase.removeChannel(channel); };
  }, []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [menu, setMenu] = useState(false);
  const [category, setCategory] = useState('All fragrances');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [size, setSize] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [setup, setSetup] = useState(false);
  useEffect(() => { try { const saved: unknown = JSON.parse(localStorage.getItem('oro-cart') ?? '[]'); if (Array.isArray(saved)) setCart(saved.filter((item: CartItem) => (() => { const product = ALL_PRODUCTS.find(p => p.id === item.id); return !!product && (product.display?.sizes ?? DEFAULT_PRODUCT_DISPLAY.sizes).includes(item.size); })() && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99)); } catch { /* Ignore malformed local cart data. */ } setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem('oro-cart', JSON.stringify(cart)); }, [cart, ready]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); } }), { threshold: 0.08 }); document.querySelectorAll('.reveal').forEach(el => observer.observe(el)); return () => observer.disconnect(); }, []);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = totals(cart, ALL_PRODUCTS, bundleActive);
  const productsForOffer = (offer: StoreData['offers'][number]) => [...ALL_PRODUCTS.filter(product => (offer.product_ids ?? []).includes(product.id)), ...(offer.gift_products ?? [])];
  const filtered = PRODUCTS.filter(p => (category === 'All fragrances' || p.category === category) && (!onlyFavorites || favorites.includes(p.id)) && `${p.name} ${p.family}`.toLowerCase().includes(search.toLowerCase()));
  function add(product: Product, selectedSize = product.display?.sizes[0] ?? 100, qty = 1, notify = true, sourceOffer?: StoreData['offers'][number]) { setCart(current => { const existing = current.find(item => item.id === product.id && item.size === selectedSize && item.offerId === sourceOffer?.id); return existing ? current.map(item => item === existing ? { ...item, quantity: Math.min(99, item.quantity + qty) } : item) : [...current, { id: product.id, size: selectedSize, quantity: qty, ...(sourceOffer ? { offerId: sourceOffer.id, offerName: sourceOffer.name } : {}) }]; }); if (notify) setNotice(`${product.name} added to your bag`); }
  function update(id: string, selectedSize: number, change: number, offerId?: string) { setCart(current => current.map(item => item.id === id && item.size === selectedSize && item.offerId === offerId ? { ...item, quantity: Math.min(99, item.quantity + change) } : item).filter(item => item.quantity > 0)); }
  function showProduct(p: Product) { window.history.pushState(null, '', productHash(p.id)); setSelected(p); setSize(p.display?.sizes[0] ?? 100); setQuantity(1); }
  useEffect(() => {
    const openFromUrl = () => {
      const hash = window.location.hash;
      if (hash.startsWith(ORDER_HASH_PREFIX)) {
        const id = decodeURIComponent(hash.slice(ORDER_HASH_PREFIX.length));
        const ordered = ALL_PRODUCTS.find(item => item.id === id);
        if (ordered) {
          add(ordered, defaultProductSize(ordered), 1, false);
          setSelected(null);
          setCheckout(false);
          setCartOpen(true);
          setNotice(`${ordered.name} has been added to your bag`);
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#home`);
        }
        return;
      }
      if (!hash.startsWith(PRODUCT_HASH_PREFIX)) return;
      const id = decodeURIComponent(hash.slice(PRODUCT_HASH_PREFIX.length));
      const product = ALL_PRODUCTS.find(item => item.id === id);
      if (product) { setSelected(product); setSize(product.display?.sizes[0] ?? 100); setQuantity(1); }
    };
    openFromUrl();
    window.addEventListener('hashchange', openFromUrl);
    window.addEventListener('popstate', openFromUrl);
    return () => { window.removeEventListener('hashchange', openFromUrl); window.removeEventListener('popstate', openFromUrl); };
  }, [PRODUCTS]);
  async function shareProduct(p: Product) {
    const url = `${window.location.origin}${window.location.pathname}${productHash(p.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: `Discover ${p.name} by ORO PARFUME`, url });
      else { await navigator.clipboard.writeText(url); setNotice('Fragrance link copied'); }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setNotice('Unable to share this fragrance'); }
  }
  function closeProduct() { setSelected(null); if (window.location.hash.startsWith(PRODUCT_HASH_PREFIX)) window.history.pushState(null, '', '#home'); }
  function contact() { if (WHATSAPP_NUMBER) window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank', 'noopener,noreferrer'); else setSetup(true); }
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (!WHATSAPP_NUMBER) { setSetup(true); return; } const data = new FormData(e.currentTarget); const customer = { name: String(data.get('name')).trim(), phone: String(data.get('phone')).trim(), city: String(data.get('city')).trim(), address: String(data.get('address')).trim() }; if (Object.values(customer).some(v => !v) || customer.city !== DELIVERY_CITY) return; window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderMessage(cart, customer, ALL_PRODUCTS, bundleActive))}`, '_blank', 'noopener,noreferrer'); }
  return <>
    <div className="announcement"><span>A little luxury, delivered to your door.</span><span className="announcement-divider">✦</span><span>Cash on delivery in Nador only</span></div>
    <header className="site-header"><div className="header-inner"><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Open navigation" onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</Button><Brand/><nav className="desktop-nav" aria-label="Main navigation">{links.map(([label, href]) => <a key={label} href={href} className={label === 'Home' ? 'active' : ''}>{label}</a>)}</nav><div className="header-actions"><Button variant="ghost" size="icon" className="header-search" aria-label="Search fragrances" onClick={() => { document.querySelector('#perfumes')?.scrollIntoView({ behavior: 'smooth' }); document.querySelector<HTMLInputElement>('#fragrance-search')?.focus({ preventScroll: true }); }}><Search/></Button><Button variant="ghost" size="icon" className={onlyFavorites ? 'favorite-active' : ''} aria-label="Show favorite fragrances" onClick={() => { setOnlyFavorites(!onlyFavorites); document.querySelector('#perfumes')?.scrollIntoView({ behavior: 'smooth' }); }}><Heart/></Button><Button variant="ghost" className="cart-trigger" aria-label={`Open shopping bag, ${count} items`} onClick={() => { setCartOpen(true); setCheckout(false); }}><ShoppingBag/><span className="cart-count">{count}</span></Button></div></div>{menu && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(([label, href]) => <a key={label} href={href} onClick={() => setMenu(false)}>{label}<ArrowUpRight size={16}/></a>)}</nav>}</header>
    <main>
      <section className="hero" id="home"><img src={hero} alt="ORO amber perfumes in sunlit travertine, with a black cap and gold detailing" width="1920" height="1024" fetchPriority="high"/><div className="hero-shade"/><div className="hero-content"><div className="eyebrow"><span/>THE ART OF LEAVING AN IMPRESSION</div><h1>ORO PARFUME<span>A scent. <em>A signature.</em></span></h1><p>Extraordinary fragrances. Unforgettable moments.<br/>Discover the essence of your individuality.</p><Button asChild className="primary-cta"><a href="#perfumes">DISCOVER THE COLLECTION<ArrowRight size={17}/></a></Button><div className="hero-footnote"><span className="little-star">✦</span> Crafted for the unforgettable.</div></div><a href="#offers" className="hero-scroll">SCROLL TO DISCOVER<ChevronDown size={16}/></a><span className="hero-number">01 <span>/ 03</span></span></section>
      <section className="trust-strip" aria-label="Our promises"><span><ShieldCheck/>100% Authentic Fragrances</span><span><Truck/>Delivery in Nador only</span><span><Wallet/>Cash on Delivery</span><span><MessageCircle/>Personal WhatsApp Support</span></section>
      <section id="offers" className="offers section-wrap"><div className="section-heading reveal"><div><div className="eyebrow">A LITTLE MORE REASON TO INDULGE</div><h2>Exceptional scents. <em>Exceptional offers.</em></h2></div><a className="text-link" href="#perfumes">Explore the collection <ArrowUpRight size={16}/></a></div>{offerBanners.length > 0 ? <OfferImageCarousel banners={offerBanners} onSelect={offer => setSelectedOffer(offer)} /> : <><div className="offers-grid reveal">{OFFERS.map((offer, i) => <a href="#perfumes" className={`offer-card offer-${i % 3}`} key={offer.id} onClick={() => { setCategory('All fragrances'); setSearch(''); setOnlyFavorites(false); }}><span className="eyebrow">{offer.label}</span>{offer.kind === 'percentage' ? <div className="offer-value">Up to <strong>{maxDiscount || 30}<span>%</span></strong> off</div> : offer.kind === 'bundle' ? <div className="offer-value trio-value">Buy 2, <em>get 1 free.</em></div> : <Countdown end={settings.offerEnd}/>}<h3>{offer.name}</h3><div className="offer-bottom"><span>{offer.description}</span><ArrowUpRight size={19}/></div></a>)}</div><p className="offer-terms">The lowest-priced fragrance is complimentary with every three. Selected discounts apply automatically. Sample collection.</p></>}</section>
      <section id="perfumes" className="collection section-wrap"><div className="collection-title reveal"><div className="eyebrow">FIND THE ONE THAT FEELS LIKE YOU</div><h2>The Signature <em>Collection</em></h2><p>A world of beautiful notes. A fragrance that is uniquely yours.</p></div><div className="collection-tools"><div className="filters" aria-label="Filter by category">{['All fragrances','Women','Men','Unisex'].map(cat => <Button key={cat} variant="ghost" className={cat === category ? 'filter active-filter' : 'filter'} onClick={() => setCategory(cat)}>{cat}</Button>)}</div><label className="search-box"><Search size={17}/><input aria-label="Search fragrances" id="fragrance-search" placeholder="Search your scent…" value={search} onChange={e => setSearch(e.target.value)}/></label></div>{onlyFavorites && <div className="favorite-filter">Your favorites <Button variant="ghost" onClick={() => setOnlyFavorites(false)} aria-label="Clear favorites filter"><X size={16}/></Button></div>}<div className="product-grid">{filtered.map(p => { const detailUrl = `/perfume/${encodeURIComponent(p.id)}`; const cover = productImages(p)[0]; return <article className="product-card" key={p.id}><a className="product-image" href={detailUrl} aria-label={`View details for ${p.name}`}><ProductNewBadge createdAt={p.created_at}/><img src={resolveImage(cover)} alt={`${p.name} perfume bottle`} loading="lazy" width="512" height="512"/></a><div className="product-card-copy"><a href={detailUrl} className="product-name">{p.name}</a><div className="fragrance-family">{p.family}</div><div className="product-card-price"><span className="product-size-label">{defaultProductSize(p)} ml</span><div className="price-values">{p.discount > 0 && <><span className="discount-badge">-{p.discount}%</span><s className="original-price">{money(productPriceBreakdown(p, defaultProductSize(p)).original)}</s></>}<strong className="product-price">{money(productPriceBreakdown(p, defaultProductSize(p)).current)}</strong></div></div><a className="product-order-link" href={detailUrl} aria-label={`View ${p.name} details and order`}>ORDER NOW <ArrowUpRight size={16}/></a></div></article>; })}</div>{filtered.length === 0 && <div className="empty-results"><Sparkles/><h3>No fragrances found</h3><p>Try another name or category.</p><Button variant="outline" onClick={() => { setSearch(''); setCategory('All fragrances'); setOnlyFavorites(false); }}>View all fragrances</Button></div>}<div className="collection-end"><span/> <span>YOUR NEXT SIGNATURE SCENT AWAITS</span> <span/></div></section>
      <section className="about-band" id="about"><div className="section-wrap about-inner reveal"><div><div className="eyebrow">THE ORO PROMISE</div><h2>More than a fragrance.<br/><em>A feeling that stays.</em></h2><p>We believe the most beautiful luxury is personal. From the first note to the last impression, our collection celebrates the art of finding your signature.</p></div><div className="promise-grid">{[[ShieldCheck,'Authenticity, always.','100% authentic fragrances, selected with care.'],[Truck,'From us to your doorstep.','Delivery within Nador only.'],[Wallet,'Your comfort comes first.','Cash on delivery. Simple, secure, effortless.'],[MessageCircle,'A personal touch.','Real people. Thoughtful advice. Just a message away.']].map(([Icon, title, text]) => { const FeatureIcon = Icon as typeof ShieldCheck; return <div className="promise" key={String(title)}><FeatureIcon size={25} strokeWidth={1.2}/><h3>{String(title)}</h3><p>{String(text)}</p></div>; })}</div></div></section>
    </main>
    <footer id="contact"><div className="section-wrap footer-inner"><div><Brand/><p>A scent. A signature. A story only you can tell.</p></div><div className="footer-links"><span className="eyebrow">EXPLORE</span><a href="#perfumes">The collection</a><a href="#offers">Special offers</a><a href="#about">Our story</a></div><div className="footer-links"><span className="eyebrow">LET’S CONNECT</span><Button variant="link" onClick={contact}>WhatsApp <ArrowUpRight size={14}/></Button>{INSTAGRAM_URL ? <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={14}/></a> : <span className="social-pending">Instagram · Coming soon</span>}<span>Nador, Morocco</span></div></div><div className="section-wrap footer-bottom"><span>© {new Date().getFullYear()} ORO PARFUME. All rights reserved.</span><span>Made for lasting impressions. <span className="little-star">✦</span></span></div></footer>
    <Button className="floating-whatsapp" onClick={contact} aria-label="Contact ORO on WhatsApp"><MessageCircle size={25}/></Button>
    <div className={`toast ${notice ? 'toast-visible' : ''} ${notice.includes('added to your bag') ? 'toast-success' : ''}`} role="status">{notice && <><Check size={17}/>{notice}<Button variant="link" onClick={() => { setCartOpen(true); setCheckout(false); setNotice(''); }}>View bag</Button></>}</div>
    <Dialog.Root open={selectedOffer !== null} onOpenChange={open => !open && setSelectedOffer(null)}><Dialog.Portal><Dialog.Overlay className="panel-overlay"/><Dialog.Content className="panel product-panel offer-products-panel" aria-describedby={undefined}><div className="panel-heading"><div><Dialog.Title>{selectedOffer?.name ?? 'Offer products'}</Dialog.Title><p className="offer-picker-caption">Choose a fragrance from this offer</p></div><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close"><X/></Button></Dialog.Close></div><div className="offer-products-grid">{selectedOffer && productsForOffer(selectedOffer).map(product => <article className="offer-product-card" key={product.id}><a href={`/perfume/${encodeURIComponent(product.id)}`} onClick={() => setSelectedOffer(null)}><img src={resolveImage(productImages(product)[0])} alt={product.name}/></a><div className="offer-product-copy"><h3>{product.name}</h3><p>{product.family}</p><strong>{money(productPriceBreakdown(product, defaultProductSize(product)).current)}</strong><Button className="primary-cta" onClick={() => { add(product, defaultProductSize(product), 1, false, selectedOffer); setNotice(`${product.name} added from ${selectedOffer.name}`); setSelectedOffer(null); setCartOpen(true); setCheckout(false); }}>ADD TO BAG <ShoppingBag size={15}/></Button></div></article>)}{selectedOffer && productsForOffer(selectedOffer).length === 0 && <div className="offer-products-empty"><Sparkles/><p>No products are assigned to this offer yet.</p></div>}</div>{selectedOffer && productsForOffer(selectedOffer).length > 0 && <div className="offer-buy-actions"><p>All selected offer products will be added to your bag.</p><Button className="primary-cta" onClick={() => { const selectedProducts = productsForOffer(selectedOffer); setCart(current => { const next = [...current]; selectedProducts.forEach(product => { const selectedSize = defaultProductSize(product); const existingIndex = next.findIndex(item => item.id === product.id && item.size === selectedSize && item.offerId === selectedOffer.id); if (existingIndex >= 0) next[existingIndex] = { ...next[existingIndex], quantity: Math.min(99, next[existingIndex].quantity + 1) }; else next.push({ id: product.id, size: selectedSize, quantity: 1, offerId: selectedOffer.id, offerName: selectedOffer.name }); }); return next; }); setNotice(`${selectedOffer.name} added to your bag`); setSelectedOffer(null); setCheckout(true); setCartOpen(true); }}>BUY OFFER NOW <ShoppingBag size={16}/></Button></div>}</Dialog.Content></Dialog.Portal></Dialog.Root>
    <Panel open={selected !== null} onOpenChange={open => { if (!open) closeProduct(); }} title={selected?.name ?? 'Fragrance details'}>{selected && <div className="product-detail"><img src={resolveImage(selected.image)} alt={selected.name} width="512" height="512"/><div><span className="eyebrow">{selected.category} · EAU DE PARFUM</span><h2>{selected.name}</h2>{(selected.display ?? DEFAULT_PRODUCT_DISPLAY).showDescription && <p className="detail-description">{selected.description}</p>}{(selected.display ?? DEFAULT_PRODUCT_DISPLAY).showPrice && <div className="detail-price-row">{selected.discount > 0 && <s className="original-price">{money(productPriceBreakdown(selected, size).original)}</s>}<strong className="detail-price">{money(productPriceBreakdown(selected, size).current)}</strong></div>}{(selected.display ?? DEFAULT_PRODUCT_DISPLAY).showSize && <><label className="field-label">Size</label><div className="size-options">{(selected.display?.sizes ?? DEFAULT_PRODUCT_DISPLAY.sizes).map(v => <Button variant="outline" className={size === v ? 'selected-size' : ''} key={v} onClick={() => setSize(v)}>{v} ml</Button>)}</div></>}<div className="char-badges">{selected.characteristics.map(c => <CharBadge key={c.label} characteristic={c} />)}</div><FragranceProfile product={selected}/><div className="detail-purchase"><div className="quantity-control"><Button variant="ghost" size="icon" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(q => q - 1)}><Minus/></Button><span>{quantity}</span><Button variant="ghost" size="icon" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => setQuantity(q => q + 1)}><Plus/></Button></div></div><div className="detail-actions"><Button className="primary-cta w-full" onClick={() => { add(selected, size, quantity, false); setNotice(`${selected.name} has been added to your bag`); closeProduct(); setCheckout(false); setCartOpen(true); }}>ORDER NOW <ShoppingBag size={17}/></Button><Button variant="outline" className="w-full" onClick={() => void shareProduct(selected)}><Share2 size={17}/> SHARE THIS FRAGRANCE</Button></div></div></div>}</Panel>
    <Panel open={cartOpen} onOpenChange={setCartOpen} title={checkout ? 'Your delivery details' : `Your bag (${count})`} drawer><div className="cart-body">{cart.length === 0 ? <div className="empty-bag"><ShoppingBag size={40} strokeWidth={1}/><h3>A little luxury awaits.</h3><p>Your bag is waiting for its first signature scent.</p><Button className="primary-cta" onClick={() => setCartOpen(false)}>EXPLORE THE COLLECTION<ArrowRight/></Button></div> : <>{checkout && <Button variant="link" className="back-to-bag" onClick={() => setCheckout(false)}>← Back to bag</Button>}<div className="cart-items">{cart.map(item => { const p = ALL_PRODUCTS.find(p => p.id === item.id); if (!p) return null; return <div className="cart-item" key={`${item.id}-${item.size}-${item.offerId ?? 'direct'}`}><img src={resolveImage(p.image)} alt={p.name} width="96" height="110"/><div><h3>{p.name}</h3><p>{item.size} ml · {p.category}</p>{item.offerName && <p className="cart-item-offer">🎁 From offer: {item.offerName}</p>}<strong>{money(Math.round(unitPrice(p, item.size) * (1 - p.discount / 100)) * item.quantity)}</strong><div className="cart-item-controls"><div className="quantity-control"><Button variant="ghost" size="icon" aria-label={`Decrease ${p.name} quantity`} onClick={() => update(item.id, item.size, -1, item.offerId)}><Minus/></Button><span>{item.quantity}</span><Button variant="ghost" size="icon" aria-label={`Increase ${p.name} quantity`} onClick={() => update(item.id, item.size, 1, item.offerId)}><Plus/></Button></div><Button variant="outline" className="remove-item-button" onClick={() => setCart(current => current.filter(c => !(c.id === item.id && c.size === item.size && c.offerId === item.offerId)))}><Trash2 size={14}/> Remove</Button></div></div></div>; })}</div><div className="cart-totals"><div><span>Subtotal</span><span>{money(total.subtotal)}</span></div><div><span>Fragrance savings</span><span>−{money(total.productDiscount)}</span></div>{total.bundleDiscount > 0 && <div><span>Buy 2, get 1 free</span><span>−{money(total.bundleDiscount)}</span></div>}<div className="total-line"><strong>Total</strong><strong>{money(total.total)}</strong></div><p>Delivery in Nador only · fee confirmed on WhatsApp.</p></div>{checkout ? <form onSubmit={submit} className="checkout-form">{([['name','Full name','text'],['phone','Phone number','tel'],['address','Delivery address','text']] as const).map(([name, label, type]) => <label key={name}>{label}<input name={name} type={type} required minLength={name === 'phone' ? 8 : 2} autoComplete={{name:'name',phone:'tel',address:'street-address'}[name]} maxLength={200}/></label>)}<label>Delivery city<select name="city" defaultValue={DELIVERY_CITY} required><option value={DELIVERY_CITY}>Nador only</option></select></label><p>Payment: cash on delivery or as agreed on WhatsApp. Delivery is available in Nador only.</p><Button type="submit" className="primary-cta w-full"><MessageCircle/> SEND ORDER ON WHATSAPP</Button></form> : <Button className="primary-cta w-full" onClick={() => setCheckout(true)}><MessageCircle/> ORDER NOW<ArrowRight/></Button>}<div className="secure-note"><ShieldCheck size={15}/> Personal service. No online payment required.</div></>}</div></Panel>
    <Panel open={setup} onOpenChange={setSetup} title="WhatsApp ordering opens soon"><div className="setup-message"><MessageCircle size={32}/><p>Our WhatsApp number is not connected yet. Your bag is saved and ready for when ordering opens.</p><Button variant="outline" onClick={() => setSetup(false)}>Continue exploring</Button></div></Panel>
  </>;
}
