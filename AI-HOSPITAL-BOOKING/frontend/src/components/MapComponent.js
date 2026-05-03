import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const ambulanceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map center updates
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

const MapComponent = ({ 
    center = [28.6139, 77.2090], 
    zoom = 13, 
    hospitals = [], 
    userLocation = null, 
    ambulanceLocation = null,
    height = "400px"
}) => {
    return (
        <div style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={center} zoom={zoom} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Location */}
                {userLocation && (
                    <Marker position={userLocation} icon={userIcon}>
                        <Popup>
                            <strong>You are here</strong>
                        </Popup>
                    </Marker>
                )}

                {/* Ambulance Location */}
                {ambulanceLocation && (
                    <Marker position={ambulanceLocation} icon={ambulanceIcon}>
                        <Popup>
                            <strong>Ambulance</strong>
                            <br />
                            En route to your location
                        </Popup>
                    </Marker>
                )}

                {/* Hospitals */}
                {hospitals.map((h, idx) => (
                    <Marker 
                        key={idx} 
                        position={[h.location.coordinates[1], h.location.coordinates[0]]}
                        icon={hospitalIcon}
                    >
                        <Popup>
                            <strong>{h.name}</strong>
                            <br />
                            {h.address}
                            <br />
                            Readiness: {h.readinessScore}%
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
