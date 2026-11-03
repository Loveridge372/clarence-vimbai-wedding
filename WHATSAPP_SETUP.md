# WhatsApp RSVP confirmations via Twilio

The registration form collects an international WhatsApp number and an optional explicit opt-in. The admin dashboard attempts a personalized template message when an RSVP changes to approved or declined. Decisions save even if messaging is unavailable. Existing email-only RSVPs are preserved and are not messaged.

## Configure in Render

Set these environment variables in the wedding service's Environment page. Keep credentials in Render, never GitHub or chat.

- `TWILIO_ACCOUNT_SID`: Twilio account ID (`AC...`).
- `TWILIO_AUTH_TOKEN`: your account's secret authentication token.
- `TWILIO_WHATSAPP_FROM`: the WhatsApp-enabled sender, e.g. `whatsapp:+<country code and number>`.
- `TWILIO_APPROVAL_CONTENT_SID`: approved WhatsApp approval template ID (`HX...`).
- `TWILIO_DECLINE_CONTENT_SID`: approved WhatsApp decline template ID (`HX...`).
- `PUBLIC_SITE_URL`: `https://clarence-vimbai-wedding-staging.onrender.com` (change if you add your own domain).
- `TWILIO_WHATSAPP_ENABLED`: set to `true` only when the sender, templates and billing are ready and you intend to start paid sends.

Save and redeploy after changing environment variables. Until all values are configured and sending is enabled, approvals still work and the dashboard shows that Twilio is not connected. Do not use the EcoCash number automatically as a WhatsApp sender: a sender must be registered with Twilio/WhatsApp.

## Template drafts for approval in Twilio

Approval — request the Utility category; Meta determines the final category:

> Hello {{1}}, your RSVP for Vimbai and Clarence's wedding on {{2}} at {{3}} has been approved for {{4}} guest(s), including you. Your personal wedding details and directions are here: {{5}}. Thank you for celebrating with us.

Variables supplied by the website:
1. Guest's full registered name
2. Wedding date, e.g. 12 December 2026
3. Start time, e.g. 13:30
4. Approved party size
5. Personal guest link

Decline:

> Hello {{1}}, thank you for responding to {{2}}'s wedding invitation. We are unable to confirm your attendance. We appreciate your understanding and send our warm wishes.

Variables:
1. Guest's full registered name
2. Vimbai and Clarence

Create these exact variable mappings in Twilio Content Template Builder and submit both for WhatsApp approval. Enter each resulting Content SID in the matching Render variable. A sandbox is for testing with joined recipients; it is not a production sender for all wedding guests.

## Sending behavior and testing

- A new admin approval or decline attempts one message, only to guests with a WhatsApp number who opted in.
- Repeated clicks with the same decision do not submit another message. Changing the decision deliberately attempts another message and may incur another charge.
- The per-RSVP decision lock prevents concurrent clicks in the single-instance Render deployment from duplicating sends.
- The notification result is persisted with each RSVP. The dashboard distinguishes not configured, missing number, missing opt-in, failed, submitted, sending and uncertain results.
- A Twilio message SID means accepted/submitted, not delivered or read. Delivery receipts/webhooks are not implemented in this version; use Twilio logs to verify delivery.
- Retry is available only after a known failed request or missing configuration. Uncertain network results or interrupted sends must be checked in Twilio logs first, avoiding blind retries.
- Sending does not run retrospectively when you enable it. Use the explicit retry control on decisions previously marked not configured, or contact legacy guests manually.
- Start with one consenting test recipient and verify both approved and declined templates in Twilio logs before processing the guest list. Each test send is billable.
- Do not send without respecting recipient opt-out requests. This is an outbound-only integration; it does not process WhatsApp replies or automatic opt-out keywords. The couple must manage opt-outs before any further sends.

## Pricing basis (checked 3 November 2026)

Twilio lists US$0.005 per outbound or inbound WhatsApp message, plus Meta template fees based on category and recipient destination. Therefore 200 outbound confirmations have a US$1 Twilio platform component. Total: US$1 plus 200 times the applicable Meta template rate, before taxes, sender/number costs, optional services, replies, retries or follow-ups. Different countries may have different Meta rates. Registration on this website does not itself open WhatsApp's 24-hour user-initiated service window.

Sources:
- https://www.twilio.com/en-us/whatsapp/pricing
- https://www.twilio.com/docs/whatsapp/api
- https://www.twilio.com/docs/content/send-templates-created-with-the-content-template-builder
