// In-memory fallback database for development when MongoDB is not connected
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { ROUTE_DATA, SEATS_PER_BUS, TICKET_PRICE } from './constants';
import { getBusNumber } from './utils';

const persistedStorePath = path.join(process.cwd(), '.data', 'memory-db.json');

export interface MemoryUser {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  password: string;
  createdAt: Date;
}

export interface MemoryRoute {
  _id: string;
  routeNumber: number;
  routeName: string;
  routeCode: string;
  stops: string[];
  totalBuses: number;
  seatsPerBus: number;
  totalSeats: number;
  remarks?: string;
  isActive: boolean;
}

export interface MemoryBus {
  _id: string;
  busNumber: string;
  routeId: string;
  capacity: number;
  isActive: boolean;
}

export interface MemoryTicket {
  _id: string;
  ticketId: string;
  userId: string;
  routeId: string;
  busNumber: string;
  travelDate: Date;
  direction: 'TO_UIU' | 'FROM_UIU';
  boardingStop: string;
  seatNumber: number;
  price: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'USED';
  paymentMethod: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANKING' | 'UCAM';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  qrCode: string;
  purchasedAt: Date;
  createdAt: Date;
}

// Global in-memory cache to persist across hot-reloads
declare global {
  var memoryStore: {
    users: MemoryUser[];
    routes: MemoryRoute[];
    buses: MemoryBus[];
    tickets: MemoryTicket[];
    initialized: boolean;
    persistedLoaded: boolean;
  } | undefined;
}

if (!globalThis.memoryStore) {
  globalThis.memoryStore = {
    users: [],
    routes: [],
    buses: [],
    tickets: [],
    initialized: false,
    persistedLoaded: false,
  };
}

const store = globalThis.memoryStore;

function loadPersistedStore() {
  if (store.persistedLoaded) return;
  store.persistedLoaded = true;

  try {
    if (!fs.existsSync(persistedStorePath)) return;
    const persisted = JSON.parse(fs.readFileSync(persistedStorePath, 'utf8'));
    store.users = Array.isArray(persisted.users) ? persisted.users : [];
    store.tickets = Array.isArray(persisted.tickets) ? persisted.tickets : [];
  } catch (error) {
    console.warn('Could not load local memory DB:', error);
  }
}

function persistStore() {
  try {
    fs.mkdirSync(path.dirname(persistedStorePath), { recursive: true });
    fs.writeFileSync(
      persistedStorePath,
      JSON.stringify({ users: store.users, tickets: store.tickets }, null, 2),
      'utf8'
    );
  } catch (error) {
    console.warn('Could not persist local memory DB:', error);
  }
}

// Initialize routes and buses in memory
export function initMemoryStore() {
  loadPersistedStore();
  if (store.initialized) return;

  store.routes = ROUTE_DATA.map((r, idx) => ({
    _id: `route_${r.routeNumber}`,
    routeNumber: r.routeNumber,
    routeName: r.routeName,
    routeCode: r.routeCode,
    stops: [...r.stops],
    totalBuses: r.totalBuses,
    seatsPerBus: r.seatsPerBus,
    totalSeats: r.totalSeats,
    remarks: r.remarks || '',
    isActive: true,
  }));

  store.buses = [];
  store.routes.forEach((route) => {
    for (let i = 1; i <= route.totalBuses; i++) {
      store.buses.push({
        _id: `bus_${route.routeCode}_${i}`,
        busNumber: getBusNumber(route.routeCode, i),
        routeId: route._id,
        capacity: SEATS_PER_BUS,
        isActive: true,
      });
    }
  });

  store.initialized = true;
}

export const memoryDb = {
  async findUserByEmailOrStudentId(email: string, studentId: string): Promise<MemoryUser | null> {
    initMemoryStore();
    const cleanEmail = email.toLowerCase().trim();
    const cleanStudentId = studentId.trim();
    return store.users.find(u => u.email.toLowerCase() === cleanEmail || u.studentId === cleanStudentId) || null;
  },

  async findUserByStudentId(studentId: string): Promise<MemoryUser | null> {
    initMemoryStore();
    return store.users.find(u => u.studentId === studentId.trim()) || null;
  },

  async createUser(data: { name: string; email: string; studentId: string; password: string }): Promise<MemoryUser> {
    initMemoryStore();
    const newUser: MemoryUser = {
      _id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      studentId: data.studentId.trim(),
      password: data.password,
      createdAt: new Date(),
    };
    store.users.push(newUser);
    persistStore();
    return newUser;
  },

  async getRoutes(): Promise<MemoryRoute[]> {
    initMemoryStore();
    return store.routes;
  },

  async getRouteById(routeId: string): Promise<MemoryRoute | null> {
    initMemoryStore();
    return store.routes.find(r => r._id === routeId || r.routeNumber.toString() === routeId) || null;
  },

  async countBookedSeats(routeId: string, travelDate: Date): Promise<number> {
    initMemoryStore();
    const start = new Date(travelDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return store.tickets.filter(t => 
      (t.routeId === routeId) &&
      (new Date(t.travelDate) >= start && new Date(t.travelDate) < end) &&
      t.status !== 'CANCELLED'
    ).length;
  },

  async getBookedSeatNumbers(routeId: string, travelDate: Date): Promise<number[]> {
    initMemoryStore();
    const start = new Date(travelDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return store.tickets
      .filter(t =>
        t.routeId === routeId &&
        new Date(t.travelDate) >= start &&
        new Date(t.travelDate) < end &&
        t.status !== 'CANCELLED'
      )
      .map(t => t.seatNumber);
  },

  async isSeatBooked(routeId: string, travelDate: Date, seatNumber: number): Promise<boolean> {
    const bookedSeats = await memoryDb.getBookedSeatNumbers(routeId, travelDate);
    return bookedSeats.includes(seatNumber);
  },

  async createTicket(ticketData: Omit<MemoryTicket, '_id' | 'createdAt'>): Promise<MemoryTicket> {
    initMemoryStore();
    const newTicket: MemoryTicket = {
      ...ticketData,
      _id: `ticket_${Date.now()}`,
      createdAt: new Date(),
    };
    store.tickets.push(newTicket);
    persistStore();
    return newTicket;
  },

  async getUserTickets(userId: string, status?: string): Promise<any[]> {
    initMemoryStore();
    let tickets = store.tickets.filter(t => t.userId === userId);
    if (status && status !== 'ALL') {
      tickets = tickets.filter(t => t.status === status);
    }
    return tickets.map(t => {
      const route = store.routes.find(r => r._id === t.routeId);
      return {
        ...t,
        routeId: route ? { routeName: route.routeName, routeCode: route.routeCode, routeNumber: route.routeNumber, stops: route.stops } : null,
      };
    }).sort((a, b) => new Date(b.travelDate).getTime() - new Date(a.travelDate).getTime());
  },

  async getTicketById(ticketId: string, userId: string): Promise<any | null> {
    initMemoryStore();
    const ticket = store.tickets.find(t => t.ticketId === ticketId && t.userId === userId);
    if (!ticket) return null;
    const route = store.routes.find(r => r._id === ticket.routeId);
    return {
      ...ticket,
      routeId: route ? { routeName: route.routeName, routeCode: route.routeCode, routeNumber: route.routeNumber, stops: route.stops } : null,
    };
  },

  async cancelTicket(ticketId: string, userId: string, paymentStatus: 'PAID' | 'REFUNDED' = 'REFUNDED'): Promise<MemoryTicket | null> {
    initMemoryStore();
    const ticket = store.tickets.find(t => t.ticketId === ticketId && t.userId === userId);
    if (!ticket) return null;
    ticket.status = 'CANCELLED';
    ticket.paymentStatus = paymentStatus;
    persistStore();
    return ticket;
  }
};
