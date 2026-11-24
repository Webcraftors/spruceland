import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { readAccount, type Account } from './account-access';

const AccountContext = createContext<{ account: Account | null; loading: boolean; error: string; refresh: () => Promise<Account | null>; signOut: () => Promise<void> }>({ account: null, loading: true, error: '', refresh: async () => null, signOut: async () => {} });

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const router = useRouter();
  const queryClient = useQueryClient();
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const next = await readAccount();
      if (current === generation.current) { setAccount(next); setError(''); }
      return next;
    } catch (e) {
      if (current === generation.current) { setAccount(null); setError(e instanceof Error ? e.message : 'Could not load your account.'); }
      return null;
    } finally { if (current === generation.current) setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      // Defer Auth requests until the Auth callback releases its lock.
      setTimeout(() => {
        if (event === 'SIGNED_OUT') { generation.current++; setAccount(null); queryClient.clear(); }
        else { void refresh(); void queryClient.invalidateQueries(); }
        void router.invalidate();
      }, 0);
    });
    return () => { subscription.unsubscribe(); generation.current++; };
  }, [refresh, router, queryClient]);
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    generation.current++;
    setAccount(null);
    localStorage.removeItem('spruceland.session.v1');
    localStorage.removeItem('spruceland.client.session.v1');
    await router.navigate({ to: '/', replace: true });
  };
  return <AccountContext.Provider value={{ account, loading, error, refresh, signOut }}>{children}</AccountContext.Provider>;
}

export const useAccount = () => useContext(AccountContext);