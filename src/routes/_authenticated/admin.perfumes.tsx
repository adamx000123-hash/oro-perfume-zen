import { createFileRoute } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { FragranceProfileEditor } from '@/components/fragrance-profile-editor';
import { compressImage } from '@/lib/admin';
import { BUILT_IN_IMAGES, parseFragranceProfile, validateFragranceProfile, type FragranceProfile, CHARACTERISTIC_OPTIONS, DEFAULT_PRODUCT_DISPLAY, parseProductPresentation, resolveImage, serializeProductPresentation, type Characteristic, type ProductDisplay } from '@/lib/catalog';

export const Route = createFileRoute('/_authenticated/admin/perfumes')({ head: () => ({ meta: [{ title: 'Perfumes — ORO PARFUME Admin' }, { name: 'description', content: 'Manage ORO PARFUME fragrances and scent profiles.' }, { property: 'og:title', content: 'Perfumes — ORO PARFUME Admin' }, { property: 'og:description', content: 'Manage fragrances and scent profiles.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: Perfumes });

type Product = FragranceProfile & { id: string; name: string; category: string; family: string; price: number; discount: number; image: string; images?: string[]; description: string; notes?: string[]; characteristics: Characteristic[]; display: ProductDisplay; visible: boolean; sort: number };
const empty: Product = { mainAccords: [], whenToWear: {}, id: '', name: '', category: 'Unisex', family: '', price: 0, discount: 0, image: 'noir', images: ['noir'], description: '', notes: ['', '', ''], characteristics: [], display: DEFAULT_PRODUCT_DISPLAY, visible: true, sort: 0 };
const CATEGORY_ORDER = ['Men', 'Women', 'Unisex'];

// Fragrances are listed grouped by type so each family is easy to find at a glance.
function groupByCategory(products: Product[]) {
  const known = CATEGORY_ORDER.filter(category => products.some(p => p.category === category));
  const others = [...new Set(products.map(p => p.category))].filter(category => !CATEGORY_ORDER.includes(category));
  return [...known, ...others].map(category => ({ category, items: products.filter(p => p.category === category) }));
}

function Perfumes() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const { data: products = [] } = useQuery({ queryKey: ['admin', 'products'], queryFn: async () => {
    const { data, error } = await supabase.from('products').select('*').order('sort').order('created_at');
    if (error) throw error;
    return (data ?? []).map(row => { const presentation = parseProductPresentation(row.characteristics); return { ...row, ...presentation, images: presentation.images?.length ? presentation.images : row.images?.length ? row.images : [row.image], ...parseFragranceProfile(row.main_accords, row.when_to_wear) }; }) as Product[];
  } });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });

  const save = useMutation({ mutationFn: async (p: Product) => {
    validateFragranceProfile(p);
    const images = p.images?.length ? p.images : [p.image];
    const row = { main_accords: p.mainAccords, when_to_wear: p.whenToWear, name: p.name, category: p.category, family: p.family, price: p.price, discount: p.discount, image: images[0], images, description: p.description, notes: p.notes, characteristics: serializeProductPresentation(p.characteristics, p.display, images), visible: p.visible, sort: p.sort };
    const saveRow = async (value: typeof row) => p.id && products.some(x => x.id === p.id)
      ? await supabase.from('products').update(value).eq('id', p.id)
      : await supabase.from('products').insert({ ...value, id: p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') });
    let result = await saveRow(row);
    // Older projects may not have run the gallery migration yet; save the cover using the legacy schema.
    if (result.error && /images|column/i.test(result.error.message)) {
      const { images: _images, ...legacyRow } = row;
      result = p.id && products.some(x => x.id === p.id)
        ? await supabase.from('products').update(legacyRow).eq('id', p.id)
        : await supabase.from('products').insert({ ...legacyRow, id: p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') });
    }
    if (result.error) throw result.error;
  }, onSuccess: () => { setEditing(null); setError(''); refresh(); }, onError: e => setError(e.message) });

  const remove = useMutation({ mutationFn: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  }, onSuccess: refresh, onError: e => setError(e.message) });

  const toggle = useMutation({ mutationFn: async (p: Product) => {
    const { error } = await supabase.from('products').update({ visible: !p.visible }).eq('id', p.id);
    if (error) throw error;
  }, onSuccess: refresh });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const f = new FormData(e.currentTarget);
    save.mutate({ ...editing,
      name: String(f.get('name')), category: String(f.get('category')), family: String(f.get('family')),
      price: Number(f.get('price')), discount: Number(f.get('discount') || 0), sort: Number(f.get('sort') || 0),
      description: String(f.get('description') ?? ''), notes: [String(f.get('note-top') ?? ''), String(f.get('note-heart') ?? ''), String(f.get('note-base') ?? '')],
      display: { ...editing.display, sizes: (() => { const sizes = String(f.get('sizes') ?? '').split(',').map(value => Number(value.trim())).filter(value => Number.isFinite(value) && value > 0); return sizes.length ? sizes : editing.display.sizes; })() },
    });
  }

  function toggleCharacteristic(option: Characteristic) {
    if (!editing) return;
    const has = editing.characteristics.some(c => c.label === option.label);
    setEditing({ ...editing, characteristics: has ? editing.characteristics.filter(c => c.label !== option.label) : [...editing.characteristics, option] });
  }

  async function addGalleryImages(files: FileList | null) {
    if (!editing || !files?.length) return;
    const uploaded = await Promise.all(Array.from(files).map(file => compressImage(file)));
    const current = editing.images?.length ? editing.images : [editing.image];
    setEditing({ ...editing, images: [...current, ...uploaded] });
  }

  function setCover(index: number) {
    if (!editing) return;
    const images = editing.images?.length ? editing.images : [editing.image];
    setEditing({ ...editing, images: [images[index], ...images.filter((_, imageIndex) => imageIndex !== index)] });
  }

  function removeGalleryImage(index: number) {
    if (!editing) return;
    const images = editing.images?.length ? editing.images : [editing.image];
    if (images.length === 1) return;
    setEditing({ ...editing, images: images.filter((_, imageIndex) => imageIndex !== index) });
  }

  const groups = groupByCategory(products);

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="font-serif text-4xl">Perfumes</h1><p className="text-muted-foreground">Add, edit, hide or remove fragrances. Changes appear on the shop immediately.</p></div>
      <Button onClick={() => { setError(''); setEditing({ ...empty, sort: products.length }); }}><Plus size={16} /> Add perfume</Button>
    </div>
    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

    {products.length === 0 && <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">No perfumes yet. Add your first fragrance.</div>}

    {groups.map(group => <section key={group.category} aria-labelledby={`group-${group.category}`} className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h2 id={`group-${group.category}`} className="font-serif text-2xl">{group.category}</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{group.items.length} {group.items.length === 1 ? 'fragrance' : 'fragrances'}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs uppercase tracking-widest text-muted-foreground"><th className="p-3">Perfume</th><th className="p-3">Family</th><th className="p-3">Price</th><th className="p-3">Discount</th><th className="p-3">Visible</th><th className="p-3" /></tr></thead>
          <tbody>{group.items.map(p => <tr key={p.id} className="border-b last:border-0">
            <td className="p-3"><div className="flex items-center gap-3"><img src={resolveImage(p.image)} alt="" className="h-10 w-10 rounded object-cover" /><div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.id}</p></div></div></td>
            <td className="p-3 text-muted-foreground">{p.family || '—'}</td>
            <td className="p-3 tabular-nums">{p.price} MAD</td>
            <td className="p-3 tabular-nums">{p.discount}%</td>
            <td className="p-3"><Switch checked={p.visible} onCheckedChange={() => toggle.mutate(p)} aria-label={`Show ${p.name}`} /></td>
            <td className="p-3"><div className="flex gap-1 justify-end">
              <Button variant="ghost" size="icon" onClick={() => { setError(''); setEditing(p); }} aria-label={`Edit ${p.name}`}><Pencil size={15} /></Button>
              <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${p.name}?`)) remove.mutate(p.id); }} aria-label={`Delete ${p.name}`}><Trash2 size={15} /></Button>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>)}

    <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{editing && products.some(x => x.id === editing.id) ? 'Edit perfume' : 'New perfume'}</DialogTitle></DialogHeader>
        {editing && <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" defaultValue={editing.name} required /></div>
          <div className="space-y-2"><Label htmlFor="description">Short description</Label><Textarea id="description" name="description" defaultValue={editing.description} rows={2} maxLength={160} placeholder="A short, elegant description…" /></div><div className="space-y-3"><Label>Notes</Label>{(['top', 'heart', 'base'] as const).map((part, index) => <div key={part} className="space-y-1"><Label htmlFor={`note-${part}`} className="text-xs text-muted-foreground">{['Top notes', 'Heart notes', 'Base notes'][index]}</Label><Input id={`note-${part}`} name={`note-${part}`} defaultValue={editing.notes?.[index] ?? ''} maxLength={120} placeholder="Leave empty if unavailable" /></div>)}</div>
          <div className="rounded-md border p-3 space-y-3"><p className="text-sm font-medium">Shop information</p><label className="flex items-center justify-between gap-3 text-sm"><span>Show description</span><Switch checked={editing.display.showDescription} onCheckedChange={value => setEditing({ ...editing, display: { ...editing.display, showDescription: value } })} /></label><label className="flex items-center justify-between gap-3 text-sm"><span>Show price</span><Switch checked={editing.display.showPrice} onCheckedChange={value => setEditing({ ...editing, display: { ...editing.display, showPrice: value } })} /></label><label className="flex items-center justify-between gap-3 text-sm"><span>Show size</span><Switch checked={editing.display.showSize} onCheckedChange={value => setEditing({ ...editing, display: { ...editing.display, showSize: value } })} /></label><div className="space-y-2"><Label htmlFor="sizes">Sizes in ml</Label><Input id="sizes" name="sizes" defaultValue={editing.display.sizes.join(', ')} placeholder="50, 100" /><p className="text-xs text-muted-foreground">Separate sizes with commas, for example: 30, 50, 100</p></div></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Category</Label><Select name="category" defaultValue={editing.category}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Men', 'Women', 'Unisex'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="family">Family</Label><Input id="family" name="family" defaultValue={editing.family} placeholder="Woody · Intense" /></div>
            <div className="space-y-2"><Label htmlFor="price">Price (MAD)</Label><Input id="price" name="price" type="number" min={0} defaultValue={editing.price} required /></div>
            <div className="space-y-2"><Label htmlFor="discount">Discount %</Label><Input id="discount" name="discount" type="number" min={0} max={90} defaultValue={editing.discount} /></div>
            <div className="space-y-2"><Label htmlFor="sort">Order</Label><Input id="sort" name="sort" type="number" defaultValue={editing.sort} /></div>
          </div>
          <div className="space-y-2"><Label>Characteristics</Label>
            <div className="flex flex-wrap gap-2">
              {CHARACTERISTIC_OPTIONS.map(option => {
                const active = editing.characteristics.some(c => c.label === option.label);
                return <Button key={option.label} type="button" variant={active ? 'default' : 'outline'} size="sm" onClick={() => toggleCharacteristic(option)} aria-pressed={active}>{option.label}</Button>;
              })}
            </div>
          </div>
          <FragranceProfileEditor value={editing} onChange={profile => setEditing({ ...editing, ...profile })}/>
          <div className="space-y-3"><div><Label>Photos</Label><p className="text-xs text-muted-foreground">The first photo is the cover. Add more photos for the swipeable product gallery.</p></div>
            <div className="admin-gallery-grid">{(editing.images?.length ? editing.images : [editing.image]).map((image, index) => <div className={index === 0 ? 'admin-gallery-item is-cover' : 'admin-gallery-item'} key={`${image}-${index}`}><img src={resolveImage(image)} alt={`${editing.name} photo ${index + 1}`} /><div className="admin-gallery-actions">{index !== 0 && <Button type="button" variant="secondary" size="sm" onClick={() => setCover(index)}>Use as cover</Button>}<Button type="button" variant="ghost" size="sm" onClick={() => removeGalleryImage(index)} disabled={index === 0 && (editing.images?.length ?? 1) === 1}>Remove</Button></div>{index === 0 && <span className="admin-gallery-cover">Cover</span>}</div>)}</div>
            <div className="flex flex-wrap items-center gap-2"><Select value={BUILT_IN_IMAGES[editing.images?.[0] ?? editing.image] ? (editing.images?.[0] ?? editing.image) : 'custom'} onValueChange={v => v !== 'custom' && setEditing({ ...editing, image: v, images: [v, ...(editing.images ?? []).filter((_, index) => index !== 0) ] })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(BUILT_IN_IMAGES).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}<SelectItem value="custom">Uploaded</SelectItem></SelectContent></Select><Input type="file" accept="image/*" multiple onChange={async e => { await addGalleryImages(e.target.files); e.currentTarget.value = ''; }} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={editing.visible} onCheckedChange={v => setEditing({ ...editing, visible: v })} /> Visible in the shop</label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save perfume'}</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}
