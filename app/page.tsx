"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function Home() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [userId, isLoaded, router]);

  if (!isLoaded || userId) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
      <div className="max-w-3xl px-4 space-y-8">
        <Shield className="w-16 h-16 mx-auto dark:text-gray-300" />
        <h1 className="text-5xl text-pr font-bold tracking-tight">
          Welcome to AudioGuard
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Secure audio calls with real-time deep fake detection. Protect your
          conversations and ensure authenticity.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push("/sign-up")}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
