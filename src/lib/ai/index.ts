import { GeminiProvider } from './gemini';
import type { AIProvider } from './provider';

let cached: AIProvider | null = null;

/** Returns the configured provider, or null when GEMINI_API_KEY is absent. */
export function getProvider(): AIProvider | null {
  if (cached) return cached;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  cached = new GeminiProvider(key);
  return cached;
}
export function aiConfigured() { return !!process.env.GEMINI_API_KEY; }