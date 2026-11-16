import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import { EnvService } from '../config/env.service';
import type { RenderedEmail } from './mail.templates';

/**
 * Single funnel for outbound email. Transport is SMTP for both dev (Mailhog)
 * and prod (Brevo SMTP relay) — same nodemailer client, just different creds.
 *
 * If you later want to use Brevo's HTTP API instead of SMTP, swap the
 * transport here without touching callers.
 */
@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly from: string;
  private readonly useBrevoApi: boolean;
  private readonly brevoApiKey: string;

  constructor(private readonly env: EnvService) {
    const cfg = env.config;
    this.fromAddress = cfg.MAIL_FROM_ADDRESS;
    this.fromName = cfg.MAIL_FROM_NAME;
    this.from = `"${cfg.MAIL_FROM_NAME}" <${cfg.MAIL_FROM_ADDRESS}>`;
    this.brevoApiKey = cfg.BREVO_API_KEY;
    this.useBrevoApi = cfg.MAIL_TRANSPORT === 'brevo' || Boolean(cfg.BREVO_API_KEY);

    if (!this.useBrevoApi) {
      this.transporter = nodemailer.createTransport({
        host: cfg.MAIL_SMTP_HOST,
        port: cfg.MAIL_SMTP_PORT,
        secure: cfg.MAIL_SMTP_PORT === 465,
        auth:
          cfg.MAIL_SMTP_USER && cfg.MAIL_SMTP_PASSWORD
            ? { user: cfg.MAIL_SMTP_USER, pass: cfg.MAIL_SMTP_PASSWORD }
            : undefined,
      });
    }
  }

  async send(to: string, email: RenderedEmail): Promise<void> {
    try {
      if (this.useBrevoApi && this.brevoApiKey) {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': this.brevoApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: this.fromName, email: this.fromAddress },
            to: [{ email: to }],
            subject: email.subject,
            htmlContent: email.html,
            textContent: email.text,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
        }

        const data = (await response.json()) as { messageId?: string };
        this.logger.log(`Email sent via Brevo HTTP to=${to} subject=${email.subject} id=${data.messageId}`);
        return;
      }

      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: this.from,
          to,
          subject: email.subject,
          text: email.text,
          html: email.html,
        });
        this.logger.log(`Email sent to=${to} subject=${email.subject} id=${info.messageId}`);
      }
    } catch (err) {
      this.logger.error(
        `Email send failed to=${to} subject=${email.subject}: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  onModuleDestroy(): void {
    this.transporter?.close();
  }
}
