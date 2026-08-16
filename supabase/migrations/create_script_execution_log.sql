-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS script_execution_log (
  id          bigserial PRIMARY KEY,
  universe_id text        NOT NULL,
  script_type text        NOT NULL CHECK (script_type IN ('free', 'premium')),
  executed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_execution_log_type       ON script_execution_log (script_type);
CREATE INDEX IF NOT EXISTS idx_execution_log_universe   ON script_execution_log (universe_id);
CREATE INDEX IF NOT EXISTS idx_execution_log_executed   ON script_execution_log (executed_at DESC);

-- (Optional) view for aggregated counts per script
CREATE OR REPLACE VIEW script_execution_summary AS
SELECT
  universe_id,
  script_type,
  COUNT(*) AS executions,
  MAX(executed_at) AS last_executed_at
FROM script_execution_log
GROUP BY universe_id, script_type;
