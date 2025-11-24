import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { UserProvider } from "@/components/UserProvider";

const gtEesti = localFont({
  src: [
    {
      path: "../public/GT-Eesti/GT-Eesti-Text-Regular-Trial.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/GT-Eesti/GT-Eesti-Text-Medium-Trial.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/GT-Eesti/GT-Eesti-Text-Bold-Trial.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/GT-Eesti/GT-Eesti-Display-Regular-Trial.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/GT-Eesti/GT-Eesti-Display-Medium-Trial.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/GT-Eesti/GT-Eesti-Display-Bold-Trial.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-gt-eesti",
  display: "swap",
});

export const metadata: Metadata = {
  title: "🎁 'Js{tz} the Season! 🌲🧑‍🎄",
  description: "Jstz Hackathon 2025 - Build, Create, Win",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${gtEesti.variable} font-sans antialiased bg-[#0c0c0c] text-white min-h-screen`}
      >
        <UserProvider>
          <Nav />
          <main className="relative z-10">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
