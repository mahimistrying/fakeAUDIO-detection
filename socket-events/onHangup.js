import { io } from "../server.js";

const onHangup = async (hangupData) => {
  let socketIdToEmitTo;
  if (
    hangupData.ongoingCall.participants.caller.userId ===
    hangupData.userHangingupId
  ) {
    socketIdToEmitTo = hangupData.ongoingCall.participants.receiver.socketId;
  } else {
    socketIdToEmitTo = hangupData.ongoingCall.participants.caller.socketId;
  }

  if (socketIdToEmitTo) {
    io.to(socketIdToEmitTo).emit("hangup");
  }
};

export default onHangup;
