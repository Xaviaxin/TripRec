'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trip, Activity, DayPlan, Location, TripStatus } from '@/lib/types';
import { getTrip, saveTrip, deleteTrip } from '@/lib/storage';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { DayItem } from './DayItem';
import { searchLocation } from '@/lib/geocoding';
import { useAuth } from './AuthContext';
import { syncTripToCloud, deleteCloudTrip, getCloudTrip } from '@/lib/firebaseUtils';
import { useI18n } from './I18nContext';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Trash2, Check, ArrowRight, Edit2, X, Clock, Lightbulb, Plane, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div style={{ height: '300px', background: '#eee', borderRadius: 'var(--radius-md)' }}>Loading Map...</div> });

export function TripDetail({ id }: { id: string }) {
    const router = useRouter();
    const { user } = useAuth();
    const { t } = useI18n();

    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Header Edit State
    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [tripLocations, setTripLocations] = useState<Location[]>([]);
    const [destQuery, setDestQuery] = useState('');
    const [destResults, setDestResults] = useState<Location[]>([]);
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editDaysCount, setEditDaysCount] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            try {
                let loadedTrip = getTrip(id) || null;

                if (!loadedTrip && user) {
                    loadedTrip = await getCloudTrip(id);
                    if (loadedTrip) {
                        saveTrip(loadedTrip); // Cache locally
                    }
                }

                if (!loadedTrip) {
                    setNotFound(true);
                } else {
                    setTrip(loadedTrip);
                    setEditTitle(loadedTrip.title);
                    setEditStartDate(loadedTrip.startDate || '');
                    setEditEndDate(loadedTrip.endDate || '');
                    setEditDaysCount(loadedTrip.days.length);
                    setTripLocations(loadedTrip.locations || (loadedTrip.destinationLocation ? [loadedTrip.destinationLocation] : []));
                    setNotFound(false);
                }
            } catch (e) {
                console.error(e);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, user]);

    const handleUpdateDay = async (dayId: string, updates: Partial<DayPlan>) => {
        if (!trip) return;
        const newDays = trip.days.map(day => {
            if (day.id === dayId) {
                return { ...day, ...updates };
            }
            return day;
        });
        const updatedTrip = { ...trip, days: newDays };
        setTrip(updatedTrip);
        saveTrip(updatedTrip);
        if (user) await syncTripToCloud(updatedTrip, user.uid);
    };

    const handleAddActivity = async (dayId: string, activity: Activity) => {
        if (!trip) return;
        const newDays = trip.days.map(day => {
            if (day.id === dayId) {
                return { ...day, activities: [...day.activities, activity] };
            }
            return day;
        });
        const updatedTrip = { ...trip, days: newDays };
        setTrip(updatedTrip);
        saveTrip(updatedTrip);
        if (user) await syncTripToCloud(updatedTrip, user.uid);
    };

    const handleRemoveActivity = async (dayId: string, activityId: string) => {
        if (!trip) return;
        const newDays = trip.days.map(day => {
            if (day.id === dayId) {
                return { ...day, activities: day.activities.filter(a => a.id !== activityId) };
            }
            return day;
        });
        const updatedTrip = { ...trip, days: newDays };
        setTrip(updatedTrip);
        saveTrip(updatedTrip);
        if (user) await syncTripToCloud(updatedTrip, user.uid);
    };

    const handleDeleteTrip = async () => {
        if (confirm(t('deleteConfirm'))) {
            deleteTrip(id);
            if (user) await deleteCloudTrip(id);
            router.push('/');
        }
    };

    const handleStatusChange = async (newStatus: TripStatus) => {
        if (!trip) return;
        const updatedTrip = { ...trip, status: newStatus };
        setTrip(updatedTrip);
        saveTrip(updatedTrip);
        if (user) await syncTripToCloud(updatedTrip, user.uid);
    };

    // Header Editing Logic
    const handleSearchDest = async (q: string) => {
        setDestQuery(q);
        if (q.length > 2) {
            const res = await searchLocation(q);
            setDestResults(res);
        } else {
            setDestResults([]);
        }
    };

    const addLocation = (loc: Location) => {
        if (tripLocations.some(l => l.id === loc.id)) return;
        setTripLocations([...tripLocations, loc]);
        setDestQuery('');
        setDestResults([]);
    };

    const removeLocation = (locId: string) => {
        setTripLocations(tripLocations.filter(l => l.id !== locId));
    };

    const saveHeaderChanges = async () => {
        if (!trip) return;
        const destString = tripLocations.map(l => l.name).join(' & ');

        let newDays = [...trip.days];

        // 1. Adjust number of days
        if (editDaysCount > newDays.length) {
            const daysToAdd = editDaysCount - newDays.length;
            const extraDays: DayPlan[] = Array.from({ length: daysToAdd }, (_, i) => ({
                id: Math.random().toString(36).substr(2, 9),
                dayIndex: newDays.length + i + 1,
                activities: [],
                locations: []
            }));
            newDays = [...newDays, ...extraDays];
        } else if (editDaysCount < newDays.length) {
            newDays = newDays.slice(0, editDaysCount);
        }

        // 2. Adjust dates
        const startDateObj = editStartDate ? new Date(editStartDate) : null;
        newDays = newDays.map((day, idx) => ({
            ...day,
            date: startDateObj ? new Date(startDateObj.getTime() + idx * 24 * 60 * 60 * 1000).toISOString() : undefined,
            dayIndex: idx + 1
        }));

        const updatedTrip: Trip = {
            ...trip,
            title: editTitle,
            startDate: editStartDate || undefined,
            endDate: editEndDate || undefined,
            destination: destString,
            locations: tripLocations,
            destinationLocation: tripLocations.length > 0 ? tripLocations[0] : undefined,
            days: newDays
        };
        setTrip(updatedTrip);
        saveTrip(updatedTrip);
        if (user) await syncTripToCloud(updatedTrip, user.uid);
        setIsEditingHeader(false);
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>{t('loading')}</div>;

    if (notFound || !trip) return (
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 className="title">{t('noTripsFound')}</h2>
            <Link href="/">
                <Button>{t('backToList')}</Button>
            </Link>
        </div>
    );

    const getStatusLabel = (status: TripStatus) => {
        switch (status) {
            case 'inspiration': return { label: t('inspiration'), icon: <Lightbulb size={16} />, color: 'var(--color-accent)' };
            case 'upcoming': return { label: t('upcoming'), icon: <Plane size={16} />, color: 'var(--color-primary)' };
            case 'completed': return { label: t('completed'), icon: <CheckCircle size={16} />, color: 'var(--color-success)' };
        }
    };

    const statusInfo = getStatusLabel(trip.status);

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} /> {t('backToList')}
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        {!isEditingHeader ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <h1 className="title" style={{ marginBottom: '0.5rem' }}>{trip.title}</h1>
                                    <button onClick={() => setIsEditingHeader(true)} style={{ color: 'var(--color-text-muted)', cursor: 'pointer', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                                        <Edit2 size={16} /> {t('edit')}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={18} />
                                        <span>{trip.destination || t('setDestination')}</span>
                                    </div>
                                    {trip.status !== 'inspiration' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={18} />
                                            <span>{trip.startDate ? new Date(trip.startDate).toLocaleDateString() : t('dateNotSet')} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : ''}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={18} />
                                        <span>{trip.days.length} {t('days')}</span>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.85rem',
                                        background: statusInfo.color,
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        {statusInfo.icon} {statusInfo.label}
                                    </span>
                                </div>
                                {trip.notes && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                            <strong>{t('notes')}:</strong> {trip.notes}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <Input label={t('tripName')} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                                </div>
                                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                        {t('destination')}
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        {tripLocations.map(loc => (
                                            <span key={loc.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}>
                                                {loc.name}
                                                <button onClick={() => removeLocation(loc.id)} style={{ cursor: 'pointer', display: 'flex', border: 'none', background: 'none', color: 'inherit' }}>
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <Input
                                        value={destQuery}
                                        onChange={e => handleSearchDest(e.target.value)}
                                        placeholder={t('searchLocationPlaceholder')}
                                        style={{ marginBottom: 0 }}
                                    />
                                    {destResults.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', zIndex: 10, boxShadow: 'var(--shadow-lg)', maxHeight: '200px', overflowY: 'auto' }}>
                                            {destResults.map(loc => (
                                                <div key={loc.id} onClick={() => addLocation(loc)} style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                                    {loc.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            label={t('departureDate')}
                                            type="date"
                                            value={editStartDate}
                                            onChange={e => setEditStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={editDaysCount}
                                                onChange={e => setEditDaysCount(parseInt(e.target.value) || 1)}
                                                style={{ marginBottom: 0, flex: 1, padding: '0.75rem' }}
                                            />
                                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '1rem' }}>{t('days')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                                    <Button onClick={saveHeaderChanges}>{t('save')}</Button>
                                    <Button variant="secondary" onClick={() => setIsEditingHeader(false)}>{t('cancel')}</Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {trip.status === 'inspiration' && (
                            <Button onClick={() => handleStatusChange('upcoming')}>
                                {t('convertToUpcoming')} <ArrowRight size={16} />
                            </Button>
                        )}
                        {trip.status === 'upcoming' && (
                            <Button onClick={() => handleStatusChange('completed')} style={{ background: 'var(--color-success)' }}>
                                {t('completeTrip')} <Check size={16} />
                            </Button>
                        )}
                        <Button variant="danger" onClick={handleDeleteTrip} style={{ padding: '0.5rem' }}>
                            <Trash2 size={20} />
                        </Button>
                    </div>
                </div>
            </header>

            <div style={{ marginBottom: '2rem' }}>
                <MapView trips={[]} activeTrip={trip} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {trip.days.map((day, idx) => (
                    <DayItem
                        key={day.id}
                        day={day}
                        dayIndex={idx}
                        isCompletedMode={trip.status === 'completed'}
                        onAddActivity={handleAddActivity}
                        onRemoveActivity={handleRemoveActivity}
                        onUpdateDay={handleUpdateDay}
                    />
                ))}
            </div>
        </div>
    );
}
