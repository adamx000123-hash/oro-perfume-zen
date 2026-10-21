import { createFileRoute } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FragranceProfileEditor } from '@/components/fragrance-profile-editor';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/admin';
import { BUILT_IN_IMAGES, CHARACTERISTIC_OPTIONS, DEFAULT_PRODUCT_DISPLAY, parseFragranceProfile, parseProductPresentation, resolveImage, serializeProductPresentation, validateFragranceProfile, type Characteristic, type FragranceProfile, type ProductDisplay } from '@/lib/catalog';

export const Route = createFileRoute('/_authenticated/admin/offers')({ head: () => ({ meta: [{ title: 'Offers — ORO PARFUME Admin' }, { name: 'description', content: 'Manage ORO PARFUME fragrance offers.' }, { property: 'og:title', content: 'Offers — ORO PARFUME Admin' }, { property: 'og:description', content: 'Manage fragrance offers.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: Offers });

type GiftProduct = FragranceProfile & { id: string; offer_id?: string; name: string; category: string; family: string; price: number; discount: number; image: string; images: string[]; description: string; notes: string[]; characteristics: Characteristic[]; display: ProductDisplay; sort: number; created_at?: string };
type Offer = { id: string; label: string; name: string; description: string; kind: 'percentage' | 'bundle' | 'limited'; active: boolean; sort: number; images: string[]; product_ids: string[]; gift_products: GiftProduct[] };
type ProductChoice = { id: string; name: string; image: string; price: number; discount: number; visible: boolean };
const emptyGift: GiftProduct = { id: '', name: '', category: 'Unisex', family: '', price: 0, discount: 0, image: 'noir', images: ['noir'], description: '', notes: ['', '', ''], characteristics: [], display: DEFAULT_PRODUCT_DISPLAY, mainAccords: [], whenToWear: {}, sort: 0 };
const empty: Offer = { id: '', label: '', name: '', description: '', kind: 'percentage', active: true, sort: 0, images: [], product_ids: [], gift_products: [] };
const missingGiftTable = 'Gift products are not enabled in the database yet. Run drizzle/migrations/0007_offer_gift_products.sql in Supabase → SQL Editor, then reload this page.';

function mapGift(row: Record<string, unknown>): GiftProduct {
  const presentation = parseProductPresentation(row.characteristics);
  return { ...row, id: String(row.id), offer_id: String(row.offer_id), image: String(row.image ?? ''), images: presentation.images?.length ? presentation.images : Array.isArray(row.images) ? row.images as string[] : [String(row.image ?? '')], ...presentation, ...parseFragranceProfile(row.main_accords, row.when_to_wear) } as GiftProduct;
}

function Offers() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Offer | null>(null);
  const [giftEditing, setGiftEditing] = useState<GiftProduct | null>(null);
  const [error, setError] = useState('');
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [giftUploading, setGiftUploading] = useState(false);
  const { data: offers = [] } = useQuery({ queryKey: ['admin', 'offers'], queryFn: async () => {
    const { data, error } = await supabase.from('offers').select('*').order('sort').order('created_at');
    if (error) throw error;
    return (data ?? []).map(row => ({ ...row, images: row.images ?? [], product_ids: row.product_ids ?? [], gift_products: [] })) as Offer[];
  } });
  const { data: products = [] } = useQuery({ queryKey: ['admin', 'offer-products'], queryFn: async () => {
    const { data, error } = await supabase.from('products').select('id,name,image,price,discount,visible').order('sort').order('created_at');
    if (error) throw error;
    return (data ?? []) as ProductChoice[];
  } });
  const { data: giftProducts = [], error: giftQueryError, isLoading: giftProductsLoading } = useQuery({ queryKey: ['admin', 'offer-gift-products'], queryFn: async () => {
    const { data, error } = await supabase.from('offer_gift_products').select('*').order('sort').order('created_at');
    if (error) throw error;
    return (data ?? []).map(row => mapGift(row as unknown as Record<string, unknown>));
  } });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'offer-gift-products'] });
  };

  const save = useMutation({ mutationFn: async (o: Offer) => {
    const row = { label: o.label, name: o.name, description: o.description, kind: o.kind, active: o.active, sort: o.sort, images: o.images ?? [], product_ids: o.product_ids ?? [] };
    let offerId = o.id || crypto.randomUUID();
    if ((o.gift_products ?? []).length) {
      const { error } = await supabase.from('offer_gift_products').select('id').limit(1);
      if (error) throw new Error(/offer_gift_products|schema cache|does not exist|relation/i.test(error.message) ? missingGiftTable : error.message);
    }
    const { error: offerError } = await supabase.from('offers').upsert({ ...row, id: offerId });
    if (offerError) throw offerError;
    const giftRows = (o.gift_products ?? []).map(gift => {
      validateFragranceProfile(gift);
      const images = gift.images?.length ? gift.images : [gift.image];
      return { id: gift.id || crypto.randomUUID(), offer_id: offerId, name: gift.name, category: gift.category, family: gift.family, price: gift.price, discount: gift.discount, image: images[0], images, description: gift.description, notes: gift.notes, characteristics: serializeProductPresentation(gift.characteristics, gift.display, images), main_accords: gift.mainAccords, when_to_wear: gift.whenToWear, sort: gift.sort };
    });
    const { data: existingGifts, error: readError } = await supabase.from('offer_gift_products').select('id').eq('offer_id', offerId);
    if (readError) {
      const missingTable = /offer_gift_products|schema cache|does not exist|relation/i.test(readError.message);
      if (missingTable && giftRows.length === 0) return;
      throw new Error(missingTable ? missingGiftTable : readError.message);
    }
    if (giftRows.length) {
      const { error } = await supabase.from('offer_gift_products').upsert(giftRows);
      if (error) throw new Error(/offer_gift_products|schema cache|does not exist|relation/i.test(error.message) ? missingGiftTable : error.message);
    }
    const keptIds = new Set(giftRows.map(gift => gift.id));
    const staleIds = (existingGifts ?? []).map(gift => gift.id).filter(id => !keptIds.has(id));
    if (staleIds.length) {
      const { error } = await supabase.from('offer_gift_products').delete().eq('offer_id', offerId).in('id', staleIds);
      if (error) throw error;
    }
  }, onSuccess: () => { setEditing(null); setError(''); refresh(); }, onError: e => {
    const message = e instanceof Error ? e.message : String(e);
    setError(/offer_gift_products|schema cache|does not exist|relation/i.test(message) ? missingGiftTable : /images|product_ids|column/i.test(message) ? 'The database is missing a field required for offer images or products. Run migrations 0004_offer_images.sql and 0005_offer_products.sql in Supabase → SQL Editor.' : message);
  } });

  const remove = useMutation({ mutationFn: async (id: string) => {
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) throw error;
  }, onSuccess: refresh, onError: e => setError(e.message) });
  const toggle = useMutation({ mutationFn: async (o: Offer) => {
    const { error } = await supabase.from('offers').update({ active: !o.active }).eq('id', o.id);
    if (error) throw error;
  }, onSuccess: refresh });

  async function addImages(files: FileList | null) {
    if (!editing || !files?.length) return;
    setUploading(true); setError('');
    try {
      const uploaded = await Promise.all(Array.from(files).map(file => compressImage(file, 900)));
      setEditing(current => current ? { ...current, images: [...(current.images ?? []), ...uploaded] } : current);
    } catch { setError('Could not process one of the images. Please try another image.'); }
    finally { setUploading(false); }
  }
  async function addGiftImages(files: FileList | null) {
    if (!giftEditing || !files?.length) return;
    setGiftUploading(true); setError('');
    try {
      const uploaded = await Promise.all(Array.from(files).map(file => compressImage(file)));
      setGiftEditing(current => current ? { ...current, images: [...(current.images?.length ? current.images : [current.image]), ...uploaded] } : current);
    } catch { setError('Could not process one of the gift product photos. Please try another image.'); }
    finally { setGiftUploading(false); }
  }
  function removeBanner(index: number) { if (editing) setEditing({ ...editing, images: editing.images.filter((_, i) => i !== index) }); }
  function saveGift(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!giftEditing || !editing) return;
    const f = new FormData(e.currentTarget);
    const gift: GiftProduct = { ...giftEditing, name: String(f.get('gift-name')).trim(), category: String(f.get('gift-category') ?? giftEditing.category), family: String(f.get('gift-family') ?? ''), price: Number(f.get('gift-price') || 0), discount: Number(f.get('gift-discount') || 0), sort: Number(f.get('gift-sort') || 0), description: String(f.get('gift-description') ?? ''), notes: [String(f.get('gift-note-top') ?? ''), String(f.get('gift-note-heart') ?? ''), String(f.get('gift-note-base') ?? '')], image: giftEditing.images[0] ?? giftEditing.image, display: { ...giftEditing.display, sizes: (() => { const sizes = String(f.get('gift-sizes') ?? '').split(',').map(value => Number(value.trim())).filter(value => Number.isFinite(value) && value > 0); return sizes.length ? sizes : giftEditing.display.sizes; })() } };
    try { validateFragranceProfile(gift); }
    catch (e) { setError(e instanceof Error ? e.message : 'Check the fragrance profile.'); return; }
    setEditing({ ...editing, gift_products: giftEditing.id && editing.gift_products.some(item => item.id === giftEditing.id) ? editing.gift_products.map(item => item.id === gift.id ? gift : item) : [...editing.gift_products, gift] });
    setGiftEditing(null); setError('');
  }
  function toggleGiftCharacteristic(option: Characteristic) {
    if (!giftEditing) return;
    const has = giftEditing.characteristics.some(item => item.label === option.label);
    setGiftEditing({ ...giftEditing, characteristics: has ? giftEditing.characteristics.filter(item => item.label !== option.label) : [...giftEditing.characteristics, option] });
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!editing) return;
    const f = new FormData(e.currentTarget);
    const next = { ...editing, id: editing.id || crypto.randomUUID(), label: String(f.get('label')), name: String(f.get('name')), description: String(f.get('description')), kind: String(f.get('kind')) as Offer['kind'], sort: Number(f.get('sort') || 0) };
    setEditing(next);
    save.mutate(next);
  }

  return <div className="space-y-6">
    <div className="admin-page-heading flex items-center justify-between">
      <div><h1 className="font-serif text-4xl">Offers</h1><p className="text-muted-foreground">Turn offers on or off, edit them or add new ones.</p></div>
      <Button onClick={() => { setError(''); setProductPickerOpen(false); setEditing({ ...empty, sort: offers.length }); }}><Plus size={16} /> Add offer</Button>
    </div>
    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    {giftQueryError && <p className="text-sm text-destructive" role="alert">{missingGiftTable}</p>}
    <div className="space-y-3">{offers.map(o => <div key={o.id} className="admin-offer-row flex items-center gap-4 rounded-lg border bg-card p-4">
      {o.images?.[0] && <img src={o.images[0]} alt="" className="h-16 w-24 shrink-0 rounded object-cover" />}<div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-widest text-muted-foreground">{o.label} · {o.kind}</p><p className="font-medium">{o.name}</p><p className="text-sm text-muted-foreground">{o.description}</p></div>
      <Switch checked={o.active} onCheckedChange={() => toggle.mutate(o)} aria-label={`Activate ${o.name}`} />
      <Button variant="ghost" size="icon" onClick={() => { setError(''); setProductPickerOpen(false); setEditing({ ...o, gift_products: giftProducts.filter(gift => gift.offer_id === o.id) }); }} aria-label={`Edit ${o.name}`} disabled={giftProductsLoading}><Pencil size={15} /></Button>
      <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete "${o.name}"?`)) remove.mutate(o.id); }} aria-label={`Delete ${o.name}`}><Trash2 size={15} /></Button>
    </div>)}</div>

    <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
      <DialogContent className="admin-dialog-content max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{editing && offers.some(x => x.id === editing.id) ? 'Edit offer' : 'New offer'}</DialogTitle></DialogHeader>
        {editing && <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="label">Small label</Label><Input id="label" name="label" defaultValue={editing.label} placeholder="THE SIGNATURE EDIT" /></div>
          <div className="space-y-2"><Label htmlFor="name">Title</Label><Input id="name" name="name" defaultValue={editing.name} required /></div>
          <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={editing.description} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Type</Label><Select name="kind" defaultValue={editing.kind}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage discount</SelectItem><SelectItem value="bundle">Buy 2 get 1</SelectItem><SelectItem value="limited">Limited time</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="sort">Order</Label><Input id="sort" name="sort" type="number" defaultValue={editing.sort} /></div>
          </div>
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><Label>Products in this offer</Label><p className="mt-1 text-xs text-muted-foreground">Keep using this to add existing shop products to the offer.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setProductPickerOpen(open => !open)}><Plus size={15}/> Add products to offer</Button></div>
            <p className="text-xs text-muted-foreground">{editing.product_ids.length} existing product(s) selected</p>
            {productPickerOpen && (products.length === 0 ? <p className="text-xs text-muted-foreground">No shop products found yet.</p> : <div className="max-h-56 space-y-1 overflow-y-auto">{products.map(product => <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded px-2 py-2 hover:bg-muted/60"><input type="checkbox" checked={editing.product_ids.includes(product.id)} onChange={event => setEditing(current => current ? { ...current, product_ids: event.target.checked ? [...current.product_ids, product.id] : current.product_ids.filter(id => id !== product.id) } : current)} /><img src={resolveImage(product.image)} alt="" className="h-10 w-10 rounded object-cover"/><span className="min-w-0 flex-1 truncate text-sm">{product.name}</span><span className="text-right text-xs text-muted-foreground">{product.visible ? 'Visible' : 'Hidden'}</span></label>)}</div>)}
          </div>
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><Label>Gift products for this offer</Label><p className="mt-1 text-xs text-muted-foreground">These fragrances appear only after shoppers open this offer.</p></div><Button type="button" size="sm" onClick={() => { setError(''); setGiftEditing({ ...emptyGift, id: crypto.randomUUID(), sort: editing.gift_products.length }); }}><Plus size={15}/> Add gift product</Button></div>
            {editing.gift_products.length === 0 ? <p className="text-xs text-muted-foreground">No gift products added yet.</p> : <div className="space-y-2">{editing.gift_products.map(gift => <div key={gift.id} className="flex items-center gap-3 rounded border p-2"><img src={resolveImage(gift.images[0] ?? gift.image)} alt="" className="h-12 w-12 rounded object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{gift.name}</p><p className="text-xs text-muted-foreground">{gift.price} MAD · Gift in this offer</p></div><Button type="button" variant="outline" size="sm" onClick={() => { setError(''); setGiftEditing(gift); }}>Edit</Button><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${gift.name}`} onClick={() => setEditing(current => current ? { ...current, gift_products: current.gift_products.filter(item => item.id !== gift.id) } : current)}><Trash2 size={15}/></Button></div>)}</div>}
          </div>
          <div className="space-y-3 rounded-md border p-3">
            <div><Label htmlFor="offer-images">Offer banner images</Label><p className="mt-1 text-xs text-muted-foreground">Upload one or more images. Recommended: 16:9 (1600 × 900 px). Any dimensions are accepted.</p></div>
            {editing.images.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{editing.images.map((image, index) => <div key={`${index}-${image.slice(0, 32)}`} className="relative overflow-hidden rounded border bg-muted"><img src={image} alt={`Offer banner ${index + 1}`} className="aspect-video w-full object-cover"/><Button type="button" variant="destructive" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => removeBanner(index)} aria-label={`Remove banner image ${index + 1}`}><X size={14}/></Button></div>)}</div>}
            <Input id="offer-images" type="file" accept="image/*" multiple disabled={uploading} onChange={event => { void addImages(event.target.files); event.currentTarget.value = ''; }}/>
            {uploading && <p className="text-xs text-muted-foreground">Optimizing images…</p>}
          </div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={editing.active} onCheckedChange={value => setEditing({ ...editing, active: value })}/> Active in the shop</label>
          <Button type="submit" className="w-full" disabled={save.isPending || uploading || giftUploading}>{save.isPending ? 'Saving…' : 'Save offer'}</Button>
        </form>}
      </DialogContent>
    </Dialog>

    <Dialog open={!!giftEditing} onOpenChange={open => !open && setGiftEditing(null)}>
      <DialogContent className="admin-dialog-content max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{giftEditing && editing?.gift_products.some(gift => gift.id === giftEditing.id) ? 'Edit gift perfume' : 'New gift perfume'}</DialogTitle></DialogHeader>
        {giftEditing && <form onSubmit={saveGift} className="space-y-4">
          <div className="rounded-md border border-accent/40 bg-accent/5 p-3 text-sm">This perfume will be shown only inside <strong>{editing?.name || 'this offer'}</strong>, not in the main collection.</div>
          <div className="space-y-2"><Label htmlFor="gift-name">Name</Label><Input id="gift-name" name="gift-name" defaultValue={giftEditing.name} required/></div>
          <div className="space-y-2"><Label htmlFor="gift-description">Short description</Label><Textarea id="gift-description" name="gift-description" defaultValue={giftEditing.description} rows={2} maxLength={160} placeholder="A short, elegant description…"/></div>
          <div className="space-y-3"><Label>Notes</Label>{(['top','heart','base'] as const).map((part,index) => <div key={part} className="space-y-1"><Label htmlFor={`gift-note-${part}`} className="text-xs text-muted-foreground">{['Top notes','Heart notes','Base notes'][index]}</Label><Input id={`gift-note-${part}`} name={`gift-note-${part}`} defaultValue={giftEditing.notes[index] ?? ''} maxLength={120} placeholder="Leave empty if unavailable"/></div>)}</div>
          <div className="rounded-md border p-3 space-y-3"><p className="text-sm font-medium">Display information</p><label className="flex items-center justify-between gap-3 text-sm"><span>Show description</span><Switch checked={giftEditing.display.showDescription} onCheckedChange={value => setGiftEditing({ ...giftEditing, display: { ...giftEditing.display, showDescription: value } })}/></label><label className="flex items-center justify-between gap-3 text-sm"><span>Show price</span><Switch checked={giftEditing.display.showPrice} onCheckedChange={value => setGiftEditing({ ...giftEditing, display: { ...giftEditing.display, showPrice: value } })}/></label><label className="flex items-center justify-between gap-3 text-sm"><span>Show size</span><Switch checked={giftEditing.display.showSize} onCheckedChange={value => setGiftEditing({ ...giftEditing, display: { ...giftEditing.display, showSize: value } })}/></label><div className="space-y-2"><Label htmlFor="gift-sizes">Sizes in ml</Label><Input id="gift-sizes" name="gift-sizes" defaultValue={giftEditing.display.sizes.join(', ')} placeholder="50, 100"/><p className="text-xs text-muted-foreground">Separate sizes with commas, for example: 30, 50, 100</p></div></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Category</Label><Select value={giftEditing.category} onValueChange={value => setGiftEditing({ ...giftEditing, category: value })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['Men','Women','Unisex'].map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="gift-family">Family</Label><Input id="gift-family" name="gift-family" defaultValue={giftEditing.family} placeholder="Woody · Intense"/></div><div className="space-y-2"><Label htmlFor="gift-price">Price (MAD)</Label><Input id="gift-price" name="gift-price" type="number" min={0} defaultValue={giftEditing.price} required/></div><div className="space-y-2"><Label htmlFor="gift-discount">Discount %</Label><Input id="gift-discount" name="gift-discount" type="number" min={0} max={90} defaultValue={giftEditing.discount}/></div><div className="space-y-2"><Label htmlFor="gift-sort">Order</Label><Input id="gift-sort" name="gift-sort" type="number" defaultValue={giftEditing.sort}/></div></div>
          <div className="space-y-2"><Label>Characteristics</Label><div className="flex flex-wrap gap-2">{CHARACTERISTIC_OPTIONS.map(option => { const active = giftEditing.characteristics.some(item => item.label === option.label); return <Button key={option.label} type="button" variant={active ? 'default' : 'outline'} size="sm" onClick={() => toggleGiftCharacteristic(option)} aria-pressed={active}>{option.label}</Button>; })}</div></div>
          <FragranceProfileEditor value={giftEditing} onChange={profile => setGiftEditing({ ...giftEditing, ...profile })}/>
          <div className="space-y-3"><div><Label>Photos</Label><p className="text-xs text-muted-foreground">The first photo is the cover. Add several photos for a gallery.</p></div><div className="admin-gallery-grid">{giftEditing.images.map((image,index) => <div className={index === 0 ? 'admin-gallery-item is-cover' : 'admin-gallery-item'} key={`${image}-${index}`}><img src={resolveImage(image)} alt={`${giftEditing.name} photo ${index + 1}`}/><div className="admin-gallery-actions">{index !== 0 && <Button type="button" variant="secondary" size="sm" onClick={() => setGiftEditing({ ...giftEditing, images: [image, ...giftEditing.images.filter((_,i) => i !== index)] })}>Use as cover</Button>}<Button type="button" variant="ghost" size="sm" onClick={() => setGiftEditing({ ...giftEditing, images: giftEditing.images.length > 1 ? giftEditing.images.filter((_,i) => i !== index) : giftEditing.images })} disabled={giftEditing.images.length === 1}>Remove</Button></div>{index === 0 && <span className="admin-gallery-cover">Cover</span>}</div>)}</div><div className="flex flex-wrap items-center gap-2"><Select value={BUILT_IN_IMAGES[giftEditing.images[0] ?? giftEditing.image] ? (giftEditing.images[0] ?? giftEditing.image) : 'custom'} onValueChange={value => value !== 'custom' && setGiftEditing({ ...giftEditing, image: value, images: [value, ...giftEditing.images.slice(1)] })}><SelectTrigger className="w-48"><SelectValue/></SelectTrigger><SelectContent>{Object.keys(BUILT_IN_IMAGES).map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}<SelectItem value="custom" disabled>Uploaded photo</SelectItem></SelectContent></Select><label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"><ImagePlus size={15}/> Upload photos<Input className="sr-only" type="file" accept="image/*" multiple disabled={giftUploading} onChange={event => { void addGiftImages(event.target.files); event.currentTarget.value = ''; }}/></label></div>{giftUploading && <p className="text-xs text-muted-foreground">Optimizing photos…</p>}</div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={giftUploading}><Plus size={16}/> Save gift product</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}
