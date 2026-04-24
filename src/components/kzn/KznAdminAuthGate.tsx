import { FormEvent, useEffect, useState } from 'react';
import KznAdminDashboard from './KznAdminDashboard';
import KznRegistrationFlow from './KznRegistrationFlow';
import { kznSupabase } from '../../lib/kznSupabase';

type KznAdminAuthGateProps = {
  onBack: () => void;
};

export default function KznAdminAuthGate({ onBack }: KznAdminAuthGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMemberRegistration, setShowMemberRegistration] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      if (!kznSupabase) {
        if (mounted) {
          setError('Supabase client is not configured.');
          setInitializing(false);
        }
        return;
      }

      const { data, error: sessionError } = await kznSupabase.auth.getSession();
      if (!mounted) return;

      if (sessionError) {
        setError(sessionError.message || 'Failed to check auth session.');
      }
      setAuthEmail(data.session?.user?.email ?? null);
      setInitializing(false);
    };

    void initSession();

    const { data: authListener } = kznSupabase
      ? kznSupabase.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return;
          setAuthEmail(session?.user?.email ?? null);
          setError(null);
        })
      : { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!kznSupabase) {
      setError('Supabase client is not configured.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signInError } = await kznSupabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError(signInError.message || 'Invalid email or password.');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    if (!kznSupabase) return;
    setLoading(true);
    setError(null);
    const { error: signOutError } = await kznSupabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message || 'Unable to sign out.');
    }
    setLoading(false);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#1C2B3A] flex items-center justify-center p-6">
        <div className="rounded-xl bg-[#243447] px-6 py-4 text-sm font-medium text-white shadow-lg">
          Checking admin session...
        </div>
      </div>
    );
  }

  if (!authEmail) {
    return (
      <div className="min-h-screen bg-[#1C2B3A] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md rounded-2xl bg-[#243447] p-6 md:p-8 shadow-xl border border-white/20">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#C9A035] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#243447] hover:text-white transition-colors"
          >
            Back
          </button>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C9A035]">Admin Access</p>
          <h1 className="mt-2 text-2xl font-display font-black uppercase text-white">
            Sign in
          </h1>

          {error ? (
            <div className="mt-4 rounded-md border border-[#a85555] bg-[#3f1f1f] px-3 py-2 text-sm text-[#fca5a5]">
              {error}
            </div>
          ) : null}

          <form onSubmit={(e) => void handleSignIn(e)} className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-white/20 px-3 py-3 text-sm text-white outline-none focus:border-[#C9A035] focus:ring-2 focus:ring-[#C9A035]/20"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-md border border-white/20 px-3 py-3 text-sm text-white outline-none focus:border-[#C9A035] focus:ring-2 focus:ring-[#C9A035]/20"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#243447] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-[#1C2B3A] transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showMemberRegistration) {
    return <KznRegistrationFlow onClose={() => setShowMemberRegistration(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#1C2B3A]">
      <div className="mx-auto max-w-[96rem] px-6 pt-4 md:px-10">
        <div className="rounded-md border border-white/15 bg-[#243447]/10 px-4 py-2 text-xs text-white flex flex-wrap items-center gap-2">
          <span>
            Signed in as <span className="font-semibold">{authEmail}</span>
          </span>
          <span className="text-white/50">·</span>
          <button
            type="button"
            onClick={() => setShowMemberRegistration(true)}
            className="font-semibold text-[#C9A035] hover:text-[#ff4d4d] transition-colors"
          >
            Register a member
          </button>
          <span className="text-white/50">·</span>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="font-semibold text-[#C9A035] hover:text-[#ff4d4d] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
      <KznAdminDashboard onBack={onBack} />
    </div>
  );
}
