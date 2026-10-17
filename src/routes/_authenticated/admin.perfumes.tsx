import { createFileRoute } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/admin';
import { BUILT_IN_IMAGES, resolveImage } from '@/lib/catalog';

export const Route = createFileRoute('/_authenticated/admin/perfumes')({ component: Perfumes });

type Product = { id: string; name: string; category: string; family: string; price: number; discount: number; image: string; notes: string[]; visible: boolean; sort: number };
const empty: Product = { id: '', name: '', category: 'Unisex', family: '', price: 0, discount: 0, image: 'noir', notes: ['', '', ''], visible: true, sort: 0 };

function Perfumes() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const { data: products = [] } = useQuery({ queryKey: ['admin', 'products'], queryFn: async () => {
    const { data, error } = await supabase.from('products').select('*').order('sort').order('created_at');
    if (error) throw error;
    return data as Product[];
  } });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });

  const save = useMutation({ mutationFn: async (p: Product) => {
    const row = { name: p.name, category: p.category, family: p.family, price: p.price, discount: p.discount, image: p.image, notes: p.notes.filter(Boolean), visible: p.visible, sort: p.sort };
    const { error } = p.id && products.some(x => x.id === p.id)
      ? await supabase.from('products').update(row).eq('id', p.id)
      : await supabase.from('products').insert({ ...row, id: p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') });
    if (error) throw error;
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
      notes: [String(f.get('note0')), String(f.get('note1')), String(f.get('note2'))],
    });
  }

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="font-serif text-4xl">Perfumes</h1><p className="text-muted-foreground">Add, edit, hide or remove fragrances. Changes appear on the shop immediately.</p></div>
      <Button onClick={() => { setError(''); setEditing({ ...empty, sort: products.length }); }}><Plus size={16} /> Add perfume</Button>
    </div>
    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-xs uppercase tracking-widest text-muted-foreground"><th className="p-3">Perfume</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Discount</th><th className="p-3">Visible</th><th className="p-3" /></tr></thead>
        <tbody>{products.map(p => <tr key={p.id} className="border-b last:border-0">
          <td className="p-3"><div className="flex items-center gap-3"><img src={resolveImage(p.image)} alt="" className="h-10 w-10 rounded object-cover" /><div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.family}</p></div></div></td>
          <td className="p-3">{p.category}</td>
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

    <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{editing && products.some(x => x.id === editing.id) ? 'Edit perfume' : 'New perfume'}</DialogTitle></DialogHeader>
        {editing && <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" defaultValue={editing.name} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Category</Label><Select name="category" defaultValue={editing.category}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Men', 'Women', 'Unisex'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="family">Family</Label><Input id="family" name="family" defaultValue={editing.family} placeholder="Woody · Intense" /></div>
            <div className="space-y-2"><Label htmlFor="price">Price (MAD)</Label><Input id="price" name="price" type="number" min={0} defaultValue={editing.price} required /></div>
            <div className="space-y-2"><Label htmlFor="discount">Discount %</Label><Input id="discount" name="discount" type="number" min={0} max={90} defaultValue={editing.discount} /></div>
            <div className="space-y-2"><Label htmlFor="sort">Order</Label><Input id="sort" name="sort" type="number" defaultValue={editing.sort} /></div>
          </div>
          <div className="space-y-2"><Label>Notes (top / heart / base)</Label>{[0, 1, 2].map(i => <Input key={i} name={`note${i}`} defaultValue={editing.notes[i] ?? ''} placeholder={['Top notes', 'Heart notes', 'Base notes'][i]} />)}</div>
          <div className="space-y-2"><Label>Photo</Label>
            <div className="flex items-center gap-3"><img src={resolveImage(editing.image)} alt="" className="h-16 w-16 rounded object-cover" />
              <div className="space-y-2">
                <Select value={BUILT_IN_IMAGES[editing.image] ? editing.image : 'custom'} onValueChange={v => v !== 'custom' && setEditing({ ...editing, image: v })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(BUILT_IN_IMAGES).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}<SelectItem value="custom">Uploaded</SelectItem></SelectContent></Select>
                <Input type="file" accept="image/*" onChange={async e => { const file = e.target.files?.[0]; if (file) setEditing({ ...editing, image: await compressImage(file) }); }} />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={editing.visible} onCheckedChange={v => setEditing({ ...editing, visible: v })} /> Visible in the shop</label>
          <Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save perfume'}</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}
