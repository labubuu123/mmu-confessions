import React, { useState } from 'react';
import {
    X, MessageCircle, Calendar, Tag, AlertCircle,
    ChevronLeft, ChevronRight, Trash2, Loader2,
    Share2, Flag, Maximize2
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

dayjs.extend(relativeTime);

export default function MarketplaceItemModal({ item, onClose, onDelete }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    if (!item) return null;

    const myAnonId = localStorage.getItem('anonId');
    const isOwner = myAnonId && String(myAnonId) === String(item.seller_id);

    const isWhatsApp = item.contact_info.includes('wa.me');
    const displayLink = isWhatsApp && !item.contact_info.startsWith('http')
        ? `https://${item.contact_info}`
        : item.contact_info.startsWith('http') ? item.contact_info : null;

    const hasMultipleImages = item.images && item.images.length > 1;

    const handleShare = async () => {
        const shareData = {
            title: `MMU Marketplace: ${item.title}`,
            text: `Check out this ${item.title} for RM${item.price}!`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            toast.success("Link copied to clipboard!");
        }
    };

    const handleReport = () => {
        if (window.confirm("Report this item as inappropriate or scam?")) {
            toast.success("Thanks for reporting. We will review this item.");
        }
    };

    const nextImage = (e) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    };

    const prevImage = (e) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase.rpc('delete_marketplace_item', {
                item_id_input: item.id,
                seller_id_input: myAnonId
            });
            if (error) throw error;
            toast.success("Item deleted");
            onDelete(item.id);
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className={`bg-white dark:bg-gray-800 w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-2xl max-h-[90vh] rounded-3xl'} shadow-2xl overflow-hidden relative flex flex-col animate-in fade-in zoom-in-95 duration-200 transition-all`}>
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                        onClick={handleShare}
                        className="p-2 bg-white/90 dark:bg-black/60 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 backdrop-blur-md shadow-sm transition-transform active:scale-95"
                        title="Share Item"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>

                    {!isOwner && (
                        <button
                            onClick={handleReport}
                            className="p-2 bg-white/90 dark:bg-black/60 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 backdrop-blur-md shadow-sm transition-transform active:scale-95"
                            title="Report Item"
                        >
                            <Flag className="w-5 h-5" />
                        </button>
                    )}

                    {isOwner && (
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 bg-white/90 dark:bg-black/60 text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 backdrop-blur-md shadow-sm"
                        >
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="p-2 bg-white/90 dark:bg-black/60 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 backdrop-blur-md shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className={`overflow-y-auto flex-1 overscroll-contain ${isFullscreen ? 'flex flex-col h-full' : ''}`}>
                    <div
                        className={`relative bg-black group ${isFullscreen ? 'flex-1 h-full' : 'aspect-video sm:aspect-[2/1]'}`}
                    >
                        {item.images && item.images.length > 0 ? (
                            <img
                                src={item.images[currentImageIndex]}
                                alt={item.title}
                                className={`w-full h-full ${isFullscreen ? 'object-contain' : 'object-contain sm:object-cover'}`}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-400">
                                <Tag className="w-12 h-12 opacity-20" />
                            </div>
                        )}

                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="absolute bottom-4 right-4 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>

                        {hasMultipleImages && (
                            <>
                                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {item.images.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {!isFullscreen && (
                        <div className="p-6 space-y-6">
                            <div>
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                        {item.title}
                                    </h2>
                                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                        RM {item.price}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs font-medium">
                                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                                        {item.category}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                                        Condition: {item.condition}
                                    </span>
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                        <Calendar className="w-3 h-3" />
                                        {dayjs(item.created_at).fromNow()}
                                    </span>
                                </div>
                            </div>

                            <div className="prose dark:prose-invert prose-sm max-w-none">
                                <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Description</h3>
                                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {item.description || "No description provided."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {!isFullscreen && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        {displayLink ? (
                            <a
                                href={displayLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {isWhatsApp ? 'Chat on WhatsApp' : 'Contact Seller'}
                            </a>
                        ) : (
                            <div className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-medium text-center">
                                Contact: {item.contact_info}
                            </div>
                        )}
                        <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Safety tip: Meet in public places on campus.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}