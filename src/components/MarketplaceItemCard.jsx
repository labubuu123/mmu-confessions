import React, { useState } from 'react';
import { Tag, MessageCircle, Trash2, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

dayjs.extend(relativeTime);

export default function MarketplaceItemCard({ item, onDelete }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const myAnonId = localStorage.getItem('anonId');
    const isOwner = myAnonId && String(myAnonId) === String(item.seller_id);

    const isWhatsApp = item.contact_info.includes('wa.me');
    const displayLink = isWhatsApp && !item.contact_info.startsWith('http')
        ? `https://${item.contact_info}`
        : item.contact_info.startsWith('http') ? item.contact_info : null;

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm("Are you sure you want to delete this item? This cannot be undone.")) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase.rpc('delete_marketplace_item', {
                item_id_input: item.id,
                seller_id_input: myAnonId
            });

            if (error) throw error;

            toast.success("Item deleted");
            if (onDelete) onDelete(item.id);
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete. Verify you are the owner.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 flex flex-col h-full group relative">
            {isOwner && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="absolute top-2 right-2 z-20 bg-white/90 dark:bg-black/60 p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                    title="Delete your item"
                >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            )}

            <div className="relative aspect-[4/4] bg-gray-100 dark:bg-gray-900 overflow-hidden">
                {item.images && item.images.length > 0 ? (
                    <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Tag className="w-8 h-8 opacity-20" />
                    </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent pt-6">
                    <span className="text-white font-bold text-base drop-shadow-md">
                        RM {item.price}
                    </span>
                </div>

                <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-white px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide">
                    {item.condition}
                </div>
            </div>

            <div className="p-3 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                        {item.category}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {dayjs(item.created_at).fromNow(true)}
                    </span>
                </div>

                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 leading-tight">
                    {item.title}
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
                    {item.description || "No description provided."}
                </p>

                {displayLink ? (
                    <a
                        href={displayLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-sm"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {isWhatsApp ? 'WhatsApp' : 'Contact'}
                    </a>
                ) : (
                    <div className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium text-xs text-center truncate px-2">
                        {item.contact_info}
                    </div>
                )}
            </div>
        </div>
    );
}