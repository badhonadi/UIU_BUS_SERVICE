import mongoose, { Schema, Document, Model } from 'mongoose';

export type TicketStatus = 'CONFIRMED' | 'CANCELLED' | 'USED';
export type PaymentMethod = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANKING' | 'UCAM';
export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED';
export type TripDirection = 'TO_UIU' | 'FROM_UIU';

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: string;
  userId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  busNumber: string;
  travelDate: Date;
  direction: TripDirection;
  boardingStop: string;
  seatNumber: number;
  price: number;
  status: TicketStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  qrCode: string;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    busNumber: {
      type: String,
      required: true,
    },
    travelDate: {
      type: Date,
      required: true,
    },
    direction: {
      type: String,
      enum: ['TO_UIU', 'FROM_UIU'],
      required: true,
    },
    boardingStop: {
      type: String,
      required: true,
    },
    seatNumber: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 100,
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'USED'],
      default: 'CONFIRMED',
    },
    paymentMethod: {
      type: String,
      enum: ['BKASH', 'NAGAD', 'ROCKET', 'BANKING', 'UCAM'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'REFUNDED'],
      default: 'PAID',
    },
    qrCode: {
      type: String,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for availability queries
TicketSchema.index({ routeId: 1, travelDate: 1, status: 1 });
TicketSchema.index({ userId: 1, travelDate: 1 });

const Ticket: Model<ITicket> = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
export default Ticket;
