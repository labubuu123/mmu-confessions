import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const getOrCreateGuestId = () => {
    let guestId = localStorage.getItem('guest_user_id');
    if (!guestId) {
        guestId = crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
        localStorage.setItem('guest_user_id', guestId);
    }
    return guestId;
};

export const upsertUserLocation = async (userId, latitude, longitude, profile) => {
    if (!userId) return;
    
    const { error } = await supabase.from('user_locations').upsert(
        {
            user_id: userId,
            latitude,
            longitude,
            username: profile?.username || 'Guest Map User',
            avatar_url: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            last_updated: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
    );
};

export function useLocationTracking() {
    const [isTracking, setIsTracking] = useState(false);
    const [showGpsModal, setShowGpsModal] = useState(false);
    
    const watchIdRef = useRef(null);
    const userIdRef = useRef(null);
    const profileRef = useRef({ username: 'Guest Map User', avatar_url: '' });

    useEffect(() => {
        let subscription;
        
        const initializeTracking = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user) {
                    userIdRef.current = session.user.id;
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', session.user.id)
                        .maybeSingle();
                    
                    if (profile) profileRef.current = profile;
                } else {
                    const guestId = getOrCreateGuestId();
                    userIdRef.current = guestId;
                    profileRef.current = {
                        username: 'Guest User',
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}` 
                    };
                }

                if (userIdRef.current) {
                    startWatching(userIdRef.current, profileRef.current);
                }
            } catch (err) {
                console.error("Init tracking error:", err);
            }
        };

        initializeTracking();

        const authSub = supabase.auth.onAuthStateChange(async (_, session) => {
            if (userIdRef.current) {
                await supabase.from('user_locations').delete().eq('user_id', userIdRef.current);
            }

            if (session?.user) {
                userIdRef.current = session.user.id;
                const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', session.user.id).maybeSingle();
                if (profile) profileRef.current = profile;
            } else {
                const guestId = getOrCreateGuestId();
                userIdRef.current = guestId;
                profileRef.current = { username: 'Guest User', avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}` };
            }

            startWatching(userIdRef.current, profileRef.current);
        });
        
        subscription = authSub.data.subscription;

        return () => {
            if (subscription) subscription.unsubscribe();
            stopWatching();
        };
    }, []);

    const startWatching = (userId, profile) => {
        if (!navigator.geolocation) {
            console.warn("Geolocation is not supported by this browser.");
            return;
        }
        
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        
        setIsTracking(true);
        console.log('📡 Starting GPS tracking (Automatic)...');
        
        watchIdRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
                setShowGpsModal(false);
                await upsertUserLocation(userId, pos.coords.latitude, pos.coords.longitude, profile);
            },
            (err) => {
                console.warn('watchPosition error:', err.message);
                if (err.code === 1) {
                    stopWatching();
                    setShowGpsModal(true);
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
        console.log('🛑 Stopped GPS tracking.');

        if (userIdRef.current) {
            await supabase.from('user_locations').delete().eq('user_id', userIdRef.current);
        }
    };

    return {
        showGpsModal,
        setShowGpsModal
    };
}