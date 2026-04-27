'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AtSign } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  async function google() {
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) setErr(error.message);
    setLoading(false);
  }

  async function emailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    if (!email.trim()) {
      setErr('Email is required.');
      setLoading(false);
      return;
    }
    if (!password) {
      setErr('Password is required.');
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    else window.location.href = '/dashboard';
    setLoading(false);
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    if (!email.trim()) {
      setErr('Email is required.');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      // Supabase 422 errors are often configuration-related (signups disabled, captcha, password rules)
      setErr(error.message);
    } else {
      setErr(
        'Signup created. If email confirmation is enabled, check your inbox; otherwise you can sign in now.',
      );
      setMode('signin');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(80%_60%_at_50%_0%,rgba(59,130,246,0.14),transparent_60%),radial-gradient(60%_60%_at_10%_15%,rgba(168,85,247,0.12),transparent_55%),linear-gradient(to_bottom,#f7fbff,#ffffff)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10">
        <div className="relative w-full overflow-hidden rounded-[28px] border border-border bg-white/80 shadow-soft backdrop-blur">
          <div className="grid min-h-[640px] grid-cols-1 lg:grid-cols-2">
            {/* Left: Login card */}
            <div
              className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14"
              style={{
                backgroundImage: "url('/login-left-bg-v2.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="mx-auto w-full max-w-md">
                <div className="rounded-[26px] border border-white/40 bg-white/40 p-6 shadow-soft backdrop-blur-xl ring-1 ring-white/30">
                  <div className="flex items-center justify-start">
                    <Link href="/" aria-label="Back to home">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 gap-2 rounded-2xl px-3 text-sm"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-4 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                      Welcome back
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600">
                      Good to see you again — let’s log you in.
                    </p>
                  </div>

                  <div className="mt-5 flex rounded-2xl border border-white/40 bg-white/35 p-1 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => {
                    setErr(null);
                    setMode('signin');
                  }}
                  className={[
                    'flex-1 rounded-xl px-3 py-2.5 text-base font-semibold transition-all',
                    mode === 'signin'
                      ? 'bg-[#dfe2e7] text-[#1c1e22] shadow-[inset_3px_3px_7px_rgba(168,173,184,0.6),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]'
                      : 'bg-[#eceef3] text-[#4b5563] shadow-[3px_3px_7px_rgba(168,173,184,0.45),-3px_-3px_7px_rgba(255,255,255,0.95)] hover:bg-[#e7eaf0]',
                  ].join(' ')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErr(null);
                    setMode('signup');
                  }}
                  className={[
                    'flex-1 rounded-xl px-3 py-2.5 text-base font-semibold transition-all',
                    mode === 'signup'
                      ? 'bg-[#dfe2e7] text-[#1c1e22] shadow-[inset_3px_3px_7px_rgba(168,173,184,0.6),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]'
                      : 'bg-[#eceef3] text-[#4b5563] shadow-[3px_3px_7px_rgba(168,173,184,0.45),-3px_-3px_7px_rgba(255,255,255,0.95)] hover:bg-[#e7eaf0]',
                  ].join(' ')}
                >
                  Sign up
                </button>
                  </div>

                  <form className="mt-5 space-y-4" onSubmit={mode === 'signin' ? emailSignIn : signUp}>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Email
                      </label>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/45 bg-white/35 px-3 py-2.5 backdrop-blur-xl">
                        <AtSign className="h-4 w-4 text-neutral-400" />
                        <input
                          className="w-full bg-transparent text-base outline-none placeholder:text-neutral-400"
                          placeholder="Enter your email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Password
                        </label>
                        <span className="text-xs font-medium text-neutral-500 hover:text-neutral-900">
                          Forgot password
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/45 bg-white/35 px-3 py-2.5 backdrop-blur-xl">
                        <input
                          className="w-full bg-transparent text-base outline-none placeholder:text-neutral-400"
                          placeholder="Enter your password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        />
                      </div>
                    </div>

                    {err && <p className="text-sm text-red-600">{err}</p>}

                    <Button
                      type="submit"
                      className="h-12 w-full rounded-2xl border border-[#d8dde7] bg-[#eceef3] text-lg font-semibold text-[#1f2937] shadow-[5px_5px_10px_rgba(168,173,184,0.5),-5px_-5px_10px_rgba(255,255,255,0.95)] hover:bg-[#e7eaf0] active:shadow-[inset_3px_3px_7px_rgba(168,173,184,0.55),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]"
                      disabled={loading}
                    >
                      {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                    </Button>

                    <div className="relative pt-2">
                      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center">
                        <div className="w-full border-t border-neutral-300/70" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="rounded-full border border-neutral-200/70 bg-white/80 px-4 py-1 text-xs font-medium tracking-wide text-neutral-600 backdrop-blur-sm">
                          Or continue with Google
                        </span>
                      </div>
                    </div>

                    <div className="pt-3">
                      <Button
                        type="button"
                        className="mx-auto flex h-12 w-20 items-center justify-center rounded-2xl border border-[#d8dde7] bg-[#eceef3] shadow-[4px_4px_9px_rgba(168,173,184,0.5),-4px_-4px_9px_rgba(255,255,255,0.95)] hover:bg-[#e7eaf0] active:shadow-[inset_3px_3px_7px_rgba(168,173,184,0.55),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]"
                        onClick={google}
                        disabled={loading}
                        aria-label="Continue with Google"
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                            <path
                              fill="#EA4335"
                              d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4a9.6 9.6 0 1 0 0 19.2c5.5 0 9.1-3.8 9.1-9.1 0-.6-.1-1-.2-1.4H12Z"
                            />
                            <path fill="#34A853" d="M3.3 7.8 6.5 10.1A6 6 0 0 1 12 6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4A9.5 9.5 0 0 0 3.3 7.8Z" />
                            <path fill="#FBBC05" d="M12 21.6c2.6 0 4.8-.9 6.4-2.4l-3-2.3c-.8.6-1.8 1-3.4 1-2.7 0-5-1.8-5.8-4.4l-3.1 2.4A9.6 9.6 0 0 0 12 21.6Z" />
                            <path fill="#4285F4" d="M21.1 12.5c0-.6-.1-1-.2-1.4H12v3.9h5.5c-.3 1-1 1.9-2 2.6l3 2.3c1.8-1.7 2.8-4.1 2.8-7.4Z" />
                          </svg>
                        </span>
                      </Button>
                  </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Right: Illustration panel */}
            <div
              className="relative hidden overflow-hidden p-10 lg:block"
              style={{
                backgroundImage: "url('/login-bg.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
