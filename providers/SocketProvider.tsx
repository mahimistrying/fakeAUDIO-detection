"use client";

import { SocketContextProvider } from "@/context/SocketContext";

interface CartProviderProps {
    children: React.ReactNode;
}

const SocketProvider: React.FC<CartProviderProps> = ({ children }) => {
    return <SocketContextProvider>{children}</SocketContextProvider>;
};

export default SocketProvider;
