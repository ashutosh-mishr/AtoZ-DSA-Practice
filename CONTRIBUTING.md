# Contributing

Thanks for your interest in DSA Practice.

This project is primarily a personal DSA practice tracker, so contributions should stay focused and avoid unnecessary feature expansion.

## Before making changes

1. Read the `README.md`.
2. Check `improvement.md` for ideas already documented for the future.
3. Verify that the requested change solves a real problem.
4. Avoid committing secrets or local `.env` files.
5. Preserve existing authentication and user-data isolation.

## Development

The project has two applications:

- `client/` — React + Vite frontend
- `server/` — Node.js + Express backend

Use Node.js 24 as specified by `.nvmrc`.

Run the frontend:

```bash
cd client
npm run dev
```

Run the backend:

```bash
cd server
npm run dev
```

## Pull requests

Keep changes focused.

A good change should:

- Explain what changed.
- Explain why it changed.
- Avoid unrelated refactoring.
- Include relevant testing notes.
- Preserve existing functionality.
- Consider both guest and authenticated users.

## Security

Never commit:

- API keys
- OAuth client secrets
- session secrets
- database passwords
- Resend keys
- `.env` files
- personal user data

Security-sensitive changes should be reviewed carefully on both the frontend and backend. The backend must remain the actual authorization boundary.

## Testing checklist

For changes affecting the UI or routing, test:

- Guest browsing
- Login
- Logout
- Authenticated tracking
- Dark/light mode
- Mobile layout where relevant

For changes affecting personal data, also verify:

- User isolation
- Authorization
- Disabled-user behavior
- Admin permissions

## Scope

Please avoid adding large new features without first discussing the need and intended design.
