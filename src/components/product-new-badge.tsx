import { useEffect, useState } from 'react';
import { isNewProduct, NEW_PRODUCT_WINDOW_MS } from '@/lib/catalog';

export function ProductNewBadge({ createdAt }: { createdAt?: string }) {
  const [visible, setVisible] = useState(() => isNewProduct(createdAt));
  useEffect(() => {
    if (!createdAt) { setVisible(false); return; }
    const created = Date.parse(createdAt);
    const remaining = created + NEW_PRODUCT_WINDOW_MS - Date.now();
    if (!Number.isFinite(created) || remaining <= 0) { setVisible(false); return; }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, [createdAt]);
  return visible && isNewProduct(createdAt) ? <span className="new-product-badge">NEW</span> : null;
}
