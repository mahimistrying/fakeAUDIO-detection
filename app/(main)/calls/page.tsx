"use client";

import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AudioCall from "@/components/AudioCall";

export default function CallPage() {
  const { ongoingCall } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!ongoingCall) {
      router.push("/dashboard");
    }
  }, [ongoingCall, router]);

  if (!ongoingCall) return null;

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <AudioCall />
    </div>
  );
}
