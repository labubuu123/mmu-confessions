import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export const GACHA_COST = 50;

export const karmaKeys = {
    profile:   (id) => ['karma_profile', id],
    inventory: (id) => ['karma_inventory', id],
    log:       (id) => ['karma_log', id],
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

export function useKarmaInventory(anonId) {
    return useQuery({
        queryKey: karmaKeys.inventory(anonId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_inventory')
                .select('id, item_id, item_type, item_name, rarity, quantity, acquired_at')
                .eq('anon_id', anonId)
                .order('acquired_at', { ascending: false });

            if (error) throw error;
            return data ?? [];
        },
        enabled: Boolean(anonId),
        staleTime: 1000 * 60 * 5,
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
                toast.success(`Daily Check-in! +${res.points_awarded} Karma 🔥`, { id: 'checkin' });
                qc.invalidateQueries({ queryKey: karmaKeys.profile(anonId) });
                qc.invalidateQueries({ queryKey: karmaKeys.log(anonId) });
            } else {
                toast('Already checked in today!', { icon: '⏳', id: 'checkin' });
            }
        },
        onError: (err) => handleSupabaseError(err, 'Check-in failed.'),
    });
}

export function useGachaPull(anonId, karmaPoints) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            if ((karmaPoints ?? 0) < GACHA_COST) {
                throw new Error(`Not enough Karma – need ${GACHA_COST}, have ${karmaPoints ?? 0}.`);
            }
            const { data, error } = await supabase
                .rpc('process_gacha_pull', { p_anon_id: anonId });
            if (error) throw new Error(error.message ?? 'Gacha pull failed.');
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: karmaKeys.profile(anonId) });
            qc.invalidateQueries({ queryKey: karmaKeys.inventory(anonId) });
            qc.invalidateQueries({ queryKey: karmaKeys.log(anonId) });
        },
        onError: (err) => handleSupabaseError(err, 'Gacha pull failed.'),
    });
}

export function usePinTicket(anonId) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (postId) => {
            const { error } = await supabase
                .rpc('use_pin_ticket', { post_id_in: postId });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Post pinned successfully! 📌');
            qc.invalidateQueries({ queryKey: karmaKeys.inventory(anonId) });
            qc.invalidateQueries({ queryKey: ['confessions'] });
        },
        onError: (err) => handleSupabaseError(err, 'Failed to pin post.'),
    });
}

export function useKarma(anonIdOverride) {
    const anonId = anonIdOverride ?? getAnonId();

    const profileQuery    = useKarmaProfile(anonId);
    const inventoryQuery  = useKarmaInventory(anonId);

    const checkIn   = useCheckIn(anonId);
    const pullGacha = useGachaPull(anonId, profileQuery.data?.karma_points);
    const usePinTicketMutation = usePinTicket(anonId);

    return {
        anonId,
        profile:   profileQuery.data,
        inventory: inventoryQuery.data,
        isLoading: profileQuery.isLoading || inventoryQuery.isLoading,
        isProfileLoading:   profileQuery.isLoading,
        isInventoryLoading: inventoryQuery.isLoading,
        profileError:   profileQuery.error,
        inventoryError: inventoryQuery.error,
        checkIn,
        pullGacha,
        usePinTicket: usePinTicketMutation,
        GACHA_COST,
        karmaPoints:    profileQuery.data?.karma_points    ?? 0,
        currentStreak:  profileQuery.data?.current_streak  ?? 0,
        highestStreak:  profileQuery.data?.highest_streak  ?? 0,
        lastLoginDate:  profileQuery.data?.last_login_date ?? null,
        canAffordGacha: (profileQuery.data?.karma_points ?? 0) >= GACHA_COST,
    };
}