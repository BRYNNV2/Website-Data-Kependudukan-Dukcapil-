import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

type KKLocation = {
    id: number;
    kepala_keluarga: string;
    rw: string;
    lat: number;
    lng: number;
}

export function PopulationMap() {
    const [locations, setLocations] = useState<KKLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('kartu_keluarga')
            .select('id, kepala_keluarga, rw, latitude, longitude');

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        if (data) {
            const validData = data
                .filter(item => item.latitude && item.longitude)
                .map(item => ({
                    id: item.id,
                    kepala_keluarga: item.kepala_keluarga,
                    rw: item.rw,
                    lat: item.latitude,
                    lng: item.longitude
                }));
            setLocations(validData);
        }
        setLoading(false);
    }

    // Default center (Indonesia general or specific desa)
    // Calculate center from data if available
    const centerLat = locations.length > 0 ? locations.reduce((sum, item) => sum + item.lat, 0) / locations.length : -6.200000;
    const centerLng = locations.length > 0 ? locations.reduce((sum, item) => sum + item.lng, 0) / locations.length : 106.816666;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Peta Sebaran Penduduk (Sesuai Input)</CardTitle>
                <CardDescription>
                    Menampilkan lokasi Kartu Keluarga berdasarkan koordinat yang diinput.
                    {locations.length === 0 && !loading && " (Belum ada data dengan koordinat)"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[400px] w-full bg-muted animate-pulse rounded-md flex items-center justify-center">
                        Memuat Peta...
                    </div>
                ) : (
                    <div className="h-[400px] w-full rounded-md overflow-hidden border z-0 relative">
                        <MapContainer
                            center={[centerLat, centerLng]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MarkerClusterGroup chunkedLoading>
                                {locations.map((loc) => (
                                    <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                                        <Popup>
                                            <div className="text-center">
                                                <p className="font-bold text-sm">{loc.kepala_keluarga}</p>
                                                <p className="text-xs">RW: {loc.rw}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MarkerClusterGroup>
                        </MapContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
