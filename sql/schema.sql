CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('daily-cleanup-posts', '0 0 * * *', 'SELECT public.auto_delete_expired_posts()');
SELECT cron.schedule('cleanup-adult-whispers', '* * * * *', 'SELECT public.auto_delete_expired_adult_posts()');

INSERT INTO storage.buckets (id, name, public)
VALUES ('confessions', 'confessions', true)
ON CONFLICT (id) DO NOTHING;

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_permanent BOOLEAN DEFAULT FALSE,
    is_sponsored BOOLEAN DEFAULT FALSE,
    sponsor_url TEXT,
    whatsapp_number TEXT,
    brand_color TEXT DEFAULT '#EAB308',
    campus TEXT,
    reply_to_id BIGINT,
    is_debate BOOLEAN DEFAULT FALSE,
    device_id TEXT
);

CREATE TABLE IF NOT EXISTS public.comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE DEFAULT NULL,
    author_id TEXT,
    text TEXT NOT NULL,
    author_name TEXT,
    reactions JSONB DEFAULT '{}'::jsonb,
    debate_side TEXT CHECK (debate_side IN ('agree', 'disagree')),
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
    confession_id BIGINT NOT NULL UNIQUE REFERENCES public.confessions(id) ON DELETE CASCADE,
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
    is_blocked BOOLEAN DEFAULT FALSE,
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
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    age INTEGER CHECK (age >= 18),
    city TEXT,
    lat FLOAT,
    long FLOAT,
    interests TEXT[],
    red_flags TEXT[] DEFAULT '{}',
    mbti TEXT,
    zodiac TEXT,
    self_intro TEXT NOT NULL,
    looking_for TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    avatar_seed TEXT,
    avatar_config JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'banned')),
    rejection_reason TEXT,
    warning_count INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.matchmaker_loves (
    id BIGSERIAL PRIMARY KEY,
    from_user_id TEXT NOT NULL REFERENCES public.matchmaker_profiles(author_id) ON DELETE CASCADE,
    to_user_id TEXT NOT NULL REFERENCES public.matchmaker_profiles(author_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS public.matchmaker_matches (
    id BIGSERIAL PRIMARY KEY,
    user1_id TEXT NOT NULL REFERENCES public.matchmaker_profiles(author_id) ON DELETE CASCADE,
    user2_id TEXT NOT NULL REFERENCES public.matchmaker_profiles(author_id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS public.matchmaker_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES public.matchmaker_profiles(author_id) ON DELETE CASCADE,
    reported_id TEXT NOT NULL REFERENCES public.matchmaker_profiles(author_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.matchmaker_feed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id TEXT REFERENCES public.matchmaker_profiles(author_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    location_tag TEXT,
    gender TEXT,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.matchmaker_credentials (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    images TEXT[],
    is_sold BOOLEAN DEFAULT FALSE,
    report_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired'))
);

CREATE TABLE IF NOT EXISTS public.marketplace_reports (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    reporter_id TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    type TEXT DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lost_and_found (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    confession_id BIGINT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
    item_name TEXT NOT NULL,
    location TEXT NOT NULL,
    contact_info TEXT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.adult_confessions (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    author_alias TEXT DEFAULT 'Anonymous',
    author_id TEXT NOT NULL,
    tags TEXT[],
    likes_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    ai_flagged BOOLEAN DEFAULT FALSE,
    ai_score FLOAT DEFAULT 0,
    is_approved BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    has_poll BOOLEAN DEFAULT FALSE,
    poll_question TEXT,
    poll_options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.adult_reactions (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.adult_confessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, type)
);

CREATE TABLE IF NOT EXISTS public.adult_comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.adult_confessions(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES public.adult_comments(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    author_alias TEXT DEFAULT 'NightOwl',
    author_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.adult_poll_votes (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    post_id BIGINT REFERENCES adult_confessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    option_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.adult_comment_reactions (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT REFERENCES public.adult_comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.blocked_devices (
    device_id TEXT PRIMARY KEY,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT
);

CREATE TABLE IF NOT EXISTS public.shop_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    cost INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cosmetic', 'powerup', 'badge')),
    type TEXT NOT NULL CHECK (type IN ('frame', 'name_color', 'pin_ticket', 'highlight_ticket')),
    config JSONB DEFAULT '{}'::jsonb,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_inventory (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.matchmaker_profiles(author_id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
    is_equipped BOOLEAN DEFAULT FALSE,
    quantity INTEGER DEFAULT 1,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.shop_items (id, name, description, cost, category, type, config, icon) VALUES
('frame_gold', 'Golden Glory', 'A shiny gold border for your Matchmaker avatar.', 500, 'cosmetic', 'frame', '{"border": "4px solid #F59E0B", "glow": "0 0 10px #F59E0B"}'::jsonb, 'Crown'),
('frame_neon', 'Cyberpunk Neon', ' glowing neon pink border.', 750, 'cosmetic', 'frame', '{"border": "3px solid #EC4899", "glow": "0 0 15px #EC4899"}'::jsonb, 'Zap'),
('name_blue', 'Royal Blue Name', 'Make your name stand out in comments.', 300, 'cosmetic', 'name_color', '{"color": "#3B82F6"}'::jsonb, 'Palette'),
('ticket_pin', 'Pin Power (1h)', 'Pin your confession to the top of the feed for 1 hour.', 1000, 'powerup', 'pin_ticket', '{"duration_minutes": 60}'::jsonb, 'Pin'),
('ticket_highlight', 'Post Highlight', 'Change your post background to a premium color.', 200, 'powerup', 'highlight_ticket', '{"colors": ["#FFFBEB", "#FEF3C7"]}'::jsonb, 'Highlighter')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.matchmaker_profiles ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;
ALTER TABLE public.matchmaker_profiles ADD COLUMN IF NOT EXISTS lat FLOAT;
ALTER TABLE public.matchmaker_profiles ADD COLUMN IF NOT EXISTS long FLOAT;
ALTER TABLE public.matchmaker_profiles ADD COLUMN IF NOT EXISTS mbti TEXT;
ALTER TABLE public.matchmaker_profiles ADD COLUMN IF NOT EXISTS zodiac TEXT;
ALTER TABLE public.matchmaker_profiles ADD COLUMN IF NOT EXISTS red_flags TEXT[] DEFAULT '{}';
ALTER TABLE public.matchmaker_profiles ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT FALSE;
ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS sponsor_url TEXT;
ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#EAB308';
ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS campus TEXT;
ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS reply_to_id BIGINT;
ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS is_debate BOOLEAN DEFAULT FALSE;
ALTER TABLE public.confessions ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE public.confessions DROP CONSTRAINT IF EXISTS fk_reply_to_post;
ALTER TABLE public.confessions ADD CONSTRAINT fk_reply_to_post FOREIGN KEY (reply_to_id) REFERENCES public.confessions (id) ON DELETE SET NULL;

ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE;
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired'));

ALTER TABLE public.matchmaker_feed DROP CONSTRAINT IF EXISTS matchmaker_feed_author_id_fkey;
ALTER TABLE public.matchmaker_feed ADD CONSTRAINT matchmaker_feed_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.matchmaker_profiles(author_id) ON DELETE CASCADE;

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS debate_side TEXT CHECK (debate_side IN ('agree', 'disagree'));

ALTER TABLE public.adult_confessions ADD COLUMN IF NOT EXISTS has_poll BOOLEAN DEFAULT FALSE;
ALTER TABLE public.adult_confessions ADD COLUMN IF NOT EXISTS poll_question TEXT;
ALTER TABLE public.adult_confessions ADD COLUMN IF NOT EXISTS poll_options JSONB;
ALTER TABLE public.adult_comments ADD COLUMN IF NOT EXISTS parent_id BIGINT;
ALTER TABLE public.adult_comments DROP CONSTRAINT IF EXISTS adult_comments_parent_id_fkey;
ALTER TABLE public.adult_comments ADD CONSTRAINT adult_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.adult_comments(id) ON DELETE CASCADE;
ALTER TABLE public.adult_confessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.user_reputation ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_reputation ADD COLUMN IF NOT EXISTS spent_points INTEGER DEFAULT 0;

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_report_status(post_id_in BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (auth.jwt() -> 'user_metadata' ->> 'role') <> 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin role required.';
    END IF;

    UPDATE public.confessions
    SET reported = FALSE, report_count = 0, updated_at = NOW()
    WHERE id = post_id_in;
END;
$$;

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
    IF (auth.jwt() -> 'user_metadata' ->> 'role') <> 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin role required.';
    END IF;

    SELECT post_id INTO post_id_var FROM public.comments WHERE id = comment_id_in;

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
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.ban_user_and_device(
    target_user_id TEXT,
    block_status BOOLEAN
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_device_id TEXT;
    result_message TEXT;
BEGIN
    IF (auth.jwt() -> 'user_metadata' ->> 'role') <> 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin role required.';
    END IF;

    UPDATE public.user_reputation
    SET is_blocked = block_status
    WHERE author_id = target_user_id;

    IF block_status = TRUE THEN
        SELECT device_id INTO last_device_id
        FROM public.confessions
        WHERE author_id = target_user_id AND device_id IS NOT NULL
        ORDER BY created_at DESC LIMIT 1;

        IF last_device_id IS NOT NULL THEN
            INSERT INTO public.blocked_devices (device_id, reason)
            VALUES (last_device_id, 'Linked to blocked user ' || target_user_id)
            ON CONFLICT (device_id) DO NOTHING;
            result_message := 'User blocked AND Device (' || last_device_id || ') banned!';
        ELSE
            result_message := 'User blocked. (No Device ID found)';
        END IF;
    ELSE
        result_message := 'User unblocked successfully.';
    END IF;

    RETURN result_message;
END;
$$;

CREATE OR REPLACE FUNCTION clear_marketplace_reports(item_id_input BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt() -> 'user_metadata' ->> 'role') <> 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin role required.';
    END IF;

    UPDATE public.marketplace_items
    SET report_count = 0
    WHERE id = item_id_input;

    DELETE FROM public.marketplace_reports
    WHERE item_id = item_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_users_with_reputation_and_counts()
RETURNS TABLE (
    author_id TEXT,
    post_count BIGINT,
    comment_count INTEGER,
    post_reactions_received_count INTEGER,
    comment_reactions_received_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_blocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (auth.jwt() -> 'user_metadata' ->> 'role') <> 'admin' THEN
        RAISE EXCEPTION 'Access denied: Must be an admin.';
    END IF;

    RETURN QUERY
    SELECT ur.author_id,
        (SELECT COUNT(*) FROM public.confessions c WHERE c.author_id = ur.author_id) AS post_count,
        ur.comment_count, ur.post_reactions_received_count, ur.comment_reactions_received_count, ur.created_at, ur.updated_at, ur.is_blocked
    FROM public.user_reputation ur
    ORDER BY ur.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_post_and_storage(post_id_in BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, storage, pg_temp
AS $$
DECLARE
    post_media_url TEXT;
    post_media_urls TEXT[];
    media_path TEXT;
    url_part TEXT;
BEGIN
    IF (auth.jwt() -> 'user_metadata' ->> 'role') <> 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin role required.';
    END IF;

    SELECT media_url, media_urls INTO post_media_url, post_media_urls
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
            RAISE WARNING 'Failed to delete single storage object: %', SQLERRM;
        END;
    END IF;

    IF post_media_urls IS NOT NULL AND array_length(post_media_urls, 1) > 0 THEN
        FOREACH url_part IN ARRAY post_media_urls LOOP
            BEGIN
                media_path := regexp_replace(url_part, '^.*storage/v1/object/public/confessions/', '');
                
                IF media_path <> '' AND media_path IS NOT NULL THEN
                    PERFORM storage.delete_object('confessions', media_path);
                END IF;
            EXCEPTION WHEN others THEN
                RAISE WARNING 'Failed to delete array storage object: %', SQLERRM;
            END;
        END LOOP;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_post_reaction(post_id_in BIGINT, emoji_in TEXT, user_id_in TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    old_emoji TEXT;
    v_new_count INTEGER;
BEGIN
    SELECT emoji INTO old_emoji FROM public.post_user_reactions WHERE post_id = post_id_in AND user_id = user_id_in;

    IF old_emoji IS NULL THEN
        INSERT INTO public.post_user_reactions (post_id, user_id, emoji) VALUES (post_id_in, user_id_in, emoji_in);
        INSERT INTO public.reactions (post_id, emoji, count) VALUES (post_id_in, emoji_in, 1) ON CONFLICT (post_id, emoji) DO UPDATE SET count = reactions.count + 1;
        IF emoji_in = '🔥' THEN UPDATE public.confessions SET likes_count = COALESCE(likes_count, 0) + 1, updated_at = NOW() WHERE id = post_id_in; END IF;
    ELSIF old_emoji = emoji_in THEN
        DELETE FROM public.post_user_reactions WHERE post_id = post_id_in AND user_id = user_id_in;
        UPDATE public.reactions SET count = GREATEST(0, count - 1) WHERE post_id = post_id_in AND emoji = emoji_in RETURNING count INTO v_new_count;
        IF v_new_count = 0 THEN DELETE FROM public.reactions WHERE post_id = post_id_in AND emoji = emoji_in; END IF;
        IF emoji_in = '🔥' THEN UPDATE public.confessions SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1), updated_at = NOW() WHERE id = post_id_in; END IF;
    ELSE
        UPDATE public.post_user_reactions SET emoji = emoji_in, created_at = NOW() WHERE post_id = post_id_in AND user_id = user_id_in;
        UPDATE public.reactions SET count = GREATEST(0, count - 1) WHERE post_id = post_id_in AND emoji = old_emoji RETURNING count INTO v_new_count;
        IF v_new_count = 0 THEN DELETE FROM public.reactions WHERE post_id = post_id_in AND emoji = old_emoji; END IF;
        INSERT INTO public.reactions (post_id, emoji, count) VALUES (post_id_in, emoji_in, 1) ON CONFLICT (post_id, emoji) DO UPDATE SET count = reactions.count + 1;
        IF old_emoji = '🔥' THEN UPDATE public.confessions SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1), updated_at = NOW() WHERE id = post_id_in; END IF;
        IF emoji_in = '🔥' THEN UPDATE public.confessions SET likes_count = COALESCE(likes_count, 0) + 1, updated_at = NOW() WHERE id = post_id_in; END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_reaction(post_id_in BIGINT, emoji_in TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.reactions (post_id, emoji, count) VALUES (post_id_in, emoji_in, 1) ON CONFLICT (post_id, emoji) DO UPDATE SET count = public.reactions.count + 1;
    IF emoji_in = '❤️' THEN UPDATE public.confessions SET likes_count = COALESCE(likes_count, 0) + 1, updated_at = NOW() WHERE id = post_id_in; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_comment_reaction(comment_id_in BIGINT, emoji_in TEXT, user_id_in TEXT)
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
    SELECT reactions INTO current_reactions FROM public.comments WHERE id = comment_id_in;
    IF current_reactions IS NULL THEN current_reactions := '{}'::jsonb; END IF;
    SELECT emoji INTO old_emoji FROM public.comment_user_reactions WHERE comment_id = comment_id_in AND user_id = user_id_in;

    IF old_emoji IS NULL THEN
        INSERT INTO public.comment_user_reactions (comment_id, user_id, emoji) VALUES (comment_id_in, user_id_in, emoji_in);
        old_count := (current_reactions->>emoji_in)::int; IF old_count IS NULL THEN old_count := 0; END IF;
        new_reactions := jsonb_set(current_reactions, ARRAY[emoji_in], to_jsonb(old_count + 1));
    ELSIF old_emoji = emoji_in THEN
        DELETE FROM public.comment_user_reactions WHERE comment_id = comment_id_in AND user_id = user_id_in;
        old_count := (current_reactions->>emoji_in)::int; IF old_count IS NULL OR old_count <= 1 THEN new_reactions := current_reactions - emoji_in; ELSE new_reactions := jsonb_set(current_reactions, ARRAY[emoji_in], to_jsonb(old_count - 1)); END IF;
    ELSE
        UPDATE public.comment_user_reactions SET emoji = emoji_in, created_at = NOW() WHERE comment_id = comment_id_in AND user_id = user_id_in;
        old_count := (current_reactions->>old_emoji)::int; IF old_count IS NULL OR old_count <= 1 THEN new_reactions := current_reactions - old_emoji; ELSE new_reactions := jsonb_set(current_reactions, ARRAY[old_emoji], to_jsonb(old_count - 1)); END IF;
        new_count := (new_reactions->>emoji_in)::int; IF new_count IS NULL THEN new_count := 0; END IF;
        new_reactions := jsonb_set(new_reactions, ARRAY[emoji_in], to_jsonb(new_count + 1));
    END IF;
    UPDATE public.comments SET reactions = new_reactions, updated_at = NOW() WHERE id = comment_id_in RETURNING reactions INTO new_reactions;
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
    UPDATE public.confessions SET comments_count = COALESCE(comments_count, 0) + 1, updated_at = NOW() WHERE id = post_id_in;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_report_count(post_id_in BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.confessions SET report_count = COALESCE(report_count, 0) + 1, reported = TRUE, updated_at = NOW() WHERE id = post_id_in;
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
    SELECT created_at INTO last_post_time FROM public.confessions WHERE author_id = author_id_in ORDER BY created_at DESC LIMIT 1;
    IF last_post_time IS NOT NULL AND NOW() < (last_post_time + INTERVAL '10 minutes') THEN RAISE EXCEPTION 'Please wait 10 minutes before posting again.'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.vote_on_poll(poll_id_in BIGINT, voter_id_in TEXT, option_index_in INTEGER)
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
    IF NOT FOUND THEN RAISE EXCEPTION 'Poll not found'; END IF;
    IF poll_record.ends_at IS NOT NULL AND NOW() > poll_record.ends_at THEN RAISE EXCEPTION 'This poll has ended'; END IF;
    IF option_index_in < 0 OR option_index_in >= jsonb_array_length(poll_record.options) THEN RAISE EXCEPTION 'Invalid option index'; END IF;

    IF EXISTS (SELECT 1 FROM public.poll_votes WHERE poll_id = poll_id_in AND voter_id = voter_id_in) THEN
        DECLARE
            old_option_index INTEGER;
        BEGIN
            SELECT option_index INTO old_option_index FROM public.poll_votes WHERE poll_id = poll_id_in AND voter_id = voter_id_in;
            updated_options := poll_record.options;
            option_obj := updated_options->old_option_index;
            option_obj := jsonb_set(option_obj, '{votes}', to_jsonb((option_obj->>'votes')::int - 1));
            updated_options := jsonb_set(updated_options, array[old_option_index::text], option_obj);
            option_obj := updated_options->option_index_in;
            option_obj := jsonb_set(option_obj, '{votes}', to_jsonb((option_obj->>'votes')::int + 1));
            updated_options := jsonb_set(updated_options, array[option_index_in::text], option_obj);
            UPDATE public.poll_votes SET option_index = option_index_in, created_at = NOW() WHERE poll_id = poll_id_in AND voter_id = voter_id_in;
        END;
    ELSE
        updated_options := poll_record.options;
        option_obj := updated_options->option_index_in;
        option_obj := jsonb_set(option_obj, '{votes}', to_jsonb((option_obj->>'votes')::int + 1));
        updated_options := jsonb_set(updated_options, array[option_index_in::text], option_obj);
        INSERT INTO public.poll_votes (poll_id, voter_id, option_index) VALUES (poll_id_in, voter_id_in, option_index_in);
        UPDATE public.polls SET total_votes = total_votes + 1 WHERE id = poll_id_in;
    END IF;
    UPDATE public.polls SET options = updated_options, updated_at = NOW() WHERE id = poll_id_in RETURNING options, total_votes INTO result;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_poll_vote(poll_id_in BIGINT, voter_id_in TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    vote_index INTEGER;
BEGIN
    SELECT option_index INTO vote_index FROM public.poll_votes WHERE poll_id = poll_id_in AND voter_id = voter_id_in;
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
    IF reactions_json IS NULL THEN RETURN 0; END IF;
    FOR r_value IN SELECT value FROM jsonb_each_text(reactions_json) LOOP
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
        INSERT INTO public.user_reputation (author_id, post_count) VALUES (NEW.author_id, 1)
        ON CONFLICT (author_id) DO UPDATE SET post_count = public.user_reputation.post_count + 1, updated_at = NOW();
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
        INSERT INTO public.user_reputation (author_id, comment_count) VALUES (NEW.author_id, 1)
        ON CONFLICT (author_id) DO UPDATE SET comment_count = public.user_reputation.comment_count + 1, updated_at = NOW();
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
    SELECT author_id INTO post_author_id FROM public.confessions WHERE id = NEW.post_id;
    IF post_author_id IS NOT NULL THEN
        IF TG_OP = 'INSERT' THEN reaction_diff := NEW.count; ELSIF TG_OP = 'UPDATE' THEN reaction_diff := NEW.count - OLD.count; END IF;
        INSERT INTO public.user_reputation (author_id, post_reactions_received_count) VALUES (post_author_id, reaction_diff)
        ON CONFLICT (author_id) DO UPDATE SET post_reactions_received_count = public.user_reputation.post_reactions_received_count + reaction_diff, updated_at = NOW();
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
            INSERT INTO public.user_reputation (author_id, comment_reactions_received_count) VALUES (NEW.author_id, reaction_diff)
            ON CONFLICT (author_id) DO UPDATE SET comment_reactions_received_count = public.user_reputation.comment_reactions_received_count + reaction_diff, updated_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_confessions_with_reputation(page_number INT, page_size INT)
RETURNS TABLE (id BIGINT, text TEXT, author_id TEXT, approved BOOLEAN, reported BOOLEAN, likes_count INTEGER, comments_count INTEGER, media_url TEXT, media_urls TEXT[], media_type TEXT, tags TEXT[], author_name TEXT, pinned BOOLEAN, created_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE, event_name TEXT, description TEXT, start_time TIMESTAMP WITH TIME ZONE, end_time TIMESTAMP WITH TIME ZONE, location TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.text, c.author_id, c.approved, c.reported, c.likes_count, c.comments_count, c.media_url, c.media_urls, c.media_type, c.tags, c.author_name, c.pinned, c.created_at, c.updated_at, e.event_name, e.description, e.start_time, e.end_time, e.location
    FROM public.confessions c LEFT JOIN public.events e ON c.id = e.confession_id WHERE c.approved = true
    ORDER BY c.pinned DESC, c.created_at DESC OFFSET page_number * page_size LIMIT page_size;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_comments_with_reputation(post_id_in BIGINT)
RETURNS TABLE (id BIGINT, post_id BIGINT, parent_id BIGINT, author_id TEXT, text TEXT, author_name TEXT, created_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE, reactions JSONB)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY SELECT co.id, co.post_id, co.parent_id, co.author_id, co.text, co.author_name, co.created_at, co.updated_at, co.reactions FROM public.comments co WHERE co.post_id = post_id_in ORDER BY co.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_my_series(author_id_in text)
RETURNS TABLE(series_id text, series_name text, series_total integer, max_part integer)
AS $$
BEGIN
    RETURN QUERY WITH ranked_posts AS (SELECT c.series_id, c.series_name, c.series_total, c.series_part, ROW_NUMBER() OVER(PARTITION BY c.series_id ORDER BY c.created_at DESC) as rn FROM public.confessions c WHERE c.author_id = author_id_in AND c.series_id IS NOT NULL), part_counts AS (SELECT c.series_id, MAX(c.series_part) as max_series_part FROM public.confessions c WHERE c.author_id = author_id_in AND c.series_id IS NOT NULL GROUP BY c.series_id)
    SELECT rp.series_id, rp.series_name, rp.series_total, pc.max_series_part::integer FROM ranked_posts rp JOIN part_counts pc ON rp.series_id = pc.series_id WHERE rp.rn = 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.enforce_user_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id TEXT;
    target_device_id TEXT;
BEGIN
    IF TG_TABLE_NAME = 'confessions' THEN
        target_user_id := NEW.author_id;
        target_device_id := NEW.device_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        target_user_id := NEW.author_id;
    ELSIF TG_TABLE_NAME = 'poll_votes' THEN
        target_user_id := NEW.voter_id;
    ELSIF TG_TABLE_NAME = 'marketplace_items' THEN
        target_user_id := NEW.seller_id;
    ELSE
        target_user_id := NEW.user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM public.user_reputation WHERE author_id = target_user_id AND is_blocked = TRUE) THEN
        RAISE EXCEPTION 'Action denied. Your account has been restricted.';
    END IF;

    IF target_device_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.blocked_devices WHERE device_id = target_device_id) THEN
            RAISE EXCEPTION 'Action denied. This device has been banned due to previous violations.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_love_action(target_user_id TEXT, action_type TEXT, message_in TEXT DEFAULT NULL, love_id_in BIGINT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_uid TEXT;
BEGIN
    current_uid := auth.uid()::text;
    IF NOT EXISTS (SELECT 1 FROM public.matchmaker_profiles WHERE author_id = current_uid) THEN RAISE EXCEPTION 'Profile Error: Your user profile (ID: %) was not found.', current_uid; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.matchmaker_profiles WHERE author_id = target_user_id) THEN RAISE EXCEPTION 'Target Error: The user you are trying to connect with (ID: %) does not exist.', target_user_id; END IF;
    IF action_type = 'love' THEN
        INSERT INTO public.matchmaker_loves (from_user_id, to_user_id, status, message, created_at, updated_at) VALUES (current_uid, target_user_id, 'pending', message_in, NOW(), NOW()) ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET status = 'pending', message = EXCLUDED.message, updated_at = NOW();
    ELSIF action_type = 'delete' OR action_type = 'withdraw' THEN DELETE FROM public.matchmaker_loves WHERE (from_user_id = current_uid AND to_user_id = target_user_id);
    ELSIF action_type = 'accept' THEN
        UPDATE public.matchmaker_loves SET status = 'accepted', updated_at = NOW() WHERE id = love_id_in;
        INSERT INTO public.matchmaker_matches (user1_id, user2_id) VALUES (LEAST(current_uid, target_user_id), GREATEST(current_uid, target_user_id)) ON CONFLICT DO NOTHING;
    ELSIF action_type = 'reject' THEN UPDATE public.matchmaker_loves SET status = 'rejected', updated_at = NOW() WHERE id = love_id_in;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_browse_profiles(viewer_id TEXT, viewer_interests TEXT[] DEFAULT '{}', viewer_mbti TEXT DEFAULT '', filter_gender TEXT DEFAULT 'all', filter_max_age INT DEFAULT 100, filter_lat FLOAT DEFAULT NULL, filter_long FLOAT DEFAULT NULL, filter_radius_km INT DEFAULT NULL)
RETURNS TABLE (author_id TEXT, nickname TEXT, gender TEXT, age INT, city TEXT, interests TEXT[], red_flags TEXT[], mbti TEXT, zodiac TEXT, self_intro TEXT, looking_for TEXT, avatar_seed TEXT, avatar_config JSONB, created_at TIMESTAMP WITH TIME ZONE, distance_km FLOAT, has_sent_love BOOLEAN, match_score INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.author_id, p.nickname, p.gender, p.age, p.city, p.interests, p.red_flags, p.mbti, p.zodiac, p.self_intro, p.looking_for, p.avatar_seed, p.avatar_config, p.created_at,
    CASE WHEN filter_lat IS NOT NULL AND filter_long IS NOT NULL AND p.lat IS NOT NULL AND p.long IS NOT NULL THEN (6371 * acos(least(1.0, greatest(-1.0, cos(radians(filter_lat)) * cos(radians(p.lat)) * cos(radians(p.long) - radians(filter_long)) + sin(radians(filter_lat)) * sin(radians(p.lat)))))) ELSE NULL END AS distance_km,
    EXISTS(SELECT 1 FROM public.matchmaker_loves l WHERE l.from_user_id = viewer_id AND l.to_user_id = p.author_id AND l.status IN ('pending', 'accepted')) AS has_sent_love,
    ((COALESCE(array_length(ARRAY(SELECT unnest(p.interests) INTERSECT SELECT unnest(viewer_interests)), 1), 0) * 2) + (CASE WHEN length(p.mbti) = 4 AND length(viewer_mbti) = 4 THEN (CASE WHEN substr(p.mbti, 1, 1) = substr(viewer_mbti, 1, 1) THEN 1 ELSE 0 END) + (CASE WHEN substr(p.mbti, 2, 1) = substr(viewer_mbti, 2, 1) THEN 1 ELSE 0 END) + (CASE WHEN substr(p.mbti, 3, 1) = substr(viewer_mbti, 3, 1) THEN 1 ELSE 0 END) + (CASE WHEN substr(p.mbti, 4, 1) = substr(viewer_mbti, 4, 1) THEN 1 ELSE 0 END) ELSE 0 END)) AS match_score
    FROM public.matchmaker_profiles p
    WHERE p.status = 'approved' AND p.is_visible = true AND p.author_id != viewer_id AND (filter_gender = 'all' OR p.gender = filter_gender) AND p.age <= filter_max_age
    AND NOT EXISTS (SELECT 1 FROM public.matchmaker_loves l WHERE ((l.from_user_id = viewer_id AND l.to_user_id = p.author_id AND l.status IN ('pending', 'accepted')) OR (l.to_user_id = viewer_id AND l.from_user_id = p.author_id AND l.status = 'accepted')))
    AND (filter_radius_km IS NULL OR filter_radius_km <= 0 OR (filter_lat IS NOT NULL AND p.lat IS NOT NULL AND (6371 * acos(least(1.0, greatest(-1.0, cos(radians(filter_lat)) * cos(radians(p.lat)) * cos(radians(p.long) - radians(filter_long)) + sin(radians(filter_lat)) * sin(radians(p.lat)))))) <= filter_radius_km))
    ORDER BY match_score DESC, distance_km ASC NULLS LAST, p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_connections(viewer_id TEXT)
RETURNS TABLE (connection_id BIGINT, other_user_id TEXT, nickname TEXT, avatar_seed TEXT, avatar_config JSONB, gender TEXT, city TEXT, status TEXT, contact_info TEXT, updated_at TIMESTAMP WITH TIME ZONE, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT l.id, p.author_id, p.nickname, p.avatar_seed, p.avatar_config, p.gender, p.city, 'pending_received', NULL::text, l.updated_at, l.message FROM public.matchmaker_loves l JOIN public.matchmaker_profiles p ON l.from_user_id = p.author_id WHERE l.to_user_id = viewer_id AND l.status = 'pending'
    UNION ALL
    SELECT l.id, p.author_id, p.nickname, p.avatar_seed, p.avatar_config, p.gender, p.city, 'pending_sent', NULL::text, l.updated_at, l.message FROM public.matchmaker_loves l JOIN public.matchmaker_profiles p ON l.to_user_id = p.author_id WHERE l.from_user_id = viewer_id AND l.status = 'pending'
    UNION ALL
    SELECT l.id, p.author_id, p.nickname, p.avatar_seed, p.avatar_config, p.gender, p.city, 'rejected', NULL::text, l.updated_at, l.message FROM public.matchmaker_loves l JOIN public.matchmaker_profiles p ON l.to_user_id = p.author_id WHERE l.from_user_id = viewer_id AND l.status = 'rejected'
    UNION ALL
    SELECT m.id, CASE WHEN m.user1_id = viewer_id THEN m.user2_id ELSE m.user1_id END, p.nickname, p.avatar_seed, p.avatar_config, p.gender, p.city, 'matched', p.contact_info, m.matched_at, NULL::text FROM public.matchmaker_matches m JOIN public.matchmaker_profiles p ON p.author_id = (CASE WHEN m.user1_id = viewer_id THEN m.user2_id ELSE m.user1_id END) WHERE m.user1_id = viewer_id OR m.user2_id = viewer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_delete_expired_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post RECORD;
    deleted_count INT := 0;
BEGIN
    FOR post IN SELECT id FROM public.confessions WHERE created_at < NOW() - INTERVAL '20 days' AND is_permanent = FALSE LOOP
        PERFORM public.delete_post_and_storage(post.id);
        deleted_count := deleted_count + 1;
    END LOOP;
    IF deleted_count > 0 THEN INSERT INTO public.actions_log (action_type, created_at) VALUES ('SYSTEM: Auto-deleted ' || deleted_count || ' expired posts', NOW()); END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.force_admin_name()
RETURNS TRIGGER AS $$
DECLARE
    reserved_names TEXT[] := ARRAY['admin', 'administrator', 'moderator', 'staff', 'support', 'mmu'];
    is_reserved BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM unnest(reserved_names) AS r
        WHERE NEW.author_name ILIKE r
    ) INTO is_reserved;

    IF is_reserved THEN
        IF (auth.jwt() -> 'user_metadata' ->> 'role') <> 'admin' OR (auth.jwt() -> 'user_metadata' ->> 'role') IS NULL THEN
            NEW.author_name := 'Anonymous';
        END IF;
    END IF;

    IF NEW.author_name IS NULL OR TRIM(NEW.author_name) = '' THEN
        NEW.author_name := 'Anonymous';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION report_marketplace_item(item_id_input BIGINT, reporter_id_input TEXT, reason_input TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.marketplace_reports (item_id, reporter_id, reason) VALUES (item_id_input, reporter_id_input, reason_input);
    UPDATE public.marketplace_items SET report_count = COALESCE(report_count, 0) + 1 WHERE id = item_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION delete_marketplace_item(item_id_input BIGINT, seller_id_input TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.marketplace_items WHERE id = item_id_input AND seller_id = seller_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_delete_expired_adult_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INT;
BEGIN
    WITH deleted_rows AS (DELETE FROM public.adult_confessions WHERE expires_at IS NOT NULL AND expires_at < NOW() RETURNING id)
    SELECT count(*) INTO deleted_count FROM deleted_rows;
    IF deleted_count > 0 THEN INSERT INTO public.actions_log (action_type, created_at) VALUES ('SYSTEM: Auto-deleted ' || deleted_count || ' expired adult whispers', NOW()); END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_karma_balance(target_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_post_count INTEGER;
    v_comment_count INTEGER;
    v_likes_received INTEGER;
    v_spent INTEGER;
    total_earned INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_post_count
    FROM public.confessions
    WHERE author_id = target_user_id AND approved = TRUE;

    SELECT COUNT(*) INTO v_comment_count
    FROM public.comments
    WHERE author_id = target_user_id;

    SELECT COALESCE(SUM(likes_count), 0) INTO v_likes_received 
    FROM public.confessions
    WHERE author_id = target_user_id;

    total_earned := (v_post_count * 10) + (v_comment_count * 5) + (v_likes_received * 2);

    SELECT spent_points INTO v_spent 
    FROM public.user_reputation 
    WHERE author_id = target_user_id;
    
    IF v_spent IS NULL THEN 
        v_spent := 0; 
    END IF;

    RETURN GREATEST(0, total_earned - v_spent);
END;
$$;

CREATE OR REPLACE FUNCTION public.buy_shop_item(item_id_in TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id TEXT;
    v_cost INTEGER;
    v_balance INTEGER;
BEGIN
    v_user_id := auth.uid()::text;
    
    SELECT cost INTO v_cost FROM public.shop_items WHERE id = item_id_in;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;

    v_balance := public.get_karma_balance(v_user_id);
    
    IF v_balance < v_cost THEN
        RAISE EXCEPTION 'Insufficient Karma Points (Required: %, Balance: %)', v_cost, v_balance;
    END IF;

    UPDATE public.user_reputation
    SET spent_points = COALESCE(spent_points, 0) + v_cost,
        updated_at = NOW()
    WHERE author_id = v_user_id;

    IF NOT FOUND THEN
        INSERT INTO public.user_reputation (author_id, spent_points)
        VALUES (v_user_id, v_cost);
    END IF;

    INSERT INTO public.user_inventory (user_id, item_id, quantity)
    VALUES (v_user_id, item_id_in, 1)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = public.user_inventory.quantity + 1;

    RETURN jsonb_build_object('success', true, 'new_balance', v_balance - v_cost);
END;
$$;

CREATE OR REPLACE FUNCTION public.equip_item(item_id_in TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id TEXT;
    v_category TEXT;
BEGIN
    v_user_id := auth.uid()::text;
    
    SELECT category INTO v_category FROM public.shop_items WHERE id = item_id_in;

    UPDATE public.user_inventory ui
    SET is_equipped = FALSE
    FROM public.shop_items si
    WHERE ui.item_id = si.id
    AND ui.user_id = v_user_id
    AND si.category = v_category;

    UPDATE public.user_inventory
    SET is_equipped = TRUE
    WHERE user_id = v_user_id AND item_id = item_id_in;
END;
$$;

CREATE OR REPLACE FUNCTION public.use_pin_ticket(post_id_in BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id TEXT;
    v_ticket_count INTEGER;
BEGIN
    v_user_id := auth.uid()::text;

    SELECT quantity INTO v_ticket_count
    FROM public.user_inventory
    WHERE user_id = v_user_id AND item_id = 'ticket_pin';

    IF v_ticket_count IS NULL OR v_ticket_count < 1 THEN
        RAISE EXCEPTION 'No Pin Tickets in inventory!';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.confessions WHERE id = post_id_in AND author_id = v_user_id) THEN
        RAISE EXCEPTION 'You can only pin your own posts.';
    END IF;

    UPDATE public.confessions
    SET pinned = TRUE
    WHERE id = post_id_in;

    UPDATE public.user_inventory
    SET quantity = quantity - 1
    WHERE user_id = v_user_id AND item_id = 'ticket_pin';
    
    DELETE FROM public.user_inventory WHERE quantity <= 0;
END;
$$;

DROP TRIGGER IF EXISTS enforce_admin_author_confessions ON public.confessions;
CREATE TRIGGER enforce_admin_author_confessions BEFORE INSERT OR UPDATE ON public.confessions FOR EACH ROW EXECUTE FUNCTION public.force_admin_name();

DROP TRIGGER IF EXISTS enforce_admin_author_comments ON public.comments;
CREATE TRIGGER enforce_admin_author_comments BEFORE INSERT OR UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.force_admin_name();

DROP TRIGGER IF EXISTS on_new_confession ON public.confessions;
CREATE TRIGGER on_new_confession AFTER INSERT ON public.confessions FOR EACH ROW EXECUTE FUNCTION public.handle_new_confession();

DROP TRIGGER IF EXISTS on_new_comment ON public.comments;
CREATE TRIGGER on_new_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

DROP TRIGGER IF EXISTS on_post_reaction ON public.reactions;
CREATE TRIGGER on_post_reaction AFTER INSERT OR UPDATE ON public.reactions FOR EACH ROW EXECUTE FUNCTION public.handle_post_reaction();

DROP TRIGGER IF EXISTS on_comment_reaction ON public.comments;
CREATE TRIGGER on_comment_reaction AFTER UPDATE OF reactions ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_comment_reaction();

DROP TRIGGER IF EXISTS check_block_confessions ON public.confessions;
CREATE TRIGGER check_block_confessions BEFORE INSERT OR UPDATE ON public.confessions FOR EACH ROW EXECUTE FUNCTION public.enforce_user_block();

DROP TRIGGER IF EXISTS check_block_comments ON public.comments;
CREATE TRIGGER check_block_comments BEFORE INSERT OR UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.enforce_user_block();

DROP TRIGGER IF EXISTS check_block_post_reactions ON public.post_user_reactions;
CREATE TRIGGER check_block_post_reactions BEFORE INSERT OR UPDATE ON public.post_user_reactions FOR EACH ROW EXECUTE FUNCTION public.enforce_user_block();

DROP TRIGGER IF EXISTS check_block_comment_reactions ON public.comment_user_reactions;
CREATE TRIGGER check_block_comment_reactions BEFORE INSERT OR UPDATE ON public.comment_user_reactions FOR EACH ROW EXECUTE FUNCTION public.enforce_user_block();

DROP TRIGGER IF EXISTS check_block_poll_votes ON public.poll_votes;
CREATE TRIGGER check_block_poll_votes BEFORE INSERT OR UPDATE ON public.poll_votes FOR EACH ROW EXECUTE FUNCTION public.enforce_user_block();

DROP TRIGGER IF EXISTS check_block_marketplace ON public.marketplace_items;
CREATE TRIGGER check_block_marketplace BEFORE INSERT OR UPDATE ON public.marketplace_items FOR EACH ROW EXECUTE FUNCTION public.enforce_user_block();

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
CREATE INDEX IF NOT EXISTS idx_post_user_reactions_user_id ON public.post_user_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_user_reactions_user_id ON public.comment_user_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_confessions_reply_to_id ON public.confessions(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_comments_debate_side ON public.comments(debate_side);
CREATE INDEX IF NOT EXISTS idx_adult_confessions_expires_at ON public.adult_confessions(expires_at);

DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

DROP POLICY IF EXISTS "Enable insert for all users (confessions)" ON storage.objects;
DROP POLICY IF EXISTS "Enable read for all users (confessions)" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for admin (confessions)" ON storage.objects;

CREATE POLICY "Enable insert for all users" ON public.confessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for approved posts" ON public.confessions FOR SELECT USING (approved = true);
CREATE POLICY "Enable read for admin" ON public.confessions FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "Enable update for admin" ON public.confessions FOR UPDATE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "Enable delete for admin" ON public.confessions FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Enable insert for all users" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for all users" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Enable update for all users (for reactions)" ON public.comments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for admin" ON public.comments FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

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
CREATE POLICY "Enable delete for admin" ON public.polls FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "Enable read for all users" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.poll_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for admin" ON public.poll_votes FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Enable read for all users" ON public.user_reputation FOR SELECT USING (true);
CREATE POLICY "Admin can update user_reputation" ON public.user_reputation FOR UPDATE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Enable read for all users" ON public.events FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for admin" ON public.events FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Enable insert for all users (confessions)" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'confessions');
CREATE POLICY "Enable read for all users (confessions)" ON storage.objects FOR SELECT USING (bucket_id = 'confessions');
CREATE POLICY "Enable delete for admin (confessions)" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'confessions' AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Manage Own Profile" ON public.matchmaker_profiles FOR ALL USING (author_id = (SELECT auth.uid()::text));
CREATE POLICY "Admin Full Access Profiles" ON public.matchmaker_profiles FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "Public View Approved Profiles" ON public.matchmaker_profiles FOR SELECT USING (status = 'approved' AND is_visible = true);

CREATE POLICY "Read Own Loves" ON public.matchmaker_loves FOR SELECT USING (from_user_id = (SELECT auth.uid()::text) OR to_user_id = (SELECT auth.uid()::text));
CREATE POLICY "Admin Read All Loves" ON public.matchmaker_loves FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "Send Love" ON public.matchmaker_loves FOR INSERT WITH CHECK (from_user_id = (SELECT auth.uid()::text));
CREATE POLICY "Update Love" ON public.matchmaker_loves FOR UPDATE USING (from_user_id = (SELECT auth.uid()::text) OR to_user_id = (SELECT auth.uid()::text));
CREATE POLICY "Delete Own Loves" ON public.matchmaker_loves FOR DELETE USING (from_user_id = (SELECT auth.uid()::text) OR to_user_id = (SELECT auth.uid()::text));

CREATE POLICY "Read Own Matches" ON public.matchmaker_matches FOR SELECT USING (user1_id = (SELECT auth.uid()::text) OR user2_id = (SELECT auth.uid()::text));
CREATE POLICY "Admin Read All Matches" ON public.matchmaker_matches FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Insert Reports" ON public.matchmaker_reports FOR INSERT WITH CHECK (reporter_id = (SELECT auth.uid()::text));
CREATE POLICY "Admin Read All Reports" ON public.matchmaker_reports FOR SELECT USING (true);
CREATE POLICY "Admin Delete Reports" ON public.matchmaker_reports FOR DELETE USING (true);

CREATE POLICY "User View Own Support" ON public.support_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User Insert Support" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin Manage Support" ON public.support_messages FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Public Read Announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admin Manage Announcements" ON public.announcements FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Everyone can view marketplace items" ON public.marketplace_items FOR SELECT USING (true);
CREATE POLICY "Anon users can insert items" ON public.marketplace_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Sellers can update own items" ON public.marketplace_items FOR UPDATE USING (seller_id = current_setting('request.header.x-anon-id', true)::text);
CREATE POLICY "Sellers can delete own items" ON public.marketplace_items FOR DELETE USING (seller_id = current_setting('request.header.x-anon-id', true)::text);
CREATE POLICY "Admin manage marketplace items" ON public.marketplace_items FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Anon users can insert reports" ON public.marketplace_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view all reports" ON public.marketplace_reports FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admin can delete reports" ON public.marketplace_reports FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Enable read access for all users" ON public.lost_and_found AS permissive FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON public.lost_and_found AS permissive FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Read approved feed" ON public.matchmaker_feed FOR SELECT USING (status = 'approved');
CREATE POLICY "Create feed posts" ON public.matchmaker_feed FOR INSERT WITH CHECK (auth.uid()::text = author_id);
CREATE POLICY "Delete own posts" ON public.matchmaker_feed FOR DELETE USING (auth.uid()::text = author_id);
CREATE POLICY "Admin delete feed" ON public.matchmaker_feed FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Anyone can read approved adult posts" ON public.adult_confessions FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can insert adult posts" ON public.adult_confessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read all adult posts" ON public.adult_confessions FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admin update adult posts" ON public.adult_confessions FOR UPDATE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admin delete adult posts" ON public.adult_confessions FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Anyone can read adult comments" ON public.adult_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert adult comments" ON public.adult_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin delete adult comments" ON public.adult_comments FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admin delete adult poll votes" ON public.adult_poll_votes FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Public read reactions" ON public.adult_reactions FOR SELECT USING (true);
CREATE POLICY "Public insert reactions" ON public.adult_reactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read comment reactions" ON public.adult_comment_reactions FOR SELECT USING (true);
CREATE POLICY "Public insert comment reactions" ON public.adult_comment_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete own comment reactions" ON public.adult_comment_reactions FOR DELETE USING (true);
CREATE POLICY "Admin delete comment reactions" ON public.adult_comment_reactions FOR DELETE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Public Read Credentials" ON public.matchmaker_credentials FOR SELECT USING (true);
CREATE POLICY "Public Insert Credentials" ON public.matchmaker_credentials FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Own Credentials" ON public.matchmaker_credentials FOR UPDATE USING (true);
CREATE POLICY "Admin manage blocked devices" ON public.blocked_devices FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Read items" ON public.shop_items FOR SELECT USING (true);
CREATE POLICY "Read own inventory" ON public.user_inventory FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Allow anon insert" ON public.push_subscriptions FOR INSERT WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.delete_comment_as_admin(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_post_and_storage(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_report_status(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ban_user_and_device(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_connections(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_love_action(TEXT, TEXT, TEXT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_marketplace_reports(BIGINT) TO authenticated;

GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;