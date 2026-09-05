# DSA Practice — Future Improvements

> This file contains optional future improvements and ideas.
>
> **Current status:** The application is considered feature-complete and stable for current needs.
>
> These improvements should only be implemented when they are actually required. Do not treat this document as a mandatory development roadmap.

---

## Phase 1 — QA, Reliability & Polish

### 1. Full End-to-End Testing

Perform a complete regression test across the application before major future changes.

Areas to test:

- Guest browsing
- Dashboard
- DSA Roadmap
- Topics and subtopics
- Problem search
- Difficulty filters
- Problem details
- Solutions
- Practice
- Streak
- Login
- Register
- Google login
- Google account linking
- Forgot password
- Password reset
- Logout
- Solved status
- Revision status
- Bookmarks
- Notes
- Personal dashboard statistics
- Heatmap
- Guest sign-in prompts
- User data isolation
- Admin functionality
- Dark/light mode
- Mobile responsiveness

Goal:

- Prevent regressions.
- Verify guest and authenticated experiences separately.
- Verify personal data never leaks between users.

---

### 2. Mobile UI Polish

Perform a dedicated mobile usability pass.

Review:

- Mobile sidebar/drawer
- Hamburger navigation
- Dashboard cards
- Heatmap
- Topic accordion
- Problem tables
- Horizontal table scrolling
- Practice page
- Solution page
- Notes modal
- Sign-in prompt modal
- Account settings
- Login/Register screens
- Forgot/reset password screens
- Admin pages

Goal:

- Make every existing feature comfortable to use on smaller screens.
- Avoid introducing unnecessary new features.

---

## Phase 2 — Learning Experience

### 3. DSA Roadmap UX Improvements

Potential improvements:

- Better topic progress visualization
- Better subtopic progress visualization
- Continue where you left off
- Recently solved problems
- Recently practiced problems
- Next recommended problem
- Topic completion insights
- Difficulty distribution
- Prerequisite guidance
- Suggested next problem

Possible future dashboard concept:

> Continue Learning
>
> Binary Search → Search Space → Koko Eating Bananas

Goal:

- Make the roadmap feel like a learning system rather than only a checklist.

---

### 4. Problem Detail Experience

Potential improvements to the problem-learning experience:

- Problem statement
- Difficulty
- Pattern
- Prerequisites
- External practice links
- Solution
- Notes
- Solved status
- Revision status
- Bookmark
- Related problems
- Similar problems

Goal:

- Make the problem page a central learning workspace.

---

## Phase 3 — Personal Productivity

### 5. Dashboard Improvements

Potential future sections:

#### Continue Learning

Show the next useful problem or topic based on progress.

#### Recently Solved

Show the most recently solved problems.

#### Needs Revision

Show problems marked for revision.

#### Recently Practiced

Show recent practice activity.

Possible dashboard structure:

    Continue Learning
    ────────────────────────
    Next recommended problem

    Recently Solved
    ────────────────────────
    Recent problems

    Needs Revision
    ────────────────────────
    Problems marked for revision

Goal:

- Make the dashboard useful as a daily starting point.

---

### 6. Practice Page Improvements

Potential future filters and modes:

- Practice by topic
- Practice by subtopic
- Practice by difficulty
- Random practice
- Unsolved only
- Revision only
- Bookmarked only
- Mixed practice
- Practice history
- Continue previous practice session

Goal:

- Make Practice more flexible without complicating the current simple experience.

---

## Phase 4 — Admin & Content Management

### 7. Admin Panel Improvements

Potential improvements:

- User management
- User activity overview
- User statistics
- Problem management
- Solution management
- Dataset statistics
- Content validation
- Problem metadata management
- Better admin search/filtering

Important:

- Admin access must remain properly protected.
- Admin functionality should not unnecessarily expose or modify users' personal tracker data.

---

## Phase 5 — Security & Performance

### 8. Security Audit

Before public production deployment, review:

- API authorization
- Authentication middleware
- Session security
- Cookie configuration
- OAuth security
- OAuth state validation
- Password hashing
- Password reset flow
- Password reset token security
- Rate limiting
- Input validation
- SQL query safety
- Error handling
- CORS configuration
- Secrets/environment variables
- Admin authorization
- User data isolation
- Disabled-user behavior
- Account deletion protections

Goal:

- Ensure the backend remains the actual security boundary.

---

### 9. Performance Audit

Potential improvements:

- API response optimization
- Database query optimization
- Database indexes
- React rendering optimization
- Heatmap rendering optimization
- Large problem-list rendering
- Lazy loading where useful
- Bundle-size review
- Network request reduction
- Caching where appropriate

Goal:

- Improve performance only where measurement shows a real need.

---

## Phase 6 — Production Deployment

### 10. Deployment Preparation

When the project is ready for deployment:

- Production frontend configuration
- Production backend configuration
- Managed PostgreSQL
- Production environment variables
- HTTPS
- Secure cookies
- Production CORS configuration
- Domain configuration
- Error monitoring
- Logging
- Database backups
- Database migration strategy

Potential architecture:

    Frontend
        ↓
    Production hosting

    Backend
        ↓
    Production hosting

    PostgreSQL
        ↓
    Managed database

    Email
        ↓
    Resend + verified domain

Goal:

- Move from local development to a secure production environment.

---

## Future Ideas — Optional Only

These are ideas that may or may not be useful later:

- Continue Learning
- Personalized problem recommendations
- Recently solved dashboard
- Revision queue
- Practice history
- Advanced practice modes
- Topic-level analytics
- Difficulty analytics
- Learning streak insights
- More detailed activity statistics
- Related/similar problems
- Better prerequisite visualization
- Admin analytics
- Performance monitoring
- Production observability

These should only be implemented if they provide meaningful value.

---

## Current Product Principle

The current product philosophy is:

> **Learn without login. Track with login.**

Guests should be able to:

- Browse the roadmap
- Browse topics
- Browse subtopics
- Browse all problems
- Search problems
- Filter problems
- Read problem details
- Read available solutions
- Practice problems
- View the Streak feature preview

Login should be required for personal tracking such as:

- Solved status
- Revision
- Bookmarks
- Notes
- Personal dashboard statistics
- Personal heatmap/activity
- Personal streak data

---

## Current Status

The current application is considered **complete enough for present use**.

No improvement in this document should be implemented automatically.

Use this document as a reference when a future need arises.
