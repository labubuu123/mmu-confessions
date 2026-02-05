import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

const POINTS = {
  PER_POST: 10,
  PER_COMMENT: 5,
  PER_LIKE_RECEIVED: 2
};

export function useKarmaShop(userId) {
  const queryClient = useQueryClient();

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

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['userInventory', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*, shop_items(*)')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    }
  });

  const { data: balance = 0, isLoading: balanceLoading } = useQuery({
    queryKey: ['karmaBalance', userId],
    enabled: !!userId && !inventoryLoading,
    queryFn: async () => {
      const { count: postCount } = await supabase
        .from('confessions')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)
        .eq('approved', true);

      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);

      const { data: postsWithLikes } = await supabase
        .from('confessions')
        .select('likes_count')
        .eq('author_id', userId);
      
      const totalLikesReceived = postsWithLikes?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;

      const totalEarned =
        (postCount * POINTS.PER_POST) +
        (commentCount * POINTS.PER_COMMENT) +
        (totalLikesReceived * POINTS.PER_LIKE_RECEIVED);

      const { data: inventoryItems, error: invError } = await supabase
        .from('user_inventory')
        .select('quantity, shop_items(cost)')
        .eq('user_id', userId);
        
      if (invError) throw invError;

      const totalSpent = inventoryItems?.reduce((sum, slot) => {
        return sum + (slot.shop_items.cost * slot.quantity);
      }, 0) || 0;

      return Math.max(0, totalEarned - totalSpent);
    }
  });

  const buyItem = useMutation({
    mutationFn: async (itemId) => {
      const { data, error } = await supabase.rpc('buy_shop_item', {
        item_id_in: itemId
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
    items,
    inventory,
    balance,
    loading: itemsLoading || inventoryLoading || balanceLoading,
    buyItem,
    equipItem
  };
}