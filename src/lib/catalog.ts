import noir from '@/assets/noir.jpg';
import rose from '@/assets/rose.jpg';
import ambre from '@/assets/ambre.jpg';
import vert from '@/assets/vert.jpg';

// STORE SETTINGS — replace with your WhatsApp Business number, digits only.
// Leave empty until configured: checkout will never send to an invented number.
export const WHATSAPP_NUMBER = '';
export const INSTAGRAM_URL = '';
export const OFFER_END = '2026-11-01T00:00:00Z';
export const DELIVERY_CITY = 'Nador';
export const PRODUCT_HASH_PREFIX = '#perfume/';
export const productHash = (id: string) => `${PRODUCT_HASH_PREFIX}${encodeURIComponent(id)}`;

// Fragrance characteristic badges. Icons are Lucide icon names; unknown values fall back to Sparkles.
export type Characteristic = { label: string; icon: string };
export const CHARACTERISTIC_OPTIONS: Characteristic[] = [
  { label: 'Summer', icon: 'sun' },
  { label: 'Winter', icon: 'snowflake' },
  { label: 'Daytime', icon: 'sunrise' },
  { label: 'Evening', icon: 'moon-star' },
  { label: 'Office', icon: 'briefcase' },
  { label: 'Occasion', icon: 'gem' },
  { label: 'Floral', icon: 'flower-2' },
  { label: 'Woody', icon: 'tree-pine' },
  { label: 'Fresh', icon: 'sparkles' },
  { label: 'Oriental', icon: 'flame' },
  { label: 'Citrus', icon: 'citrus' },
  { label: 'Sweet', icon: 'candy' },
];
export const CHARACTERISTIC_LABELS = CHARACTERISTIC_OPTIONS.map(c => c.label);

// All sample products and offers live in this one editable array. Prices are MAD.
export const CATALOG = [
  { type: 'product', id: 'noir', name: 'Noir Absolu', category: 'Men', family: 'Woody · Intense', price: 690, discount: 30, image: noir, description: 'A deep, confident woody scent for evenings that matter.', characteristics: [{ label: 'Evening', icon: 'moon-star' }, { label: 'Winter', icon: 'snowflake' }, { label: 'Woody', icon: 'tree-pine' }, { label: 'Occasion', icon: 'gem' }] },
  { type: 'product', id: 'rose', name: 'Rose Éternelle', category: 'Women', family: 'Floral · Delicate', price: 590, discount: 0, image: rose, description: 'A soft, romantic floral that feels fresh all day.', characteristics: [{ label: 'Floral', icon: 'flower-2' }, { label: 'Daytime', icon: 'sunrise' }, { label: 'Sweet', icon: 'candy' }] },
  { type: 'product', id: 'ambre', name: 'Ambre Royal', category: 'Unisex', family: 'Oriental · Warm', price: 790, discount: 30, image: ambre, description: 'A warm oriental embrace, rich and unforgettable.', characteristics: [{ label: 'Oriental', icon: 'flame' }, { label: 'Evening', icon: 'moon-star' }, { label: 'Occasion', icon: 'gem' }] },
  { type: 'product', id: 'vert', name: 'Bois de Lumière', category: 'Unisex', family: 'Fresh · Woody', price: 650, discount: 0, image: vert, description: 'A bright, clean freshness made for everyday wear.', characteristics: [{ label: 'Fresh', icon: 'sparkles' }, { label: 'Summer', icon: 'sun' }, { label: 'Office', icon: 'briefcase' }, { label: 'Citrus', icon: 'citrus' }] },
  { type: 'product', id: 'velours', name: 'Velours de Nuit', category: 'Women', family: 'Floral · Sensual', price: 720, discount: 0, image: rose, description: 'A sensual floral wrapped in soft evening warmth.', characteristics: [{ label: 'Floral', icon: 'flower-2' }, { label: 'Evening', icon: 'moon-star' }, { label: 'Sweet', icon: 'candy' }] },
  { type: 'product', id: 'oud', name: 'Oud Impérial', category: 'Men', family: 'Woody · Spiced', price: 890, discount: 0, image: noir, description: 'A majestic spiced oud for truly grand entrances.', characteristics: [{ label: 'Oriental', icon: 'flame' }, { label: 'Woody', icon: 'tree-pine' }, { label: 'Occasion', icon: 'gem' }, { label: 'Winter', icon: 'snowflake' }] },
  { type: 'product', id: 'soleil', name: 'Soleil Doré', category: 'Unisex', family: 'Amber · Radiant', price: 620, discount: 0, image: ambre, description: 'A radiant amber glow, warm as afternoon sun.', characteristics: [{ label: 'Summer', icon: 'sun' }, { label: 'Daytime', icon: 'sunrise' }, { label: 'Sweet', icon: 'candy' }] },
  { type: 'product', id: 'jardin', name: 'Jardin Secret', category: 'Women', family: 'Fresh · Floral', price: 560, discount: 0, image: vert, description: 'A secret garden of crisp, green floral freshness.', characteristics: [{ label: 'Fresh', icon: 'sparkles' }, { label: 'Floral', icon: 'flower-2' }, { label: 'Summer', icon: 'sun' }] },
  { type: 'offer', id: 'signature', name: 'Your signature, for less.', description: '30% off selected fragrances', kind: 'percentage' },
  { type: 'offer', id: 'trio', name: 'Good things come in threes.', description: 'Buy 2, get your third fragrance free', kind: 'bundle' },
  { type: 'offer', id: 'moment', name: 'A little luxury. A limited moment.', description: 'The signature selection · Until 31 October', kind: 'limited' },
] as const;
export type Product = { id: string; name: string; category: string; family: string; price: number; discount: number; image: string; description: string; characteristics: readonly Characteristic[] };
export type Offer = { id: string; label: string; name: string; description: string; kind: 'percentage' | 'bundle' | 'limited' };
export type StoreSettings = { whatsappNumber: string; instagramUrl: string; offerEnd: string };
export type StoreData = { products: Product[]; offers: Offer[]; settings: StoreSettings };
// Bundled photos can be referenced by key from the admin dashboard; other values are uploaded image URLs.
export const BUILT_IN_IMAGES: Record<string, string> = { noir, rose, ambre, vert };
export const resolveImage = (value: string) => BUILT_IN_IMAGES[value] ?? value;
export const PRODUCTS: Product[] = CATALOG.filter(item => item.type === 'product');
const OFFER_LABELS = ['THE SIGNATURE EDIT', 'THE PERFECT TRIO', 'ONLY FOR A MOMENT'];
export const OFFERS: Offer[] = CATALOG.filter(item => item.type === 'offer').map((o, i) => ({ id: o.id, label: OFFER_LABELS[i] ?? '', name: o.name, description: o.description, kind: o.kind }));
export const FALLBACK_STORE: StoreData = { products: PRODUCTS, offers: OFFERS, settings: { whatsappNumber: WHATSAPP_NUMBER, instagramUrl: INSTAGRAM_URL, offerEnd: OFFER_END } };
export type CartItem = { id: string; size: number; quantity: number };
export const money = (value: number) => `${Math.round(value).toLocaleString('en-US')} MAD`;
export function unitPrice(product: Product, size: number) { return Math.round(product.price * (size === 50 ? 0.65 : 1)); }
export function totals(cart: CartItem[], products: Product[] = PRODUCTS, bundleActive = true) {
  let subtotal = 0, productDiscount = 0;
  const eligible: number[] = [];
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;
    const price = unitPrice(product, item.size);
    const net = Math.round(price * (1 - product.discount / 100));
    subtotal += price * item.quantity;
    productDiscount += (price - net) * item.quantity;
    for (let i = 0; i < item.quantity; i++) eligible.push(net);
  });
  eligible.sort((a, b) => a - b);
  const bundleDiscount = !bundleActive ? 0 : eligible.slice(0, Math.floor(eligible.length / 3)).reduce((a, b) => a + b, 0);
  const discount = productDiscount + bundleDiscount;
  return { subtotal, productDiscount, bundleDiscount, discount, total: subtotal - discount };
}
export function orderMessage(cart: CartItem[], customer: { name: string; phone: string; city: string; address: string }, products: Product[] = PRODUCTS, bundleActive = true) {
  const total = totals(cart, products, bundleActive);
  return ['ORO PARFUME — New order', '', ...cart.map(item => {
    const p = products.find(product => product.id === item.id);
    return p ? `${p.name} · ${item.size} ml × ${item.quantity} — ${money(Math.round(unitPrice(p, item.size) * (1 - p.discount / 100)) * item.quantity)}` : '';
  }), '', `Subtotal: ${money(total.subtotal)}`, `Discount: ${money(total.discount)}`, `Total: ${money(total.total)}`, 'Delivery area: Nador only — fee confirmed on WhatsApp', '', `Full name: ${customer.name}`, `Phone: ${customer.phone}`, `City: ${customer.city}`, `Address: ${customer.address}`, '', 'Payment: cash on delivery or as agreed on WhatsApp. Delivery is available in Nador only.'].join('\n');
}
