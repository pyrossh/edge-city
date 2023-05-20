// import NextAuth from "next-auth";
// import EmailProvider from "next-auth/providers/email";
// import GoogleProvider from "next-auth/providers/google";
// import DrizzleAuthAdapterPG from "drizzle-auth-adaptor-pg";
// import db from "@/db";

// GET /api/auth/signin
// POST /api/auth/signin/:provider
// GET/POST /api/auth/callback/:provider
// GET /api/auth/signout
// POST /api/auth/signout
// GET /api/auth/session
// GET /api/auth/csrf
// GET /api/auth/providers

// NEXTAUTH_SECRET="This is an example"
// NEXTAUTH_URL

// import { SessionProvider } from "next-auth/react"
// export default function App({
//   Component,
//   pageProps: { session, ...pageProps },
// }) {
//   return (
//     <SessionProvider session={session}>
//       <Component {...pageProps} />
//     </SessionProvider>
//   )
// }

// const handler = NextAuth({
//   adapter: DrizzleAuthAdapterPG(db),
//   providers: [
//     EmailProvider({
//       server: {
//         host: process.env.SMTP_HOST,
//         port: Number(process.env.SMTP_PORT),
//         auth: {
//           user: process.env.SMTP_USER,
//           pass: process.env.SMTP_PASSWORD,
//         },
//       },
//       from: process.env.EMAIL_FROM,
//     }),
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     }),
//   ],
// });
