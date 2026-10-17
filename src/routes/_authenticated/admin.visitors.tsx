import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLiveVisitors } from '@/lib/admin';

export const Route = createFileRoute('/_authenticated/admin/visitors')({ component: Visitors });

function Visitors() {
  const live = useLiveVisitors();
  const { data } = useQuery({ queryKey: ['admin', 'visits'], refetchInterval: 30000, queryFn: async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const week = new Date(); week.setDate(week.getDate() - 7);
    const [today, total, last7] = await Promise.all([
      supabase.from('visits').select('id', { count: 'exact', head: true }).gte('created_at', start.toISOString()),
      supabase.from('visits').select('id', { count: 'exact', head: true }),
      supabase.from('visits').select('created_at').gte('created_at', week.toISOString()),
    ]);
    const days: Record<string, number> = {};
    (last7.data ?? []).forEach(v => { const d = v.created_at.slice(0, 10); days[d] = (days[d] ?? 0) + 1; });
    return { today: today.count ?? 0, total: total.count ?? 0, days };
  } });
  const cards = [
    { label: 'Online right now', value: live },
    { label: 'Visits today', value: data?.today ?? '—' },
    { label: 'Total visits', value: data?.total ?? '—' },
  ];
  return <div className="space-y-6">
    <div><h1 className="font-serif text-4xl">Visitors</h1><p className="text-muted-foreground">Who is on the shop right now and how many visits you receive.</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{cards.map(c => <div key={c.label} className="rounded-lg border bg-card p-5"><p className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{c.value}</p></div>)}</div>
    <div className="rounded-lg border bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Last 7 days</p>
      <div className="mt-4 space-y-2">{Object.entries(data?.days ?? {}).sort().reverse().map(([day, count]) => <div key={day} className="flex items-center gap-3 text-sm"><span className="w-24 tabular-nums text-muted-foreground">{day}</span><div className="h-2 rounded bg-accent" style={{ width: `${Math.min(100, count * 8)}%` }} /><span className="tabular-nums">{count}</span></div>)}</div>
      {data && Object.keys(data.days).length === 0 && <p className="mt-4 text-sm text-muted-foreground">No visits recorded yet this week.</p>}
    </div>
  </div>;
}
