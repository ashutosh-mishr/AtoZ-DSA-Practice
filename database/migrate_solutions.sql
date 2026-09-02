CREATE TABLE IF NOT EXISTS problem_solutions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  problem_id BIGINT NOT NULL UNIQUE REFERENCES problems(id) ON DELETE CASCADE,
  problem_statement TEXT NOT NULL DEFAULT '',
  examples TEXT NOT NULL DEFAULT '',
  brute_force TEXT NOT NULL DEFAULT '',
  better_approach TEXT NOT NULL DEFAULT '',
  optimal_approach TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  code_language VARCHAR(50) NOT NULL DEFAULT 'C++',
  video_url TEXT,
  source_repository TEXT,
  source_file TEXT,
  mapping_confidence NUMERIC(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_problem_solutions_problem ON problem_solutions(problem_id);
