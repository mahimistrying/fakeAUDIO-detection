"use client";

import { Home, Users, Mic } from "lucide-react";
import { useRouter } from "next/navigation";

const BottomNav = () => {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex justify-around p-4">
        {/* Home Button */}
        <button
          className="flex flex-col items-center space-y-1"
          onClick={() => router.push("/dashboard")}
        >
          <Home className="h-6 w-6 dark:text-gray-300" />
          <span className="text-xs dark:text-gray-300">Home</span>
        </button>

        {/* Online Users Button */}
        <button
          className="flex flex-col items-center space-y-1"
          onClick={() => router.push("/online-users")}
        >
          <Users className="h-6 w-6 dark:text-gray-300" />
          <span className="text-xs dark:text-gray-300">Online Users</span>
        </button>

        {/* DeepFake Detection Button */}
        <button
          className="flex flex-col items-center space-y-1"
          onClick={() => router.push("/deepfake-detection")}
        >
          <Mic className="h-6 w-6 dark:text-gray-300" />
          <span className="text-xs dark:text-gray-300">Model</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
