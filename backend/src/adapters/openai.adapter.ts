import { ProviderAdapter, ProviderInvocationResult } from './types';

export class OpenAIAdapter implements ProviderAdapter {
  async invoke(
    credentials: Record<string, unknown>,
    model: string,
    payload: Record<string, unknown>
  ): Promise<ProviderInvocationResult> {
    const apiKey = String(credentials.apiKey || '');
    const baseUrl = String(credentials.baseUrl || 'https://api.openai.com');

    if (!apiKey) {
      throw new Error('Missing OpenAI apiKey');
    }

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, ...payload })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as any;
    const usage = data.usage || {};

    return {
      output: data,
      tokensIn: Number(usage.prompt_tokens || 0),
      tokensOut: Number(usage.completion_tokens || 0),
      costUsd: 0
    };
  }
}
