import React from 'react';
import { X } from 'lucide-react';
import AdultPostForm from './AdultPostForm';

export default function AdultPostModal({ onClose, onSuccess }) {

    const handleSuccess = () => {
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 sm:border border-slate-800 sm:rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[100vh] sm:max-h-[90vh] h-full sm:h-auto animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0 relative z-20">
                    <div>
                        <h3 className="font-black text-white text-lg tracking-tight flex items-center gap-2">
                            POST SECRET
                            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono shadow-[0_0_10px_rgba(225,29,72,0.5)]">18+</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Safe & Anonymous Space</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 hover:text-white transition-colors text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-1 bg-slate-900">
                    <AdultPostForm onSuccess={handleSuccess} onCancel={onClose} />
                </div>
            </div>
        </div>
    );
}