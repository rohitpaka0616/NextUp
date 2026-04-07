-- Run against your NextUp PostgreSQL database.
-- Adds profile fields and NextAuth adapter tables for Google OAuth + magic links.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    username text,
    avatar text,
    bio text DEFAULT '' NOT NULL,
    role text DEFAULT 'member' NOT NULL,
    "passwordHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY (id)
);

ALTER TABLE public."User"
    ADD COLUMN IF NOT EXISTS username text,
    ADD COLUMN IF NOT EXISTS avatar text,
    ADD COLUMN IF NOT EXISTS bio text DEFAULT '' NOT NULL,
    ADD COLUMN IF NOT EXISTS role text DEFAULT 'member' NOT NULL;

ALTER TABLE public."User"
    ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON public."User"(username);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON public."User"(email);

CREATE TABLE IF NOT EXISTS public.users (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name text,
    email text UNIQUE,
    "emailVerified" timestamp(3) without time zone,
    image text
);

CREATE TABLE IF NOT EXISTS public.accounts (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_key"
    ON public.accounts(provider, "providerAccountId");
CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON public.accounts("userId");

CREATE TABLE IF NOT EXISTS public.sessions (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "sessionToken" text NOT NULL UNIQUE,
    "userId" text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    expires timestamp(3) without time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON public.sessions("userId");

CREATE TABLE IF NOT EXISTS public.verification_token (
    identifier text NOT NULL,
    token text NOT NULL UNIQUE,
    expires timestamp(3) without time zone NOT NULL,
    PRIMARY KEY (identifier, token)
);
