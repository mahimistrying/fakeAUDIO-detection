import { io } from "../server.js";

const onWebrtcSignal = async (data) => {
  if (data.isCaller) {
    if (data.ongoingCall.participants.receiver.socketId) {
      io.to(data.ongoingCall.participants.receiver.socketId).emit(
        "webrtcSignal",
        {
          sdp: data.sdp,
          ongoingCall: data.ongoingCall,
          isCaller: true,
        }
      );
    }
  } else {
    if (data.ongoingCall.participants.caller.socketId) {
      if (data.ongoingCall.participants.caller.socketId) {
        io.to(data.ongoingCall.participants.caller.socketId).emit(
          "webrtcSignal",
          {
            sdp: data.sdp,
            ongoingCall: data.ongoingCall,
            isCaller: false,
          }
        );
      }
    }
  }
};

export default onWebrtcSignal;
