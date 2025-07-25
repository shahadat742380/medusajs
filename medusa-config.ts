import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "./src/modules/zeptomail",
            id: "zeptomail",
            options: {
              channels: ["email"],
              api_key: process.env.ZEPTOMAIL_API_KEY,
              from_email: process.env.ZEPTOMAIL_FROM_EMAIL,
              from_name: process.env.ZEPTOMAIL_FROM_NAME,
              templates: {
                "order.placed": {
                  subject: "Thank you for your order #{{display_id}}!"
                },
                "order.shipped": {
                  subject: "Your order #{{display_id}} has been shipped!"
                },
                "order.canceled": {
                  subject: "Order #{{display_id}} has been canceled"
                },
                "customer.created": {
                  subject: "Welcome to {{store_name || 'our store'}}!"
                },
                "user.password_reset": {
                  subject: "Password reset request"
                },
                "invite.created": {
                  subject: "You've been invited to join {{store_name || 'our team'}}"
                }
              }
            },
          },
        ],
      },
    },
  ],
});
