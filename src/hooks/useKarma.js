import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useKarma(userId) {
  const queryClient = useQueryClient();
  const enabled = !!userId;

  const { data: balance = 0, isLoading: balanceLoading } = useQuery({
    queryKey: ['karmaBalance', userId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('fetch_and_sync_karma', { target_user_id: userId });
      
      if (error) {
        console.error("Karma Sync Failed:", error);
        return 0;
      }
      return data;
    },
    staleTime: 1000 * 60 * 1,
  });

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['userInventory', userId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*, shop_items(*)')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    }
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['shopItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .order('cost', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const buyItem = useMutation({
    mutationFn: async (itemId) => {
      const { data, error } = await supabase.rpc('buy_shop_item', { 
        item_id_in: itemId,
        user_id_in: userId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userInventory', userId]);
      queryClient.invalidateQueries(['karmaBalance', userId]);
    }
  });

  const equipItem = useMutation({
    mutationFn: async (itemId) => {
      const { error } = await supabase.rpc('equip_item', {
        item_id_in: itemId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userInventory', userId]);
    }
  });

  return {
    balance,
    inventory,
    items,
    loading: balanceLoading || inventoryLoading || itemsLoading,
    buyItem,
    equipItem
  };
}