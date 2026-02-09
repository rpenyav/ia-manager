import { ProviderAdapter, ProviderInvocationResult } from './types';

export class MockAdapter implements ProviderAdapter {
  async invoke(
    _credentials: Record<string, unknown>,
    model: string,
    payload: Record<string, unknown>
  ): Promise<ProviderInvocationResult> {
    return {
      output: {
        message: 'mock-response',
        model,
        payload
      },
      tokensIn: 50,
      tokensOut: 20,
      costUsd: 0
    };
  }
}
