'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trip, TripStatus, DayPlan, Location } from '@/lib/types';
import { saveTrip } from '@/lib/storage';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { searchLocation } from '@/lib/geocoding';
import { useAuth } from './AuthContext';
import { syncTripToCloud } from '@/lib/firebaseUtils';
import { useI18n } from './I18nContext';

export function CreateTripForm() {
    const { user } = useAuth();
    const { t } = useI18n();
    const router = useRouter();
    const [status, setStatus] = useState<TripStatus>('upcoming');
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [estimatedDays, setEstimatedDays] = useState<number>(3);
    const [destinationQuery, setDestinationQuery] = useState('');
    const [destinationResults, setDestinationResults] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    const handleSearch = async (query: string) => {
        setDestinationQuery(query);
        if (query.length > 2) {
            const results = await searchLocation(query);
            setDestinationResults(results);
        } else {
            setDestinationResults([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numDays = status === 'inspiration' ? estimatedDays :
            (startDate && endDate ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : estimatedDays);

        const days: DayPlan[] = Array.from({ length: numDays }, (_, i) => ({
            id: Math.random().toString(36).substr(2, 9),
            date: startDate ? new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString() : undefined,
            dayIndex: i + 1,
            activities: [],
            locations: []
        }));

        const newTrip: Trip = {
            id: Math.random().toString(36).substr(2, 9),
            title: title || (selectedLocation ? `${selectedLocation.name}之旅` : '我的旅行'),
            status,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            destination: selectedLocation?.name,
            locations: selectedLocation ? [selectedLocation] : [],
            days,
            notes: status === 'inspiration' ? notes : undefined,
            estimatedDays: status === 'inspiration' ? estimatedDays : undefined,
            createdAt: Date.now(),
        };

        saveTrip(newTrip);
        if (user) {
            await syncTripToCloud(newTrip, user.uid);
        }
        router.push(`/trips/${newTrip.id}`);
    };

    return (
        <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="title" style={{ textAlign: 'center', marginBottom: '2rem' }}>{t('createTripTitle')}</h2>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                {(['inspiration', 'upcoming', 'completed'] as TripStatus[]).map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: 'calc(var(--radius-md) - 2px)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            background: status === s ? 'white' : 'transparent',
                            color: status === s ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            boxShadow: status === s ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t(s as any)}
                    </button>
                ))}
            </div>

            <Input
                label={t('tripName')}
                placeholder={t('tripNamePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            {status === 'inspiration' && (
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <Input
                        label={t('destinationInspiration')}
                        placeholder={t('destinationPlaceholder')}
                        value={destinationQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        required={!selectedLocation}
                    />
                    {destinationResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', zIndex: 10, boxShadow: 'var(--shadow-lg)', maxHeight: '200px', overflowY: 'auto' }}>
                            {destinationResults.map(loc => (
                                <div
                                    key={loc.id}
                                    onClick={() => {
                                        setSelectedLocation(loc);
                                        setDestinationQuery(loc.name);
                                        setDestinationResults([]);
                                    }}
                                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                >
                                    {loc.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {status === 'inspiration' ? (
                <>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>{t('notesOptional')}</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('notesPlaceholder')}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                minHeight: '100px',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                    <Input
                        label={t('estimatedDays')}
                        type="number"
                        min={1}
                        value={estimatedDays}
                        onChange={(e) => setEstimatedDays(parseInt(e.target.value))}
                    />
                </>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                        label={t('travelDates')}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                        label=" "
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <Button type="submit" style={{ flex: 1 }}>{t('startPlanning')}</Button>
                <Button type="button" variant="secondary" onClick={() => router.back()}>{t('cancel')}</Button>
            </div>
        </form>
    );
}
