ALTER TABLE "Machine"
  ALTER COLUMN "year" TYPE TEXT USING "year"::text,
  ALTER COLUMN "hrnCurrent" TYPE TEXT USING "hrnCurrent"::text,
  ALTER COLUMN "hrnResidual" TYPE TEXT USING "hrnResidual"::text;
