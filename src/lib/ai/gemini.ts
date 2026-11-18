import { AIError, type AIProvider, type AIRequest, type AIResponse } from './provider';
import { isTransient } from '@/lib/utils';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      const status = (e as { status?: number })?.status;
      if (status && isTransient(status)) { await sleep(300 * 2 ** i); continue; }
      throw e;
    }
  }
  throw lastErr;
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  constructor(
    private key: string,
    private model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
    private embedModel = 'text-embedding-004',
  ) {}

  async complete(req: AIRequest): Promise<AIResponse> {
    const body = {
      contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
      ...(req.system ? { systemInstruction: { parts: [{ text: req.system }] } } : {}),
      generationConfig: {
        temperature: req.temperature ?? 0.4,
        ...(req.jsonSchema ? { responseMimeType: 'application/json', responseSchema: req.jsonSchema } : {}),
      },
    };
    const data = await withRetry(async () => {
      const res = await fetch(`${BASE}/${this.model}:generateContent?key=${this.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        const err = new AIError(`Gemini ${res.status}: ${text.slice(0, 300)}`, isTransient(res.status)) as
          AIError & { status?: number };
        err.status = res.status;
        throw err;
      }
      return res.json() as Promise<any>;
    });
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
    let structured: unknown;
    try { structured = text ? JSON.parse(text) : undefined; } catch { structured = undefined; }
    return { text, structured, usage: data?.usageMetadata, model: this.model };
  }

  async embed(text: string): Promise<number[]> {
    const res = await withRetry(async () => {
      const r = await fetch(`${BASE}/${this.embedModel}:embedContent?key=${this.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: `models/${this.embedModel}`, content: { parts: [{ text }] } }),
      });
      if (!r.ok) {
        const err = new AIError(`embed ${r.status}`, isTransient(r.status)) as AIError & { status?: number };
        err.status = r.status;
        throw err;
      }
      return r.json() as Promise<any>;
    });
    const v = res?.embedding?.values;
    if (!Array.isArray(v) || !v.length) throw new AIError('empty embedding');
    return v as number[];
  }
}