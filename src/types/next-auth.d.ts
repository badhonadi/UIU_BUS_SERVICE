import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      studentId: string;
      image?: string | null;
    };
  }

  interface User {
    studentId?: string;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    studentId?: string;
  }
}
