import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AI_TIMEOUT_MS } from '../common/constants';
import type { ReportPayload } from '../reports/aggregation.service';

interface InsightResult {
  summary: string;
  risks: string[];
  opportunities: string[];
  anomalies: string[];
  recommendations: string[];
  cached?: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI | null = null;
  private readonly insightCache = new Map<string, InsightResult>();

  constructor(private readonly config: ConfigService) {
    const key = config.get<string>('OPENAI_API_KEY');
    if (key) {
      const baseURL = config.get<string>('OPENAI_BASE_URL')?.trim();
      this.client = new OpenAI({ apiKey: key, baseURL: baseURL || undefined });
    }
  }

  private cacheKey(checksum: string): string {
    return `ins:${checksum}`;
  }

  async generateReportInsights(
    payload: ReportPayload,
    schemaChecksum: string,
  ): Promise<InsightResult> {
    const key = this.cacheKey(schemaChecksum);
    const hit = this.insightCache.get(key);
    if (hit) return { ...hit, cached: true };

    const statsJson = JSON.stringify({
      rowCount: payload.rowCount,
      kpis: payload.kpis,
      numericSummaries: payload.stats.numericSummaries,
      chartTitles: payload.charts.map((c) => c.title),
    });

    if (!this.client) {
      return this.fallback(statsJson);
    }

    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() ||
      'openai/gpt-4o-mini';
    const sys = `You are a senior BI analyst. You ONLY interpret the JSON statistics provided.
Never invent numbers, percentages, or row counts not present in the input.
If data is insufficient, say so briefly. Output strict JSON with keys:
summary (string), risks (string[]), opportunities (string[]), anomalies (string[]), recommendations (string[]).`;

    try {
      const p = this.client.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: sys },
          {
            role: 'user',
            content: `Analyze these verified aggregates from Power BI:\n${statsJson}`,
          },
        ],
      });
      const result = await Promise.race([
        p,
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('ai-timeout')), AI_TIMEOUT_MS),
        ),
      ]);
      const text = result.choices[0]?.message?.content ?? '';
      const parsed = this.safeParseInsightJson(text);
      this.insightCache.set(key, parsed);
      return parsed;
    } catch (e) {
      this.logger.warn(`OpenAI insights failed: ${e}`);
      return this.fallback(statsJson);
    }
  }

  private safeParseInsightJson(text: string): InsightResult {
    try {
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('no json');
      const j = JSON.parse(m[0]) as InsightResult;
      return {
        summary: String(j.summary ?? ''),
        risks: Array.isArray(j.risks) ? j.risks.map(String) : [],
        opportunities: Array.isArray(j.opportunities)
          ? j.opportunities.map(String)
          : [],
        anomalies: Array.isArray(j.anomalies) ? j.anomalies.map(String) : [],
        recommendations: Array.isArray(j.recommendations)
          ? j.recommendations.map(String)
          : [],
      };
    } catch {
      return this.fallback(text);
    }
  }

  private fallback(seed: string): InsightResult {
    return {
      summary:
        'AI insight service timed out or was unavailable. The KPIs and charts above are computed directly from your Power BI data.',
      risks: [],
      opportunities: [],
      anomalies: [],
      recommendations: [
        'Retry shortly, or verify OpenAI API quota and OPENAI_MODEL.',
      ],
    };
  }
}
