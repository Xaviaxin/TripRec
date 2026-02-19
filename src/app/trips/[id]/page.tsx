import { TripDetail } from '@/components/TripDetail';

// Next.js 15+ compatible: params is a promise
export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <main className="container" style={{ padding: '2rem 1rem' }}>
            <TripDetail id={id} />
        </main>
    );
}
