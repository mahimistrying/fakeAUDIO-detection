"use client";

import ListOnlineUsers from "@/components/ListOnlineUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnlineUsersPage() {
  return (
    <div className="container mx-auto p-4">
      {/* Online Users Card */}
      <Card>
        <CardHeader>
          <CardTitle>Online Users</CardTitle>
        </CardHeader>
        <CardContent>
          <ListOnlineUsers />
        </CardContent>
      </Card>
    </div>
  );
}
