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
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/admin';

export const Route = createFileRoute('/_authenticated/admin/offers')({ head: () => ({ meta: [{ title: 'Offers — ORO PARFUME Admin' }, { name: "description", content: 'Manage ORO PARFUME fragrance offers.' }, { property: "og:title", content: 'Offers — ORO PARFUME Admin' }, { property: "og:description", content: 'Manage ORO PARFUME fragrance offers.' }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Offers });

type Offer = { id: string; label: string; name: string; description: string; kind: 'percentage' | 'bundle' | 'limited'; active: boolean; sort: number; images: string[]; product_ids: string[] };
type ProductChoice = { id: string; name: string; image: string; price: number; discount: number; visible: boolean };
const empty: Offer = { id: '', label: '', name: '', description: '', kind: 'percentage', active: true, sort: 0, images: [], product_ids: [] };

function Offers() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Offer | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const { data: offers = [] } = useQuery({ queryKey: ['admin', 'offers'], queryFn: async () => {
    const { data, error } = await supabase.from('offers').select('*').order('sort').order('created_at');
    if (error) throw error;
    return (data ?? []).map(row => ({ ...row, images: row.images ?? [], product_ids: row.product_ids ?? [] })) as Offer[];
  } });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
  const { data: products = [] } = useQuery({ queryKey: ['admin', 'offer-products'], queryFn: async () => {
    const { data, error } = await supabase.from('products').select('id,name,image,price,discount,visible').order('sort').order('created_at');
    if (error) throw error;
    return (data ?? []) as ProductChoice[];
  } });

  const save = useMutation({ mutationFn: async (o: Offer) => {
    const row = { label: o.label, name: o.name, description: o.description, kind: o.kind, active: o.active, sort: o.sort, images: o.images ?? [], product_ids: o.product_ids ?? [] };
    const { error } = o.id && offers.some(x => x.id === o.id)
      ? await supabase.from('offers').update(row).eq('id', o.id)
      : await supabase.from('offers').insert(row);
    if (error) throw error;
  }, onSuccess: () => { setEditing(null); setError(''); refresh(); }, onError: e => {
    const message = e instanceof Error ? e.message : String(e);
    setError(/images|column|schema cache/i.test(message)
      ? 'The database is missing a field required for offer images or products. Run migrations 0004_offer_images.sql and 0005_offer_products.sql in Supabase → SQL Editor, then save again.'
      : message);
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
    setUploading(true);
    setError('');
    try {
      const uploaded = await Promise.all(Array.from(files).map(file => compressImage(file, 900)));
      setEditing(current => current ? { ...current, images: [...(current.images ?? []), ...uploaded] } : current);
    } catch {
      setError('Could not process one of the images. Please try another image.');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    if (!editing) return;
    setEditing({ ...editing, images: (editing.images ?? []).filter((_, imageIndex) => imageIndex !== index) });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const f = new FormData(e.currentTarget);
    save.mutate({ ...editing, label: String(f.get('label')), name: String(f.get('name')), description: String(f.get('description')), kind: String(f.get('kind')) as Offer['kind'], sort: Number(f.get('sort') || 0) });
  }

  return <div className="space-y-6">
    <div className="admin-page-heading flex items-center justify-between">
      <div><h1 className="font-serif text-4xl">Offers</h1><p className="text-muted-foreground">Turn offers on or off, edit them or add new ones.</p></div>
      <Button onClick={() => { setError(''); setEditing({ ...empty, sort: offers.length }); }}><Plus size={16} /> Add offer</Button>
    </div>
    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    <div className="space-y-3">{offers.map(o => <div key={o.id} className="admin-offer-row flex items-center gap-4 rounded-lg border bg-card p-4">
      {o.images?.[0] && <img src={o.images[0]} alt="" className="h-16 w-24 shrink-0 rounded object-cover" />}<div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-widest text-muted-foreground">{o.label} · {o.kind}</p><p className="font-medium">{o.name}</p><p className="text-sm text-muted-foreground">{o.description}</p></div>
      <Switch checked={o.active} onCheckedChange={() => toggle.mutate(o)} aria-label={`Activate ${o.name}`} />
      <Button variant="ghost" size="icon" onClick={() => { setError(''); setEditing(o); }} aria-label={`Edit ${o.name}`}><Pencil size={15} /></Button>
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
            <div><Label>Products in this offer</Label><p className="mt-1 text-xs text-muted-foreground">Select products shoppers can browse and add to their bag by tapping this offer banner.</p></div>
            {products.length === 0 ? <p className="text-xs text-muted-foreground">No products found yet.</p> : <div className="max-h-56 space-y-1 overflow-y-auto">{products.map(product => <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded px-2 py-2 hover:bg-muted/60">
              <input type="checkbox" checked={(editing.product_ids ?? []).includes(product.id)} onChange={event => setEditing(current => current ? { ...current, product_ids: event.target.checked ? [...(current.product_ids ?? []), product.id] : (current.product_ids ?? []).filter(id => id !== product.id) } : current)} />
              <img src={product.image} alt="" className="h-10 w-10 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm">{product.name}</span>
              <span className="text-xs text-muted-foreground">{product.visible ? 'Visible' : 'Hidden'}</span>
            </label>)}</div>}
            <p className="text-xs text-muted-foreground">{(editing.product_ids ?? []).length} product(s) selected</p>
          </div>
          <div className="space-y-3 rounded-md border p-3">
            <div><Label htmlFor="offer-images">Offer banner images</Label><p className="mt-1 text-xs text-muted-foreground">Upload one or more images. Recommended: 16:9 (1600 × 900 px). Any dimensions are accepted; images are optimized and cropped to fit the banner.</p></div>
            {(editing.images ?? []).length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{(editing.images ?? []).map((image, index) => <div key={`${index}-${image.slice(0, 32)}`} className="relative overflow-hidden rounded border bg-muted"><img src={image} alt={`Offer banner ${index + 1}`} className="aspect-video w-full object-cover" /><Button type="button" variant="destructive" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => removeImage(index)} aria-label={`Remove banner image ${index + 1}`}><X size={14}/></Button></div>)}</div>}
            <Input id="offer-images" type="file" accept="image/*" multiple disabled={uploading} onChange={event => { void addImages(event.target.files); event.currentTarget.value = ''; }} />
            {uploading && <p className="text-xs text-muted-foreground">Optimizing images…</p>}
          </div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /> Active in the shop</label>
          <Button type="submit" className="w-full" disabled={save.isPending || uploading}>{save.isPending ? 'Saving…' : 'Save offer'}</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}
