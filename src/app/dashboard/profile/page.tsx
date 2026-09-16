'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Camera, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

type Profile = {
  name: string;
  email: string;
  studentId: string;
  image: string | null;
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load profile');
        setProfile(data.profile);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage('');
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const response = await fetch('/api/profile', { method: 'PATCH', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update profile picture');
      setProfile(data.profile);
      setSelectedFile(null);
      setPreview('');
      setMessage('Profile picture updated successfully.');
      await update({ image: data.profile.image });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to update profile picture');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/profile', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to remove profile picture');
      setProfile(data.profile);
      setSelectedFile(null);
      setPreview('');
      setMessage('Profile picture removed successfully.');
      await update({ image: null });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to remove profile picture');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  const currentProfile = profile || {
    name: session?.user?.name || 'Student',
    email: session?.user?.email || '',
    studentId: session?.user?.studentId || '',
    image: session?.user?.image || null,
  };
  const avatarSource = preview || currentProfile.image || '';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F37021]">Account</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">View your UIU RideWave account details and update your picture.</p>
      </div>

      <Card className="overflow-hidden border-slate-200">
        <div className="bg-gradient-to-r from-[#1E3A5F] to-slate-900 px-6 py-8 text-white">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar size="lg" className="size-24 ring-4 ring-white/20">
              <AvatarImage src={avatarSource} alt={currentProfile.name} />
              <AvatarFallback className="bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <UserRound size={38} strokeWidth={1.5} />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{currentProfile.name}</h2>
              <p className="mt-1 text-sm text-slate-300">Student ID: {currentProfile.studentId}</p>
            </div>
          </div>
        </div>

        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400"><UserRound size={15} /> Full Name</div>
              <p className="mt-2 font-semibold text-slate-800 dark:text-white">{currentProfile.name}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400"><Mail size={15} /> Email</div>
              <p className="mt-2 truncate font-semibold text-slate-800 dark:text-white">{currentProfile.email}</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-[#F37021]" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Profile Picture</h3>
                <p className="text-xs text-slate-500">JPG, PNG or WEBP up to 2MB.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label
                htmlFor="profile-picture-upload"
                className="group relative block size-28 shrink-0 cursor-pointer rounded-full"
                aria-label="Choose profile picture"
              >
                <Avatar className="!size-28 bg-slate-200 ring-2 ring-slate-300 transition group-hover:brightness-90 dark:bg-slate-700 dark:ring-slate-600">
                  <AvatarImage src={avatarSource} alt={currentProfile.name} />
                  <AvatarFallback className="bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    <UserRound size={48} strokeWidth={1.5} />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-1 right-1 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#F37021] text-white shadow-sm dark:border-slate-900">
                  <Camera size={15} />
                </span>
                <Input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <Button onClick={handleUpload} disabled={!selectedFile || saving} className="gap-2 bg-[#F37021] text-white hover:bg-[#E85D0A]">
                <ShieldCheck size={16} /> {saving ? 'Uploading...' : 'Upload Picture'}
              </Button>
              {currentProfile.image && !preview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={saving}
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={16} /> Delete Picture
                </Button>
              )}
            </div>
            {message && <p className="mt-3 text-sm font-medium text-emerald-600">{message}</p>}
            {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
