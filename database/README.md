# DSA Practice Tracker database

This folder contains the PostgreSQL schema only. It does not contain the real DSA problem dataset.

## Start PostgreSQL locally

This machine has Homebrew PostgreSQL 14 data at `/opt/homebrew/var/postgresql@14`. Start it manually with:

```bash
brew services start postgresql@14
```

Confirm it is ready:

```bash
pg_isready
```

To stop it later:

```bash
brew services stop postgresql@14
```

## Create and initialize the database

From the repository root, create the local database once:

```bash
createdb dsa_practice_tracker
```

Apply the schema:

```bash
psql -d dsa_practice_tracker -f database/schema.sql
```

`test-data.sql` inserts only temporary validation records (one topic, one subtopic, and two problems):

```bash
psql -d dsa_practice_tracker -f database/test-data.sql
```

Verify the relationships:

```bash
psql -d dsa_practice_tracker -c "SELECT t.name AS topic, s.name AS subtopic, p.title, pp.status, n.content AS note, b.created_at AS bookmarked_at FROM topics t JOIN subtopics s ON s.topic_id = t.id JOIN problems p ON p.subtopic_id = s.id LEFT JOIN problem_progress pp ON pp.problem_id = p.id LEFT JOIN notes n ON n.problem_id = p.id LEFT JOIN bookmarks b ON b.problem_id = p.id ORDER BY p.order_number;"
```

## Tables

- `topics` holds top-level roadmap sections.
- `subtopics` groups problems within a topic.
- `problems` stores problem metadata and its LeetCode URL.
- `problem_progress` stores exactly one status per problem: `not_started`, `solved`, or `revision`.
- `notes` stores one personal note per problem.
- `bookmarks` stores whether a problem is bookmarked.

Deleting a topic, subtopic, or problem cascades to its dependent records. The schema uses uniqueness constraints to preserve ordering within a parent, avoid duplicate names/URLs, and prevent duplicate progress, note, and bookmark rows per problem. `updated_at` is maintained automatically by PostgreSQL triggers for progress and notes.
