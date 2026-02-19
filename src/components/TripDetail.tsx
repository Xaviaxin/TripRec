'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trip, Activity, DayPlan, Location } from '@/lib/types';
import { getTrip, saveTrip, deleteTrip } from '@/lib/storage';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { DayItem } from './DayItem';
import { searchLocation } from '@/lib/geocoding';
import { useAuth } from './AuthContext';
import { syncTripToCloud, deleteCloudTrip, getCloudTrip } from '@/lib/firebaseUtils';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Trash2, Check, ArrowRight, Edit2, X, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div style={{ height: '300px', background: '#eee', borderRadius: 'var(--radius-md)' }}>Loading Map...</div> });

export function TripDetail({ id }: { id: string }) {
    const router = useRouter();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const { user } = useAuth();

    // Header Edit State
    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    // Multiple destinations logic
    const [tripLocations, setTripLocations] = useState<Location[]>([]);
    const [destQuery, setDestQuery] = useState('');
    const [destResults, setDestResults] = useState<Location[]>([]);

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
        if (confirm('确定要删除这个行程吗？')) {
            deleteTrip(id);
            if (user) await deleteCloudTrip(id);
            router.push('/');
        }
    };

    const handleStatusChange = async (newStatus: 'upcoming' | 'completed') => {
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

        const updatedTrip = {
            ...trip,
            title: editTitle,
            destination: destString,
            locations: tripLocations,
            destinationLocation: tripLocations.length > 0 ? tripLocations[0] : undefined
        };
        setTrip(updatedTrip);
        saveTrip(updatedTrip);
        if (user) await syncTripToCloud(updatedTrip, user.uid);
        setIsEditingHeader(false);
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>加载中...</div>;

    if (notFound || !trip) return (
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 className="title">未找到行程</h2>
            <p style={{ marginBottom: '1rem' }}>该行程可能已被删除或ID不正确。</p>
            <Link href="/">
                <Button>返回首页</Button>
            </Link>
        </div>
    );

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} /> 返回列表
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        {!isEditingHeader ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h1 className="title" style={{ marginBottom: '0.5rem' }}>{trip.title}</h1>
                                    <button onClick={() => setIsEditingHeader(true)} style={{ color: 'var(--color-text-muted)', cursor: 'pointer', border: 'none', background: 'none' }}>
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={18} />
                                        <span>{trip.destination || '未设置目的地'}</span>
                                    </div>
                                    {trip.status !== 'inspiration' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={18} />
                                            <span>{trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '日期未定'} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : ''}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={18} />
                                        <span>{trip.days.length} 天</span>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.85rem',
                                        background: trip.status === 'upcoming' ? 'var(--color-primary)' : trip.status === 'completed' ? 'var(--color-success)' : 'var(--color-accent)',
                                        color: 'white'
                                    }}>
                                        {trip.status === 'inspiration' ? '灵感' : trip.status === 'upcoming' ? '待出行' : '已出行'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <Input label="行程名称" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                                </div>
                                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                        目的地 (可添加多个)
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
                                        placeholder="搜索并添加目的地..."
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
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <Button onClick={saveHeaderChanges}>保存</Button>
                                    <Button variant="secondary" onClick={() => setIsEditingHeader(false)}>取消</Button>
                                </div>
                            </div>
                        )}

                        {trip.notes && !isEditingHeader && (
                            <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                备注: {trip.notes}
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {trip.status === 'inspiration' && (
                            <Button onClick={() => handleStatusChange('upcoming')}>
                                转为待出行 <ArrowRight size={16} />
                            </Button>
                        )}
                        {trip.status === 'upcoming' && (
                            <Button onClick={() => handleStatusChange('completed')} style={{ background: 'var(--color-success)' }}>
                                完成行程 <Check size={16} />
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {trip.days.map(day => (
                    <DayItem
                        key={day.id}
                        day={day}
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
