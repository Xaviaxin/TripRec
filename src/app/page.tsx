'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TripList } from '@/components/TripList';
import { useEffect, useState } from 'react';
import { getTrips } from '@/lib/storage';
import { Trip } from '@/lib/types';
import { useAuth } from '@/components/AuthContext';
import { loginWithGoogle, logout, getCloudTrips, syncTripToCloud } from '@/lib/firebaseUtils';
import { LogIn, User as UserIcon } from 'lucide-react';
import { useI18n } from '@/components/I18nContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setMounted(true);

    const loadTrips = async () => {
      const localTrips = getTrips();

      if (user) {
        setSyncing(true);
        try {
          // Fetch cloud trips
          const cloudTrips = await getCloudTrips(user.uid);

          // Simple Merge: Local trips not in cloud get uploaded
          for (const local of localTrips) {
            if (!cloudTrips.some(c => c.id === local.id)) {
              await syncTripToCloud(local, user.uid);
              cloudTrips.push(local);
            }
          }

          setTrips(cloudTrips);
        } catch (error) {
          console.error("Cloud sync failed:", error);
          setTrips(localTrips);
        } finally {
          setSyncing(false);
        }
      } else {
        setTrips(localTrips);
      }
    };

    if (mounted || (!authLoading)) {
      loadTrips();
    }
  }, [user, mounted, authLoading]);

  if (!mounted || authLoading) return <div className="container" style={{ padding: '2rem' }}>{t('loading')}</div>;

  return (
    <main className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title" style={{ margin: 0, color: 'var(--color-primary)' }}>{t('appName')}</h1>
          <p className="subtitle">{t('appSubtitle')}</p>
          {syncing && <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{t('syncing')}</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {user ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'var(--color-surface)',
              padding: '0 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              height: '42px'
            }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
              ) : (
                <UserIcon size={16} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.displayName || t('visitor')}</span>
                <button onClick={logout} style={{ fontSize: '0.75rem', color: 'var(--color-danger)', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}>{t('logout')}</button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={loginWithGoogle} style={{ height: '42px', padding: '0 1rem' }}>
              <LogIn size={18} /> {t('loginGoogle')}
            </Button>
          )}

          <div style={{ height: '42px', display: 'flex', alignItems: 'center' }}>
            <LanguageSwitcher />
          </div>

          <Link href="/trips/new">
            <Button style={{ height: '42px', padding: '0 1.25rem' }}>{t('newTrip')}</Button>
          </Link>
        </div>
      </header>

      <TripList trips={trips} />
    </main>
  );
}
