import { Location } from './types';

// Nominatim OpenStreetMap Geocoding
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

export async function searchLocation(query: string): Promise<Location[]> {
    if (!query || query.length < 3) return [];

    try {
        const response = await fetch(`${NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&format=json&limit=5`);
        const data = await response.json();

        return data.map((item: any) => ({
            id: item.place_id ? String(item.place_id) : crypto.randomUUID(),
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: item.display_name
        }));
    } catch (error) {
        console.error("Geocoding error:", error);
        return [];
    }
}
