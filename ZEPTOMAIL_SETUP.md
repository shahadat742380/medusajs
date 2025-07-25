# ZeptoMail Integration with MedusaJS

This document explains how to set up ZeptoMail email notifications in your MedusaJS store.

## Overview

This integration provides:

- Order confirmation emails when orders are placed
- Welcome emails when customers register
- Invitation emails when users are invited to the admin panel
- Beautiful HTML email templates with order details

## Prerequisites

1. **ZeptoMail Account**: Sign up at [ZeptoMail](https://www.zoho.com/zeptomail/)
2. **API Key**: Get your ZeptoMail API key from the dashboard
3. **Verified Domain**: Add and verify your sending domain in ZeptoMail

## Installation

The ZeptoMail integration is already installed and configured in this project. The following components are included:

- **Service**: `src/modules/zeptomail/service.ts` - Core ZeptoMail integration
- **Module**: `src/modules/zeptomail/index.ts` - Module definition
- **Subscribers**: Event handlers for order creation, customer registration, and invitations

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# ZeptoMail Configuration
ZEPTOMAIL_API_KEY=your_zeptomail_api_key_here
ZEPTOMAIL_FROM_EMAIL=noreply@yourdomain.com
ZEPTOMAIL_FROM_NAME=Your Store Name
```

### 2. Get ZeptoMail API Key

1. Log in to your ZeptoMail dashboard
2. Go to **Settings** > **API Keys**
3. Create a new API key or copy an existing one
4. Add it to your `.env` file as `ZEPTOMAIL_API_KEY`

### 3. Verify Your Domain

1. In ZeptoMail dashboard, go to **Domains**
2. Add your domain (e.g., `yourdomain.com`)
3. Add the provided DNS records to your domain
4. Verify the domain
5. Use an email address from this domain in `ZEPTOMAIL_FROM_EMAIL`

## Email Templates

The integration includes pre-built email templates for:

### Order Placed

- Subject: "Thank you for your order #{{display_id}}!"
- Includes: Order details, items, customer info, totals
- Automatically sent when `order.placed` event is triggered

### Customer Created

- Subject: "Welcome to {{store_name || 'our store'}}!"
- Includes: Welcome message and account details
- Automatically sent when `customer.created` event is triggered

### User Invitation

- Subject: "You've been invited to join {{store_name || 'our team'}}"
- Includes: Invitation link and role information
- Automatically sent when `invite.created` event is triggered

## Template Customization

You can customize email subjects by modifying the `templates` configuration in `medusa-config.ts`:

```typescript
templates: {
  "order.placed": {
    subject: "Custom order confirmation for #{{display_id}}"
  },
  "customer.created": {
    subject: "Welcome to {{store_name}}!"
  }
}
```

## Testing

### 1. Start the Application

```bash
npm run dev
```

### 2. Test Order Email

1. Create a test order through your storefront or API
2. Check your email for the order confirmation
3. Monitor the console for log messages

### 3. Test Customer Registration

1. Register a new customer account
2. Check the email for the welcome message

### 4. Test User Invitation

1. Invite a new user through the admin panel
2. Check the invited email address for the invitation

## Troubleshooting

### Common Issues

1. **No emails received**

   - Check that `ZEPTOMAIL_API_KEY` is set correctly
   - Verify your domain in ZeptoMail dashboard
   - Check console logs for error messages

2. **Authentication errors**

   - Verify your API key is active
   - Ensure the API key has sending permissions

3. **Domain verification issues**
   - Add all required DNS records
   - Wait for DNS propagation (up to 24 hours)
   - Use ZeptoMail's verification tool

### Debug Logging

Check the console output for:

- `Order placed notification sent for order XXX`
- `Welcome email sent to new customer email@example.com`
- `Invite notification sent to email@example.com`

Error messages will also appear in the console if there are issues.

## Supported Events

The current integration handles these MedusaJS events:

- `order.placed` - Order confirmation emails
- `customer.created` - Welcome emails
- `invite.created` - User invitation emails

Additional events can be added by:

1. Creating new subscribers in `src/subscribers/`
2. Adding corresponding email templates to the service
3. Configuring template subjects in `medusa-config.ts`

## Email Template Customization

To customize the HTML email templates, modify the template methods in `src/modules/zeptomail/service.ts`:

- `buildOrderPlacedTemplate()` - Order confirmation email
- `buildCustomerCreatedTemplate()` - Welcome email
- `buildInviteTemplate()` - Invitation email

The templates support:

- Dynamic data interpolation with `{{variable}}`
- Responsive HTML design
- Order details and item listings
- Currency formatting
- Conditional content

## Next Steps

- Customize email templates to match your brand
- Add more event subscribers for additional notifications
- Configure email templates in ZeptoMail dashboard for advanced features
- Set up email analytics and tracking

For more information about ZeptoMail features, visit [ZeptoMail Documentation](https://www.zoho.com/zeptomail/help/).
