import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { memoryDb } from '@/lib/memory-db';
import { signupSchema } from '@/lib/validations';

const useMemoryDb = process.env.NODE_ENV !== 'production' && !process.env.MONGODB_URI;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, studentId, password } = validationResult.data;
    const cleanEmail = email.toLowerCase().trim();
    const cleanStudentId = studentId.trim();

    // Try MongoDB connection first
    let isMongo = false;
    try {
      const conn = await connectToDatabase();
      if (conn && conn.connection && conn.connection.readyState === 1) {
        isMongo = true;
      }
    } catch (dbErr) {
      console.warn('MongoDB connection unavailable, falling back to memory DB:', dbErr);
    }

    if (isMongo) {
      // Check existing user in MongoDB
      const existingUser = await User.findOne({
        $or: [{ email: cleanEmail }, { studentId: cleanStudentId }],
      });

      if (existingUser) {
        if (existingUser.email === cleanEmail) {
          return NextResponse.json(
            { error: 'An account with this UIU email already exists' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'An account with this Student ID already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user in MongoDB
      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        studentId: cleanStudentId,
        password: hashedPassword,
      });

      return NextResponse.json(
        {
          message: 'Account created successfully',
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            studentId: user.studentId,
          },
        },
        { status: 201 }
      );
    } else if (useMemoryDb) {
      // Fallback: In-Memory DB
      const existingUser = await memoryDb.findUserByEmailOrStudentId(cleanEmail, cleanStudentId);

      if (existingUser) {
        if (existingUser.email === cleanEmail) {
          return NextResponse.json(
            { error: 'An account with this UIU email already exists' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'An account with this Student ID already exists' },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await memoryDb.createUser({
        name: name.trim(),
        email: cleanEmail,
        studentId: cleanStudentId,
        password: hashedPassword,
      });

      return NextResponse.json(
        {
          message: 'Account created successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            studentId: user.studentId,
          },
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Account service is unavailable. Please configure MONGODB_URI.' },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('Signup error details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create account. Please check your inputs.' },
      { status: 500 }
    );
  }
}
