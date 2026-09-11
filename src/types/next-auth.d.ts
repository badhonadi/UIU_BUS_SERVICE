import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      studentId: string;
    };
  }

  interface User {
    studentId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    studentId?: string;
  }
}
