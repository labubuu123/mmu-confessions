ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert" ON public.confessions;
DROP POLICY IF EXISTS "Allow public insert" ON public.confessions;
DROP POLICY IF EXISTS "Allow public read" ON public.confessions;
DROP POLICY IF EXISTS "Allow admin delete" ON public.confessions;
DROP POLICY IF EXISTS "Allow service role all" ON public.confessions;

-- Allow anyone (including anonymous) to insert
CREATE POLICY "Enable insert for all users"
ON public.confessions
FOR INSERT 
WITH CHECK (true);

-- Allow public to read only approved posts
CREATE POLICY "Enable read for approved posts"
ON public.confessions
FOR SELECT 
USING (approved = true);

-- Allow service role full access (for admin functions)
CREATE POLICY "Enable all for service role"
ON public.confessions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- COMMENTS TABLE POLICIES
-- ============================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public insert" ON public.comments;
DROP POLICY IF EXISTS "Allow public read comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public read" ON public.comments;

CREATE POLICY "Enable insert for all users"
ON public.comments
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable read for all users"
ON public.comments
FOR SELECT 
USING (true);

-- ============================================
-- REACTIONS TABLE POLICIES
-- ============================================
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read reactions" ON public.reactions;
DROP POLICY IF EXISTS "Allow public insert reactions" ON public.reactions;
DROP POLICY IF EXISTS "Allow public update reactions" ON public.reactions;
DROP POLICY IF EXISTS "Allow public read" ON public.reactions;
DROP POLICY IF EXISTS "Allow public insert" ON public.reactions;
DROP POLICY IF EXISTS "Allow public update" ON public.reactions;

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

-- ============================================
-- ACTIONS_LOG TABLE POLICIES (for rate limiting)
-- ============================================
ALTER TABLE public.actions_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service_role insert" ON public.actions_log;
DROP POLICY IF EXISTS "Allow service_role read" ON public.actions_log;

CREATE POLICY "Enable insert for service role"
ON public.actions_log
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable read for service role"
ON public.actions_log
FOR SELECT 
USING (auth.role() = 'service_role');

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================

-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('confessions', 'confessions', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable read for all users" ON storage.objects;

-- Allow anyone to upload files
CREATE POLICY "Enable insert for all users"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'confessions');

-- Allow anyone to read files
CREATE POLICY "Enable read for all users"
ON storage.objects
FOR SELECT
USING (bucket_id = 'confessions');

-- Optional: Allow users to delete their own uploads (not required for anonymous)
CREATE POLICY "Enable delete for uploaded files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'confessions');

-- ============================================
-- INCREMENT REACTION FUNCTION
-- ============================================
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
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = post_id_in;
    END IF;
END;
$$;