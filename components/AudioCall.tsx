"use client";

import { useSocket } from "@/context/SocketContext";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import AudioVisualizer from "./AudioVisualizer";
import DetectionResult from "@/components/DetectionResult";
import { useDetection } from "@/context/DetectionContext";
import { useRouter } from "next/navigation";

const AudioCall = () => {
  const { localStream, peer, isCallEnded, ongoingCall, handleHangup } =
    useSocket();
  const [isMicOn, setIsMicOn] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [detectionResult, setDetectionResult] = useState<{
    deepfake_probability: number;
    prediction_score: string;
    confidence_metrics: {
      average_probability: number;
      max_probability: number;
    };
  } | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();
  const { addResult, setCallStart, setCallEnd } = useDetection();

  // Handle local and remote audio streams
  useEffect(() => {
    if (localStream && localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (peer?.stream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = peer.stream;
      // Start recording when remote stream is available
      setCallStart();
      startRecording(peer.stream);
    }

    // Cleanup when peer stream changes or component unmounts
    return () => {
      stopRecording();
    };
  }, [peer?.stream, setCallStart]);

  const startRecording = (stream: MediaStream) => {
    if (!stream) return;

    // Stop any existing recording
    stopRecording();

    const startNewRecording = () => {
      try {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (audioChunksRef.current.length === 0) return;

          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm;codecs=opus",
          });

          try {
            await convertToWavAndSend(audioBlob);
          } catch (error) {
            console.error("Error processing audio chunk:", error);
          }
        };

        mediaRecorder.start();
        console.log("Started recording remote stream");
      } catch (error) {
        console.error("Error starting recorder:", error);
      }
    };

    startNewRecording();

    // Set up interval to create new 5-second chunks
    recordingIntervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        startNewRecording();
      }
    }, 5000);
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  };

  const convertToWavAndSend = async (webmBlob: Blob) => {
    try {
      const audioContext = new window.AudioContext();
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const wavBuffer = audioBufferToWav(audioBuffer);
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });

      await sendAudioToServer(wavBlob);
    } catch (error) {
      console.error("Error converting audio:", error);
      // Fallback to sending original webm if conversion fails
      await sendAudioToServer(webmBlob);
    }
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, `recording_${Date.now()}.wav`);

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload audio");
      }

      const result = await response.json();
      console.log("Deep fake detection result:", result);

      setDetectionResult({
        deepfake_probability: result.deepfake_probability,
        prediction_score: result.prediction_score,
        confidence_metrics: result.confidence_metrics,
      });

      addResult({
        timestamp: new Date().toISOString(),
        deepfake_probability: result.deepfake_probability,
        prediction_score: result.prediction_score,
        confidence_metrics: result.confidence_metrics,
      });
    } catch (error) {
      console.error("Error uploading audio chunk:", error);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const handleEndCall = () => {
    stopRecording();
    setCallEnd(); 
    handleHangup({
      ongoingCall: ongoingCall ? ongoingCall : undefined,
    });
    router.push("/calls/summary");
  };

  if (isCallEnded) {
    return <div className="mt-5 text-rose-500">Call Ended</div>;
  }

  if (!localStream && !peer) return null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          In Call:
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <audio
          ref={localAudioRef}
          autoPlay
          muted
        />
        <audio
          ref={remoteAudioRef}
          autoPlay
        />

        <div className="space-y-4">
          {peer?.stream && (
            <div className="relative border rounded-lg p-4 bg-secondary/5">
              <div className="text-sm font-medium mb-2">Remote Audio</div>
              <AudioVisualizer stream={peer.stream} />
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            variant={isMicOn ? "default" : "secondary"}
            onClick={toggleAudio}
            size="icon"
            className="w-12 h-12"
          >
            {isMicOn ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={handleEndCall}
            size="icon"
            className="w-12 h-12"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>

        {detectionResult && (
          <DetectionResult
            probability={detectionResult.deepfake_probability}
            prediction_score={detectionResult.prediction_score}
            confidence_metrics={detectionResult.confidence_metrics}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer: AudioBuffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const channel = buffer.getChannelData(i);
    for (let j = 0; j < buffer.length; j++) {
      sample = Math.max(-1, Math.min(1, channel[j]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
  }

  return out;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
export default AudioCall;
