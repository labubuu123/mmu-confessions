import React from 'react';
import { User } from 'lucide-react';

export default function AdultAvatar({ gender, size = "md", className = "" }) {
    const isMale = gender === 'Boy' || gender === 'M';

    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12"
    };

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center shadow-lg transition-all duration-300 relative group overflow-hidden ${className} 
            ${isMale
                ? 'bg-gradient-to-br from-cyan-900 to-blue-950 border border-cyan-700 shadow-cyan-900/20'
                : 'bg-gradient-to-br from-pink-900 to-rose-950 border border-pink-700 shadow-pink-900/20'
            }`}>

            <div className={`absolute inset-0 opacity-50 blur-sm ${isMale ? 'bg-cyan-500/10' : 'bg-pink-500/10'}`}></div>

            <User className={`${iconSizes[size]} relative z-10 ${isMale ? 'text-cyan-400 fill-cyan-900/50' : 'text-pink-400 fill-pink-900/50'}`} />
        </div>
    );
}