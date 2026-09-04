# Password reset setup

This version adds password reset using the Resend Email API.

## Local environment

Add these values to `server/.env` (keep the API key secret):

```env
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
PASSWORD_RESET_URL=http://localhost:5173/reset-password
PASSWORD_RESET_TTL_MINUTES=30
```

For local testing, Resend's `onboarding@resend.dev` sender is used. For production, verify your own domain in Resend and change `RESEND_FROM_EMAIL`.

## Database

From `server/` run:

```bash
npm run migrate:password-reset
```

## Run

Start the API and client as usual. On the login page, use **Forgot password?**.

The API returns the same response whether or not an email exists, so the endpoint does not reveal registered accounts. Reset tokens are random, hashed in PostgreSQL, expire after the configured TTL, and are single-use. A successful reset invalidates all existing sessions for that user.
