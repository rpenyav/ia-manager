import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ProviderAdapter, ProviderInvocationResult } from './types';

export class AwsBedrockAdapter implements ProviderAdapter {
  async invoke(
    credentials: Record<string, unknown>,
    model: string,
    payload: Record<string, unknown>
  ): Promise<ProviderInvocationResult> {
    const accessKeyId = String(credentials.accessKeyId || '');
    const secretAccessKey = String(credentials.secretAccessKey || '');
    const sessionToken = credentials.sessionToken ? String(credentials.sessionToken) : undefined;
    const region = String(credentials.region || 'us-east-1');
    const modelId = String(credentials.modelId || model || '');

    if (!accessKeyId || !secretAccessKey || !modelId) {
      throw new Error('Missing AWS Bedrock credentials (accessKeyId, secretAccessKey, modelId)');
    }

    const client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken
      }
    });

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await client.send(command);

    const chunks: Uint8Array[] = [];
    if (response.body) {
      for await (const chunk of response.body as any) {
        chunks.push(chunk as Uint8Array);
      }
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    const data = raw ? JSON.parse(raw) : {};
    const usage = data.usage || {};
    const tokensIn = Number(usage.input_tokens || usage.prompt_tokens || 0);
    const tokensOut = Number(usage.output_tokens || usage.completion_tokens || 0);

    return {
      output: data,
      tokensIn,
      tokensOut,
      costUsd: 0
    };
  }
}
