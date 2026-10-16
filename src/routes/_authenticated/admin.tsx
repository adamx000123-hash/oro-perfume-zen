import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, LogOut, Megaphone, Settings, Sparkles, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { isAdmin } from '@/lib/admin';

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: async () => { if (!(await isAdmin())) throw redirect({ to: '/auth' }); },
  head: () => ({ meta: [
    { title: 'Admin dashboard — ORO PARFUME' },
    { name: 'description', content: 'Manage ORO PARFUME fragrances, offers, contact links and visitors.' },
    { property: 'og:title', content: 'Admin dashboard — ORO PARFUME' },
    { property: 'og:description', content: 'Manage ORO PARFUME fragrances, offers, contact links and visitors.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminLayout,
});

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/perfumes', label: 'Perfumes', icon: Sparkles },
  { to: '/admin/offers', label: 'Offers', icon: Megaphone },
  { to: '/admin/visitors', label: 'Visitors', icon: Users },
  { to: '/admin/settings', label: 'Contact links', icon: Settings },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function signOut() {
    await queryClient.cancelQueries(); queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: '/auth', replace: true });
  }
  return <div className="admin-shell min-h-screen bg-background text-foreground md:flex">
    <aside className="border-b bg-card md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between p-4 md:block md:p-6"><p className="font-serif text-2xl">ORO<span className="text-accent">✦</span> <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Admin</span></p></div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3" aria-label="Admin navigation">
        {nav.map(({ to, label, icon: Icon }) => <Link key={to} to={to} activeOptions={{ exact: true }} className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: 'bg-muted !text-foreground font-medium' }}><Icon size={16} />{label}</Link>)}
        <a href="/" target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><ExternalLink size={16} />View shop</a>
        <Button variant="ghost" className="shrink-0 justify-start gap-2 px-3 text-sm font-normal text-muted-foreground" onClick={signOut}><LogOut size={16} />Sign out</Button>
      </nav>
    </aside>
    <main className="flex-1 p-4 md:p-8"><div className="mx-auto max-w-5xl"><Outlet /></div></main>
  </div>;
}
