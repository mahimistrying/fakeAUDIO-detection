import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Container from "@/components/layout/Container";
import NavBar from "@/components/layout/NavBar";
import SocketProvider from "@/providers/SocketProvider";
import { cn } from "@/lib/utils";
import { DetectionProvider } from "@/context/DetectionContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AudioGuard",
  description: "Audio Call with Deep Fake Detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={cn(inter.className, "relative")}>
          <DetectionProvider>
            <SocketProvider>
              <main className="dark flex flex-col min-h-screen bg-secondary">
                <NavBar />
                <section className="flex-grow">
                  <Container>{children}</Container>
                </section>
              </main>
            </SocketProvider>
          </DetectionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
