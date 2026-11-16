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
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly env: EnvService) {
    const cfg = env.config;
    this.transporter = nodemailer.createTransport({
      host: cfg.MAIL_SMTP_HOST,
      port: cfg.MAIL_SMTP_PORT,
      secure: cfg.MAIL_SMTP_PORT === 465,
      auth:
        cfg.MAIL_SMTP_USER && cfg.MAIL_SMTP_PASSWORD
          ? { user: cfg.MAIL_SMTP_USER, pass: cfg.MAIL_SMTP_PASSWORD }
          : undefined,
    });
    this.from = `"${cfg.MAIL_FROM_NAME}" <${cfg.MAIL_FROM_ADDRESS}>`;
  }

  async send(to: string, email: RenderedEmail): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      this.logger.log(`Email sent to=${to} subject=${email.subject} id=${info.messageId}`);
    } catch (err) {
      this.logger.error(
        `Email send failed to=${to} subject=${email.subject}: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }
}
