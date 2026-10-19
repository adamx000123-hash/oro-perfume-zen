import { createFileRoute } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/admin/settings')({ head: () => ({ meta: [{ title: 'Contact links — ORO PARFUME Admin' }, { name: "description", content: 'Manage ORO PARFUME contact links.' }, { property: "og:title", content: 'Contact links — ORO PARFUME Admin' }, { property: "og:description", content: 'Manage ORO PARFUME contact links.' }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Settings });

function Settings() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const { data } = useQuery({ queryKey: ['admin', 'settings'], queryFn: async () => {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    return data;
  } });
  const save = useMutation({ mutationFn: async (row: { whatsapp_number: string; instagram_url: string; offer_end: string }) => {
    const { error } = await supabase.from('site_settings').update(row).eq('id', 1);
    if (error) throw error;
  }, onSuccess: () => { setMessage('Saved. The shop now uses the new values.'); queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }); }, onError: e => setMessage(e.message) });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const date = String(f.get('offer_end'));
    save.mutate({ whatsapp_number: String(f.get('whatsapp')).replace(/\D/g, ''), instagram_url: String(f.get('instagram')), offer_end: date ? new Date(date).toISOString() : new Date().toISOString() });
  }

  const offerEnd = data?.offer_end ? new Date(data.offer_end).toISOString().slice(0, 16) : '';
  return <div className="space-y-6">
    <div><h1 className="font-serif text-4xl">Contact links</h1><p className="text-muted-foreground">The WhatsApp number that receives orders, your Instagram link, and the end of the limited offer.</p></div>
    <form onSubmit={submit} className="max-w-lg space-y-5 rounded-lg border bg-card p-6">
      <div className="space-y-2"><Label htmlFor="whatsapp">WhatsApp number (with country code, e.g. 2126XXXXXXXX)</Label><Input id="whatsapp" name="whatsapp" defaultValue={data?.whatsapp_number ?? ''} placeholder="2126XXXXXXXX" /></div>
      <div className="space-y-2"><Label htmlFor="instagram">Instagram link</Label><Input id="instagram" name="instagram" type="url" defaultValue={data?.instagram_url ?? ''} placeholder="https://instagram.com/…" /></div>
      <div className="space-y-2"><Label htmlFor="offer_end">Limited offer ends</Label><Input id="offer_end" name="offer_end" type="datetime-local" defaultValue={offerEnd} /></div>
      {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
      <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save changes'}</Button>
    </form>
  </div>;
}
