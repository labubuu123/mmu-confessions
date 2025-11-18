CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.confessions (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    author_id TEXT,
    approved BOOLEAN DEFAULT FALSE,
    reported BOOLEAN DEFAULT FALSE,
    report_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    media_url TEXT,
    media_urls TEXT[],
    media_type TEXT,
    tags TEXT[],
    author_name TEXT,
    pinned BOOLEAN DEFAULT FALSE,
    mood JSONB DEFAULT NULL,
    series_id TEXT,
    series_name TEXT,
    series_description TEXT,
    series_part INTEGER,
    series_total INTEGER,
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
    reactions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reactions (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (post_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.post_user_reactions (
    post_id BIGINT NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comment_user_reactions (
    comment_id BIGINT NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.matchmaker_profiles (
    id BIGSERIAL PRIMARY KEY,
    author_id TEXT NOT NULL UNIQUE,
    nickname TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'undisclosed')),
    age INTEGER,
    age_range TEXT,
    city TEXT,
    interests TEXT[],
    self_intro TEXT NOT NULL,
    looking_for TEXT NOT NULL,
    contact_info TEXT,
    student_id_url TEXT,
    selfie_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'banned')),
    rejection_reason TEXT,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.matchmaker_likes (
    id BIGSERIAL PRIMARY KEY,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS public.matchmaker_matches (
    id BIGSERIAL PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    contact_exchanged BOOLEAN DEFAULT false,
    UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS public.matchmaker_messages (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL REFERENCES public.matchmaker_matches(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    message TEXT NOT NULL,
    is_contact_request BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.matchmaker_contact_requests (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL REFERENCES public.matchmaker_matches(id) ON DELETE CASCADE,
    requester_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.matchmaker_blocks (
    id BIGSERIAL PRIMARY KEY,
    blocker_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS public.matchmaker_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    reported_id TEXT NOT NULL,
    report_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'dismissed')),
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.matchmaker_sensitive_words (
    id BIGSERIAL PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.matchmaker_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.matchmaker_user_actions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('confessions', 'confessions', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('matchmaker_selfies', 'matchmaker_selfies', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('matchmaker_verification', 'matchmaker_verification', false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_user_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_user_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_sensitive_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_user_actions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename); 
    END LOOP;
    
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

DROP POLICY IF EXISTS "Enable read own profile" ON public.matchmaker_profiles;
DROP POLICY IF EXISTS "Enable update own profile" ON public.matchmaker_profiles;

CREATE POLICY "Enable insert for all users" ON public.confessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for approved posts" ON public.confessions FOR SELECT USING (approved = true);
CREATE POLICY "Enable update for admin" ON public.confessions FOR UPDATE USING ((SELECT auth.role()) = 'authenticated') WITH CHECK ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable delete for admin" ON public.confessions FOR DELETE USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable insert for all users" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for all users" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Enable update for all users (for reactions)" ON public.comments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for admin" ON public.comments FOR DELETE USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable read for all users" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.reactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable read for all users" ON public.post_user_reactions FOR SELECT USING (true);
CREATE POLICY "Enable all for users" ON public.post_user_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read for all users" ON public.comment_user_reactions FOR SELECT USING (true);
CREATE POLICY "Enable all for users" ON public.comment_user_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable insert for service role" ON public.actions_log FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role');
CREATE POLICY "Enable read for service role" ON public.actions_log FOR SELECT USING ((SELECT auth.role()) = 'service_role');
CREATE POLICY "Enable read for all users" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.polls FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for admin" ON public.polls FOR DELETE USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable read for all users" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.poll_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for admin" ON public.poll_votes FOR DELETE USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable read for all users" ON public.user_reputation FOR SELECT USING (true);
CREATE POLICY "Enable read for all users" ON public.events FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for admin" ON public.events FOR DELETE USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable insert for all users (confessions)" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'confessions');
CREATE POLICY "Enable read for all users (confessions)" ON storage.objects FOR SELECT USING (bucket_id = 'confessions');
CREATE POLICY "Enable delete for admin (confessions)" ON storage.objects FOR DELETE USING ((SELECT auth.role()) = 'authenticated' AND bucket_id = 'confessions');
CREATE POLICY "Enable read for all users (matchmaker_selfies)" ON storage.objects FOR SELECT USING (bucket_id = 'matchmaker_selfies');
CREATE POLICY "Enable insert for users (matchmaker_selfies)" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'matchmaker_selfies' AND auth.role() = 'authenticated');
CREATE POLICY "Enable insert for users (matchmaker_verification)" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'matchmaker_verification' AND auth.role() = 'authenticated');
CREATE POLICY "Enable read for admin (matchmaker_verification)" ON storage.objects FOR SELECT USING (bucket_id = 'matchmaker_verification' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable delete for admin (matchmaker)" ON storage.objects FOR DELETE USING ((SELECT auth.role()) = 'authenticated' AND (bucket_id = 'matchmaker_selfies' OR bucket_id = 'matchmaker_verification'));
CREATE POLICY "Enable read approved profiles" ON public.matchmaker_profiles FOR SELECT USING (status = 'approved' AND is_visible = true);
CREATE POLICY "Enable read own profile" ON public.matchmaker_profiles FOR SELECT USING (author_id = (SELECT current_setting('request.jwt.claims', true)::json->>'sub'));
CREATE POLICY "Enable insert own profile" ON public.matchmaker_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update own profile" ON public.matchmaker_profiles FOR UPDATE USING (author_id = (SELECT current_setting('request.jwt.claims', true)::json->>'sub') OR (SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable delete for admin" ON public.matchmaker_profiles FOR DELETE USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable delete own pending profile" ON public.matchmaker_profiles FOR DELETE USING (author_id = (SELECT current_setting('request.jwt.claims', true)::json->>'sub') AND status IN ('pending', 'rejected'));
CREATE POLICY "Enable delete own pending/rejected profile" ON public.matchmaker_profiles FOR DELETE USING (auth.uid()::text = author_id AND status IN ('pending', 'rejected'));
CREATE POLICY "Enable insert likes" ON public.matchmaker_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read own likes" ON public.matchmaker_likes FOR SELECT USING (true);
CREATE POLICY "Enable read own matches" ON public.matchmaker_matches FOR SELECT USING (true);
CREATE POLICY "Enable insert matches" ON public.matchmaker_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read match messages" ON public.matchmaker_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert messages" ON public.matchmaker_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable all on contact requests" ON public.matchmaker_contact_requests FOR ALL USING (true);
CREATE POLICY "Enable all on blocks" ON public.matchmaker_blocks FOR ALL USING (true);
CREATE POLICY "Enable insert reports" ON public.matchmaker_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read reports for admin" ON public.matchmaker_reports FOR SELECT USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable all for admin on sensitive words" ON public.matchmaker_sensitive_words FOR ALL USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable read settings for everyone" ON public.matchmaker_settings FOR SELECT USING (true);
CREATE POLICY "Enable inserts for admin" ON public.matchmaker_settings FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable updates for admin" ON public.matchmaker_settings FOR UPDATE USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable deletes for admin" ON public.matchmaker_settings FOR DELETE USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "Enable insert user actions" ON public.matchmaker_user_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for admin" ON public.matchmaker_user_actions FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

DROP FUNCTION IF EXISTS public.increment_reaction(BIGINT, TEXT);

CREATE OR REPLACE FUNCTION public.toggle_post_reaction(
    post_id_in BIGINT,
    emoji_in TEXT,
    user_id_in TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    old_emoji TEXT;
BEGIN
    SELECT emoji INTO old_emoji
    FROM public.post_user_reactions
    WHERE post_id = post_id_in AND user_id = user_id_in;

    IF old_emoji IS NULL THEN
        INSERT INTO public.post_user_reactions (post_id, user_id, emoji)
        VALUES (post_id_in, user_id_in, emoji_in);

        INSERT INTO public.reactions (post_id, emoji, count)
        VALUES (post_id_in, emoji_in, 1)
        ON CONFLICT (post_id, emoji)
        DO UPDATE SET count = reactions.count + 1;
        
        IF emoji_in = '👍' THEN
            UPDATE public.confessions
            SET likes_count = COALESCE(likes_count, 0) + 1, updated_at = NOW()
            WHERE id = post_id_in;
        END IF;

    ELSIF old_emoji = emoji_in THEN
        DELETE FROM public.post_user_reactions
        WHERE post_id = post_id_in AND user_id = user_id_in;

        UPDATE public.reactions
        SET count = GREATEST(0, count - 1)
        WHERE post_id = post_id_in AND emoji = emoji_in;

        IF emoji_in = '👍' THEN
            UPDATE public.confessions
            SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1), updated_at = NOW()
            WHERE id = post_id_in;
        END IF;

    ELSE
        UPDATE public.post_user_reactions
        SET emoji = emoji_in, created_at = NOW()
        WHERE post_id = post_id_in AND user_id = user_id_in;

        UPDATE public.reactions
        SET count = GREATEST(0, count - 1)
        WHERE post_id = post_id_in AND emoji = old_emoji;

        INSERT INTO public.reactions (post_id, emoji, count)
        VALUES (post_id_in, emoji_in, 1)
        ON CONFLICT (post_id, emoji)
        DO UPDATE SET count = reactions.count + 1;

        IF old_emoji = '👍' THEN
            UPDATE public.confessions
            SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1), updated_at = NOW()
            WHERE id = post_id_in;
        END IF;
        IF emoji_in = '👍' THEN
            UPDATE public.confessions
            SET likes_count = COALESCE(likes_count, 0) + 1, updated_at = NOW()
            WHERE id = post_id_in;
        END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_comment_reaction(
    comment_id_in BIGINT,
    emoji_in TEXT,
    user_id_in TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    old_emoji TEXT;
    current_reactions JSONB;
    new_reactions JSONB;
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    SELECT reactions INTO current_reactions
    FROM public.comments
    WHERE id = comment_id_in;
    
    IF current_reactions IS NULL THEN
        current_reactions := '{}'::jsonb;
    END IF;

    SELECT emoji INTO old_emoji
    FROM public.comment_user_reactions
    WHERE comment_id = comment_id_in AND user_id = user_id_in;

    IF old_emoji IS NULL THEN
        INSERT INTO public.comment_user_reactions (comment_id, user_id, emoji)
        VALUES (comment_id_in, user_id_in, emoji_in);
        
        old_count := (current_reactions->>emoji_in)::int;
        IF old_count IS NULL THEN old_count := 0; END IF;
        new_reactions := jsonb_set(current_reactions, ARRAY[emoji_in], to_jsonb(old_count + 1));

    ELSIF old_emoji = emoji_in THEN
        DELETE FROM public.comment_user_reactions
        WHERE comment_id = comment_id_in AND user_id = user_id_in;

        old_count := (current_reactions->>emoji_in)::int;
        IF old_count IS NULL OR old_count <= 1 THEN
            new_reactions := current_reactions - emoji_in;
        ELSE
            new_reactions := jsonb_set(current_reactions, ARRAY[emoji_in], to_jsonb(old_count - 1));
        END IF;

    ELSE
        UPDATE public.comment_user_reactions
        SET emoji = emoji_in, created_at = NOW()
        WHERE comment_id = comment_id_in AND user_id = user_id_in;

        old_count := (current_reactions->>old_emoji)::int;
        IF old_count IS NULL OR old_count <= 1 THEN
            new_reactions := current_reactions - old_emoji;
        ELSE
            new_reactions := jsonb_set(current_reactions, ARRAY[old_emoji], to_jsonb(old_count - 1));
        END IF;

        new_count := (new_reactions->>emoji_in)::int;
        IF new_count IS NULL THEN new_count := 0; END IF;
        new_reactions := jsonb_set(new_reactions, ARRAY[emoji_in], to_jsonb(new_count + 1));
    END IF;

    UPDATE public.comments
    SET reactions = new_reactions, updated_at = NOW()
    WHERE id = comment_id_in
    RETURNING reactions INTO new_reactions;

    RETURN new_reactions;
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
    SET comments_count = COALESCE(comments_count, 0) + 1, updated_at = NOW()
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

    DELETE FROM public.confessions WHERE id = post_id_in;

    IF post_media_url IS NOT NULL THEN
        BEGIN
            media_path := regexp_replace(post_media_url, '^.*storage/v1/object/public/confessions/', '');
            IF media_path <> '' AND media_path IS NOT NULL THEN
                PERFORM storage.delete_object('confessions', media_path);
            END IF;
        EXCEPTION WHEN others THEN
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
            EXCEPTION WHEN others THEN
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

    SELECT post_id INTO post_id_var
    FROM public.comments
    WHERE id = comment_id_in;

    IF post_id_var IS NOT NULL THEN
        WITH RECURSIVE comments_to_delete AS (
            SELECT id FROM public.comments WHERE id = comment_id_in
            UNION
            SELECT c.id FROM public.comments c
            INNER JOIN comments_to_delete ctd ON c.parent_id = ctd.id
        )
        SELECT count(*) INTO deleted_count FROM comments_to_delete;

        DELETE FROM public.comments WHERE id = comment_id_in;

        UPDATE public.confessions
        SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - deleted_count), updated_at = NOW()
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
    SET report_count = COALESCE(report_count, 0) + 1, reported = TRUE, updated_at = NOW()
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
    SET reported = FALSE, report_count = 0, updated_at = NOW()
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
    SELECT created_at INTO last_post_time
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
    SELECT * INTO poll_record FROM public.polls WHERE id = poll_id_in;

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
        c.id,
        c.text,
        c.author_id,
        c.approved,
        c.reported,
        c.likes_count,
        c.comments_count,
        c.media_url,
        c.media_urls,
        c.media_type,
        c.tags,
        c.author_name,
        c.pinned,
        c.created_at,
        c.updated_at,
        e.event_name,
        e.description,
        e.start_time,
        e.end_time,
        e.location
    FROM public.confessions c
    LEFT JOIN public.events e ON c.id = e.confession_id
    WHERE c.approved = true
    ORDER BY c.pinned DESC, c.created_at DESC
    OFFSET page_number * page_size
    LIMIT page_size;
END;
$$;

DROP FUNCTION IF EXISTS public.get_comments_with_reputation(BIGINT);
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
    reactions JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        co.id,
        co.post_id,
        co.parent_id,
        co.author_id,
        co.text,
        co.author_name,
        co.created_at,
        co.updated_at,
        co.reactions
    FROM public.comments co
    WHERE co.post_id = post_id_in
    ORDER BY co.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_my_series(author_id_in text)
RETURNS TABLE(
    series_id text,
    series_name text,
    series_total integer,
    max_part integer
)
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_posts AS (
        SELECT
            c.series_id,
            c.series_name,
            c.series_total,
            c.series_part,
            ROW_NUMBER() OVER(PARTITION BY c.series_id ORDER BY c.created_at DESC) as rn
        FROM
            public.confessions c
        WHERE
            c.author_id = author_id_in
            AND c.series_id IS NOT NULL
    ),
    part_counts AS (
        SELECT
            c.series_id,
            MAX(c.series_part) as max_series_part
        FROM
            public.confessions c
        WHERE
            c.author_id = author_id_in
            AND c.series_id IS NOT NULL
        GROUP BY
            c.series_id
    )
    SELECT
        rp.series_id,
        rp.series_name,
        rp.series_total,
        pc.max_series_part::integer
    FROM
        ranked_posts rp
    JOIN
        part_counts pc ON rp.series_id = pc.series_id
    WHERE
        rp.rn = 1;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS public.get_users_with_reputation_and_counts();
CREATE OR REPLACE FUNCTION public.get_users_with_reputation_and_counts()
RETURNS TABLE (
    author_id TEXT,
    post_count BIGINT,
    comment_count INTEGER,
    post_reactions_received_count INTEGER,
    comment_reactions_received_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.role() <> 'authenticated' THEN
        RAISE EXCEPTION 'Access denied: Must be an authenticated admin.';
    END IF;

    RETURN QUERY
    SELECT
        ur.author_id,
        (SELECT COUNT(*) FROM public.confessions c WHERE c.author_id = ur.author_id) AS post_count,
        ur.comment_count,
        ur.post_reactions_received_count,
        ur.comment_reactions_received_count,
        ur.created_at,
        ur.updated_at
    FROM
        public.user_reputation ur
    ORDER BY
        ur.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION check_and_create_match(
    user1_id_in TEXT,
    user2_id_in TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    match_id BIGINT;
    mutual_like BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.matchmaker_likes
        WHERE from_user_id = user2_id_in AND to_user_id = user1_id_in
    ) INTO mutual_like;
    
    IF mutual_like THEN
        INSERT INTO public.matchmaker_matches (user1_id, user2_id)
        VALUES (
            LEAST(user1_id_in, user2_id_in),
            GREATEST(user1_id_in, user2_id_in)
        )
        ON CONFLICT (user1_id, user2_id) DO UPDATE SET matched_at = NOW()
        RETURNING id INTO match_id;
        
        RETURN match_id;
    END IF;
    
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION check_sensitive_words(
    text_in TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    word RECORD;
BEGIN
    FOR word IN SELECT word FROM public.matchmaker_sensitive_words
    LOOP
        IF text_in ILIKE '%' || word.word || '%' THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_matches(user_id_in TEXT);
CREATE OR REPLACE FUNCTION get_user_matches(user_id_in TEXT)
RETURNS TABLE (
    match_id BIGINT,
    other_user_id TEXT,
    nickname TEXT,
    gender TEXT,
    age INTEGER,
    selfie_url TEXT,
    self_intro TEXT,
    matched_at TIMESTAMP WITH TIME ZONE,
    contact_exchanged BOOLEAN,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id as match_id,
        CASE
            WHEN m.user1_id = user_id_in THEN m.user2_id
            ELSE m.user1_id
        END as other_user_id,
        p.nickname,
        p.gender,
        p.age,
        p.selfie_url,
        p.self_intro,
        m.matched_at,
        m.contact_exchanged,
        (SELECT message FROM public.matchmaker_messages
        WHERE match_id = m.id
        ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM public.matchmaker_messages
        WHERE match_id = m.id
        ORDER BY created_at DESC LIMIT 1) as last_message_time
    FROM public.matchmaker_matches m
    JOIN public.matchmaker_profiles p ON (
        CASE
            WHEN m.user1_id = user_id_in THEN p.author_id = m.user2_id
            ELSE p.author_id = m.user1_id
        END
    )
    WHERE (m.user1_id = user_id_in OR m.user2_id = user_id_in)
    AND m.is_active = true
    ORDER BY COALESCE(last_message_time, m.matched_at) DESC;
END;
$$;

INSERT INTO public.matchmaker_settings (setting_key, setting_value) VALUES
('daily_like_limit', '20'),
('allow_links_in_chat', 'false'),
('allow_undisclosed_gender', 'true'),
('new_user_cooldown_minutes', '5')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.matchmaker_sensitive_words (word, category) VALUES
('whatsapp', 'contact'),
('telegram', 'contact'),
('wechat', 'contact'),
('line', 'contact'),
('phone', 'contact'),
('email', 'contact'),
('instagram', 'contact'),
('facebook', 'contact'),
('twitter', 'contact'),
('tiktok', 'contact')
ON CONFLICT (word) DO NOTHING;

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
CREATE INDEX IF NOT EXISTS idx_confessions_pinned ON public.confessions(pinned DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_series_id ON public.confessions(series_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_polls_confession_id ON public.polls(confession_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_voter_id ON public.poll_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_events_confession_id ON public.events(confession_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_matchmaker_profiles_status ON public.matchmaker_profiles(status);
CREATE INDEX IF NOT EXISTS idx_matchmaker_profiles_author_id ON public.matchmaker_profiles(author_id);
CREATE INDEX IF NOT EXISTS idx_matchmaker_likes_from_user ON public.matchmaker_likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaker_likes_to_user ON public.matchmaker_likes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_matchmaker_matches_users ON public.matchmaker_matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_matchmaker_messages_match ON public.matchmaker_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_matchmaker_blocks_blocker ON public.matchmaker_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_matchmaker_blocks_blocked ON public.matchmaker_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_post_user_reactions_user_id ON public.post_user_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_user_reactions_user_id ON public.comment_user_reactions(user_id);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT ALL ON FUNCTION public.delete_comment_as_admin(BIGINT) TO authenticated;
GRANT ALL ON FUNCTION public.delete_post_and_storage(BIGINT) TO authenticated;
GRANT ALL ON FUNCTION public.clear_report_status(BIGINT) TO authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_post_reaction(BIGINT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_comment_reaction(BIGINT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_comment_count(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_comment_reaction_total(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_confession() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_comment() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_post_reaction() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_comment_reaction() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_confessions_with_reputation(INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_comments_with_reputation(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_report_count(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_post_cooldown(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vote_on_poll(BIGINT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_poll_vote(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;