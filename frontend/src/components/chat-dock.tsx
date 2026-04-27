'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

type Props = {
  token: string;
};

export function ChatDock({ token }: Props) {
  const pathname = usePathname();
  const reportMatch = pathname?.match(/^\/reports\/([0-9a-f-]{36})/i);
  const reportId = reportMatch?.[1];
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [lines, setLines] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, open]);

  async function send() {
    if (!msg.trim() || loading) return;
    const userLine = msg.trim();
    setMsg('');
    setLines((l) => [...l, { role: 'user', text: userLine }]);
    setLoading(true);
    try {
      const res = await apiFetch<{
        reply: string;
        clarify?: string;
        sessionId?: string;
        intent: string;
        confidence: number;
      }>('/chat/query', token, {
        method: 'POST',
        body: JSON.stringify({
          message: userLine,
          reportId: reportId ?? undefined,
          sessionId,
        }),
      });
      if (res.sessionId) setSessionId(res.sessionId);
      const text = res.reply || res.clarify || 'No response.';
      setLines((l) => [...l, { role: 'assistant', text }]);
    } catch (e) {
      setLines((l) => [
        ...l,
        { role: 'assistant', text: `Error: ${String(e)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-soft transition hover:scale-105',
          open && 'pointer-events-none opacity-0',
        )}
        aria-label="Open assistant"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Analysis assistant</p>
              <p className="text-xs text-neutral-500">
                Uses report aggregates — no raw fabrication
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-80 overflow-y-auto px-3 py-2 text-sm">
            {lines.length === 0 && (
              <p className="text-neutral-500">
                Ask about trends, comparisons, anomalies, or top categories.
              </p>
            )}
            {lines.map((l, i) => (
              <div
                key={i}
                className={cn(
                  'mb-2 rounded-lg px-3 py-2',
                  l.role === 'user'
                    ? 'ml-8 bg-neutral-900 text-white'
                    : 'mr-4 bg-neutral-50 text-neutral-800',
                )}
              >
                {l.text}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="flex gap-2 border-t border-neutral-100 p-3">
            <input
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              placeholder="Ask a question…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button
              type="button"
              onClick={send}
              disabled={loading}
              className="rounded-lg bg-neutral-900 p-2 text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
