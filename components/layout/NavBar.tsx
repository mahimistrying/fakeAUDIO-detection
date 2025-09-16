"use client";

import { UserButton, useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import Container from "./Container";
import { Shield, Video } from "lucide-react";

const NavBar = () => {
  const router = useRouter();
  const { userId } = useAuth();
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut(() => router.push("/"));
  };

  return (
    <div className="sticky top-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <Container>
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Shield className="dark:text-gray-300 h-6 w-6" />
          </div>
          <div className="flex gap-4 items-center">
            {userId ? (
              <>
                <UserButton afterSignOutUrl="/" />
                <Button
                  onClick={handleLogout}
                  variant="secondary"
                  size="sm"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => router.push("/sign-in")}
                  size="sm"
                >
                  Sign in
                </Button>
                <Button
                  onClick={() => router.push("/sign-up")}
                  variant="secondary"
                  size="sm"
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default NavBar;
