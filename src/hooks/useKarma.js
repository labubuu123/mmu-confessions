import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const GACHA_COST = 50;

const GACHA_POOL = [
    { id: 'border_neon', type: 'border', name: 'Neon Lights Border', rarity: 'rare', weight: 25 },
    { id: 'border_gold', type: 'border', name: 'Golden Champion Border', rarity: 'epic', weight: 10 },
    { id: 'border_diamond', type: 'border', name: 'Diamond VIP Border', rarity: 'legendary', weight: 2 },
    { id: 'theme_sunset', type: 'theme', name: 'Sunset Post Theme', rarity: 'epic', weight: 8 },
    { id: 'theme_galaxy', type: 'theme', name: 'Galaxy Post Theme', rarity: 'legendary', weight: 5 },
    { id: 'ticket_pin_1', type: 'ticket', name: '1x Pin Ticket', rarity: 'common', weight: 40 },
    { id: 'ticket_pin_3', type: 'ticket', name: '3x Pin Ticket', rarity: 'rare', weight: 10 },
];

export function useKarma(anonId) {
    const queryClient = useQueryClient();
    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['user_profile', anonId],
        queryFn: async () => {
            if (!anonId) return null;
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('anon_id', anonId)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data || { karma_points: 0, current_streak: 0, highest_streak: 0, last_login_date: null };
        },
        enabled: !!anonId,
    });

    const { data: inventory, isLoading: isInventoryLoading } = useQuery({
        queryKey: ['user_inventory', anonId],
        queryFn: async () => {
            if (!anonId) return [];
            const { data, error } = await supabase
                .from('user_inventory')
                .select('*')
                .eq('anon_id', anonId);
            
            if (error) throw error;
            return data || [];
        },
        enabled: !!anonId,
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
                queryClient.invalidateQueries(['user_profile', anonId]);
            } else {
                toast.error("You've already checked in today!");
            }
        },
    });

    const pullGacha = useMutation({
        mutationFn: async () => {
            if (profile.karma_points < GACHA_COST) {
                throw new Error("Not enough Karma points!");
            }

            const { error: deductError } = await supabase
                .from('user_profiles')
                .update({ karma_points: profile.karma_points - GACHA_COST })
                .eq('anon_id', anonId);
            
            if (deductError) throw deductError;

            const totalWeight = GACHA_POOL.reduce((sum, item) => sum + item.weight, 0);
            let random = Math.random() * totalWeight;
            let droppedItem = GACHA_POOL[0];

            for (const item of GACHA_POOL) {
                random -= item.weight;
                if (random <= 0) {
                    droppedItem = item;
                    break;
                }
            }

            const quantityToAdd = droppedItem.id.startsWith('ticket_pin_') ? parseInt(droppedItem.id.split('_').pop()) : 1;
            const itemIdForDb = droppedItem.type === 'ticket' ? 'ticket_pin' : droppedItem.id;
            const existingItem = inventory?.find(i => i.item_id === itemIdForDb);

            if (existingItem) {
                const { error: updateError } = await supabase
                    .from('user_inventory')
                    .update({ quantity: existingItem.quantity + quantityToAdd })
                    .eq('id', existingItem.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('user_inventory')
                    .insert([{
                        anon_id: anonId,
                        item_id: itemIdForDb,
                        item_type: droppedItem.type,
                        item_name: droppedItem.name,
                        rarity: droppedItem.rarity,
                        quantity: quantityToAdd
                    }]);
                if (insertError) throw insertError;
            }

            return droppedItem;
        },
        onSuccess: (droppedItem) => {
            queryClient.invalidateQueries(['user_profile', anonId]);
            queryClient.invalidateQueries(['user_inventory', anonId]);
            return droppedItem;
        },
        onError: (err) => {
            toast.error(err.message || "Failed to pull Gacha.");
        }
    });

    const usePinTicket = useMutation({
        mutationFn: async (postId) => {
            const ticket = inventory?.find(i => i.item_id === 'ticket_pin');
            if (!ticket || ticket.quantity < 1) throw new Error("No Pin Tickets available.");

            const { error: postError } = await supabase
                .from('confessions')
                .update({ pinned: true })
                .eq('id', postId);
            if (postError) throw postError;

            const { error: ticketError } = await supabase
                .from('user_inventory')
                .update({ quantity: ticket.quantity - 1 })
                .eq('id', ticket.id);
            if (ticketError) throw ticketError;
        },
        onSuccess: () => {
            toast.success("Post pinned successfully!");
            queryClient.invalidateQueries(['user_inventory', anonId]);
            queryClient.invalidateQueries(['confessions']);
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