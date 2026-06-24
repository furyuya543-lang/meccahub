import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      image: string;
      steamId: string;
    };
  }

  interface User {
    id: string;
    name: string;
    image: string;
    steamId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    steamId: string;
    userId: string;
  }
}
