import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { SendMailConfig, ZeptoMail } from "zeptomail";

type ZeptoMailOptions = {
  api_key: string;
  from_email: string;
  from_name?: string;
  templates?: Record<
    string,
    {
      subject?: string;
      template_id?: string;
    }
  >;
};

type InjectedDependencies = {
  logger: Logger;
};

class ZeptoMailNotificationProviderService {
  static identifier = "zeptomail";

  private zeptomailClient: ZeptoMail;
  private options: ZeptoMailOptions;
  private logger: Logger;

  constructor({ logger }: InjectedDependencies, options: ZeptoMailOptions) {
    this.logger = logger;
    this.options = options;

    // Initialize ZeptoMail client
    this.zeptomailClient = new ZeptoMail(options.api_key);
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in ZeptoMail provider options."
      );
    }

    if (!options.from_email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from_email` is required in ZeptoMail provider options."
      );
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    try {
      const { to, template, data } = notification;

      if (!to) {
        throw new Error("Recipient email is required");
      }

      // Get template configuration
      const templateConfig = this.options.templates?.[template] || {};
      const subject =
        templateConfig.subject || this.getDefaultSubject(template);

      // Build email configuration
      const mailConfig: SendMailConfig = {
        from: {
          address: this.options.from_email,
          name: this.options.from_name || "Medusa Store",
        },
        to: [{ email_address: { address: to } }],
        subject: this.interpolateTemplate(subject, data),
        htmlbody: this.buildEmailBody(template, data),
      };

      this.logger.info(`Sending email via ZeptoMail to: ${to}`);

      const response = await this.zeptomailClient.sendMail(mailConfig);

      this.logger.info("Email sent successfully via ZeptoMail");

      return {
        id: response.data?.[0]?.message_id || Date.now().toString(),
      };
    } catch (error) {
      this.logger.error("Failed to send email via ZeptoMail", error);
      throw error;
    }
  }

  private getDefaultSubject(template: string): string {
    switch (template) {
      case "order.placed":
        return "Order Confirmation";
      case "order.shipped":
        return "Order Shipped";
      case "order.canceled":
        return "Order Canceled";
      case "customer.created":
        return "Welcome to our store";
      case "user.password_reset":
        return "Password Reset Request";
      case "invite.created":
        return "You've been invited";
      default:
        return "Notification from Medusa Store";
    }
  }

  private buildEmailBody(template: string, data: any): string {
    switch (template) {
      case "order.placed":
        return this.buildOrderPlacedTemplate(data);
      case "order.shipped":
        return this.buildOrderShippedTemplate(data);
      case "order.canceled":
        return this.buildOrderCanceledTemplate(data);
      case "customer.created":
        return this.buildCustomerCreatedTemplate(data);
      case "user.password_reset":
        return this.buildPasswordResetTemplate(data);
      case "invite.created":
        return this.buildInviteTemplate(data);
      default:
        return this.buildDefaultTemplate(data);
    }
  }

  private buildOrderPlacedTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Thank you for your order!</h2>
        <p>Hi ${data.customer?.first_name || "Customer"},</p>
        <p>We've received your order and we're processing it now.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> #${data.display_id}</p>
          <p><strong>Order Date:</strong> ${new Date(
            data.created_at
          ).toLocaleDateString()}</p>
          <p><strong>Total:</strong> ${this.formatCurrency(
            data.total,
            data.currency_code
          )}</p>
        </div>

        ${
          data.items?.length
            ? `
          <h3 style="color: #333;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="text-align: left; padding: 10px; border-bottom: 1px solid #ddd;">Item</th>
                <th style="text-align: center; padding: 10px; border-bottom: 1px solid #ddd;">Qty</th>
                <th style="text-align: right; padding: 10px; border-bottom: 1px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${data.items
                .map(
                  (item: any) => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong>${item.title}</strong>
                    ${
                      item.variant?.title
                        ? `<br><small style="color: #666;">${item.variant.title}</small>`
                        : ""
                    }
                  </td>
                  <td style="text-align: center; padding: 10px; border-bottom: 1px solid #eee;">${
                    item.quantity
                  }</td>
                  <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">${this.formatCurrency(
                    item.unit_price,
                    data.currency_code
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `
            : ""
        }

        <div style="margin-top: 30px; padding: 15px; background-color: #e8f5e8; border-radius: 5px;">
          <p style="margin: 0;"><strong>What happens next?</strong></p>
          <p style="margin: 5px 0 0 0;">We'll send you another email when your order ships with tracking information.</p>
        </div>

        <p style="margin-top: 30px;">
          If you have any questions, please don't hesitate to contact us.
        </p>
        
        <p>Best regards,<br>Your Medusa Store Team</p>
      </div>
    `;
  }

  private buildOrderShippedTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Your order has shipped!</h2>
        <p>Hi ${data.customer?.first_name || "Customer"},</p>
        <p>Great news! Your order #${
          data.display_id
        } has been shipped and is on its way to you.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Shipping Information</h3>
          <p><strong>Order Number:</strong> #${data.display_id}</p>
          <p><strong>Shipped Date:</strong> ${new Date().toLocaleDateString()}</p>
          ${
            data.tracking_number
              ? `<p><strong>Tracking Number:</strong> ${data.tracking_number}</p>`
              : ""
          }
        </div>

        <p>You can expect to receive your order within the estimated delivery time frame.</p>
        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>Your Medusa Store Team</p>
      </div>
    `;
  }

  private buildOrderCanceledTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Order Cancellation Confirmation</h2>
        <p>Hi ${data.customer?.first_name || "Customer"},</p>
        <p>We've successfully canceled your order #${
          data.display_id
        } as requested.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Cancellation Details</h3>
          <p><strong>Order Number:</strong> #${data.display_id}</p>
          <p><strong>Canceled Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Refund Amount:</strong> ${this.formatCurrency(
            data.total,
            data.currency_code
          )}</p>
        </div>

        <p>If you paid for this order, your refund will be processed within 3-5 business days.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>Your Medusa Store Team</p>
      </div>
    `;
  }

  private buildCustomerCreatedTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to our store!</h2>
        <p>Hi ${data.first_name || "Customer"},</p>
        <p>Welcome! Your account has been successfully created.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Account Information</h3>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Created:</strong> ${new Date(
            data.created_at
          ).toLocaleDateString()}</p>
        </div>

        <p>You can now start shopping and enjoy all the benefits of being a registered customer.</p>
        <p>Happy shopping!</p>
        
        <p>Best regards,<br>Your Medusa Store Team</p>
      </div>
    `;
  }

  private buildPasswordResetTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${data.first_name || "User"},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${
            data.reset_url
          }" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>

        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 24 hours for security reasons.</p>
        
        <p>Best regards,<br>Your Medusa Store Team</p>
      </div>
    `;
  }

  private buildInviteTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">You've been invited!</h2>
        <p>Hi there,</p>
        <p>You've been invited to join our store as a ${
          data.role || "team member"
        }.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${
            data.invite_url
          }" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accept Invitation
          </a>
        </div>

        <p>This invitation will expire in 7 days.</p>
        
        <p>Best regards,<br>Your Medusa Store Team</p>
      </div>
    `;
  }

  private buildDefaultTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Notification</h2>
        <p>Hi there,</p>
        <p>You have a new notification from your Medusa store.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <pre style="white-space: pre-wrap; font-family: monospace;">${JSON.stringify(
            data,
            null,
            2
          )}</pre>
        </div>
        
        <p>Best regards,<br>Your Medusa Store Team</p>
      </div>
    `;
  }

  private interpolateTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private formatCurrency(amount: number, currencyCode: string): string {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode?.toUpperCase() || "USD",
      }).format(amount / 100); // Assuming amount is in cents
    } catch {
      return `${(amount / 100).toFixed(2)} ${
        currencyCode?.toUpperCase() || "USD"
      }`;
    }
  }
}

export default ZeptoMailNotificationProviderService;
