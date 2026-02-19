'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip } from '@/lib/types';
import { useEffect, useState } from 'react';

// Use CircleMarker for easy coloring based on status
// Colors: Inspiration (Accent/Orange), Upcoming (Primary/Blue), Completed (Success/Green)

interface MapViewProps {
    trips: Trip[];
    activeTrip?: Trip;
}

export default function MapView({ trips, activeTrip }: MapViewProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return <div style={{ height: '400px', background: '#f0f0f0' }}>加载地图中...</div>;

    // Center map logic
    // Priority: Active Trip first location -> First Trip -> Default
    let center: [number, number] = [35.6762, 139.6503]; // Default
    if (activeTrip && activeTrip.locations && activeTrip.locations.length > 0) {
        center = [activeTrip.locations[0].lat, activeTrip.locations[0].lng];
    } else if (activeTrip && activeTrip.destinationLocation) {
        center = [activeTrip.destinationLocation.lat, activeTrip.destinationLocation.lng];
    } else if (trips.length > 0 && trips[0].destinationLocation) {
        center = [trips[0].destinationLocation.lat, trips[0].destinationLocation.lng];
    }

    const getColor = (status: string) => {
        switch (status) {
            case 'inspiration': return '#f59e0b'; // Orange
            case 'upcoming': return '#2563eb'; // Blue
            case 'completed': return '#22c55e'; // Green
            default: return '#64748b';
        }
    };

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 0 }}>
            <MapContainer center={center} zoom={activeTrip ? 8 : 2} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Render All Trips (Summary View) */}
                {!activeTrip && trips.map((trip) => {
                    const tripColor = getColor(trip.status);

                    // Collect all main destination points for this trip
                    const mainDestinations = trip.locations || (trip.destinationLocation ? [trip.destinationLocation] : []);

                    return (
                        <div key={trip.id}>
                            {/* Main Destinations for this trip */}
                            {mainDestinations.map((loc, idx) => (
                                <CircleMarker
                                    key={`${trip.id}-dest-${idx}`}
                                    center={[loc.lat, loc.lng]}
                                    radius={8}
                                    pathOptions={{
                                        color: 'white',
                                        fillColor: tripColor,
                                        fillOpacity: 0.9,
                                        weight: 2
                                    }}
                                >
                                    <Popup>
                                        <strong>{trip.title}</strong><br />
                                        目的地: {loc.name}
                                    </Popup>
                                </CircleMarker>
                            ))}
                        </div>
                    );
                })}

                {/* Render Active Trip Detailed Markers */}
                {activeTrip && (
                    <>
                        {/* Trip Destinations */}
                        {(activeTrip.locations || (activeTrip.destinationLocation ? [activeTrip.destinationLocation] : [])).map((loc, idx) => (
                            <CircleMarker
                                key={`dest-${idx}`}
                                center={[loc.lat, loc.lng]}
                                radius={10}
                                pathOptions={{
                                    color: 'white',
                                    fillColor: 'var(--color-primary)',
                                    fillOpacity: 1,
                                    weight: 3
                                }}
                            >
                                <Popup>
                                    <strong>行程目的地: {loc.name}</strong>
                                </Popup>
                            </CircleMarker>
                        ))}

                        {/* Daily Locations */}
                        {activeTrip.days.map(day => (
                            (day.locations || (day.location ? [day.location] : [])).map((loc, lIdx) => (
                                <CircleMarker
                                    key={`day-${day.id}-${lIdx}`}
                                    center={[loc.lat, loc.lng]}
                                    radius={6}
                                    pathOptions={{
                                        color: 'white',
                                        fillColor: 'var(--color-accent)',
                                        fillOpacity: 0.8,
                                        weight: 1
                                    }}
                                >
                                    <Popup>
                                        <strong>第 {day.dayIndex} 天</strong><br />
                                        {loc.name}
                                    </Popup>
                                </CircleMarker>
                            ))
                        ))}
                    </>
                )}
            </MapContainer>
        </div>
    );
}
