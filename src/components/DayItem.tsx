import { DayPlan, Activity, Location } from '@/lib/types';
import { Button } from './ui/Button';
import { useState } from 'react';
import { Input } from './ui/Input';
import { MapPin, Sun, X } from 'lucide-react';
import { searchLocation } from '@/lib/geocoding';
import { useI18n } from './I18nContext';

interface DayItemProps {
    day: DayPlan;
    dayIndex: number;
    isCompletedMode: boolean;
    onAddActivity: (dayId: string, activity: Activity) => void;
    onRemoveActivity: (dayId: string, activityId: string) => void;
    onUpdateDay: (dayId: string, updates: Partial<DayPlan>) => void;
}

export function DayItem({ day, dayIndex, isCompletedMode, onAddActivity, onRemoveActivity, onUpdateDay }: DayItemProps) {
    const { t } = useI18n();
    const [isAdding, setIsAdding] = useState(false);
    const [newActivity, setNewActivity] = useState('');

    // Weather Edit
    const [isEditingWeather, setIsEditingWeather] = useState(false);
    const [weatherInput, setWeatherInput] = useState('');
    const [editingLoc, setEditingLoc] = useState(false);
    const [locSearch, setLocSearch] = useState('');
    const [locResults, setLocResults] = useState<Location[]>([]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newActivity.trim()) return;

        onAddActivity(day.id, {
            id: crypto.randomUUID(),
            description: newActivity,
        });
        setNewActivity('');
        setIsAdding(false);
    };

    const handleSearchLoc = async (q: string) => {
        setLocSearch(q);
        if (q.length > 2) {
            const res = await searchLocation(q);
            setLocResults(res);
        } else {
            setLocResults([]);
        }
    };

    const addLocation = (loc: Location) => {
        const currentLocs = day.locations || (day.location ? [day.location] : []);
        if (currentLocs.some(l => l.id === loc.id)) return;

        onUpdateDay(day.id, {
            locations: [...currentLocs, loc],
            location: undefined // Clear deprecated single location
        });
        setEditingLoc(false);
        setLocResults([]);
        setLocSearch('');
    };

    const removeLocation = (locId: string) => {
        const currentLocs = day.locations || (day.location ? [day.location] : []);
        onUpdateDay(day.id, {
            locations: currentLocs.filter(l => l.id !== locId)
        });
    };

    const saveWeather = () => {
        onUpdateDay(day.id, { weather: weatherInput });
        setIsEditingWeather(false);
    };

    const startEditWeather = () => {
        setWeatherInput(day.weather || '');
        setIsEditingWeather(true);
    };

    return (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('day')} {dayIndex + 1}</h3>
                        {day.date && (
                            <span style={{ color: 'var(--color-text-muted)' }}>{new Date(day.date).toLocaleDateString()}</span>
                        )}
                    </div>

                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <MapPin size={16} color="var(--color-primary)" />

                        {(day.locations || (day.location ? [day.location] : [])).map(loc => (
                            <span key={loc.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>
                                {loc.name}
                                <button onClick={() => removeLocation(loc.id)} style={{ cursor: 'pointer', display: 'flex', color: 'inherit', border: 'none', background: 'none', padding: 0 }}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}

                        {editingLoc ? (
                            <div style={{ position: 'relative' }}>
                                <input
                                    autoFocus
                                    className="input"
                                    style={{ padding: '0.25rem', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                    value={locSearch}
                                    onChange={e => handleSearchLoc(e.target.value)}
                                    placeholder={t('searchPlaceholder')}
                                />
                                {locResults.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, width: '200px', background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', zIndex: 10, boxShadow: 'var(--shadow-md)' }}>
                                        {locResults.map(loc => (
                                            <div key={loc.id} onClick={() => addLocation(loc)} style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                                {loc.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setEditingLoc(true)}
                                style={{ color: 'var(--color-primary)', fontSize: '0.85rem', cursor: 'pointer', border: 'none', background: 'none', padding: 0, textDecoration: 'underline' }}
                            >
                                + {t('addLocation')}
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* Weather Editable */}
            {isCompletedMode && (
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    <Sun size={16} />
                    {isEditingWeather ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Input
                                autoFocus
                                value={weatherInput}
                                onChange={e => setWeatherInput(e.target.value)}
                                style={{ width: '150px', padding: '0.25rem', marginBottom: 0 }}
                                placeholder={t('weather')}
                            />
                            <Button size="sm" onClick={saveWeather}>{t('confirm')}</Button>
                        </div>
                    ) : (
                        <span onClick={startEditWeather} style={{ cursor: 'pointer', borderBottom: '1px dashed var(--color-border)' }}>
                            {t('weather')}: {day.weather || t('clickToModify')}
                        </span>
                    )}
                </div>
            )}


            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {day.activities.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>{t('noActivities')}</p>
                ) : (
                    day.activities.map((act) => (
                        <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.75rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.95rem' }}>{act.description}</div>
                            </div>
                            <button
                                onClick={() => onRemoveActivity(day.id, act.id)}
                                style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem', lineHeight: 1, border: 'none', background: 'none', cursor: 'pointer' }}
                                aria-label="Remove activity"
                            >
                                ×
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div style={{ marginTop: '1rem' }}>
                {!isAdding ? (
                    <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)} style={{ width: '100%', fontSize: '0.85rem' }}>+ {t('addActivity')}</Button>
                ) : (
                    <form onSubmit={handleAdd} style={{ marginTop: '0.5rem', background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <Input
                                placeholder={t('activityDescription')}
                                value={newActivity}
                                onChange={e => setNewActivity(e.target.value)}
                                required
                                style={{ marginBottom: 0 }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <Button type="button" variant="secondary" size="sm" onClick={() => setIsAdding(false)}>{t('cancel')}</Button>
                            <Button type="submit" size="sm">{t('confirm')}</Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
