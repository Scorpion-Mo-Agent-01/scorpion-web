import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminUser = process.env.ADMIN_USER;
        const adminPass = process.env.ADMIN_PASS;


        if (!adminUser || !adminPass) {
          throw new Error("Server credentials not configured");
        }

        if (
          credentials?.username === adminUser &&
          credentials?.password === adminPass
        ) {
          return { id: adminUser, name: adminUser };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const typedToken = token as { id?: string; accessToken?: string };
      if (user) {
        const credentialUser = user as { id: string };
        typedToken.id = credentialUser.id;
        // Sign a JWT with the server secret for gateway auth
        typedToken.accessToken = jwt.sign({ sub: credentialUser.id }, process.env.NEXTAUTH_SECRET as string);
      }
      return typedToken;
    },
    async session({ session, token }) {
      const sessionWithToken = session as typeof session & { accessToken?: string; user: { id?: string } };
      sessionWithToken.user = sessionWithToken.user ?? {};
      if (token?.id) {
        sessionWithToken.user.id = token.id as string;
      }
      if ((token as { accessToken?: string }).accessToken) {
        sessionWithToken.accessToken = (token as { accessToken?: string }).accessToken;
      }
      return sessionWithToken;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/", // Redirect to home page for sign in
  },
});

export { handler as GET, handler as POST };
