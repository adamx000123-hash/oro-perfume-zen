import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLiveVisitors } from '@/lib/admin';

export const Route = createFileRoute('/_authenticated/admin/')({ component: Overview });

function Overview() {
  const live = useLiveVisitors();
  const { data } = useQuery({ queryKey: ['admin', 'overview'], queryFn: async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const [p, o, v] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('offers').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('visits').select('id', { count: 'exact', head: true }).gte('created_at', start.toISOString()),
    ]);
    return { products: p.count ?? 0, offers: o.count ?? 0, today: v.count ?? 0 };
  } });
  const cards = [
    { label: 'Online now', value: live, to: '/admin/visitors' },
    { label: 'Visits today', value: data?.today ?? '—', to: '/admin/visitors' },
    { label: 'Perfumes', value: data?.products ?? '—', to: '/admin/perfumes' },
    { label: 'Active offers', value: data?.offers ?? '—', to: '/admin/offers' },
  ] as const;
  return <div className="space-y-6">
    <div><h1 className="font-serif text-4xl">Welcome back</h1><p className="text-muted-foreground">Everything in your shop, in one place.</p></div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{cards.map(c => <Link key={c.label} to={c.to} className="rounded-lg border bg-card p-5 hover:border-accent"><p className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{c.value}</p></Link>)}</div>
  </div>;
}
