import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export const upsertUserLocation = async (userId, latitude, longitude, profile) => {
    const { error } = await supabase.from('user_locations').upsert(
        {
            user_id: userId,
            latitude,
            longitude,
            username: profile?.username || 'Anonymous',
            avatar_url: profile?.avatar_url || '',
            last_updated: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
    );
    if (error) console.error('upsertUserLocation error:', error.message);
};

export function useLocationTracking() {
    const [isTracking, setIsTracking] = useState(false);
    const [showGpsModal, setShowGpsModal] = useState(false);
    
    const watchIdRef = useRef(null);
    const userIdRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        let subscription;
        
        const initializeTracking = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            userIdRef.current = session.user.id;

            const { data: profile } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', session.user.id)
                .single();
            
            profileRef.current = profile;

            const alreadyGranted = localStorage.getItem('gps_permission_granted');
            if (alreadyGranted === 'true') {
                startWatching(session.user.id, profile);
            }
        };

        initializeTracking();

        const authSub = supabase.auth.onAuthStateChange((_, session) => {
            if (session?.user) {
                userIdRef.current = session.user.id;
            } else {
                userIdRef.current = null;
                stopWatching();
            }
        });
        
        subscription = authSub.data.subscription;

        return () => {
            if (subscription) subscription.unsubscribe();
            stopWatching();
        };
    }, []);

    const startWatching = (userId, profile) => {
        if (!navigator.geolocation) return;
        
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        
        setIsTracking(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
                await upsertUserLocation(userId, pos.coords.latitude, pos.coords.longitude, profile);
            },
            (err) => {
                console.warn('watchPosition error:', err.message);
                if (err.code === 1) {
                    stopWatching();
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const stopWatching = async () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
        localStorage.removeItem('gps_permission_granted');

        if (userIdRef.current) {
            await supabase.from('user_locations').delete().eq('user_id', userIdRef.current);
        }
    };

    const toggleLocation = () => {
        if (isTracking) {
            stopWatching();
        } else {
            setShowGpsModal(true);
        }
    };

    const handleGpsAllowed = async (pos) => {
        setShowGpsModal(false);
        localStorage.setItem('gps_permission_granted', 'true');
        if (userIdRef.current && profileRef.current) {
            await upsertUserLocation(userIdRef.current, pos.coords.latitude, pos.coords.longitude, profileRef.current);
            startWatching(userIdRef.current, profileRef.current);
        }
    };

    return {
        isTracking,
        showGpsModal,
        setShowGpsModal,
        toggleLocation,
        handleGpsAllowed
    };
}