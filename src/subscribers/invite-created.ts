import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export default async function inviteCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve("query");

  // Retrieve invite details
  const {
    data: [invite],
  } = await query.graph({
    entity: "invite",
    fields: ["*", "user.*"],
    filters: {
      id: data.id,
    },
  });

  if (!invite || !invite.email) {
    console.warn(
      `Invite ${data.id} has no email address, skipping notification`
    );
    return;
  }

  try {
    await notificationModuleService.createNotifications({
      to: invite.email,
      channel: "email",
      template: "invite.created",
      data: {
        ...invite,
        invite_url: `${
          process.env.ADMIN_CORS || "http://localhost:9000"
        }/invite/accept?token=${invite.token}`,
        role: invite.email || "team member",
      },
    });

    console.log(`Invite notification sent to ${invite}`);
  } catch (error) {
    console.error(
      `Failed to send invite notification to ${invite}:`,
      error
    );
  }
}

export const config: SubscriberConfig = {
  event: "invite.created",
};
