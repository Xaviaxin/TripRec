
export type TripStatus = 'inspiration' | 'upcoming' | 'completed';

export interface Location {
    id: string;
    name: string;
    address?: string; // Optional
    lat: number;      // Required for map
    lng: number;      // Required for map
}

export interface Activity {
    id: string;
    description: string;
    location?: Location;
    cost?: number;
    notes?: string;
}

export interface DayPlan {
    id: string;
    date?: string; // ISO Date string
    dayIndex: number; // 1-based
    location?: Location; // Deprecated: use locations array instead
    locations?: Location[]; // Multi-locations for the day
    activities: Activity[];
    summary?: string;
    weather?: string; // e.g., 'Sunny'
}

export interface Trip {
    id: string;
    title: string; // Auto-generated if not provided
    status: TripStatus;
    startDate?: string; // ISO Date string
    endDate?: string;   // ISO Date string
    destination?: string; // Formatting purpose (Main display)
    destinationLocation?: Location; // Deprecated, kept for compat
    locations?: Location[]; // New: Multiple destinations
    days: DayPlan[];
    notes?: string; // For Inspiration mode
    estimatedDays?: number; // For Inspiration mode
    createdAt: number;
}
