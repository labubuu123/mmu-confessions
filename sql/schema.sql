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

CREATE TABLE IF NOT EXISTS public.events (
    id BIGSERIAL PRIMARY KEY,
    confession_id BIGINT NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

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
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='polls'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.polls', pol.policyname); END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='poll_votes'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.poll_votes', pol.policyname); END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_reputation'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_reputation', pol.policyname); END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname); END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='events'
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', pol.policyname); END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.polls (
    id BIGSERIAL PRIMARY KEY,
    confession_id BIGINT NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    total_votes INTEGER DEFAULT 0,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_options CHECK (jsonb_array_length(options) >= 2 AND jsonb_array_length(options) <= 6)
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
    id BIGSERIAL PRIMARY KEY,
    poll_id BIGINT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    voter_id TEXT NOT NULL,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, voter_id)
);

CREATE TABLE IF NOT EXISTS public.user_reputation (
    author_id TEXT PRIMARY KEY,
    post_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    post_reactions_received_count INTEGER DEFAULT 0,
    comment_reactions_received_count INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

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

CREATE POLICY "Enable read for all users"
ON public.polls
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.polls
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.polls
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users (admin)"
ON public.polls
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Enable read for all users"
ON public.poll_votes
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.poll_votes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users (admin)"
ON public.poll_votes
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Enable read for all users"
ON public.user_reputation
FOR SELECT
USING (true);

CREATE POLICY "Enable read for all users"
ON public.events
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users (admin)"
ON public.events
FOR DELETE
USING ((SELECT auth.role()) = 'authenticated');

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
SECURITY DEFINER
SET search_path = public, pg_temp
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
SECURITY INVOKER
SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION public.vote_on_poll(
    poll_id_in BIGINT,
    voter_id_in TEXT,
    option_index_in INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    poll_record RECORD;
    updated_options JSONB;
    option_obj JSONB;
    result JSONB;
BEGIN
    SELECT * INTO poll_record
    FROM public.polls
    WHERE id = poll_id_in;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Poll not found';
    END IF;

    IF poll_record.ends_at IS NOT NULL AND NOW() > poll_record.ends_at THEN
        RAISE EXCEPTION 'This poll has ended';
    END IF;

    IF option_index_in < 0 OR option_index_in >= jsonb_array_length(poll_record.options) THEN
        RAISE EXCEPTION 'Invalid option index';
    END IF;

    IF EXISTS (SELECT 1 FROM public.poll_votes WHERE poll_id = poll_id_in AND voter_id = voter_id_in) THEN
        DECLARE
            old_option_index INTEGER;
        BEGIN
            SELECT option_index INTO old_option_index
            FROM public.poll_votes
            WHERE poll_id = poll_id_in AND voter_id = voter_id_in;

            updated_options := poll_record.options;
            option_obj := updated_options->old_option_index;
            option_obj := jsonb_set(option_obj, '{votes}', to_jsonb((option_obj->>'votes')::int - 1));
            updated_options := jsonb_set(updated_options, array[old_option_index::text], option_obj);

            option_obj := updated_options->option_index_in;
            option_obj := jsonb_set(option_obj, '{votes}', to_jsonb((option_obj->>'votes')::int + 1));
            updated_options := jsonb_set(updated_options, array[option_index_in::text], option_obj);

            UPDATE public.poll_votes
            SET option_index = option_index_in, created_at = NOW()
            WHERE poll_id = poll_id_in AND voter_id = voter_id_in;
        END;
    ELSE
        updated_options := poll_record.options;
        option_obj := updated_options->option_index_in;
        option_obj := jsonb_set(option_obj, '{votes}', to_jsonb((option_obj->>'votes')::int + 1));
        updated_options := jsonb_set(updated_options, array[option_index_in::text], option_obj);

        INSERT INTO public.poll_votes (poll_id, voter_id, option_index)
        VALUES (poll_id_in, voter_id_in, option_index_in);

        UPDATE public.polls
        SET total_votes = total_votes + 1
        WHERE id = poll_id_in;
    END IF;

    UPDATE public.polls
    SET options = updated_options, updated_at = NOW()
    WHERE id = poll_id_in
    RETURNING options, total_votes INTO result;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_poll_vote(
    poll_id_in BIGINT,
    voter_id_in TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    vote_index INTEGER;
BEGIN
    SELECT option_index INTO vote_index
    FROM public.poll_votes
    WHERE poll_id = poll_id_in AND voter_id = voter_id_in;

    RETURN vote_index;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_comment_reaction_total(reactions_json JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    total INTEGER := 0;
    r_value TEXT;
BEGIN
    IF reactions_json IS NULL THEN
        RETURN 0;
    END IF;
    
    FOR r_value IN SELECT value FROM jsonb_each_text(reactions_json)
    LOOP
        total := total + r_value::INTEGER;
    END LOOP;
    
    RETURN total;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_user_badges(author_id_in TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    rep_record RECORD;
    new_badges TEXT[] := ARRAY[]::TEXT[];
BEGIN
    SELECT * INTO rep_record
    FROM public.user_reputation
    WHERE author_id = author_id_in;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF (rep_record.post_count + rep_record.comment_count) >= 10 THEN
        new_badges := array_append(new_badges, 'ACTIVE_MEMBER');
    END IF;
    
    IF rep_record.comment_count >= 5 THEN
        new_badges := array_append(new_badges, 'HELPFUL_COMMENTER');
    END IF;

    IF (rep_record.post_reactions_received_count + rep_record.comment_reactions_received_count) >= 20 THEN
        new_badges := array_append(new_badges, 'SUPPORTIVE_FRIEND');
    END IF;

    UPDATE public.user_reputation
    SET badges = new_badges
    WHERE author_id = author_id_in;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_confession()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.author_id IS NOT NULL THEN
        INSERT INTO public.user_reputation (author_id, post_count)
        VALUES (NEW.author_id, 1)
        ON CONFLICT (author_id)
        DO UPDATE SET
            post_count = public.user_reputation.post_count + 1,
            updated_at = NOW();
        
        PERFORM public.recalculate_user_badges(NEW.author_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.author_id IS NOT NULL THEN
        INSERT INTO public.user_reputation (author_id, comment_count)
        VALUES (NEW.author_id, 1)
        ON CONFLICT (author_id)
        DO UPDATE SET
            comment_count = public.user_reputation.comment_count + 1,
            updated_at = NOW();
            
        PERFORM public.recalculate_user_badges(NEW.author_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_post_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    post_author_id TEXT;
    reaction_diff INTEGER;
BEGIN
    SELECT author_id INTO post_author_id
    FROM public.confessions
    WHERE id = NEW.post_id;

    IF post_author_id IS NOT NULL THEN
        IF TG_OP = 'INSERT' THEN
            reaction_diff := NEW.count;
        ELSIF TG_OP = 'UPDATE' THEN
            reaction_diff := NEW.count - OLD.count;
        END IF;

        INSERT INTO public.user_reputation (author_id, post_reactions_received_count)
        VALUES (post_author_id, reaction_diff)
        ON CONFLICT (author_id)
        DO UPDATE SET
            post_reactions_received_count = public.user_reputation.post_reactions_received_count + reaction_diff,
            updated_at = NOW();
            
        PERFORM public.recalculate_user_badges(post_author_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_comment_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    old_total INTEGER;
    new_total INTEGER;
    reaction_diff INTEGER;
BEGIN
    IF OLD.reactions IS DISTINCT FROM NEW.reactions AND NEW.author_id IS NOT NULL THEN
        old_total := public.get_comment_reaction_total(OLD.reactions);
        new_total := public.get_comment_reaction_total(NEW.reactions);
        reaction_diff := new_total - old_total;

        IF reaction_diff != 0 THEN
            INSERT INTO public.user_reputation (author_id, comment_reactions_received_count)
            VALUES (NEW.author_id, reaction_diff)
            ON CONFLICT (author_id)
            DO UPDATE SET
                comment_reactions_received_count = public.user_reputation.comment_reactions_received_count + reaction_diff,
                updated_at = NOW();
                
            PERFORM public.recalculate_user_badges(NEW.author_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.get_confessions_with_reputation(integer, integer);
CREATE OR REPLACE FUNCTION public.get_confessions_with_reputation(
    page_number INT,
    page_size INT
)
RETURNS TABLE (
    id BIGINT,
    text TEXT,
    author_id TEXT,
    approved BOOLEAN,
    reported BOOLEAN,
    likes_count INTEGER,
    comments_count INTEGER,
    media_url TEXT,
    media_urls TEXT[],
    media_type TEXT,
    tags TEXT[],
    author_name TEXT,
    pinned BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    author_reputation JSONB,
    event_name TEXT,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.*,
        COALESCE(
            jsonb_build_object('badges', ur.badges),
            '{"badges": []}'::jsonb
        ) AS author_reputation,
        e.event_name,
        e.description,
        e.start_time,
        e.end_time,
        e.location
    FROM
        public.confessions c
    LEFT JOIN
        public.user_reputation ur ON c.author_id = ur.author_id
    LEFT JOIN
        public.events e ON c.id = e.confession_id
    WHERE
        c.approved = true
    ORDER BY
        c.pinned DESC,
        c.created_at DESC
    OFFSET
        page_number * page_size
    LIMIT
        page_size;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_comments_with_reputation(
    post_id_in BIGINT
)
RETURNS TABLE (
    id BIGINT,
    post_id BIGINT,
    parent_id BIGINT,
    author_id TEXT,
    text TEXT,
    author_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    reactions JSONB,
    author_reputation JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        co.*,
        COALESCE(
            jsonb_build_object('badges', ur.badges),
            '{"badges": []}'::jsonb
        ) AS author_reputation
    FROM
        public.comments co
    LEFT JOIN
        public.user_reputation ur ON co.author_id = ur.author_id
    WHERE
        co.post_id = post_id_in
    ORDER BY
        co.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION increment_view_count(post_id_in BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.confessions
    SET
        view_count = COALESCE(view_count, 0) + 1,
        updated_at = NOW()
    WHERE id = post_id_in;
END;
$$;

DROP TRIGGER IF EXISTS on_new_confession ON public.confessions;
CREATE TRIGGER on_new_confession
    AFTER INSERT ON public.confessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_confession();

DROP TRIGGER IF EXISTS on_new_comment ON public.comments;
CREATE TRIGGER on_new_comment
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

DROP TRIGGER IF EXISTS on_post_reaction ON public.reactions;
CREATE TRIGGER on_post_reaction
    AFTER INSERT OR UPDATE ON public.reactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_post_reaction();

DROP TRIGGER IF EXISTS on_comment_reaction ON public.comments;
CREATE TRIGGER on_comment_reaction
    AFTER UPDATE OF reactions ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_comment_reaction();

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
CREATE INDEX IF NOT EXISTS idx_polls_confession_id ON public.polls(confession_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_voter_id ON public.poll_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_events_confession_id ON public.events(confession_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_view_count ON public.confessions(view_count DESC);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT ALL ON FUNCTION public.delete_comment_as_admin(BIGINT) TO authenticated;
GRANT ALL ON FUNCTION public.delete_post_and_storage(BIGINT) TO authenticated;
GRANT ALL ON public.polls TO anon, authenticated;
GRANT ALL ON public.poll_votes TO anon, authenticated;
GRANT ALL ON SEQUENCE polls_id_seq TO anon, authenticated;
GRANT ALL ON SEQUENCE poll_votes_id_seq TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON public.user_reputation TO anon, authenticated;
GRANT ALL ON FUNCTION public.get_comment_reaction_total(JSONB) TO anon, authenticated;
GRANT ALL ON FUNCTION public.recalculate_user_badges(TEXT) TO anon, authenticated;
GRANT ALL ON FUNCTION public.handle_new_confession() TO anon, authenticated;
GRANT ALL ON FUNCTION public.handle_new_comment() TO anon, authenticated;
GRANT ALL ON FUNCTION public.handle_post_reaction() TO anon, authenticated;
GRANT ALL ON FUNCTION public.handle_comment_reaction() TO anon, authenticated;
GRANT ALL ON public.events TO anon, authenticated;
GRANT ALL ON SEQUENCE events_id_seq TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_confessions_with_reputation(INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_comments_with_reputation(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_report_count(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_post_cooldown(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_report_status(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vote_on_poll(BIGINT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_poll_vote(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count(BIGINT) TO anon, authenticated;