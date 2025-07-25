import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve("query");

  // Retrieve customer details
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["*"],
    filters: {
      id: data.id,
    },
  });

  if (!customer || !customer.email) {
    console.warn(
      `Customer ${data.id} has no email address, skipping notification`
    );
    return;
  }

  try {
    await notificationModuleService.createNotifications({
      to: customer.email,
      channel: "email",
      template: "customer.created",
      data: customer,
    });

    console.log(`Welcome email sent to new customer ${customer.email}`);
  } catch (error) {
    console.error(
      `Failed to send welcome email to customer ${customer.email}:`,
      error
    );
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
};
