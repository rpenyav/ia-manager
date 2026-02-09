export type ProviderInvocationResult = {
  output: Record<string, unknown>;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
};

export type ProviderAdapter = {
  invoke: (
    credentials: Record<string, unknown>,
    model: string,
    payload: Record<string, unknown>
  ) => Promise<ProviderInvocationResult>;
};
