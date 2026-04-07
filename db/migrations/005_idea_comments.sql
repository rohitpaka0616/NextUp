-- Threaded comments for ideas (one reply level)

CREATE TABLE IF NOT EXISTS public."Comment" (
  id text PRIMARY KEY,
  body text NOT NULL,
  "authorId" text NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "ideaId" text NOT NULL REFERENCES public."Idea"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "parentCommentId" text REFERENCES public."Comment"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  upvotes integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "Comment_ideaId_idx" ON public."Comment"("ideaId");
CREATE INDEX IF NOT EXISTS "Comment_parentCommentId_idx" ON public."Comment"("parentCommentId");
