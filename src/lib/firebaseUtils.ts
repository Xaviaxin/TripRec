import { auth, db, googleProvider } from './firebase';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    orderBy
} from 'firebase/firestore';
import { Trip } from './types';

// Auth Functions
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

export const logout = () => signOut(auth);

// Helper to recursively remove undefined values (Firestore doesn't allow them)
const cleanUndefined = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(cleanUndefined);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => [k, cleanUndefined(v)])
        );
    }
    return obj;
};

// Firestore Functions
const TRIPS_COLLECTION = 'trips';

export const syncTripToCloud = async (trip: Trip, userId: string) => {
    const tripDoc = doc(db, TRIPS_COLLECTION, trip.id);
    const cleanedTrip = cleanUndefined({ ...trip, userId });
    await setDoc(tripDoc, cleanedTrip);
};

export const getCloudTrips = async (userId: string): Promise<Trip[]> => {
    const q = query(
        collection(db, TRIPS_COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Trip);
};

export const deleteCloudTrip = async (tripId: string) => {
    await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
};

export const getCloudTrip = async (tripId: string): Promise<Trip | null> => {
    const docSnap = await getDoc(doc(db, TRIPS_COLLECTION, tripId));
    return docSnap.exists() ? (docSnap.data() as Trip) : null;
};
