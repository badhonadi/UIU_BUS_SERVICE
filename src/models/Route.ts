import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoute extends Document {
  _id: mongoose.Types.ObjectId;
  routeNumber: number;
  routeName: string;
  routeCode: string;
  stops: string[];
  totalBuses: number;
  seatsPerBus: number;
  totalSeats: number;
  remarks?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RouteSchema = new Schema<IRoute>(
  {
    routeNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    routeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    stops: {
      type: [String],
      required: true,
    },
    totalBuses: {
      type: Number,
      required: true,
    },
    seatsPerBus: {
      type: Number,
      required: true,
      default: 50,
    },
    totalSeats: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Route: Model<IRoute> = mongoose.models.Route || mongoose.model<IRoute>('Route', RouteSchema);
export default Route;
