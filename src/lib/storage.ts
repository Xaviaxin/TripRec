import { Trip } from './types';

const STORAGE_KEY = 'triprec_trips_v2';

// Clear old storage if exists (simple migration by deletion as requested)
if (typeof window !== 'undefined') {
    if (localStorage.getItem('triprec_trips')) {
        localStorage.removeItem('triprec_trips');
    }
}

export const getTrips = (): Trip[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const getTrip = (id: string): Trip | undefined => {
    const trips = getTrips();
    return trips.find((t) => t.id === id);
};

export const saveTrip = (trip: Trip): void => {
    const trips = getTrips();
    const index = trips.findIndex((t) => t.id === trip.id);

    if (index >= 0) {
        trips[index] = trip;
    } else {
        // Add new trip to the beginning
        trips.unshift(trip);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
};

export const deleteTrip = (id: string): void => {
    const trips = getTrips();
    const newTrips = trips.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTrips));
};

