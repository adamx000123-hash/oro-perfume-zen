import { describe, it, expect } from 'vitest';
import { PRODUCTS, totals, orderMessage } from '@/lib/catalog';

describe('ORO shopping rules', () => {
  it('applies the displayed 30% fragrance discount in MAD', () => {
    expect(PRODUCTS.find(p => p.id === 'noir')?.discount).toBe(30);
    expect(totals([{ id: 'noir', size: 100, quantity: 1 }])).toMatchObject({ subtotal: 690, discount: 207, total: 483 });
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
  it('returns zero for an empty bag', () => { expect(totals([]).total).toBe(0); });
});