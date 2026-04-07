-- General community forum + shared comments support for posts

ALTER TABLE public."CommunityPost"
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS tag text DEFAULT 'General' NOT NULL,
  ADD COLUMN IF NOT EXISTS upvotes integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "authorId" text;

UPDATE public."CommunityPost"
SET title = COALESCE(title, LEFT(body, 80)),
    tag = COALESCE(tag, 'General'),
    "authorId" = COALESCE("authorId", "userId");

ALTER TABLE public."CommunityPost"
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN "authorId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CommunityPost_authorId_fkey'
  ) THEN
    ALTER TABLE public."CommunityPost"
      ADD CONSTRAINT "CommunityPost_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES public."User"(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public."Comment"
  ADD COLUMN IF NOT EXISTS "postId" text REFERENCES public."CommunityPost"(id) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Comment_postId_idx" ON public."Comment"("postId");
