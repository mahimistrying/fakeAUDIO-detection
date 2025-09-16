"use client";

import { useSocket } from "@/context/SocketContext";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const ListOnlineUsers = () => {
  const { user } = useUser();
  const { onlineUsers, handleCall } = useSocket();

  return (
    <div className="w-full space-y-2">
      {onlineUsers &&
        onlineUsers.map((onlineUser) => {
          if (onlineUser.profile.id === user?.id) return null;

          return (
            <div
              key={onlineUser.profile.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-100"
            >
              {/* Avatar */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={onlineUser.profile.imageUrl} />
                  <AvatarFallback>
                    {onlineUser.profile.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Username */}
                <p className="text-sm font-medium">
                  {onlineUser.profile.fullName?.split(" ")[0]}
                </p>
              </div>

              {/* Call Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCall(onlineUser)}
                className="flex items-center"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
            </div>
          );
        })}
    </div>
  );
};

export default ListOnlineUsers;
