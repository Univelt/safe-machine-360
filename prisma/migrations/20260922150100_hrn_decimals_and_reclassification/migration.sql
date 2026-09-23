ALTER TABLE "RiskAssessment"
  ALTER COLUMN "hrnCurrent" TYPE DOUBLE PRECISION USING "hrnCurrent"::DOUBLE PRECISION,
  ALTER COLUMN "hrnResidual" TYPE DOUBLE PRECISION USING "hrnResidual"::DOUBLE PRECISION;

WITH parsed_hrn AS (
  SELECT
    "id",
    GREATEST(
      CASE
        WHEN BTRIM("hrnCurrent") ~ '^[0-9]+([.,][0-9]+)?$'
          THEN REPLACE(BTRIM("hrnCurrent"), ',', '.')::DOUBLE PRECISION
        ELSE 0
      END,
      CASE
        WHEN BTRIM(COALESCE("hrnResidual", '')) ~ '^[0-9]+([.,][0-9]+)?$'
          THEN REPLACE(BTRIM("hrnResidual"), ',', '.')::DOUBLE PRECISION
        ELSE 0
      END
    ) AS value
  FROM "Machine"
  WHERE "riskOrigin" = 'AUTOMATIC'
    AND (
      BTRIM("hrnCurrent") ~ '^[0-9]+([.,][0-9]+)?$'
      OR BTRIM(COALESCE("hrnResidual", '')) ~ '^[0-9]+([.,][0-9]+)?$'
    )
)
UPDATE "Machine" AS machine
SET "riskLevel" = CASE
  WHEN parsed_hrn.value <= 1 THEN 'DESPREZIVEL'::"RiskLevel"
  WHEN parsed_hrn.value <= 5 THEN 'MUITO_BAIXO'::"RiskLevel"
  WHEN parsed_hrn.value <= 10 THEN 'BAIXO'::"RiskLevel"
  WHEN parsed_hrn.value <= 50 THEN 'SIGNIFICATIVO'::"RiskLevel"
  WHEN parsed_hrn.value <= 100 THEN 'ALTO'::"RiskLevel"
  WHEN parsed_hrn.value <= 500 THEN 'MUITO_ALTO'::"RiskLevel"
  WHEN parsed_hrn.value <= 1000 THEN 'EXTREMO'::"RiskLevel"
  ELSE 'INACEITAVEL'::"RiskLevel"
END
FROM parsed_hrn
WHERE machine."id" = parsed_hrn."id";
