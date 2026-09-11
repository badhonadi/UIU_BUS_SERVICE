import mongoose from 'mongoose';
import { ROUTE_DATA, SEATS_PER_BUS } from './constants';
import { getBusNumber } from './utils';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uiu-ridewave';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import models dynamically to avoid circular deps
    const Route = (await import('../models/Route')).default;
    const Bus = (await import('../models/Bus')).default;

    // Clear existing data
    await Route.deleteMany({});
    await Bus.deleteMany({});
    console.log('Cleared existing routes and buses');

    for (const routeData of ROUTE_DATA) {
      // Create route
      const route = await Route.create({
        routeNumber: routeData.routeNumber,
        routeName: routeData.routeName,
        routeCode: routeData.routeCode,
        stops: [...routeData.stops],
        totalBuses: routeData.totalBuses,
        seatsPerBus: routeData.seatsPerBus,
        totalSeats: routeData.totalSeats,
        remarks: routeData.remarks || '',
        isActive: true,
      });

      console.log(`Created route: ${route.routeName}`);

      // Create buses for this route
      for (let i = 1; i <= routeData.totalBuses; i++) {
        const busNumber = getBusNumber(routeData.routeCode, i);
        await Bus.create({
          busNumber,
          routeId: route._id,
          capacity: SEATS_PER_BUS,
          isActive: true,
        });
        console.log(`  Created bus: ${busNumber}`);
      }
    }

    console.log('\nSeeding completed successfully!');
    console.log('Routes created: 6');
    console.log('Buses created: 18');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
