import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Navigation } from 'lucide-react';

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

function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function UserDistributionMap() {
    const [locations, setLocations] = useState([]);
    const [myLocation, setMyLocation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const defaultCenter = [4.2105, 101.9758];

    useEffect(() => {
        const initMap = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setCurrentUser(session.user);

                const { data: myLoc } = await supabase
                    .from('user_locations')
                    .select('latitude, longitude')
                    .eq('user_id', session.user.id)
                    .single();

                if (myLoc) {
                    setMyLocation([myLoc.latitude, myLoc.longitude]);
                }
            }
            fetchLocations();
        };
        initMap();

        const channel = supabase
            .channel('public:user_locations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, fetchLocations)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchLocations = async () => {
        const { data, error } = await supabase.from('user_locations').select('*');
        if (!error && data) {
            setLocations(data);
        }
    };

    return (
        <div className="relative w-full h-screen bg-slate-100 dark:bg-slate-900 pt-16">
            <div className="absolute top-20 left-4 right-4 z-[400] flex justify-between items-center pointer-events-none">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 pointer-events-auto flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-500" />
                    <span className="font-bold text-slate-800 dark:text-white">Live User Map</span>
                    <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full ml-2">
                        {locations.length} Total
                    </span>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    <button
                        onClick={() => myLocation && setMyLocation([...myLocation])}
                        title="Find My Location"
                        className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-gray-50 transition-colors"
                    >
                        <Navigation className="w-5 h-5 text-blue-500" />
                    </button>
                </div>
            </div>

            <MapContainer
                center={myLocation || defaultCenter}
                zoom={myLocation ? 14 : 6}
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <MapController center={myLocation} />

                {locations.map((loc) => {
                    const isOnline = new Date() - new Date(loc.last_updated) < 3600000;
                    const isCurrentUser = currentUser?.id === loc.user_id;

                    return (
                        <Marker
                            key={loc.user_id}
                            position={[loc.latitude, loc.longitude]}
                            icon={createAvatarIcon(loc.avatar_url, isOnline, isCurrentUser)}
                        >
                            <Popup className="custom-popup">
                                <div className="text-center p-2 min-w-[120px]">
                                    <img src={loc.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="avatar" className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-indigo-100 shadow-sm object-cover" />
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-0">{loc.username || 'Anonymous'}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isOnline ? '🟢 Active recently' : '⚪ Last seen offline'}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}