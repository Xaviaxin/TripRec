'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Trip, TripStatus } from '@/lib/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Search, MapPin, Calendar, Clock, CheckCircle, Lightbulb, Plane } from 'lucide-react';
import clsx from 'clsx';
import { mergeTrips } from '@/lib/merge'; // Assume this file exists from previous step
import { saveTrip } from '@/lib/storage';

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div style={{ height: '400px', background: '#eee' }}>Loading Map...</div> });

interface TripListProps {
    trips: Trip[];
}

import { useI18n } from './I18nContext';

export function TripList({ trips }: TripListProps) {
    const { t } = useI18n();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | TripStatus>('all');
    const [showMap, setShowMap] = useState(false);
    const [selectedTrips, setSelectedTrips] = useState<string[]>([]); // For merge

    const filteredTrips = trips.filter(trip => {
        if (statusFilter !== 'all' && trip.status !== statusFilter) return false;
        if (search && !trip.title.toLowerCase().includes(search.toLowerCase()) && !(trip.destination || '').toLowerCase().includes(search.toLowerCase())) {
            return false;
        }
        return true;
    });

    const toggleSelect = (id: string) => {
        if (selectedTrips.includes(id)) {
            setSelectedTrips(prev => prev.filter(t => t !== id));
        } else {
            setSelectedTrips(prev => [...prev, id]);
        }
    };

    const handleMerge = () => {
        if (selectedTrips.length < 2) return;
        const tripsToMerge = trips.filter(t => selectedTrips.includes(t.id));
        const newTitle = prompt(t('mergePrompt'), tripsToMerge[0].title + " Merged");
        if (newTitle) {
            alert(t('merging'));
        }
    };

    const getStatusLabel = (status: TripStatus) => {
        switch (status) {
            case 'inspiration': return { label: t('inspiration'), icon: <Lightbulb size={14} />, color: 'var(--color-accent)' };
            case 'upcoming': return { label: t('upcoming'), icon: <Plane size={14} />, color: 'var(--color-primary)' };
            case 'completed': return { label: t('completed'), icon: <CheckCircle size={14} />, color: 'var(--color-success)' };
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                {/* Status Tabs - Primary focus */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <Button variant={statusFilter === 'all' ? 'primary' : 'secondary'} onClick={() => setStatusFilter('all')}>{t('all')}</Button>
                    <Button variant={statusFilter === 'inspiration' ? 'primary' : 'secondary'} onClick={() => setStatusFilter('inspiration')}>{t('inspiration')}</Button>
                    <Button variant={statusFilter === 'upcoming' ? 'primary' : 'secondary'} onClick={() => setStatusFilter('upcoming')}>{t('upcoming')}</Button>
                    <Button variant={statusFilter === 'completed' ? 'primary' : 'secondary'} onClick={() => setStatusFilter('completed')}>{t('completed')}</Button>
                </div>

                {/* Secondary Controls: Search and Map Toggle */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', zIndex: 1 }} />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                marginBottom: 0,
                                paddingLeft: '3rem',
                                height: '50px',
                                borderRadius: '25px',
                                border: '2px solid var(--color-primary)',
                                boxShadow: '0 2px 10px rgba(37, 99, 235, 0.1)'
                            }}
                        />
                    </div>
                    <Button variant="secondary" onClick={() => setShowMap(!showMap)}>
                        {showMap ? t('hideMap') : t('showMap')}
                    </Button>
                </div>

                {showMap && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <MapView trips={filteredTrips} />
                    </div>
                )}
            </div>

            {filteredTrips.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p className="subtitle" style={{ marginBottom: '1.5rem' }}>{t('noTripsFound')}</p>
                    <Link href="/trips/new">
                        <Button>{t('createFirstTrip')}</Button>
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredTrips.map((trip) => {
                        const statusInfo = getStatusLabel(trip.status);
                        return (
                            <Link href={`/trips/${trip.id}`} key={trip.id} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: 0, overflow: 'hidden', position: 'relative' }}>
                                <div style={{ height: '70px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', padding: '0.75rem', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <span style={{ background: statusInfo.color, color: 'white', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            {statusInfo.icon} {statusInfo.label}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={12} /> {trip.days.length} {t('days')}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <MapPin size={14} className="text-primary" />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {trip.destination || t('setDestination')}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trip.title}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                        <Calendar size={14} />
                                        <span>{trip.startDate ? new Date(trip.startDate).toLocaleDateString() : t('dateNotSet')}</span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
