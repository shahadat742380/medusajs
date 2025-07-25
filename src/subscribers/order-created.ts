import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve("query");

  // Retrieve order details with customer and items
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "*",
      "customer.*",
      "items.*",
      "shipping_address.*",
      "billing_address.*",
      "shipping_methods.*",
    ],
    filters: {
      id: data.id,
    },
  });

  if (!order || !order.email) {
    console.warn(
      `Order ${data.id} has no email address, skipping notification`
    );
    return;
  }

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: "email",
      template: "order.placed",
      data: order,
    });

    console.log(`Order placed notification sent for order ${order.email}`);
  } catch (error) {
    console.error(
      `Failed to send order placed notification for order ${order.email}:`,
      error
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
