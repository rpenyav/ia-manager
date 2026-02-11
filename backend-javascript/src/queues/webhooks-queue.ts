export const WEBHOOKS_QUEUE = 'WEBHOOKS_QUEUE';

export type WebhooksQueue = {
  add: (name: string, data: { webhookId: string; event: unknown }) => Promise<unknown>;
};
