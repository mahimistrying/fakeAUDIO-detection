import { OngoingCall, Participants, PeerData, SocketUser } from "@/types";
import { useUser } from "@clerk/nextjs";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { createContext } from "react";
import { Socket, io } from "socket.io-client";
import Peer, { SignalData } from "simple-peer";
import { useRouter } from "next/navigation";

interface Props {
  [propName: string]: any;
}
interface iSocketContext {
  socket: Socket | null;
  onlineUsers: SocketUser[] | null;
  ongoingCall: OngoingCall | null;
  localStream: MediaStream | null;
  peer: PeerData | null;
  isCallEnded: boolean;
  handleCall: (user: SocketUser) => void;
  handleJoinCall: (ongoingCall: OngoingCall) => void;
  handleHangup: (data: {
    ongoingCall?: OngoingCall;
    callEnded?: boolean;
  }) => void;
  startRecording: () => void;
  stopRecording: () => void;
}

interface CallSummary {
  participantName: string;
  duration: number;
  startTime: string;
  endTime: string;
  detectionResults: Array<{
    timestamp: string;
    prediction_score: string;
    probability: number;
    confidence_metrics: {
      average_probability: number;
      max_probability: number;
    };
  }>;
}

export const SocketContext = createContext<iSocketContext | null>(null);

export const SocketContextProvider = (props: Props) => {
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<SocketUser[] | null>(null);
  const [ongoingCall, setOngoingCall] = useState<OngoingCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<PeerData | null>(null);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const router = useRouter();

  const currentSocketUser = onlineUsers?.find(
    (onlineUser) => onlineUser.userId === user?.id
  );

  const getMediaStream = useCallback(async () => {
    if (localStream) {
      return localStream;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Failed to get stream", error);
      setLocalStream(null);
      return null;
    }
  }, [localStream]);

  const onIncomingCall = useCallback(
    (participants: Participants) => {
      if (ongoingCall && socket && user) {
        socket.emit("hangup", {
          ongoingCall: {
            participants,
            isRinging: false,
          },
          userHangingupId: user.id,
        });
        return;
      }

      setOngoingCall({
        participants,
        isRinging: true,
      });
    },
    [ongoingCall, socket, user]
  );

  const addStreamToPeer = useCallback(
    (stream: MediaStream) => {
      setPeer((prevPeer) => {
        if (prevPeer) {
          processAudioStream(stream);
          return { ...prevPeer, stream };
        } else return prevPeer;
      });
    },
    [setPeer]
  );

  const createPeer = useCallback(
    (stream: MediaStream, initiator: boolean, participantUser: SocketUser) => {
      const iceServers: RTCIceServer[] = [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
          ],
        },
      ];

      const peer = new Peer({
        stream,
        initiator,
        trickle: true,
        config: { iceServers },
        offerOptions: { offerToReceiveAudio: true, offerToReceiveVideo: false },
      });
      peer.on("stream", (stream: MediaStream) => addStreamToPeer(stream));
      peer.on("error", console.error);
      peer.on("close", () => handleHangup({ callEnded: true }));

      const rtcPeerConnection: RTCPeerConnection = (peer as any)._pc;

      rtcPeerConnection.oniceconnectionstatechange = async () => {
        if (
          rtcPeerConnection.iceConnectionState === "disconnected" ||
          rtcPeerConnection.iceConnectionState === "failed"
        ) {
          handleHangup({ ongoingCall: ongoingCall });
        }
      };

      return peer;
    },
    [ongoingCall]
  );

  const completePeerConnection = useCallback(
    async (connectionData: {
      sdp: SignalData;
      ongoingCall: OngoingCall;
      isCaller: boolean;
    }) => {
      if (!localStream) {
        console.log("Missing localStream");
        return;
      }

      console.log("Peer", peer);

      if (peer) {
        peer.peerConnection?.signal(connectionData.sdp);
        return;
      }

      let participantUser;

      if (connectionData.isCaller) {
        participantUser = connectionData.ongoingCall.participants.caller;
      } else {
        participantUser = connectionData.ongoingCall.participants.receiver;
      }

      const newPeer = createPeer(localStream, true, participantUser);

      setPeer({
        peerConnection: newPeer,
        participantUser,
        stream: undefined,
      });

      newPeer.on("signal", async (data: SignalData) => {
        if (socket) {
          console.log("emit answer");
          socket.emit("webrtcSignal", {
            sdp: data,
            ongoingCall: connectionData.ongoingCall,
            isCaller: !connectionData.isCaller,
          });
        }
      });
    },
    [localStream, createPeer, peer, ongoingCall]
  );

  const handleCall = useCallback(
    async (user: SocketUser) => {
      setIsCallEnded(false);
      if (!currentSocketUser) return;
      if (ongoingCall) return alert("Already in another call");

      const stream = await getMediaStream();
      if (!stream) return;

      const participants = { caller: currentSocketUser, receiver: user };
      setOngoingCall({
        participants,
        isRinging: true,
      });
      socket?.emit("call", participants);
      router.push("/calls");
    },
    [socket, currentSocketUser, ongoingCall, router]
  );

  const handleJoinCall = useCallback(
    async (ongoingCall: OngoingCall) => {
      setIsCallEnded(false);
      setOngoingCall((prev) => {
        if (prev) {
          return { ...prev, isRinging: false };
        } else return prev;
      });

      socket?.emit("callAccepted", { ongoingCall });

      const stream = await getMediaStream();
      if (!stream) return;

      const newPeer = createPeer(
        stream!,
        true,
        ongoingCall.participants.caller
      );
      setPeer({
        peerConnection: newPeer,
        participantUser: ongoingCall.participants.caller,
        stream: undefined,
      });

      newPeer.on("signal", async (data: SignalData) => {
        if (socket) {
          socket.emit("webrtcSignal", {
            sdp: data,
            ongoingCall,
            isCaller: false,
          });
        }
      });

      router.push("/calls");
    },
    [socket, getMediaStream, router]
  );

  const startRecording = useCallback(() => {
    if (!localStream) {
      console.error("No local stream available");
      return;
    }

    const mediaRecorder = new MediaRecorder(localStream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Store in local storage
      const timestamp = new Date().toISOString();
      localStorage.setItem(`audio_${timestamp}`, audioUrl);

      console.log(`Audio stored in local storage with key: audio_${timestamp}`);

      // Reset audio chunks
      audioChunksRef.current = [];
    };

    mediaRecorder.start();
    setIsRecording(true);

    // Stop recording after 5 seconds
    setTimeout(() => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }, 5000);
  }, [localStream]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const processAudioStream = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(1024, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      // Here, you would send the inputData to your ML model for analysis
      // This is where you'd integrate your deep fake detection logic
      // For example:
      // const isDeepFake = await analyzeAudio(inputData);
      // if (isDeepFake) {
      //   alert('Potential deep fake detected!');
      // }
    };
  }, []);

  const handleHangup = useCallback(
    (data: { ongoingCall?: OngoingCall | null; callEnded?: boolean }) => {
      if (socket && user && data?.ongoingCall && !data?.callEnded) {
        socket.emit("hangup", {
          ongoingCall: data.ongoingCall,
          userHangingupId: user.id,
        });
      }

      setOngoingCall(null);
      setPeer(null);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
      setIsCallEnded(true);
      router.push("/calls/summary");
    },
    [socket, user, localStream, router]
  );

  // initialize socket
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (socket === null) return;

    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      if (socket) {
        setIsConnected(true);
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  // set online users
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("addNewUser", user);
    socket.on("getUsers", (res) => {
      setOnlineUsers(res);
    });

    return () => {
      socket.off("getUsers");
    };
  }, [socket, isConnected, user]);

  // calls
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("incomingCall", onIncomingCall);
    socket.on("webrtcSignal", completePeerConnection);
    socket.on("hangup", () => handleHangup({ callEnded: true }));

    return () => {
      socket.off("incomingCall", onIncomingCall);
      socket.off("webrtcSignal", completePeerConnection);
      socket.off("hangup", () => () => handleHangup({ callEnded: true }));
    };
  }, [
    socket,
    isConnected,
    user,
    onIncomingCall,
    completePeerConnection,
    handleHangup,
  ]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isCallEnded) {
      timeout = setTimeout(() => {
        setIsCallEnded(false);
      }, 2000);
    }

    return () => clearTimeout(timeout);
  }, [isCallEnded]);

  useEffect(() => {
    if (localStream && !isRecording) {
      const recordingInterval = setInterval(() => {
        startRecording();
      }, 5000);

      return () => clearInterval(recordingInterval);
    }
  }, [localStream, isRecording, startRecording]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        ongoingCall,
        localStream,
        peer,
        isCallEnded,
        handleCall,
        handleJoinCall,
        handleHangup,
        startRecording,
        stopRecording,
      }}
      {...props}
    />
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (context === null) {
    throw new Error("useCart must be used within a CartContextProvider");
  }

  return context;
};
