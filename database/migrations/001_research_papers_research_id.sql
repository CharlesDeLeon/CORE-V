-- Fixes: Error: Field 'research_id' doesn't have a default value (errno 1364)
-- Your INSERT omits `research_id`, so MySQL needs it to be AUTO_INCREMENT (or nullable).
--
-- 1) Inspect your table:
--    SHOW CREATE TABLE research_papers;
--
-- 2) If `research_id` is the PRIMARY KEY (and you do NOT have a separate `paper_id` PK),
--    run:
ALTER TABLE research_papers
  MODIFY COLUMN research_id INT NOT NULL AUTO_INCREMENT;

-- 3) If that fails, you may have BOTH `paper_id` and `research_id`. Then either drop the
--    redundant column or make `research_id` nullable — match your intended design.
