import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { FALLBACK_STORE, parseFragranceProfile, parseProductPresentation, type Offer, type StoreData } from '@/lib/catalog';

const EMPTY_STORE: StoreData = { products: [], offers: [], settings: FALLBACK_STORE.settings };
const productionStore = () => process.env['VERCEL'] === '1' || process.env['NODE_ENV'] === 'production';

// Public read of the catalog managed from the admin dashboard. Falls back to the built-in catalog.
export const getStoreData = createServerFn({ method: 'GET' }).handler(async (): Promise<StoreData> => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  const url = process.env['SUPABASE_URL'];
  if (!key || !url) {
    console.error('[Store data] Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY. Configure them in Vercel.');
    return productionStore() ? EMPTY_STORE : FALLBACK_STORE;
  }
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
      h.set('apikey', key);
      return fetch(input, { ...init, headers: h });
    } },
  });
  try {
    const productsWithListingType = await db.from('products').select('id,name,category,family,price,discount,image,images,description,notes,characteristics,main_accords,when_to_wear,created_at,listing_type').eq('visible', true).order('sort').order('created_at');
    const productsWithGallery = productsWithListingType.error && /listing_type|column|schema cache/i.test(productsWithListingType.error.message)
      ? await db.from('products').select('id,name,category,family,price,discount,image,images,description,notes,characteristics,main_accords,when_to_wear,created_at').eq('visible', true).order('sort').order('created_at')
      : productsWithListingType;
    // Keep the shop usable while an existing Supabase project is waiting for a gallery migration.
    const productsWithoutGallery = productsWithGallery.error
      ? await db.from('products').select('id,name,category,family,price,discount,image,description,notes,characteristics,main_accords,when_to_wear,created_at,listing_type').eq('visible', true).order('sort').order('created_at')
      : productsWithGallery;
    const products = productsWithoutGallery.error && /listing_type|column|schema cache/i.test(productsWithoutGallery.error.message)
      ? await db.from('products').select('id,name,category,family,price,discount,image,description,notes,characteristics,main_accords,when_to_wear,created_at').eq('visible', true).order('sort').order('created_at')
      : productsWithoutGallery;
    const [offersWithProducts, settings] = await Promise.all([
      db.from('offers').select('id,label,name,description,kind,images,product_ids').eq('active', true).order('sort').order('created_at'),
      db.from('site_settings').select('whatsapp_number,instagram_url,offer_end').eq('id', 1).maybeSingle(),
    ]);
    const offersWithImages = offersWithProducts.error && /product_ids|column|schema cache/i.test(offersWithProducts.error.message)
      ? await db.from('offers').select('id,label,name,description,kind,images').eq('active', true).order('sort').order('created_at')
      : offersWithProducts;
    const offers = offersWithImages.error && /images|column|schema cache/i.test(offersWithImages.error.message)
      ? await db.from('offers').select('id,label,name,description,kind').eq('active', true).order('sort').order('created_at')
      : offersWithImages;
    if (products.error || offers.error || settings.error) throw products.error ?? offers.error ?? settings.error;
    return {
      products: (products.data ?? []).map(row => { const presentation = parseProductPresentation(row.characteristics); return { ...row, listing_type: 'listing_type' in row && row.listing_type === 'offer' ? 'offer' : 'product', ...presentation, images: presentation.images?.length ? presentation.images : row.images?.length ? row.images : [row.image], ...parseFragranceProfile(row.main_accords, row.when_to_wear) }; }) as StoreData['products'],
      offers: (offers.data ?? []).map(row => ({ ...row, images: 'images' in row && Array.isArray(row.images) ? row.images : [], product_ids: 'product_ids' in row && Array.isArray(row.product_ids) ? row.product_ids : [] })) as Offer[],
      settings: settings.data ? { whatsappNumber: settings.data.whatsapp_number.replace(/\D/g, ''), instagramUrl: settings.data.instagram_url, offerEnd: settings.data.offer_end } : FALLBACK_STORE.settings,
    };
  } catch (error) {
    console.error('Store data unavailable', error);
    return productionStore() ? EMPTY_STORE : FALLBACK_STORE;
  }
});
