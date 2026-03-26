import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const GACHA_COST = 50;

export function useKarma(anonId) {
    const queryClient = useQueryClient();

    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['user_profile', anonId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('anon_id', anonId)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data || { karma_points: 0, current_streak: 0, highest_streak: 0, last_login_date: null };
        },
        enabled: !!anonId,
        staleTime: 1000 * 60 * 5,
    });

    const { data: inventory, isLoading: isInventoryLoading } = useQuery({
        queryKey: ['user_inventory', anonId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_inventory')
                .select('*')
                .eq('anon_id', anonId);
            
            if (error) throw error;
            return data || [];
        },
        enabled: !!anonId,
        staleTime: 1000 * 60 * 5,
    });

    const checkIn = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.rpc('process_daily_checkin', { p_anon_id: anonId });
            if (error) throw error;
            return data;
        },
        onSuccess: (res) => {
            if (res.success) {
                toast.success(`Daily Check-in! +${res.points_awarded} Karma 🔥`);
                queryClient.invalidateQueries({ queryKey: ['user_profile', anonId] });
            } else {
                toast.error(res.message || "You've already checked in today!");
            }
        },
        onError: () => toast.error("Failed to check in.")
    });

    const pullGacha = useMutation({
        mutationFn: async () => {
            if ((profile?.karma_points || 0) < GACHA_COST) {
                throw new Error("Not enough Karma points!");
            }

            const { data: droppedItem, error } = await supabase.rpc('process_gacha_pull', { p_anon_id: anonId });
            
            if (error) throw new Error(error.message || "Failed to pull Gacha.");
            return droppedItem;
        },
        onSuccess: (droppedItem) => {
            queryClient.invalidateQueries({ queryKey: ['user_profile', anonId] });
            queryClient.invalidateQueries({ queryKey: ['user_inventory', anonId] });
            
        },
        onError: (err) => {
            toast.error(err.message || "Failed to pull Gacha.");
        }
    });

    const usePinTicket = useMutation({
        mutationFn: async (postId) => {
            const { error } = await supabase.rpc('use_pin_ticket', { post_id_in: postId });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Post pinned successfully!");
            queryClient.invalidateQueries({ queryKey: ['user_inventory', anonId] });
            queryClient.invalidateQueries({ queryKey: ['confessions'] });
        },
        onError: (err) => {
            toast.error(err.message || "Failed to pin post.");
        }
    });

    return {
        profile,
        inventory,
        isLoading: isProfileLoading || isInventoryLoading,
        checkIn,
        pullGacha,
        usePinTicket,
        GACHA_COST
    };
}