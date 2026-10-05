-- Keep the values previously displayed by the machine category selector.
-- RiskAssessment retains its own safety-category enum.
BEGIN;
ALTER TABLE "Machine"
  ALTER COLUMN "category" TYPE TEXT
  USING CASE "category"::TEXT
    WHEN 'CAT_1' THEN '1'
    WHEN 'CAT_2' THEN '2'
    WHEN 'CAT_3' THEN '3'
    WHEN 'CAT_4' THEN '4'
    ELSE "category"::TEXT
  END;
COMMIT;
