# DSA Practice

A full-stack **DSA (Data Structures & Algorithms) practice tracker** built around a structured roadmap of **474 problems across 18 topics and 62 subtopics**.

The project is designed around a simple principle:

> **Learn without login. Track with login.**

You can browse the roadmap, problems, patterns, solutions, and practice experience without an account. Signing in adds personal progress tracking across devices.

## ✨ Features

### Learning & Roadmap
- Structured DSA roadmap
- 18 topics
- 62 subtopics
- 474 problems
- Problem search and difficulty filtering
- Topic and subtopic progress
- Prerequisite relationships
- Pattern information

### Practice
- Random practice from the full problem set
- Practice by problem number
- Problem hints showing topic/subtopic
- LeetCode, GeeksforGeeks, TUF and YouTube links where available
- Practice tracking for signed-in users

### Solutions
- Dedicated solution pages
- Problem statement
- Examples
- Approach
- Code
- Time complexity
- Space complexity
- TUF article reference where available
- 298 mapped solutions, with problems intentionally left without a solution where source content was unavailable

### Personal Tracking
Signed-in users can:
- Mark problems as solved
- Mark problems for revision
- Bookmark problems
- Add personal notes
- Track daily activity
- Track current and longest streaks
- View active days
- View a yearly activity heatmap
- Personalize the dashboard welcome message

### Authentication
- Email/password registration and login
- Google OAuth
- Connect Google to an existing account
- PostgreSQL-backed sessions
- HttpOnly session cookie
- Password reset flow
- Resend email integration
- Role-based admin access
- Disabled-user handling
- User-owned tracker data

### Guest Experience
No login is required to:
- Browse the dashboard overview
- Explore the DSA roadmap
- Browse topics and subtopics
- Search and filter problems
- Read problem details
- Read available solutions
- Use Practice
- Preview the Streak feature

Personal tracking actions ask the guest to sign in rather than storing temporary progress locally.

## 🧭 Product Philosophy

**Learn without login. Track with login.**

The application separates public learning content from personal tracking.

Public content is available to everyone, while progress-related information is scoped to the authenticated user.

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- JavaScript / JSX

### Backend
- Node.js
- Express
- PostgreSQL driver (`pg`)

### Database
- PostgreSQL

### Authentication & Email
- PostgreSQL-backed sessions
- Google OAuth 2.0 authorization-code flow
- Resend for password-reset email delivery
- Node.js `scrypt` password hashing

## 🏗️ Architecture

```text
Browser
   │
   ▼
React + Vite
   │ HTTPS / API
   ▼
Express + Node.js
   │
   ▼
PostgreSQL

Authentication:
Browser → Session Cookie → Express → PostgreSQL

Password reset:
Express → Resend → User email
```

The backend is the application's security boundary. Personal tracker APIs require authentication and use the authenticated user's ID to isolate progress, bookmarks, revisions, notes and activity.

## 📁 Project Structure

```text
AtoZ-DSA-Practice/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   └── ...
│   ├── index.html
│   └── package.json
│
├── server/
│   ├── src/
│   ├── scripts/
│   └── package.json
│
├── database/
├── .nvmrc
├── improvement.md
├── CONTRIBUTING.md
└── README.md
```

## 🚀 Local Development

### Requirements

- Node.js 24
- npm
- PostgreSQL 15+ recommended
- A local PostgreSQL database

The repository includes an `.nvmrc` specifying Node 24.

### 1. Clone

```bash
git clone https://github.com/ashutosh-mishr/AtoZ-DSA-Practice.git
cd AtoZ-DSA-Practice
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create the required `.env` files locally.

**Never commit `.env` files or secrets to GitHub.**

The frontend uses:

```env
VITE_API_URL=http://localhost:5001/api
```

The backend requires the database, session, authentication and email configuration appropriate to your local setup. See the server source and deployment documentation for the exact environment variables used by the current application.

### 5. Start the backend

```bash
cd server
npm run dev
```

### 6. Start the frontend

In another terminal:

```bash
cd client
npm run dev
```

The local frontend runs on Vite's development server, normally:

```text
http://localhost:5173
```

The local API is configured to run on:

```text
http://localhost:5001
```

## 🔐 Security Notes

- Secrets belong in environment variables, not source control.
- Session tokens are stored hashed server-side.
- Authentication uses HttpOnly cookies.
- Google OAuth state is validated server-side.
- Verified Google email addresses are required for OAuth accounts.
- Passwords are hashed with Node.js `scrypt`.
- Password-reset tokens are stored hashed and expire.
- Personal tracker data is associated with a user ID.
- The primary admin account has additional deletion/demotion protections.
- Disabled users cannot continue using authenticated sessions.
- The backend enforces authorization; frontend checks are only UX safeguards.

## 📊 Dataset

The current canonical dataset contains:

| Metric | Count |
|---|---:|
| Problems | 474 |
| Topics | 18 |
| Subtopics | 62 |
| Solutions | 298 |
| Prerequisite references | 53 |
| Quotes | 310 |

The project intentionally preserves source URLs and handles duplicate normalized problem names because a problem title can occur in more than one topic.

## 🔎 SEO

The application includes a global SEO foundation:

- Descriptive page title
- Meta description
- Robots metadata
- Open Graph metadata
- Twitter/X card metadata
- Theme color
- Web application structured data
- `robots.txt`

Domain-specific canonical URLs and a production sitemap should be finalized once the production domain is selected. They should not point search engines at a placeholder domain.

Public, useful pages are intended to be the primary search destinations. Personal/admin/authentication pages should not be treated as SEO landing pages.

## 🧪 Development Principles

- Keep public learning content accessible without login.
- Keep personal tracker data private to the authenticated user.
- Prefer small, targeted changes.
- Preserve working functionality when adding improvements.
- Test guest and authenticated flows separately.
- Keep secrets out of Git.
- Avoid adding features unless they solve a real need.

## 🗺️ Future Improvements

Future ideas are documented in:

```text
improvement.md
```

That document is intentionally a reference rather than a mandatory roadmap.

The current application is considered complete enough for present use.

## 🤝 Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for development and contribution guidelines.

## 📄 License

No open-source license has been selected yet.

Until a license is added, the repository should not be assumed to grant permission to reuse, redistribute, or modify the code beyond rights provided by applicable law.

## 🙏 Inspiration

The project is inspired by structured DSA practice roadmaps and problem sheets used by the programming community. It is an independent practice-tracking application and is not affiliated with those original resources.

## 📌 Project Status

**Current status: Stable / actively usable**

The core tracker, public browsing experience, authentication, personal tracking, solutions, practice, notes, bookmarks, revision and streak functionality are implemented.

Future changes should be driven by actual usage, bugs, or a clearly identified need.
