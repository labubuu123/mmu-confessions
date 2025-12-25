import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Sparkles, X } from 'lucide-react';

export default function AdultNotification({ status, message, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (status !== 'idle') {
            setIsVisible(true);
            setIsClosing(false);
        } else {
            handleClose();
        }
    }, [status]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, 300);
    };

    if (!isVisible && status === 'idle') return null;

    const config = {
        success: {
            icon: CheckCircle2,
            bg: "bg-emerald-950/90 border-emerald-500/50 shadow-emerald-900/50",
            text: "text-emerald-200",
            iconColor: "text-emerald-400",
            title: "Success",
            progressColor: "bg-emerald-500"
        },
        error: {
            icon: XCircle,
            bg: "bg-rose-950/90 border-rose-500/50 shadow-rose-900/50",
            text: "text-rose-200",
            iconColor: "text-rose-400",
            title: "Error",
            progressColor: "bg-rose-500"
        },
        blocked: {
            icon: AlertTriangle,
            bg: "bg-amber-950/90 border-amber-500/50 shadow-amber-900/50",
            text: "text-amber-200",
            iconColor: "text-amber-400",
            title: "Content Flagged",
            progressColor: "bg-amber-500"
        },
        analyzing: {
            icon: Sparkles,
            bg: "bg-slate-900/90 border-violet-500/50 shadow-violet-900/50",
            text: "text-violet-200",
            iconColor: "text-violet-400",
            title: "AI Analysis",
            progressColor: "bg-violet-500"
        }
    };

    const currentConfig = config[status] || config.analyzing;
    const Icon = currentConfig.icon;

    return createPortal(
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 transform 
            ${isVisible && !isClosing ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95'}`}
        >
            <div className={`flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-md shadow-2xl min-w-[320px] max-w-md ${currentConfig.bg}`}>

                <div className={`p-2 rounded-full bg-black/20 shrink-0 ${status === 'analyzing' ? 'animate-spin-slow' : ''}`}>
                    <Icon className={`w-6 h-6 ${currentConfig.iconColor}`} />
                </div>

                <div className="flex-1 pt-0.5">
                    <h4 className={`font-bold text-sm mb-1 tracking-wide ${currentConfig.iconColor}`}>
                        {currentConfig.title}
                    </h4>
                    <p className={`text-xs font-medium leading-relaxed ${currentConfig.text}`}>
                        {message}
                    </p>
                </div>

                {status !== 'analyzing' && (
                    <button
                        onClick={handleClose}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {status !== 'analyzing' && status !== 'idle' && (
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-black/20 overflow-hidden rounded-b-2xl">
                        <div className={`h-full ${currentConfig.progressColor} animate-progress-shrink`}></div>
                    </div>
                )}
            </div>

            <div className={`absolute inset-0 -z-10 blur-2xl opacity-20 ${currentConfig.bg.split(' ')[0]}`}></div>
        </div>,
        document.body
    );
}