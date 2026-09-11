import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBus extends Document {
  _id: mongoose.Types.ObjectId;
  busNumber: string;
  routeId: mongoose.Types.ObjectId;
  capacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusSchema = new Schema<IBus>(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 50,
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

const Bus: Model<IBus> = mongoose.models.Bus || mongoose.model<IBus>('Bus', BusSchema);
export default Bus;
