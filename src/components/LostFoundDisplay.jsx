import React from 'react';
import { MapPin, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LostFoundDisplay({ type, item_name, location, contact_info, is_resolved }) {
    const isLost = type === 'lost';

    const config = isLost ? {
        bg: 'bg-red-50 dark:bg-red-900/10',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-300',
        icon: AlertCircle,
        label: 'LOST ITEM',
        badgeColor: 'bg-red-600',
        resolvedLabel: 'FOUND'
    } : {
        bg: 'bg-green-50 dark:bg-green-900/10',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        icon: CheckCircle2,
        label: 'FOUND ITEM',
        badgeColor: 'bg-green-600',
        resolvedLabel: 'RETURNED'
    };

    const Icon = config.icon;

    return (
        <div className={`mt-2 rounded-xl border-2 ${config.border} ${config.bg} overflow-hidden relative group`}>
            <div className={`absolute top-0 right-0 ${config.badgeColor} text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10 uppercase tracking-wider`}>
                {is_resolved ? config.resolvedLabel : config.label}
            </div>

            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-full ${isLost ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'} flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${config.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-bold ${config.text} leading-tight mb-1`}>
                            {item_name}
                        </h3>

                        <div className="flex flex-col gap-1.5 mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="font-medium">{location}</span>
                            </div>

                            {contact_info && (
                                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="font-mono bg-white dark:bg-gray-800 px-1.5 rounded border border-gray-200 dark:border-gray-700">
                                        {contact_info}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {is_resolved && (
                <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-[1px] flex items-center justify-center z-20">
                    <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg transform -rotate-6">
                        <span className="text-gray-900 dark:text-white font-black text-lg uppercase tracking-widest">
                            Resolved
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}