import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { memoryDb } from '@/lib/memory-db';
import { authConfig } from '@/auth.config';

const useMemoryDb = process.env.NODE_ENV !== 'production' && !process.env.MONGODB_URI;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        studentId: { label: 'Student ID', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const studentId = (credentials?.studentId as string)?.trim();
        const password = credentials?.password as string;

        if (!studentId || !password) {
          throw new Error('Student ID and password are required');
        }

        let userRecord: { id: string; name: string; email: string; studentId: string; passwordHash: string } | null = null;

        // Try MongoDB connection first
        try {
          const conn = await connectToDatabase();
          if (conn && conn.connection && conn.connection.readyState === 1) {
            const mongoUser = await User.findOne({ studentId });
            if (mongoUser) {
              userRecord = {
                id: mongoUser._id.toString(),
                name: mongoUser.name,
                email: mongoUser.email,
                studentId: mongoUser.studentId,
                passwordHash: mongoUser.password,
              };
            }
          }
        } catch (err) {
          console.warn('MongoDB query failed during auth, using memory DB:', err);
        }

        if (!useMemoryDb && !userRecord) {
          throw new Error('Account service is unavailable. Please configure MONGODB_URI.');
        }

        // Memory storage is intended only for local development.
        if (!userRecord) {
          const memUser = await memoryDb.findUserByStudentId(studentId);
          if (memUser) {
            userRecord = {
              id: memUser._id,
              name: memUser.name,
              email: memUser.email,
              studentId: memUser.studentId,
              passwordHash: memUser.password,
            };
          }
        }

        if (!userRecord) {
          throw new Error('No account found with this Student ID');
        }

        const isPasswordValid = await bcrypt.compare(password, userRecord.passwordHash);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          studentId: userRecord.studentId,
        };
      },
    }),
  ],
});
