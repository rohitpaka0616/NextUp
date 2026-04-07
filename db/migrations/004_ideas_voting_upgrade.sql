-- Idea submission + voting schema upgrades

ALTER TABLE public."Idea"
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS "externalLink" text,
  ADD COLUMN IF NOT EXISTS vote_count integer DEFAULT 0 NOT NULL;

UPDATE public."Idea"
SET description = COALESCE(description, "longDesc"),
    category = COALESCE(category, 'Other');

UPDATE public."Idea" i
SET vote_count = v.cnt
FROM (
  SELECT "ideaId", COUNT(*)::int AS cnt
  FROM public."Vote"
  GROUP BY "ideaId"
) v
WHERE v."ideaId" = i.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Vote_userId_ideaId_key'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relkind = 'i'
      AND relname = 'Vote_userId_ideaId_key'
  ) THEN
    ALTER TABLE public."Vote"
      ADD CONSTRAINT "Vote_userId_ideaId_key" UNIQUE ("userId", "ideaId");
  END IF;
END $$;
