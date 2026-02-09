import { GoogleAuth } from 'google-auth-library';
import { ProviderAdapter, ProviderInvocationResult } from './types';

export class GoogleVertexAdapter implements ProviderAdapter {
  async invoke(
    credentials: Record<string, unknown>,
    model: string,
    payload: Record<string, unknown>
  ): Promise<ProviderInvocationResult> {
    const projectId = String(credentials.projectId || '');
    const location = String(credentials.location || 'us-central1');
    const modelId = String(credentials.model || model || '');
    const serviceAccount = (credentials.serviceAccount || credentials) as Record<string, unknown>;
    const clientEmail = String(serviceAccount.client_email || serviceAccount.clientEmail || '');
    const privateKey = String(serviceAccount.private_key || serviceAccount.privateKey || '');

    if (!projectId || !modelId || !clientEmail || !privateKey) {
      throw new Error('Missing Google Vertex credentials (projectId, model, client_email, private_key)');
    }

    const auth = new GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const accessToken = await auth.getAccessToken();
    if (!accessToken) {
      throw new Error('Unable to obtain Google access token');
    }

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Vertex error: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as any;
    const usage = data.usageMetadata || {};
    const tokensIn = Number(usage.promptTokenCount || 0);
    const tokensOut = Number(usage.candidatesTokenCount || 0);

    return {
      output: data,
      tokensIn,
      tokensOut,
      costUsd: 0
    };
  }
}
