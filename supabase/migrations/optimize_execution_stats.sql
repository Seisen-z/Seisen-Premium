-- Aggregated data for the homepage execution cards.
-- The stats endpoint reads these small result sets instead of downloading the
-- full execution log and aggregating it in the Next.js process.

ALTER TABLE script_execution_log
  ADD COLUMN IF NOT EXISTS country text;

CREATE OR REPLACE VIEW script_execution_summary AS
SELECT
  universe_id,
  script_type,
  COUNT(*) AS executions,
  MAX(executed_at) AS last_executed_at
FROM script_execution_log
GROUP BY universe_id, script_type;

CREATE OR REPLACE VIEW execution_country_summary AS
SELECT
  country,
  COUNT(*) AS executions
FROM script_execution_log
WHERE country IS NOT NULL AND country <> 'unknown'
GROUP BY country;
