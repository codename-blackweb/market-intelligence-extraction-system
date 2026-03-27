import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import SideNav from "@/components/navigation/SideNav";
import SmokeyCursor from "@/components/ui/smokey-cursor";
import "./globals.css";

export const metadata: Metadata = {
  title: "Market Intelligence Engine",
  description:
    "A lean market-intelligence workflow for demand mapping, voice-of-customer mining, competitor analysis, and synthesis."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <AuthProvider>
          <SmokeyCursor intensity={0.6} />
          <SideNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
