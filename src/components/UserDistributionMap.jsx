import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

const createAvatarIcon = (avatarUrl, isOnline, isCurrentUser) => L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
        <div class="relative group">
            ${isCurrentUser ? '<div class="absolute -inset-2 bg-indigo-500/30 rounded-full animate-ping"></div>' : ''}
            <div class="relative w-10 h-10 rounded-full border-[3px] ${isOnline ? 'border-green-400' : 'border-gray-400'} shadow-xl overflow-hidden bg-white z-10 transition-transform group-hover:scale-110">
                <img src="${avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}" class="w-full h-full object-cover" />
            </div>
            ${isOnline ? '<div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-20"></div>' : ''}
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

function MapController({ center, zoom }) {
    const map = useMap();
    const didFlyRef = useRef(false);

    useEffect(() => {
        if (!center) return;
        if (!didFlyRef.current) {
            map.setView(center, zoom ?? map.getZoom());
            didFlyRef.current = true;
        } else {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map, zoom]);

    return null;
}

export default function UserDistributionMap() {
    const [locations, setLocations] = useState([]);
    const [myLocation, setMyLocation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const DEFAULT_CENTER = [4.2105, 101.9758];
    const DEFAULT_ZOOM = 6;

    useEffect(() => {
        const initMap = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                let activeId = session?.user?.id;

                if (session?.user) {
                    setCurrentUser(session.user);
                } else {
                    activeId = localStorage.getItem('guest_user_id');
                    if (activeId) setCurrentUser({ id: activeId });
                }

                if (activeId) {
                    const { data: myLoc } = await supabase
                        .from('user_locations')
                        .select('latitude, longitude')
                        .eq('user_id', activeId)
                        .maybeSingle();

                    if (myLoc) {
                        setMyLocation([myLoc.latitude, myLoc.longitude]);
                    }
                }
            } catch (err) {
                console.error('initMap error:', err);
            } finally {
                await fetchLocations();
                setLoading(false);
            }
        };

        initMap();

        const channel = supabase
            .channel('public:user_locations')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_locations' },
                () => {
                    console.log('🔄 Database change detected, refreshing map...');
                    fetchLocations();
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchLocations = async () => {
        const { data, error } = await supabase
            .from('user_locations')
            .select('user_id, latitude, longitude, username, avatar_url, last_updated');

        if (!error && data) {
            console.log(`🗺️ Map updated: ${data.length} users found.`);
            setLocations(data);
        } else if (error) {
            console.error('fetchLocations error:', error.message);
        }
    };

    const handleRecenter = () => {
        if (myLocation) {
            setMyLocation(prev => prev ? [...prev] : prev);
        }
    };

    const onlineCount = locations.filter(
        (loc) => new Date() - new Date(loc.last_updated) < 3_600_000
    ).length;

    return (
        <div className="relative w-full h-screen bg-slate-100 dark:bg-slate-900 pt-16">
            <div className="absolute top-20 left-4 right-4 z-[400] flex justify-between items-center pointer-events-none">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 pointer-events-auto flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-500" />
                    <span className="font-bold text-slate-800 dark:text-white">Live User Map</span>

                    {loading ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin ml-2" />
                    ) : (
                        <>
                            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full ml-1">
                                {locations.length} Total
                            </span>
                            <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                                {onlineCount} Online
                            </span>
                        </>
                    )}
                </div>

                <button
                    onClick={handleRecenter}
                    disabled={!myLocation}
                    title="Find My Location"
                    className="pointer-events-auto bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
                >
                    <Navigation className="w-5 h-5 text-blue-500" />
                </button>
            </div>

            <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                <MapController center={myLocation} zoom={14} />

                {locations.map((loc) => {
                    if (!loc.latitude || !loc.longitude) return null;

                    const isOnline = new Date() - new Date(loc.last_updated) < 3_600_000;
                    const isCurrentUser = currentUser?.id === loc.user_id;

                    return (
                        <Marker
                            key={loc.user_id}
                            position={[loc.latitude, loc.longitude]}
                            icon={createAvatarIcon(loc.avatar_url, isOnline, isCurrentUser)}
                        >
                            <Popup className="custom-popup">
                                <div className="text-center p-2 min-w-[120px]">
                                    <img
                                        src={loc.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}
                                        alt="avatar"
                                        className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-indigo-100 shadow-sm object-cover"
                                    />
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-0">
                                        {loc.username || 'Anonymous'}
                                        {isCurrentUser && (
                                            <span className="ml-1 text-xs text-indigo-400">(you)</span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isOnline ? '🟢 Active recently' : '⚪ Last seen offline'}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {!loading && locations.length === 0 && (
                <div className="absolute inset-0 z-[300] flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 text-center shadow-xl border border-slate-200 dark:border-slate-700 pointer-events-auto">
                        <MapPin className="w-10 h-10 text-indigo-300 mx-auto mb-2" />
                        <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">No users on the map yet.</p>
                        <p className="text-slate-500 text-xs mt-2">Open the menu in the bottom right to share your location!</p>
                    </div>
                </div>
            )}
        </div>
    );
}