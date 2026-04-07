-- Run against your NextUp PostgreSQL database (once).
-- Community discussion + “open to collaborate” on ideas.

CREATE TABLE IF NOT EXISTS public."CommunityPost" (
    id text NOT NULL,
    "userId" text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY (id),
    CONSTRAINT "CommunityPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CommunityPost_createdAt_idx" ON public."CommunityPost" ("createdAt" DESC);

CREATE TABLE IF NOT EXISTS public."IdeaInterest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "ideaId" text NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "IdeaInterest_pkey" PRIMARY KEY (id),
    CONSTRAINT "IdeaInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "IdeaInterest_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES public."Idea"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "IdeaInterest_userId_ideaId_key" UNIQUE ("userId", "ideaId")
);

CREATE INDEX IF NOT EXISTS "IdeaInterest_ideaId_idx" ON public."IdeaInterest" ("ideaId");
