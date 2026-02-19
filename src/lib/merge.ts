import { Trip, DayPlan } from './types';

export function mergeTrips(tripsToMerge: Trip[], newTitle: string): Trip {
    if (tripsToMerge.length === 0) throw new Error("No trips to merge");

    const baseTrip = tripsToMerge[0];
    const newTrip: Trip = {
        ...baseTrip,
        id: crypto.randomUUID(),
        title: newTitle,
        status: baseTrip.status, // Inherit status from first, or default? Let's assume user merges same-status trips usually.
        createdAt: Date.now(),
        days: []
    };

    let totalDays = 0;

    tripsToMerge.forEach((trip) => {
        trip.days.forEach((day) => {
            // Re-index days
            const newDayIndex = totalDays + 1;
            const newDay: DayPlan = {
                ...day,
                id: crypto.randomUUID(),
                dayIndex: newDayIndex,
                // If merging upcoming trips, dates might need shift, but typically merging is for Inspiration/Planning where dates are loose.
                // For now, we clear specific dates to avoid conflicts, or strictly sequentialize if needed.
                // Let's clear date to force re-planning, or keep relative order.
                date: undefined
            };
            newTrip.days.push(newDay);
            totalDays++;
        });
    });

    return newTrip;
}
