-- Notifications + moderation reports

CREATE TABLE IF NOT EXISTS public."Notification" (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  type text NOT NULL,
  "referenceId" text NOT NULL,
  read boolean DEFAULT false NOT NULL,
  "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON public."Notification"("userId", read);
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON public."Notification"("createdAt" DESC);

CREATE TABLE IF NOT EXISTS public."Report" (
  id text PRIMARY KEY,
  "reporterId" text NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "targetType" text NOT NULL,
  "targetId" text NOT NULL,
  reason text NOT NULL,
  "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "Report_createdAt_idx" ON public."Report"("createdAt" DESC);
