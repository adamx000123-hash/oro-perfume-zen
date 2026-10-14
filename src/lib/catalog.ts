import noir from '@/assets/noir.jpg';
import rose from '@/assets/rose.jpg';
import ambre from '@/assets/ambre.jpg';
import vert from '@/assets/vert.jpg';

// STORE SETTINGS — replace with your WhatsApp Business number, digits only.
// Leave empty until configured: checkout will never send to an invented number.
export const WHATSAPP_NUMBER = '';
export const INSTAGRAM_URL = '';
export const OFFER_END = '2026-11-01T00:00:00Z';
// All sample products and offers live in this one editable array. Prices are MAD.
export const CATALOG = [
  { type: 'product', id: 'noir', name: 'Noir Absolu', category: 'Men', family: 'Woody · Intense', price: 690, discount: 30, image: noir, notes: ['Bergamot, black pepper', 'Iris, cedarwood', 'Amber, leather, musk'] },
  { type: 'product', id: 'rose', name: 'Rose Éternelle', category: 'Women', family: 'Floral · Delicate', price: 590, discount: 0, image: rose, notes: ['Lychee, pink pepper', 'Damask rose, peony', 'White musk, vanilla'] },
  { type: 'product', id: 'ambre', name: 'Ambre Royal', category: 'Unisex', family: 'Oriental · Warm', price: 790, discount: 30, image: ambre, notes: ['Saffron, mandarin', 'Amber, jasmine', 'Oud, sandalwood, vanilla'] },
  { type: 'product', id: 'vert', name: 'Bois de Lumière', category: 'Unisex', family: 'Fresh · Woody', price: 650, discount: 0, image: vert, notes: ['Bergamot, lemon', 'Vetiver, green tea', 'Cedarwood, white musk'] },
  { type: 'product', id: 'velours', name: 'Velours de Nuit', category: 'Women', family: 'Floral · Sensual', price: 720, discount: 0, image: rose, notes: ['Blackcurrant, pear', 'Jasmine, orange blossom', 'Patchouli, vanilla'] },
  { type: 'product', id: 'oud', name: 'Oud Impérial', category: 'Men', family: 'Woody · Spiced', price: 890, discount: 0, image: noir, notes: ['Cardamom, saffron', 'Oud, rose', 'Leather, sandalwood'] },
  { type: 'product', id: 'soleil', name: 'Soleil Doré', category: 'Unisex', family: 'Amber · Radiant', price: 620, discount: 0, image: ambre, notes: ['Neroli, mandarin', 'Ylang-ylang, jasmine', 'Amber, vanilla'] },
  { type: 'product', id: 'jardin', name: 'Jardin Secret', category: 'Women', family: 'Fresh · Floral', price: 560, discount: 0, image: vert, notes: ['Green apple, bergamot', 'Lily, magnolia', 'Musk, cedar'] },
  { type: 'offer', id: 'signature', name: 'Your signature, for less.', description: '30% off selected fragrances', kind: 'percentage' },
  { type: 'offer', id: 'trio', name: 'Good things come in threes.', description: 'Buy 2, get your third fragrance free', kind: 'bundle' },
  { type: 'offer', id: 'moment', name: 'A little luxury. A limited moment.', description: 'The signature selection · Until 31 October', kind: 'limited' },
] as const;
export const PRODUCTS = CATALOG.filter(item => item.type === 'product');
export const OFFERS = CATALOG.filter(item => item.type === 'offer');
export type Product = typeof PRODUCTS[number];
export type CartItem = { id: string; size: number; quantity: number };
export const money = (value: number) => `${Math.round(value).toLocaleString('en-US')} MAD`;
export function unitPrice(product: Product, size: number) { return Math.round(product.price * (size === 50 ? 0.65 : 1)); }
export function totals(cart: CartItem[]) {
  let subtotal = 0, productDiscount = 0;
  const eligible: number[] = [];
  cart.forEach(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    if (!product) return;
    const price = unitPrice(product, item.size);
    const net = Math.round(price * (1 - product.discount / 100));
    subtotal += price * item.quantity;
    productDiscount += (price - net) * item.quantity;
    for (let i = 0; i < item.quantity; i++) eligible.push(net);
  });
  eligible.sort((a, b) => a - b);
  const bundleDiscount = eligible.slice(0, Math.floor(eligible.length / 3)).reduce((a, b) => a + b, 0);
  const discount = productDiscount + bundleDiscount;
  return { subtotal, productDiscount, bundleDiscount, discount, total: subtotal - discount };
}
export function orderMessage(cart: CartItem[], customer: { name: string; phone: string; city: string; address: string }) {
  const total = totals(cart);
  return ['ORO PARFUME — New order', '', ...cart.map(item => {
    const p = PRODUCTS.find(product => product.id === item.id);
    return p ? `${p.name} · ${item.size} ml × ${item.quantity} — ${money(Math.round(unitPrice(p, item.size) * (1 - p.discount / 100)) * item.quantity)}` : '';
  }), '', `Subtotal: ${money(total.subtotal)}`, `Discount: ${money(total.discount)}`, `Total: ${money(total.total)}`, 'Delivery fee: to be confirmed on WhatsApp', '', `Full name: ${customer.name}`, `Phone: ${customer.phone}`, `City: ${customer.city}`, `Address: ${customer.address}`, '', 'Payment: cash on delivery or as agreed on WhatsApp. Please confirm availability and delivery.'].join('\n');
}