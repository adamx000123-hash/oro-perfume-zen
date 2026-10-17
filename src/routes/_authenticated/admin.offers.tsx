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

export const Route = createFileRoute('/_authenticated/admin/offers')({ component: Offers });

type Offer = { id: string; label: string; name: string; description: string; kind: 'percentage' | 'bundle' | 'limited'; active: boolean; sort: number };
const empty: Offer = { id: '', label: '', name: '', description: '', kind: 'percentage', active: true, sort: 0 };

function Offers() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Offer | null>(null);
  const [error, setError] = useState('');
  const { data: offers = [] } = useQuery({ queryKey: ['admin', 'offers'], queryFn: async () => {
    const { data, error } = await supabase.from('offers').select('*').order('sort').order('created_at');
    if (error) throw error;
    return data as Offer[];
  } });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });

  const save = useMutation({ mutationFn: async (o: Offer) => {
    const row = { label: o.label, name: o.name, description: o.description, kind: o.kind, active: o.active, sort: o.sort };
    const { error } = o.id && offers.some(x => x.id === o.id)
      ? await supabase.from('offers').update(row).eq('id', o.id)
      : await supabase.from('offers').insert(row);
    if (error) throw error;
  }, onSuccess: () => { setEditing(null); setError(''); refresh(); }, onError: e => setError(e.message) });

  const remove = useMutation({ mutationFn: async (id: string) => {
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) throw error;
  }, onSuccess: refresh, onError: e => setError(e.message) });

  const toggle = useMutation({ mutationFn: async (o: Offer) => {
    const { error } = await supabase.from('offers').update({ active: !o.active }).eq('id', o.id);
    if (error) throw error;
  }, onSuccess: refresh });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const f = new FormData(e.currentTarget);
    save.mutate({ ...editing, label: String(f.get('label')), name: String(f.get('name')), description: String(f.get('description')), kind: String(f.get('kind')) as Offer['kind'], sort: Number(f.get('sort') || 0) });
  }

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="font-serif text-4xl">Offers</h1><p className="text-muted-foreground">Turn offers on or off, edit them or add new ones.</p></div>
      <Button onClick={() => { setError(''); setEditing({ ...empty, sort: offers.length }); }}><Plus size={16} /> Add offer</Button>
    </div>
    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    <div className="space-y-3">{offers.map(o => <div key={o.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-widest text-muted-foreground">{o.label} · {o.kind}</p><p className="font-medium">{o.name}</p><p className="text-sm text-muted-foreground">{o.description}</p></div>
      <Switch checked={o.active} onCheckedChange={() => toggle.mutate(o)} aria-label={`Activate ${o.name}`} />
      <Button variant="ghost" size="icon" onClick={() => { setError(''); setEditing(o); }} aria-label={`Edit ${o.name}`}><Pencil size={15} /></Button>
      <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete "${o.name}"?`)) remove.mutate(o.id); }} aria-label={`Delete ${o.name}`}><Trash2 size={15} /></Button>
    </div>)}</div>

    <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{editing && offers.some(x => x.id === editing.id) ? 'Edit offer' : 'New offer'}</DialogTitle></DialogHeader>
        {editing && <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="label">Small label</Label><Input id="label" name="label" defaultValue={editing.label} placeholder="THE SIGNATURE EDIT" /></div>
          <div className="space-y-2"><Label htmlFor="name">Title</Label><Input id="name" name="name" defaultValue={editing.name} required /></div>
          <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={editing.description} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Type</Label><Select name="kind" defaultValue={editing.kind}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage discount</SelectItem><SelectItem value="bundle">Buy 2 get 1</SelectItem><SelectItem value="limited">Limited time</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="sort">Order</Label><Input id="sort" name="sort" type="number" defaultValue={editing.sort} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /> Active in the shop</label>
          <Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save offer'}</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}
