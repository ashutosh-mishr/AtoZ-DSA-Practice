# A2Z DSA Practice Tracker database

This folder contains the PostgreSQL schema, migration, canonical 474-question dataset, and import instructions.

## Canonical dataset

`data/a2z_canonical_474.json` is the application import source. It contains:

- 18 topics
- 62 subtopics
- 474 problems
- difficulty information
- LeetCode, GFG, YouTube and TUF/article links where available
- pattern/complexity/approach metadata where safely available from the source reconciliation

Missing URLs/metadata are stored as `NULL`; the importer does not invent values.

## Local PostgreSQL

This project uses PostgreSQL locally. The current development setup uses PostgreSQL 18 on port `5434`.

The server reads these variables from `server/.env`:

```text
DB_HOST=localhost
DB_PORT=5434
DB_NAME=dsa_practice_tracker
DB_USER=ashutoshmishra
```

## Fresh database

Apply the complete schema:

```bash
psql -p 5434 -d dsa_practice_tracker -f database/schema.sql
```

Then import the canonical dataset from the project root:

```bash
cd server
npm run import:a2z
```

The importer validates the expected 18/62/474 structure and runs in a transaction.

## Existing database

If the database already has the original tracker schema, run the migration once:

```bash
psql -p 5434 -d dsa_practice_tracker -f database/migrate_legacy.sql
```

Then run:

```bash
cd server
npm run import:a2z
```

The importer removes only legacy rows that have no source IDs. On subsequent imports it upserts canonical records by stable source IDs and preserves existing progress, notes, and bookmarks for matching problems.

## Tables

- `dataset_metadata` — imported dataset/version information.
- `topics` — top-level A2Z sections and source topic IDs.
- `subtopics` — subtopics and source subtopic IDs.
- `problems` — problem metadata and external resource links.
- `topic_prerequisites` — topic-to-topic prerequisite relationships when supplied by a canonical source.
- `problem_prerequisites` — problem-to-problem prerequisite relationships when supplied by a canonical source.
- `problem_progress` — one practice status per problem: `not_started`, `solved`, or `revision`.
- `notes` — one personal note per problem.
- `bookmarks` — one bookmark row per problem.

Problem titles are intentionally **not globally unique**, because the same title can legitimately occur in multiple A2Z sections. Stable source problem IDs are unique instead.

## Streaks and daily quotes

The feature migration adds:
- `practice_activity`: one row per active calendar day.
- `practice_activity_problems`: unique problem/day records so re-solving the same problem on the same day does not inflate the daily count.
- `quotes`: the DSA/coding-focused quote pool.
- `daily_quotes`: one assigned quote per calendar date, preventing immediate day-to-day repeats.

Run once after applying a feature ZIP:

```bash
cd "/Users/ashutoshmishra/HelloWorld/AtoZ DSA Practice/server"
npm run migrate:features
```

A day becomes active when a problem changes from `not_started` to `solved`. Unsolving a problem does not erase historical activity.

## Authentication

Email/password authentication uses PostgreSQL-backed sessions and an HttpOnly cookie. Run the authentication migration once:

```bash
cd server
npm run migrate:auth
```

New registrations are regular `user` accounts. To create or promote an administrator account:

```bash
npm run create:admin -- admin@example.com "Admin Name"
```

The current authentication release protects the application APIs with login/session checks and establishes the `user`/`admin` role foundation. To migrate the existing tracker data to the first admin account and enable per-user ownership, run once:

```bash
cd server
npm run migrate:users
```

The migration assigns the existing progress, notes, bookmarks, and activity history to the oldest admin account, then isolates those records by `user_id`. New users start with their own empty tracker history.
