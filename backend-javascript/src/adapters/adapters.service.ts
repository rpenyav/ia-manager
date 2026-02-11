import { Injectable } from '@nestjs/common';
import { AwsBedrockAdapter } from './aws-bedrock.adapter';
import { AzureOpenAIAdapter } from './azure-openai.adapter';
import { GoogleVertexAdapter } from './google-vertex.adapter';
import { MockAdapter } from './mock.adapter';
import { OpenAIAdapter } from './openai.adapter';
import { ProviderInvocationResult } from './types';

@Injectable()
export class AdaptersService {
  async invokeProvider(
    providerType: string,
    credentials: string,
    model: string,
    payload: Record<string, unknown>
  ): Promise<ProviderInvocationResult> {
    const normalized = (providerType || 'openai').toLowerCase();
    const parsedCredentials = this.safeParse(credentials);

    const adapter = this.resolveAdapter(normalized);
    return adapter.invoke(parsedCredentials, model, payload);
  }

  private resolveAdapter(providerType: string) {
    switch (providerType) {
      case 'azure':
      case 'azure_openai':
      case 'azure-openai':
        return new AzureOpenAIAdapter();
      case 'aws':
      case 'bedrock':
      case 'aws-bedrock':
        return new AwsBedrockAdapter();
      case 'google':
      case 'gcp':
      case 'vertex':
      case 'vertex-ai':
        return new GoogleVertexAdapter();
      case 'mock':
        return new MockAdapter();
      case 'openai':
      default:
        return new OpenAIAdapter();
    }
  }

  private safeParse(credentials: string) {
    try {
      return JSON.parse(credentials) as Record<string, unknown>;
    } catch (error) {
      throw new Error('Invalid credentials format, must be JSON');
    }
  }
}
