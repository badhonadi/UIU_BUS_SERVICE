import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Route from '@/models/Route';
import Bus from '@/models/Bus';
import { ROUTE_DATA, SEATS_PER_BUS } from '@/lib/constants';
import { getBusNumber } from '@/lib/utils';

async function ensureMongoRoutes() {
  const routes = await Route.find({ isActive: true }).sort({ routeNumber: 1 });
  if (routes.length > 0) return routes;

  for (const routeData of ROUTE_DATA) {
    const route = await Route.create({
      ...routeData,
      stops: [...routeData.stops],
      remarks: routeData.remarks || '',
      isActive: true,
    });

    const buses = Array.from({ length: routeData.totalBuses }, (_, index) => ({
      busNumber: getBusNumber(routeData.routeCode, index + 1),
      routeId: route._id,
      capacity: SEATS_PER_BUS,
      isActive: true,
    }));
    await Bus.insertMany(buses);
  }

  return Route.find({ isActive: true }).sort({ routeNumber: 1 });
}

export async function GET() {
  try {
    try {
      const conn = await connectToDatabase();
      if (conn && conn.connection && conn.connection.readyState === 1) {
        const routes = await ensureMongoRoutes();
        return NextResponse.json({ routes });
      }
    } catch (dbErr) {
      console.warn('MongoDB routes fetch failed:', dbErr);
    }

    return NextResponse.json(
      { error: 'Route storage is unavailable. Please configure MongoDB.' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}
