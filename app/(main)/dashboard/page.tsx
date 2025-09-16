"use client";

import ListOnlineUsers from "@/components/ListOnlineUsers";
import CallNotification from "@/components/CallNotification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocket } from "@/context/SocketContext";
import AudioCall from "@/components/AudioCall";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import BottomNav from "@/components/layout/BottomNav";
import { useRouter } from "next/navigation";
import { Divide } from "lucide-react";

export default function DashboardPage() {
  const { ongoingCall } = useSocket();
  const { user } = useUser();
  const router = useRouter();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="w-full md:w-1/3">
        {/* Section 1: User Profile */}
        <CardHeader className="flex flex-col items-center">
          <Avatar />
          <CardTitle className="mt-4 text-2xl font-bold">
            Hello, {user?.firstName}!
          </CardTitle>
        </CardHeader>

        {/* Section 3: Online Users */}
        <CardContent>
          <p className="font-semibold">Online Users</p>
          <ListOnlineUsers />
        </CardContent>

        <CardContent className="mb-4">
          <p className="font-semibold mb-2">Test Deep fake Model</p>
          <Button onClick={() => router.push("/deepfake-detection")}>
            Go to DeepFake Detection
          </Button>
        </CardContent>
      </Card>

      {ongoingCall && <AudioCall />}
      <CallNotification />
      <BottomNav />
    </div>
  );
}
