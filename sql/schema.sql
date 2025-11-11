CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.confessions (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    author_id TEXT,
    approved BOOLEAN DEFAULT FALSE,
    reported BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    media_url TEXT,
    media_urls TEXT[],
    media_type TEXT,
    tags TEXT[],
    author_name TEXT,
    pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE DEFAULT NULL,
    author_id TEXT,
    text TEXT NOT NULL,
    author_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reactions JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.reactions (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (post_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.actions_log (
    id BIGSERIAL PRIMARY KEY,
    action_type TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='confessions'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.confessions', pol.policyname); END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='comments'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.comments', pol.policyname); END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='reactions'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.reactions', pol.policyname); END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='actions_log'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.actions_log', pol.policyname); END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname); END LOOP;
END $$;

CREATE POLICY "Enable insert for all users"
ON public.confessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable read for approved posts"
ON public.confessions
FOR SELECT
USING (approved = true);

CREATE POLICY "Enable update for authenticated users (admin)"
ON public.confessions
FOR UPDATE
USING ((SELECT auth.role()) = 'authenticated')
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Enable delete for authenticated users (admin)"
ON public.confessions
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Enable insert for all users"
ON public.comments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable read for all users"
ON public.comments
FOR SELECT
USING (true);

CREATE POLICY "Enable update for all users (for reactions)"
ON public.comments
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users (admin)"
ON public.comments
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Enable read for all users"
ON public.reactions
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.reactions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.reactions
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable insert for service role"
ON public.actions_log
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Enable read for service role"
ON public.actions_log
FOR SELECT
USING ((SELECT auth.role()) = 'service_role');

INSERT INTO storage.buckets (id, name, public)
VALUES ('confessions', 'confessions', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Enable insert for all users"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'confessions');

CREATE POLICY "Enable read for all users"
ON storage.objects
FOR SELECT
USING (bucket_id = 'confessions');

CREATE POLICY "Enable delete for authenticated users (admin)"
ON storage.objects
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated' AND bucket_id = 'confessions');

CREATE OR REPLACE FUNCTION increment_reaction(post_id_in BIGINT, emoji_in TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.reactions (post_id, emoji, count)
    VALUES (post_id_in, emoji_in, 1)
    ON CONFLICT (post_id, emoji)
    DO UPDATE SET count = reactions.count + 1;

    IF emoji_in = '👍' THEN
        UPDATE public.confessions
        SET 
            likes_count = COALESCE(likes_count, 0) + 1,
            updated_at = NOW()
        WHERE id = post_id_in;
    ELSE
        UPDATE public.confessions
        SET updated_at = NOW()
        WHERE id = post_id_in;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION increment_comment_count(post_id_in BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.confessions
    SET
        comments_count = COALESCE(comments_count, 0) + 1,
        updated_at = NOW()
    WHERE id = post_id_in;
END;
$$;

CREATE OR REPLACE FUNCTION delete_post_and_storage(post_id_in BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, storage
AS $$
DECLARE
    post_media_url TEXT;
    post_media_urls TEXT[];
    media_path TEXT;
    url_part TEXT;
BEGIN

    SELECT media_url, media_urls
    INTO post_media_url, post_media_urls
    FROM public.confessions
    WHERE id = post_id_in;

    DELETE FROM public.confessions
    WHERE id = post_id_in;

    IF post_media_url IS NOT NULL THEN
        BEGIN
            media_path := regexp_replace(post_media_url, '^.*storage/v1/object/public/confessions/', '');
            IF media_path <> '' AND media_path IS NOT NULL THEN
                PERFORM storage.delete_object('confessions', media_path);
            END IF;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Failed to delete single storage object: %', SQLERRM;
        END;
    END IF;

    IF post_media_urls IS NOT NULL AND array_length(post_media_urls, 1) > 0 THEN
        FOREACH url_part IN ARRAY post_media_urls
        LOOP
            BEGIN
                media_path := regexp_replace(url_part, '^.*storage/v1/object/public/confessions/', '');
                IF media_path <> '' AND media_path IS NOT NULL THEN
                    PERFORM storage.delete_object('confessions', media_path);
                END IF;
            EXCEPTION
                WHEN others THEN
                    RAISE NOTICE 'Failed to delete array storage object: %', SQLERRM;
            END;
        END LOOP;
    END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.delete_comment_as_admin(BIGINT);
CREATE OR REPLACE FUNCTION public.delete_comment_as_admin(comment_id_in BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    post_id_var BIGINT;
    deleted_count INT;
BEGIN

    IF auth.role() <> 'authenticated' THEN
        RAISE EXCEPTION 'Access denied: Must be an authenticated admin.';
    END IF;

    SELECT post_id
    INTO post_id_var
    FROM public.comments
    WHERE id = comment_id_in;

    IF post_id_var IS NOT NULL THEN

        WITH RECURSIVE comments_to_delete AS (
            SELECT id FROM public.comments WHERE id = comment_id_in
            UNION
            SELECT c.id FROM public.comments c
            INNER JOIN comments_to_delete ctd ON c.parent_id = ctd.id
        )

        SELECT count(*)
        INTO deleted_count
        FROM comments_to_delete;

        DELETE FROM public.comments
        WHERE id = comment_id_in;

        UPDATE public.confessions
        SET
            comments_count = GREATEST(0, COALESCE(comments_count, 0) - deleted_count),
            updated_at = NOW()
        WHERE id = post_id_var;
    ELSE
        RAISE NOTICE 'Comment with ID % not found.', comment_id_in;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_report_count(post_id_in BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.confessions
    SET
        report_count = COALESCE(report_count, 0) + 1,
        reported = TRUE,
        updated_at = NOW()
    WHERE id = post_id_in;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_report_status(post_id_in BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.role() <> 'authenticated' THEN
        RAISE EXCEPTION 'Access denied: Must be an authenticated admin.';
    END IF;

    UPDATE public.confessions
    SET
        reported = FALSE,
        report_count = 0,
        updated_at = NOW()
    WHERE id = post_id_in;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_post_cooldown(author_id_in TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    last_post_time TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT created_at
    INTO last_post_time
    FROM public.confessions
    WHERE author_id = author_id_in
    ORDER BY created_at DESC
    LIMIT 1;

    IF last_post_time IS NOT NULL AND NOW() < (last_post_time + INTERVAL '10 minutes') THEN
        RAISE EXCEPTION 'Please wait 10 minutes before posting again.';
    END IF;
END;
$$;


CREATE INDEX IF NOT EXISTS idx_confessions_approved ON public.confessions(approved);
CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON public.confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_likes_count ON public.confessions(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_comments_count ON public.confessions(comments_count DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_tags ON public.confessions USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_confessions_pinned ON public.confessions(pinned DESC);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT ALL ON FUNCTION public.delete_comment_as_admin(BIGINT) TO authenticated;
GRANT ALL ON FUNCTION public.delete_post_and_storage(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_report_count(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_post_cooldown(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_report_status(BIGINT) TO authenticated;

GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;