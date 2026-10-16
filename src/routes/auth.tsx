import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { isAdmin, usernameToEmail } from '@/lib/admin';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [
    { title: 'Admin sign in — ORO PARFUME' },
    { name: 'description', content: 'Private sign in for the ORO PARFUME store administrator.' },
    { property: 'og:title', content: 'Admin sign in — ORO PARFUME' },
    { property: 'og:description', content: 'Private sign in for the ORO PARFUME store administrator.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const form = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(String(form.get('username'))), password: String(form.get('password')) });
    if (error || !(await isAdmin())) { if (!error) await supabase.auth.signOut(); setError('Incorrect username or password.'); setBusy(false); return; }
    navigate({ to: '/admin', replace: true });
  }
  return <div className="admin-shell flex min-h-screen items-center justify-center bg-background px-4">
    <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-lg border bg-card p-8 shadow-sm">
      <div className="text-center"><p className="font-serif text-3xl text-foreground">ORO<span className="text-accent">✦</span></p><p className="mt-1 text-sm text-muted-foreground">Admin dashboard</p></div>
      <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" name="username" autoComplete="username" required /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
    </form>
  </div>;
}
