# Clarence & Vimbai wedding — Render edition

This package preserves the current invitation, four-photo banner, RSVP approval dashboard, guest photo uploads and EcoCash gifts page. It runs independently of ChatGPT hosting with Node.js and a persistent filesystem adapter. No packages need to be installed.

## Deployment proposal

Push this folder to a private GitHub repository and create a Render Blueprint using render.yaml. The blueprint proposes a Starter Docker web service and a 10 GB persistent disk. These are paid resources: check current Render prices before applying the blueprint. The configuration has not yet been validated against a connected Render account.

Set ADMIN_PASSWORD in Render to a new unique password containing at least 16 characters. Do not put the password in source control. Render supplies PORT; DATA_DIR must remain under the attached persistent disk at /var/data/wedding. Health endpoint: /healthz.

The dashboard is reached directly at /#admin; no dashboard link appears to guests. Admin operations require the password on the server. There is no ChatGPT sign-in gate on this portable version. A normal Render web service URL may be publicly reachable, so configure staging access restrictions before using real guest data if private staging is required.

## Storage

The proposed disk is 10 GB and stores photos plus RSVP and wedding settings records. Guest uploads remain 4–12 JPG/PNG/WebP photos per batch, up to 8 MB each. There is no per-guest lifetime cap. Monitor disk usage and make off-service backups before collecting real guest photos. Do not use ephemeral service storage for guest data. A single attached disk is intended for one service instance; use object storage if scaling to several instances.

## Existing data

This package contains the website and its banner images only. It does not export or migrate any existing hosted RSVP submissions, wedding settings or guest photo uploads. Arrange a data migration before switching guests to Render. Defaults will be shown until settings are entered on the new dashboard. Approval links contain opaque tokens; keep guest links private. Automatic email delivery is not configured.

## Local check

Use Node.js 22 or later. Set ADMIN_PASSWORD and optionally DATA_DIR, then run npm start. Visit http://localhost:3000. Never commit local data or credentials.
