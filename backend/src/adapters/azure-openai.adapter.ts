import { ProviderAdapter, ProviderInvocationResult } from './types';

export class AzureOpenAIAdapter implements ProviderAdapter {
  async invoke(
    credentials: Record<string, unknown>,
    model: string,
    payload: Record<string, unknown>
  ): Promise<ProviderInvocationResult> {
    const endpoint = String(credentials.endpoint || '');
    const apiKey = String(credentials.apiKey || '');
    const deployment = String(credentials.deployment || model || '');
    const apiVersion = String(credentials.apiVersion || '2024-02-15-preview');

    if (!endpoint || !apiKey || !deployment) {
      throw new Error('Missing Azure OpenAI credentials (endpoint, apiKey, deployment)');
    }

    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, ...payload })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI error: ${response.status} ${errorText}`);
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
