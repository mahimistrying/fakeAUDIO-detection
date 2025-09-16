"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface DetectionResult {
  timestamp: string;
  prediction_score: string;
  deepfake_probability: number;
  confidence_metrics: {
    average_probability: number;
    max_probability: number;
  };
}

interface DetectionContextType {
  detectionResults: DetectionResult[];
  addResult: (result: DetectionResult) => void;
  clearResults: () => void;
  callStartTime: Date | null;
  callEndTime: Date | null;
  setCallStart: () => void;
  setCallEnd: () => void;
}

const DetectionContext = createContext<DetectionContextType | null>(null);

export const DetectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>(
    []
  );
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callEndTime, setCallEndTime] = useState<Date | null>(null);

  const addResult = useCallback((result: DetectionResult) => {
    setDetectionResults((prev) => [
      ...prev,
      {
        ...result,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const clearResults = useCallback(() => {
    setDetectionResults([]);
    setCallStartTime(null);
    setCallEndTime(null);
  }, []);

  const setCallStart = useCallback(() => {
    setCallStartTime(new Date());
  }, []);

  const setCallEnd = useCallback(() => {
    setCallEndTime(new Date());
  }, []);

  return (
    <DetectionContext.Provider
      value={{
        detectionResults,
        addResult,
        clearResults,
        callStartTime,
        callEndTime,
        setCallStart,
        setCallEnd,
      }}
    >
      {children}
    </DetectionContext.Provider>
  );
};

export const useDetection = () => {
  const context = useContext(DetectionContext);
  if (!context) {
    throw new Error("useDetection must be used within a DetectionProvider");
  }
  return context;
};
