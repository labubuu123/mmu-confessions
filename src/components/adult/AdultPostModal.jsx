import React from 'react';
import { X } from 'lucide-react';
import AdultPostForm from './AdultPostForm';

export default function AdultPostModal({ onClose, onSuccess }) {

    const handleSuccess = () => {
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-zinc-950 sm:border border-zinc-800 sm:rounded-2xl shadow-2xl shadow-red-900/10 overflow-hidden flex flex-col max-h-[90vh] h-full sm:h-auto">
                <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950 shrink-0">
                    <div>
                        <h3 className="font-black text-white text-lg tracking-tight flex items-center gap-2">
                            POST SECRET
                            <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">18+</span>
                        </h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Anonymity Guaranteed</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <AdultPostForm onSuccess={handleSuccess} onCancel={onClose} />

            </div>
        </div>
    );
}