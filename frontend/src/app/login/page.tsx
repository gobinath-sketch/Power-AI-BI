'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Mail } from 'lucide-react';

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

  async function outlook() {
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
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
    <div className="min-h-screen text-foreground [background-image:radial-gradient(70%_60%_at_20%_30%,rgba(251,146,60,0.22),transparent_62%),radial-gradient(65%_55%_at_55%_25%,rgba(236,72,153,0.16),transparent_60%),radial-gradient(60%_60%_at_45%_90%,rgba(168,85,247,0.10),transparent_65%),linear-gradient(to_bottom,#fff7f1,#fffdfb)]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-5 py-12">
        <div className="relative w-full overflow-hidden rounded-[28px] border border-border bg-white/80 shadow-soft backdrop-blur">
          <div className="grid min-h-[780px] grid-cols-1 lg:grid-cols-2">
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
              <div className="absolute left-6 top-6 sm:left-10 sm:top-8">
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

              <div className="mx-auto w-full max-w-sm">
                <div className="min-h-[540px] rounded-[26px] border border-white/40 bg-white/40 p-6 shadow-soft backdrop-blur-xl ring-1 ring-white/30">
                  <div className="text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                      Welcome back
                    </h1>
                  
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
                        <Mail className="h-4 w-4 shrink-0 text-neutral-400" />
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
                      </div>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/45 bg-white/35 px-3 py-2.5 backdrop-blur-xl">
                        <Lock className="h-4 w-4 shrink-0 text-neutral-400" />
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

                    <div className="flex justify-center">
                      <Button
                        type="submit"
                        className="h-12 w-56 rounded-2xl border border-[#d8dde7] bg-[#eceef3] text-lg font-semibold text-[#1f2937] shadow-[5px_5px_10px_rgba(168,173,184,0.5),-5px_-5px_10px_rgba(255,255,255,0.95)] hover:bg-[#e7eaf0] active:shadow-[inset_3px_3px_7px_rgba(168,173,184,0.55),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]"
                        disabled={loading}
                      >
                        {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                      </Button>
                    </div>

                    <div className="relative pt-2">
                      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center">
                        <div className="w-full border-t border-neutral-300/70" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="rounded-full border border-neutral-200/70 bg-white/80 px-4 py-1 text-xs font-medium tracking-wide text-neutral-600 backdrop-blur-sm">
                          Or continue with Below
                        </span>
                      </div>
                    </div>

                    <div className="pt-3">
                      <div className="mx-auto flex items-center justify-center gap-3">
                      <button
                        type="button"
                        className="block transition-opacity hover:opacity-90 disabled:opacity-60"
                        onClick={google}
                        disabled={loading}
                        aria-label="Continue with Google"
                      >
                        <Image
                          src="/google-logo-search-new-svgrepo-com.svg"
                          alt="Google"
                          width={20}
                          height={20}
                          className="h-[30px] w-[30px]"
                        />
                      </button>
                      <span className="text-2xl font-semibold leading-none text-neutral-500">/</span>
                      <button
                        type="button"
                        className="block transition-opacity hover:opacity-90 disabled:opacity-60"
                        onClick={outlook}
                        disabled={loading}
                        aria-label="Outlook"
                      >
                        <Image
                          src="/ms-outlook-svgrepo-com.svg"
                          alt="Outlook"
                          width={20}
                          height={20}
                          className="h-[30px] w-[30px]"
                        />
                      </button>
                      </div>
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
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/35" />
              <div className="relative flex h-full items-start">
                <div className="w-full space-y-4 border border-white/35 bg-white/15 p-6 backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
                    Power AI Platform
                  </p>
                  <h2 className="text-3xl font-semibold leading-tight text-white">
                    Build reports faster from your datasets.
                  </h2>
                  <p className="max-w-md text-sm text-white/85">
                    Connect data, generate insights, and export professional reports with AI support in
                    one workflow.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="border border-white/40 bg-white/20 px-3 py-1 text-xs font-medium text-white/90">
                      AI Insights
                    </span>
                    <span className="border border-white/40 bg-white/20 px-3 py-1 text-xs font-medium text-white/90">
                      PDF + HTML Export
                    </span>
                    <span className="border border-white/40 bg-white/20 px-3 py-1 text-xs font-medium text-white/90">
                      Scheduled Email
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
