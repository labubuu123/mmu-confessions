import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Navigation, Loader2, Users, Radio, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const simpleHash = (str) => {
    let hash = 0;
    if (!str || str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const GRADIENTS = [
    'from-indigo-500/85 to-purple-600/85',
    'from-green-400/85 to-blue-500/85',
    'from-pink-500/85 to-rose-500/85',
    'from-yellow-400/85 to-orange-500/85',
    'from-teal-400/85 to-cyan-500/85',
    'from-red-500/85 to-pink-600/85',
    'from-blue-500/85 to-indigo-600/85',
    'from-purple-400/85 to-pink-500/85',
    'from-fuchsia-500/85 to-purple-600/85',
    'from-rose-400/85 to-red-500/85',
    'from-emerald-400/85 to-teal-500/85',
    'from-cyan-400/85 to-blue-500/85',
    'from-amber-400/85 to-orange-500/85',
    'from-violet-500/85 to-fuchsia-500/85',
    'from-lime-400/85 to-emerald-500/85'
];

const PATTERNS = ['✨', '🌟', '💫', '⭐', '☀️', '🌙', '⚡', '🔥', '🌸', '🌺', '🍀', '🍁', '🦋', '🦉', '🦊', '🐼', '🐨', '🐸', '🐢', '🐳'];
const AVATAR_CHARS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const createAvatarIcon = (userId, isOnline, isCurrentUser) => {
    const hash = simpleHash(userId || '');
    const gradient = GRADIENTS[hash % GRADIENTS.length] || GRADIENTS[0];
    const pattern = PATTERNS[hash % PATTERNS.length] || PATTERNS[0];
    const letter = AVATAR_CHARS[hash % AVATAR_CHARS.length] || AVATAR_CHARS[0];

    return L.divIcon({
        className: 'custom-leaflet-icon bg-transparent border-none',
        html: `
            <div class="relative group cursor-pointer flex items-center justify-center">
                ${isCurrentUser ? '<div class="absolute -inset-3 bg-indigo-500/20 rounded-full animate-ping"></div>' : ''}
                <div class="relative w-11 h-11 rounded-full border-[3px] ${isOnline ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'border-slate-300 shadow-lg'} overflow-hidden z-10 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2 flex flex-col items-center justify-center text-white font-bold bg-gradient-to-br ${gradient} backdrop-blur-sm">
                    <span class="opacity-50 text-[10px] leading-none mt-0.5">${pattern}</span>
                    <span class="text-[16px] leading-tight">${letter}</span>
                </div>
                ${isOnline ? '<div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-20"></div>' : ''}
            </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -24]
    });
};

function MapFixer() {
    const map = useMap();
    useEffect(() => {
        const timers = [
            setTimeout(() => map.invalidateSize(), 100),
            setTimeout(() => map.invalidateSize(), 400)
        ];
        return () => timers.forEach(clearTimeout);
    }, [map]);
    return null;
}

function MapController({ center, zoom }) {
    const map = useMap();
    const didFlyRef = useRef(false);

    useEffect(() => {
        if (!center) return;
        if (!didFlyRef.current) {
            map.setView(center, zoom ?? map.getZoom());
            didFlyRef.current = true;
        } else {
            map.flyTo(center, map.getZoom(), { duration: 1.5, easeLinearity: 0.25 });
        }
    }, [center, map, zoom]);

    return null;
}

export default function UserDistributionMap() {
    const [locations, setLocations] = useState([]);
    const [myLocation, setMyLocation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const mapRef = useRef(null);

    const DEFAULT_CENTER = [4.2105, 101.9758];
    const DEFAULT_ZOOM = 6;

    useEffect(() => {
        const fetchLocations = async () => {
            const { data, error } = await supabase
                .from('user_locations')
                .select('user_id, latitude, longitude, username, avatar_url, last_updated');

            if (!error && data) {
                setLocations(data);
            }
            setLoading(false);
        };

        const fetchUserLoc = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            let activeId = session?.user?.id || localStorage.getItem('guest_user_id');

            if (activeId) {
                setCurrentUser({ id: activeId });
                const { data: myLoc } = await supabase
                    .from('user_locations')
                    .select('latitude, longitude')
                    .eq('user_id', activeId)
                    .maybeSingle();

                if (myLoc) setMyLocation([myLoc.latitude, myLoc.longitude]);
            }
        };

        fetchLocations();
        fetchUserLoc();

        const channel = supabase
            .channel('public:user_locations')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_locations' },
                () => fetchLocations()
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const handleRecenter = useCallback(() => {
        if (myLocation && mapRef.current) {
            mapRef.current.flyTo(myLocation, 14, { duration: 1.5 });
        }
    }, [myLocation]);

    const onlineUsers = locations.filter(
        (loc) => new Date() - new Date(loc.last_updated) < 3_600_000
    ).length;

    const leafletPopupStyles = `
        .leaflet-popup-content-wrapper {
            background: transparent;
            box-shadow: none;
            padding: 0;
        }
        .leaflet-popup-tip-container {
            display: none;
        }
    `;

    return (
        <div className="relative w-full h-[calc(100vh-64px)] bg-slate-100 overflow-hidden font-sans z-0">
            <style>{leafletPopupStyles}</style>

            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute top-4 left-4 right-4 z-[20] pointer-events-none flex justify-center"
            >
                <div className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200 shadow-xl rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4 max-w-md w-full">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-xl">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-sm">Live Campus Map</h2>
                            <p className="text-xs text-slate-500">Discover nearby students</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
                        {loading ? (
                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        ) : (
                            <>
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Total
                                    </span>
                                    <span className="font-bold text-slate-800">{locations.length}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                onClick={handleRecenter}
                disabled={!myLocation}
                className={`absolute bottom-8 right-4 md:right-6 md:bottom-10 z-20 p-4 rounded-full shadow-xl backdrop-blur-md transition-all duration-300 ease-in-out group ${myLocation
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-white text-slate-400 border border-slate-200 cursor-not-allowed opacity-90'
                    }`}
                title={myLocation ? "Zoom to My Location" : "Location not shared"}
            >
                {myLocation ? (
                    <Crosshair className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                ) : (
                    <Navigation className="w-6 h-6" />
                )}
            </motion.button>

            <MapContainer
                ref={mapRef}
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <MapFixer />

                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                <MapController center={myLocation} zoom={15} />

                {locations.map((loc) => {
                    if (!loc.latitude || !loc.longitude) return null;

                    const isOnline = new Date() - new Date(loc.last_updated) < 3_600_000;
                    const isCurrentUser = currentUser?.id === loc.user_id;

                    const hash = simpleHash(loc.user_id || '');
                    const gradient = GRADIENTS[hash % GRADIENTS.length];
                    const pattern = PATTERNS[hash % PATTERNS.length];
                    const letter = AVATAR_CHARS[hash % AVATAR_CHARS.length];

                    return (
                        <Marker
                            key={loc.user_id}
                            position={[loc.latitude, loc.longitude]}
                            icon={createAvatarIcon(loc.user_id, isOnline, isCurrentUser)}
                        >
                            <Popup>
                                <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 min-w-[160px] transform transition-all text-center">
                                    <div className="relative inline-block mb-3">

                                        <div className={`w-16 h-16 rounded-full border-4 border-indigo-50 mx-auto flex flex-col items-center justify-center text-white font-bold bg-gradient-to-br ${gradient} shadow-lg backdrop-blur-sm`}>
                                            <span className="opacity-50 text-xs mt-1">{pattern}</span>
                                            <span className="text-2xl">{letter}</span>
                                        </div>

                                        {isOnline && (
                                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                                        {loc.username || 'Anonymous'}
                                    </h3>
                                    {isCurrentUser && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] uppercase tracking-wider font-bold rounded-full">
                                            This is You
                                        </span>
                                    )}
                                    <div className="mt-3 flex items-center justify-center gap-1 text-xs font-medium">
                                        {isOnline ? (
                                            <span className="text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg w-full justify-center">
                                                <Radio className="w-3 h-3" /> Online Now
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg w-full justify-center">
                                                Offline
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            <AnimatePresence>
                {!loading && locations.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-[300] flex items-center justify-center pointer-events-none p-4"
                    >
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl border border-slate-100 pointer-events-auto max-w-sm w-full">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Map is Empty</h3>
                            <p className="text-slate-500 text-sm mb-6">Be the first to share your location with the campus community!</p>
                            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-semibold">
                                <Navigation className="w-4 h-4" /> Open menu to share
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}