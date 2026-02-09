export const pricingDefaults = [
  {
    providerType: 'openai',
    model: 'gpt-4o-mini',
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006
  },
  {
    providerType: 'openai',
    model: 'gpt-4.1-mini',
    inputCostPer1k: 0.0004,
    outputCostPer1k: 0.0016
  },
  {
    providerType: 'aws-bedrock',
    model: 'claude-3.5-sonnet',
    inputCostPer1k: 0.006,
    outputCostPer1k: 0.003
  },
  {
    providerType: 'vertex-ai',
    model: 'gemini-2.0-flash',
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006
  },
  {
    providerType: 'vertex-ai',
    model: 'gemini-2.0-flash-lite',
    inputCostPer1k: 0.000075,
    outputCostPer1k: 0.0003
  }
];
