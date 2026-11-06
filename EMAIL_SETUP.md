# Wedding RSVP email setup
Registration collects a guest email and optional opt-in. A changed admin decision attempts a personalised email. Existing WhatsApp-only RSVPs are retained and never converted into invented email addresses. Contact those guests separately to collect email addresses. Their saved personal links still work.

1. Create a Resend account and verify a sending domain you own. For example, use `updates.natloptechnologies.co.za`; add exactly the DNS records Resend provides, preserving existing website and mailbox records. Domain verification for the website does not verify an email sender.
2. Create a sending API key and enter it directly in Render Environment; never paste it in chat or commit it to GitHub.
3. Set these environment variables on the wedding service:
   - RESEND_API_KEY: the sending API key
   - EMAIL_FROM: Vimbai & Clarence <rsvp@updates.natloptechnologies.co.za> (must match your verified sending domain)
   - EMAIL_REPLY_TO: optional, a monitored email inbox
   - PUBLIC_SITE_URL: https://clarence-vimbai-wedding-staging.onrender.com
   - EMAIL_ENABLED: true only when ready to send guest email
4. Save and deploy. Test with one consenting recipient and check the provider's email logs for delivery. Do not approve real guests as a test.

Sending requires both a valid guest email and opt-in. Repeated clicks on the same decision do not send again. Changing a decision attempts another email. Failed/not-configured requests have an explicit retry control; uncertain requests require checking the provider logs first. Retry sends use a fresh attempt ID. No old decisions are automatically resent when you enable email. Delivery tracking and bounce webhooks are not implemented; 'Submitted' means accepted by the provider, not delivered to the inbox. The integration does not provide a hosted mailbox or process replies.

The old Twilio environment variables are no longer read by the application. No WhatsApp notifications are sent by this version.
