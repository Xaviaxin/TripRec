'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TripList } from '@/components/TripList';
import { useEffect, useState } from 'react';
import { getTrips } from '@/lib/storage';
import { Trip } from '@/lib/types';
import { useAuth } from '@/components/AuthContext';
import { loginWithGoogle, logout, getCloudTrips, syncTripToCloud } from '@/lib/firebaseUtils';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
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

  if (!mounted || authLoading) return <div className="container" style={{ padding: '2rem' }}>加载中...</div>;

  return (
    <main className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title" style={{ margin: 0, color: 'var(--color-primary)' }}>TripRec 旅行轨迹</h1>
          <p className="subtitle">走过的路和尚未踏足的远方</p>
          {syncing && <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>同步数据中...</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-surface)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              ) : (
                <UserIcon size={20} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.displayName || '旅行者'}</span>
                <button onClick={logout} style={{ fontSize: '0.75rem', color: 'var(--color-danger)', textAlign: 'left', padding: 0 }}>登出</button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={loginWithGoogle}>
              <LogIn size={18} /> Google 登录同步
            </Button>
          )}

          <Link href="/trips/new">
            <Button>+ 新建行程</Button>
          </Link>
        </div>
      </header>

      <TripList trips={trips} />
    </main>
  );
}
