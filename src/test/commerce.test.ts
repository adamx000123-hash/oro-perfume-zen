import { describe, it, expect } from 'vitest';
import { PRODUCTS, productHash, totals, orderMessage, productPriceBreakdown, defaultProductSize, isNewProduct, NEW_PRODUCT_WINDOW_MS, shopProducts } from '@/lib/catalog';

describe('ORO shopping rules', () => {
  it('keeps offer-only products out of the normal collection', () => {
    const normal = PRODUCTS[0];
    const offerOnly = { ...normal, id: 'offer-only-test', listing_type: 'offer' as const };
    expect(shopProducts([normal, offerOnly]).map(product => product.id)).toEqual([normal.id]);
  });
  it('marks a product as new for exactly seven days after creation', () => {
    const now = Date.parse('2026-10-20T12:00:00.000Z');
    expect(isNewProduct(new Date(now - NEW_PRODUCT_WINDOW_MS + 1).toISOString(), now)).toBe(true);
    expect(isNewProduct(new Date(now - NEW_PRODUCT_WINDOW_MS).toISOString(), now)).toBe(false);
    expect(isNewProduct(new Date(now + 1).toISOString(), now)).toBe(false);
    expect(isNewProduct(undefined, now)).toBe(false);
  });
  it('applies the displayed 30% fragrance discount in MAD', () => {
    expect(PRODUCTS.find(p => p.id === 'noir')?.discount).toBe(30);
    expect(totals([{ id: 'noir', size: 100, quantity: 1 }])).toMatchObject({ subtotal: 690, discount: 207, total: 483 });
  });
  it('uses the same default-size price on product cards and details, showing a consistent discount', () => {
    const noir = PRODUCTS.find(product => product.id === 'noir')!;
    const size = defaultProductSize(noir);
    expect(size).toBe(50);
    expect(productPriceBreakdown(noir, size)).toEqual({ original: 449, current: 314 });
    expect(productPriceBreakdown(noir, 100)).toEqual({ original: 690, current: 483 });
  });
  it('makes the cheapest of every three fragrances free', () => {
    expect(totals([{ id: 'rose', size: 100, quantity: 2 }, { id: 'vert', size: 100, quantity: 1 }])).toMatchObject({ subtotal: 1830, bundleDiscount: 590, total: 1240 });
  });
  it('combines product savings and bundle savings without negative totals', () => {
    expect(totals([{ id: 'noir', size: 100, quantity: 3 }])).toMatchObject({ subtotal: 2070, productDiscount: 621, bundleDiscount: 483, total: 966 });
  });
  it('includes product quantities prices total and every customer field in WhatsApp order', () => {
    const message = orderMessage([{ id: 'rose', size: 100, quantity: 2 }], { name: 'Test Customer', phone: '0612345678', city: 'Nador', address: '12 Test Street' });
    for (const value of ['Rose Éternelle · 100 ml × 2 — 1,180 MAD', 'Total: 1,180 MAD', 'Full name: Test Customer', 'Phone: 0612345678', 'City: Nador', 'Address: 12 Test Street', 'cash on delivery', 'Nador only']) expect(message).toContain(value);
  });
  it('identifies the originating offer for products added from an offer banner', () => {
    const message = orderMessage([{ id: 'noir', size: 50, quantity: 1, offerId: 'summer-offer', offerName: 'Summer Signature Offer' }], { name: 'Test Customer', phone: '0612345678', city: 'Nador', address: '12 Test Street' });
    expect(message).toContain('Noir Absolu · 50 ml × 1');
    expect(message).toContain('Offer: Summer Signature Offer');
    expect(message).toContain('💰 *Total: 314 MAD*');
    expect(message).not.toContain('https://oro-perfume-zen.lovable.app/perfume/noir');
  });
  it('formats WhatsApp orders with product links, totals, customer details and clear emoji labels', () => {
    const message = orderMessage([{ id: 'noir', size: 50, quantity: 1 }], { name: 'Test Customer', phone: '0612345678', city: 'Nador', address: '12 Test Street' });
    for (const value of ['🛍️ *ORO PARFUME — New order*', 'Noir Absolu · 50 ml × 1', 'https://oro-perfume-zen.lovable.app/perfume/noir', '✅ *Total:', '🧑 Full name: Test Customer', '📱 Phone: 0612345678', '🏠 Address: 12 Test Street']) expect(message).toContain(value);
  });
  it('creates a shareable product hash for every fragrance id', () => { expect(productHash('rose')).toBe('#perfume/rose'); expect(PRODUCTS.every(product => productHash(product.id).startsWith('#perfume/'))).toBe(true); });
  it('returns zero for an empty bag', () => { expect(totals([]).total).toBe(0); });
});