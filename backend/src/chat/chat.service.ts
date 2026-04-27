import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AI_TIMEOUT_MS } from '../common/constants';
import type { ReportPayload } from '../reports/aggregation.service';

export type ChatIntent = 'trend' | 'comparison' | 'anomaly' | 'topn' | 'unclear';

export interface ChatResult {
  reply: string;
  intent: ChatIntent;
  confidence: number;
  clarify?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {
    const key = config.get<string>('OPENAI_API_KEY');
    if (key) {
      const baseURL = config.get<string>('OPENAI_BASE_URL')?.trim();
      this.client = new OpenAI({ apiKey: key, baseURL: baseURL || undefined });
    }
  }

  classifyIntent(q: string): { intent: ChatIntent; confidence: number } {
    const s = q.toLowerCase();
    let scoreTrend = 0;
    let scoreCompare = 0;
    let scoreAnomaly = 0;
    let scoreTop = 0;
    if (/\b(trend|over time|growth|season|moving)\b/.test(s)) scoreTrend += 0.8;
    if (/\b(compare|vs|versus|difference|between|year over year|yoy)\b/.test(s))
      scoreCompare += 0.85;
    if (/\b(anomal|spike|drop|outlier|unusual)\b/.test(s)) scoreAnomaly += 0.85;
    if (/\b(top|bottom|rank|highest|lowest|first \d+)\b/.test(s)) scoreTop += 0.8;
    const scores: [ChatIntent, number][] = [
      ['trend', scoreTrend],
      ['comparison', scoreCompare],
      ['anomaly', scoreAnomaly],
      ['topn', scoreTop],
    ];
    scores.sort((a, b) => b[1] - a[1]);
    const best = scores[0];
    const second = scores[1][1];
    if (best[1] < 0.35) {
      return { intent: 'unclear', confidence: 0.2 };
    }
    const confidence = Math.min(0.99, best[1] + (best[1] - second) * 0.2);
    return { intent: best[0], confidence };
  }

  async answer(
    question: string,
    context: ReportPayload | null,
  ): Promise<ChatResult> {
    const { intent, confidence } = this.classifyIntent(question);
    if (intent === 'unclear' || confidence < 0.45) {
      return {
        reply: '',
        intent: 'unclear',
        confidence,
        clarify:
          'Should I focus on trends over time, comparisons between categories, anomalies/spikes, or a top/bottom ranking?',
      };
    }

    const ctx = context
      ? JSON.stringify({
          kpis: context.kpis,
          stats: context.stats.numericSummaries,
          charts: context.charts.map((c) => ({
            title: c.title,
            kind: c.kind,
          })),
          rowCount: context.rowCount,
        })
      : '{}';

    if (!this.client) {
      return {
        reply:
          'Chat AI is offline. KPIs and chart summaries are still from your Power BI dataset.',
        intent,
        confidence,
      };
    }

    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() ||
      'openai/gpt-4o-mini';
    const sys = `You answer analytics questions using ONLY the JSON context (aggregates from Power BI).
Never invent raw numbers. Reference trends qualitatively if exact figures are not in context.
Keep answer under 180 words.`;

    try {
      const p = this.client.chat.completions.create({
        model,
        temperature: 0.25,
        messages: [
          { role: 'system', content: sys },
          {
            role: 'user',
            content: `Intent: ${intent}\nContext:\n${ctx}\nQuestion: ${question}`,
          },
        ],
      });
      const result = await Promise.race([
        p,
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('timeout')), AI_TIMEOUT_MS),
        ),
      ]);
      const reply = result.choices[0]?.message?.content?.trim() ?? '';
      return { reply, intent, confidence };
    } catch (e) {
      this.logger.warn(`chat failed ${e}`);
      return {
        reply:
          'I could not reach the AI service in time. Please try a shorter question.',
        intent,
        confidence,
      };
    }
  }
}
