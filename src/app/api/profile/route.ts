import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { memoryDb } from '@/lib/memory-db';

export const dynamic = 'force-dynamic';
const useMemoryDb = process.env.NODE_ENV !== 'production' && !process.env.MONGODB_URI;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function toProfile(user: { name: string; email: string; studentId: string; image?: string | null }) {
  return {
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    image: user.image || null,
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (useMemoryDb) {
      const user = await memoryDb.getUserById(session.user.id);
      if (!user) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      return NextResponse.json({ profile: toProfile(user) });
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id).select('name email studentId image');
    if (!user) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    return NextResponse.json({ profile: toProfile(user) });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const image = formData.get('image');
    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'Please choose an image to upload' }, { status: 400 });
    }
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }
    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image must be smaller than 2MB' }, { status: 400 });
    }

    const imageData = `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString('base64')}`;

    if (useMemoryDb) {
      const user = await memoryDb.updateUserImage(session.user.id, imageData);
      if (!user) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      return NextResponse.json({ message: 'Profile picture updated', profile: toProfile(user) });
    }

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { image: imageData },
      { new: true, runValidators: true }
    ).select('name email studentId image');
    if (!user) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    return NextResponse.json({ message: 'Profile picture updated', profile: toProfile(user) });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (useMemoryDb) {
      const user = await memoryDb.updateUserImage(session.user.id, null);
      if (!user) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      return NextResponse.json({ message: 'Profile picture removed', profile: toProfile(user) });
    }

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $unset: { image: 1 } },
      { new: true, runValidators: true }
    ).select('name email studentId image');
    if (!user) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    return NextResponse.json({ message: 'Profile picture removed', profile: toProfile(user) });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    return NextResponse.json({ error: 'Failed to remove profile picture' }, { status: 500 });
  }
}
