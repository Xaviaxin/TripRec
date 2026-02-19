'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { saveTrip } from '@/lib/storage';
import { searchLocation } from '@/lib/geocoding';
import { useAuth } from './AuthContext';
import { syncTripToCloud } from '@/lib/firebaseUtils';
import { TripStatus, Location, DayPlan, Trip } from '@/lib/types';

export function CreateTripForm() {
    const router = useRouter();
    const [status, setStatus] = useState<TripStatus>('inspiration');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Fields
    const [title, setTitle] = useState(''); // Used for Upcoming/Completed
    const [destination, setDestination] = useState(''); // Used for Inspiration
    const [notes, setNotes] = useState('');
    const [estimatedDays, setEstimatedDays] = useState<number | ''>('');
    const [dates, setDates] = useState({ start: '', end: '' });

    // Geocoding (Inspiration only)
    const [locationResults, setLocationResults] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    const handleSearchLocation = async (query: string) => {
        setDestination(query);
        if (query.length > 2) {
            const results = await searchLocation(query);
            setLocationResults(results);
        } else {
            setLocationResults([]);
        }
    };

    const selectLocation = (loc: Location) => {
        setSelectedLocation(loc);
        setDestination(loc.name);
        setLocationResults([]);
    };

    const calculateDaysFromDates = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let days: DayPlan[] = [];
            let finalTitle = '';

            if (status === 'inspiration') {
                finalTitle = destination + ' (灵感)';
            } else {
                finalTitle = title;
            }

            const dayCount = status === 'upcoming' && typeof estimatedDays === 'number'
                ? estimatedDays
                : (dates.start && dates.end ? calculateDaysFromDates(dates.start, dates.end) : 0);

            // Generate Days
            if (dayCount > 0) {
                for (let i = 0; i < dayCount; i++) {
                    let dateStr = undefined;
                    if (dates.start) {
                        const d = new Date(dates.start);
                        d.setDate(d.getDate() + i);
                        dateStr = d.toISOString().split('T')[0];
                    }

                    days.push({
                        id: crypto.randomUUID(),
                        date: dateStr,
                        dayIndex: i + 1,
                        activities: [],
                        summary: ''
                    });
                }
            }

            const newTrip: Trip = {
                id: crypto.randomUUID(),
                title: finalTitle,
                destination: status === 'inspiration' ? destination : '',
                destinationLocation: selectedLocation || undefined,
                startDate: dates.start || undefined,
                endDate: dates.end || undefined,
                status: status,
                days: days,
                notes: notes,
                estimatedDays: Number(estimatedDays) || undefined,
                createdAt: Date.now()
            };

            saveTrip(newTrip);

            if (user) {
                await syncTripToCloud(newTrip, user.uid);
            }

            router.push(`/trips/${newTrip.id}`);
        } catch (error) {
            console.error("Failed to create trip", error);
            alert("创建失败: " + (error instanceof Error ? error.message : String(error)));
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>创建新行程</h2>

            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--color-surface)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                {(['inspiration', 'upcoming', 'completed'] as TripStatus[]).map(s => (
                    <button
                        key={s}
                        type="button"
                        className={`btn ${status === s ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1 }}
                        onClick={() => {
                            setStatus(s);
                            setTitle('');
                            setDestination('');
                            setDates({ start: '', end: '' });
                        }}
                    >
                        {s === 'inspiration' ? '灵感' : s === 'upcoming' ? '待出行' : '已出行'}
                    </button>
                ))}
            </div>

            {/* Dynamic Fields based on Status */}
            {status === 'inspiration' ? (
                // Inspiration: Destination + Notes
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <Input
                        label="目的地 *"
                        placeholder="搜索目的地 (例如: 京都)"
                        value={destination}
                        onChange={(e) => handleSearchLocation(e.target.value)}
                        required
                    />
                    {locationResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', zIndex: 10, boxShadow: 'var(--shadow-lg)', maxHeight: '200px', overflowY: 'auto' }}>
                            {locationResults.map(loc => (
                                <div
                                    key={loc.id}
                                    onClick={() => selectLocation(loc)}
                                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                >
                                    {loc.name}
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>备注 (可选)</label>
                        <textarea
                            className="input"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="想去的景点、餐厅等..."
                            style={{ minHeight: '100px', padding: '0.5rem' }}
                        />
                    </div>
                </div>
            ) : (
                // Upcoming/Completed: Title + Dates/Days
                <>
                    <Input
                        label="行程名称 *"
                        placeholder="例如: 2024 春节日本游"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>
                            {status === 'completed' ? '旅行日期 *' : '日期范围 (可选)'}
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <Input
                                type="date"
                                value={dates.start}
                                onChange={(e) => setDates({ ...dates, start: e.target.value })}
                                required={status === 'completed'}
                            />
                            <Input
                                type="date"
                                value={dates.end}
                                onChange={(e) => setDates({ ...dates, end: e.target.value })}
                                required={status === 'completed'}
                            />
                        </div>
                    </div>

                    {status === 'upcoming' && !dates.start && (
                        <Input
                            label="或者：仅设置天数"
                            type="number"
                            value={estimatedDays}
                            onChange={(e) => setEstimatedDays(Number(e.target.value))}
                            placeholder="例如: 5 天"
                        />
                    )}
                </>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <Button type="button" variant="secondary" onClick={() => router.back()}>取消</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? '创建中...' : '开始规划'}
                </Button>
            </div>
        </form>
    );
}
