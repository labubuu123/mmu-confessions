import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useKarmaShop = (userId) => {
    const queryClient = useQueryClient();

    const { data: balance = 0, isLoading: balanceLoading } = useQuery({
        queryKey: ['karmaBalance', userId],
        queryFn: async () => {
            if (!userId) return 0;
            const { data, error } = await supabase.rpc('get_karma_balance', { target_user_id: userId });
            if (error) throw error;
            return data;
        },
        enabled: !!userId
    });

    const { data: items = [], isLoading: itemsLoading } = useQuery({
        queryKey: ['shopItems'],
        queryFn: async () => {
            const { data, error } = await supabase.from('shop_items').select('*').eq('is_active', true).order('cost', { ascending: true });
            if (error) throw error;
            return data;
        }
    });

    const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
        queryKey: ['userInventory', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('user_inventory')
                .select('*, shop_items(*)')
                .eq('user_id', userId);
            if (error) throw error;
            return data;
        },
        enabled: !!userId
    });

    const buyItem = useMutation({
        mutationFn: async (itemId) => {
            const { data, error } = await supabase.rpc('buy_shop_item', { item_id_in: itemId });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success('Purchase successful! Check your inventory.');
            queryClient.invalidateQueries(['karmaBalance']);
            queryClient.invalidateQueries(['userInventory']);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const equipItem = useMutation({
        mutationFn: async (itemId) => {
            const { error } = await supabase.rpc('equip_item', { item_id_in: itemId });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Item equipped!');
            queryClient.invalidateQueries(['userInventory']);
        },
        onError: (err) => toast.error(err.message)
    });

    const usePinTicket = useMutation({
        mutationFn: async (postId) => {
            const { error } = await supabase.rpc('use_pin_ticket', { post_id_in: postId });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Post Pinned successfully!');
            queryClient.invalidateQueries(['userInventory']);
            queryClient.invalidateQueries(['confessions']);
        },
        onError: (err) => toast.error(err.message)
    });

    return {
        balance,
        items,
        inventory,
        loading: balanceLoading || itemsLoading || inventoryLoading,
        buyItem,
        equipItem,
        usePinTicket
    };
};