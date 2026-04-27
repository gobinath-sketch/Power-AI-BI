'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

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
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-neutral-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Power BI Analytics
          </p>
          <h1 className="mt-8 text-4xl font-semibold leading-tight">
            Secure analytics on your workspace data.
          </h1>
          <p className="mt-4 max-w-md text-neutral-400">
            Service-principal access to Power BI REST, OpenAI insights on aggregates, and
            automated reporting — built for production.
          </p>
        </div>
        <p className="text-sm text-neutral-500">Read-only · Auditable · Server-side secrets</p>
      </div>
      <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
            ← Back
          </Link>
          <h2 className="mt-6 text-2xl font-semibold">Welcome back</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Sign in with Google or use email credentials configured in Supabase.
          </p>

          <Button
            type="button"
            className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl"
            onClick={google}
            disabled={loading}
          >
            Continue with Google
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-400">Or email</span>
            </div>
          </div>

          <div className="mb-4 flex rounded-xl border border-neutral-200 p-1">
            <button
              type="button"
              onClick={() => {
                setErr(null);
                setMode('signin');
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                mode === 'signin' ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setErr(null);
                setMode('signup');
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                mode === 'signup' ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Sign up
            </button>
          </div>

          <form className="space-y-4" onSubmit={mode === 'signin' ? emailSignIn : signUp}>
            <div>
              <label className="text-xs font-medium text-neutral-600">Email</label>
              <input
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600">Password</label>
              <input
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {mode === 'signup' && (
                <p className="mt-2 text-xs text-neutral-500">
                  Use at least 8 characters. If you still get 422, check Supabase Auth settings (signups enabled,
                  captcha off, and password policy).
                </p>
              )}
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
