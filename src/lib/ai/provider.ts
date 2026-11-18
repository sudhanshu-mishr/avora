export interface AIRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  jsonSchema?: object;
}
export interface AIUsage { promptTokens?: number; completionTokens?: number; totalTokens?: number }
export interface AIResponse {
  text: string;
  structured?: unknown;
  usage?: AIUsage;
  model: string;
}
export interface AIProvider {
  readonly name: string;
  complete(req: AIRequest): Promise<AIResponse>;
  embed(text: string): Promise<number[]>;
}

export class AIError extends Error {
  constructor(msg: string, public readonly retryable = false) { super(msg); }
}