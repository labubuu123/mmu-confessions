import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export const karmaKeys = {
    profile: (id) => ['karma_profile', id],
    log: (id) => ['karma_log', id],
};

const getAnonId = () => localStorage.getItem('anonId');

function handleSupabaseError(error, fallbackMsg = 'Something went wrong.') {
    const msg = error?.message || fallbackMsg;
    toast.error(msg);
    console.error('[useKarma]', msg, error);
}

export function useKarmaProfile(anonId) {
    return useQuery({
        queryKey: karmaKeys.profile(anonId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('anon_id, karma_points, current_streak, highest_streak, last_login_date')
                .eq('anon_id', anonId)
                .maybeSingle();

            if (error) throw error;
            return data ?? {
                anon_id: anonId,
                karma_points: 0,
                current_streak: 0,
                highest_streak: 0,
                last_login_date: null,
            };
        },
        enabled: Boolean(anonId),
        staleTime: 1000 * 60 * 2,
        retry: 2,
    });
}

export function useKarmaActivityLog(anonId, { enabled = false } = {}) {
    return useQuery({
        queryKey: karmaKeys.log(anonId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('karma_activity_log')
                .select('id, activity_type, amount, description, balance_after, created_at')
                .eq('user_id', anonId)
                .order('created_at', { ascending: false })
                .limit(30);

            if (error) throw error;
            return data ?? [];
        },
        enabled: Boolean(anonId) && enabled,
        staleTime: 1000 * 60 * 5,
    });
}

export function useCheckIn(anonId) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase
                .rpc('process_daily_checkin', { p_anon_id: anonId });
            if (error) throw error;
            return data;
        },
        onSuccess: (res) => {
            if (res?.success) {
                toast.success(`Daily Check-in! +${res.points_awarded} Points 🔥`, { id: 'checkin' });
                qc.invalidateQueries({ queryKey: karmaKeys.profile(anonId) });
                qc.invalidateQueries({ queryKey: karmaKeys.log(anonId) });
            } else {
                toast('Already checked in today!', { icon: '⏳', id: 'checkin' });
            }
        },
        onError: (err) => handleSupabaseError(err, 'Check-in failed.'),
    });
}

export function useKarma(anonIdOverride) {
    const anonId = anonIdOverride ?? getAnonId();

    const profileQuery = useKarmaProfile(anonId);
    const checkIn = useCheckIn(anonId);

    return {
        anonId,
        profile: profileQuery.data,
        isLoading: profileQuery.isLoading,
        profileError: profileQuery.error,
        checkIn,
        karmaPoints: profileQuery.data?.karma_points ?? 0,
        currentStreak: profileQuery.data?.current_streak ?? 0,
        highestStreak: profileQuery.data?.highest_streak ?? 0,
        lastLoginDate: profileQuery.data?.last_login_date ?? null,
    };
}