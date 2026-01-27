import React, { useState, useEffect } from 'react';
import { Cake, Instagram, MessageCircle, X, Info, PartyPopper, Wand2, Gift, Check } from 'lucide-react';

const WISH_TEMPLATES = [
    "Happy Birthday! Hope you have an amazing day! 🎂✨",
    "Level Up! 🚀 Have the best birthday ever!",
    "Happy Birthday! Stay awesome and enjoy your day! 🎉🎈",
    "Another year older, another year wiser (maybe?) 😜 HBD!",
    "Sending you big birthday hugs! 🤗🎂",
    "Happy Cake Day! 🍰 May all your wishes come true!"
];

export default function BirthdayCreator({ onData, onRemove }) {
    const [friendName, setFriendName] = useState('');
    const [contactType, setContactType] = useState('instagram');
    const [handle, setHandle] = useState('');
    const [message, setMessage] = useState(WISH_TEMPLATES[0]);
    const [templateIdx, setTemplateIdx] = useState(0);

    const cycleTemplate = () => {
        const nextIdx = (templateIdx + 1) % WISH_TEMPLATES.length;
        setTemplateIdx(nextIdx);
        setMessage(WISH_TEMPLATES[nextIdx]);
    };

    useEffect(() => {
        if (friendName && handle) {
            let cleanHandle = handle;
            let link = '';

            if (contactType === 'instagram') {
                cleanHandle = handle.replace('@', '').replace(/\s/g, '').trim();
                link = `https://instagram.com/${cleanHandle}`;
            } else {
                cleanHandle = handle.replace(/\D/g, '');
                link = `https://wa.me/${cleanHandle}?text=${encodeURIComponent(message)}`;
            }

            onData({
                type: 'birthday',
                friendName,
                contactType,
                handle: cleanHandle,
                defaultMessage: message,
                link
            });
        } else {
            onData(null);
        }
    }, [friendName, contactType, handle, message, onData]);

    return (
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-pink-200 dark:border-pink-800/50 shadow-sm animate-in slide-in-from-top-2 my-2 group">
            <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5 pointer-events-none">
                <PartyPopper className="w-24 h-24 text-pink-500 rotate-12" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl shadow-md text-white">
                        <Cake className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Birthday Shoutout</h3>
                        <p className="text-[11px] text-pink-500 dark:text-pink-400 font-medium">Create a card & gather wishes!</p>
                    </div>
                </div>
                <button
                    onClick={onRemove}
                    type="button"
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-full transition-all"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4 relative z-10">
                <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1 mb-1 block">
                        Who is the Birthday Star?
                    </label>
                    <div className="relative">
                        <Gift className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="e.g. Bryan"
                            value={friendName}
                            onChange={(e) => setFriendName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <div className="p-1 bg-gray-100 dark:bg-gray-900 rounded-lg flex gap-1">
                    <button
                        type="button"
                        onClick={() => setContactType('instagram')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${contactType === 'instagram'
                                ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        <Instagram className="w-4 h-4" /> Instagram
                    </button>
                    <button
                        type="button"
                        onClick={() => setContactType('whatsapp')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${contactType === 'whatsapp'
                                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                </div>

                <div>
                    <input
                        type={contactType === 'whatsapp' ? 'tel' : 'text'}
                        placeholder={contactType === 'instagram' ? "IG Username (e.g. @bryan_lee)" : "Phone (e.g. 60123456789)"}
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 ml-1">
                        {contactType === 'whatsapp'
                            ? "Enter number with country code, no symbols (e.g. 601...)"
                            : "We'll automatically link to their profile."}
                    </p>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1 ml-1">
                        <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Default Wish Message
                        </label>
                        <button
                            type="button"
                            onClick={cycleTemplate}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                        >
                            <Wand2 className="w-3 h-3" /> Pick Template
                        </button>
                    </div>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows="2"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none text-gray-700 dark:text-gray-300"
                    />
                </div>

                {friendName && handle && (
                    <div className="flex items-center gap-2 p-2 bg-pink-50 dark:bg-pink-900/10 rounded-lg border border-pink-100 dark:border-pink-800/30 animate-in fade-in">
                        <div className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                            <Check className="w-3 h-3 text-pink-500" />
                        </div>
                        <p className="text-[10px] text-pink-700 dark:text-pink-400 leading-tight font-medium">
                            Ready! A "Send Wishes" button will appear on your post.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}