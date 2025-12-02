import React from 'react';
import { Tag, ExternalLink, MessageCircle } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function MarketplaceItemCard({ item }) {
    const isWhatsApp = item.contact_info.includes('wa.me') || item.contact_info.match(/^\+?60/);

    const contactLink = isWhatsApp && !item.contact_info.startsWith('http')
        ? `https://${item.contact_info}`
        : item.contact_info.startsWith('http') ? item.contact_info : null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
            <div className="relative h-48 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                {item.images && item.images.length > 0 ? (
                    <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Tag className="w-12 h-12 opacity-20" />
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                    {dayjs(item.created_at).fromNow()}
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs font-medium">
                    {item.condition}
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">
                        {item.category}
                    </span>
                    <span className="text-lg font-black text-gray-900 dark:text-white">
                        RM {item.price}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {item.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                    {item.description || "No description provided."}
                </p>

                {contactLink ? (
                    <a
                        href={contactLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-sm"
                    >
                        <MessageCircle className="w-4 h-4" />
                        {isWhatsApp ? 'WhatsApp Seller' : 'Contact Link'}
                    </a>
                ) : (
                    <div className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                        <span className="truncate max-w-[200px]">{item.contact_info}</span>
                    </div>
                )}
            </div>
        </div>
    );
}