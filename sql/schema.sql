-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert" ON public.confessions;
DROP POLICY IF EXISTS "Allow public read" ON public.confessions;
DROP POLICY IF EXISTS "Allow admin delete" ON public.confessions;

-- Enable RLS
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;

-- Fixed: Allow anyone to insert (no authentication required)
CREATE POLICY "Allow anonymous insert"
ON public.confessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow public to read only approved posts
CREATE POLICY "Allow public read"
ON public.confessions
FOR SELECT
TO anon, authenticated
USING (approved = true);

-- Allow service role to do everything (for admin functions)
CREATE POLICY "Allow service role all"
ON public.confessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comments table
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert" ON public.comments;
DROP POLICY IF EXISTS "Allow public read" ON public.comments;

CREATE POLICY "Allow anonymous insert comments"
ON public.comments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public read comments"
ON public.comments
FOR SELECT
TO anon, authenticated
USING (true);

-- Reactions table
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON public.reactions;
DROP POLICY IF EXISTS "Allow public insert" ON public.reactions;
DROP POLICY IF EXISTS "Allow public update" ON public.reactions;

CREATE POLICY "Allow public read reactions"
ON public.reactions
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert reactions"
ON public.reactions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update reactions"
ON public.reactions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Actions log (rate limiting)
ALTER TABLE public.actions_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service_role insert" ON public.actions_log;
DROP POLICY IF EXISTS "Allow service_role read" ON public.actions_log;

CREATE POLICY "Allow service_role insert"
ON public.actions_log
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Allow service_role read"
ON public.actions_log
FOR SELECT
TO service_role
USING (true);

-- Fixed increment_reaction function
CREATE OR REPLACE FUNCTION increment_reaction(post_id_in BIGINT, emoji_in TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or increment reaction count
    INSERT INTO public.reactions (post_id, emoji, count)
    VALUES (post_id_in, emoji_in, 1)
    ON CONFLICT (post_id, emoji)
    DO UPDATE SET count = reactions.count + 1;

    -- If it's a like emoji (thumbs up), increment likes_count
    IF emoji_in = '👍' THEN
        UPDATE public.confessions
        SET likes_count = likes_count + 1
        WHERE id = post_id_in;
    END IF;
END;
$$;