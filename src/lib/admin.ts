import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// The admin signs in with a username; Cloud auth needs an email, so it is derived here.
export const usernameToEmail = (username: string) => `${username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')}@oro.local`;

export async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  return data === true;
}

// Number of people with the shop open right now (shared realtime presence channel).
export function useLiveVisitors() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const channel = supabase.channel('site-presence');
    channel.on('presence', { event: 'sync' }, () => setCount(Object.keys(channel.presenceState()).length)).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);
  return count;
}

// Shrinks an uploaded photo and returns it as an embeddable image string.
export function compressImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
