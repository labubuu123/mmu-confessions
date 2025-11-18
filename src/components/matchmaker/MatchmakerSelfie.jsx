import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User } from 'lucide-react';

/**
 * Renders a user's selfie from a Supabase Storage path.
 * @param {object} props
 * @param {string} props.selfiePath
 * @param {string} [props.className]
 */
export default function MatchmakerSelfie({ selfiePath, className = 'w-16 h-16' }) {
    const [publicUrl, setPublicUrl] = useState(null);

    useEffect(() => {
        if (selfiePath) {
            const { data } = supabase.storage
                .from('matchmaker_selfies')
                .getPublicUrl(selfiePath);

            setPublicUrl(data.publicUrl);
        }
    }, [selfiePath]);

    const commonClasses = `rounded-full object-cover bg-gray-100 dark:bg-gray-700 ${className}`;

    if (!publicUrl) {
        return (
            <div className={`flex items-center justify-center text-gray-400 ${commonClasses}`}>
                <User className="w-2/3 h-2/3" />
            </div>
        );
    }

    return (
        <img
            src={publicUrl}
            alt="Profile"
            className={commonClasses}
        />
    );
}