import { z } from 'zod';

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long'),
    email: z
      .string()
      .email('Invalid email address')
      .refine(
        (email) => /@([a-zA-Z0-9-]+\.)*uiu\.ac\.bd$/i.test(email.trim()),
        'Must be a valid UIU email address (e.g. @uiu.ac.bd or @bscse.uiu.ac.bd)'
      ),
    studentId: z
      .string()
      .min(6, 'Student ID must be at least 6 characters')
      .max(15, 'Student ID is too long')
      .regex(/^[0-9]+$/, 'Student ID must contain only numbers'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password is too long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const bookingSchema = z.object({
  routeId: z.string().min(1, 'Please select a route'),
  travelDate: z.string().min(1, 'Please select a travel date'),
  direction: z.enum(['TO_UIU', 'FROM_UIU'], {
    message: 'Please select a direction',
  }),
  boardingStop: z.string().min(1, 'Please select a boarding stop'),
  paymentMethod: z.enum(['BKASH', 'NAGAD', 'ROCKET', 'BANKING', 'UCAM'], {
    message: 'Please select a payment method',
  }),
  seatNumber: z.number().int().min(1).max(50).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
