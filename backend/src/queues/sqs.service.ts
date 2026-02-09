import { Injectable } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqsService {
  private readonly client: SQSClient;
  private readonly queueUrl?: string;

  constructor(private readonly configService: ConfigService) {
    this.queueUrl = this.configService.get<string>('SQS_QUEUE_URL') || undefined;
    const region = this.configService.get<string>('SQS_REGION') || 'us-east-1';

    this.client = new SQSClient({
      region,
      credentials: this.configService.get<string>('SQS_ACCESS_KEY_ID')
        ? {
            accessKeyId: this.configService.get<string>('SQS_ACCESS_KEY_ID') as string,
            secretAccessKey: this.configService.get<string>('SQS_SECRET_ACCESS_KEY') as string
          }
        : undefined
    });
  }

  async sendMessage(body: Record<string, unknown>) {
    if (!this.queueUrl) {
      return { skipped: true };
    }

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(body)
    });

    return this.client.send(command);
  }
}
