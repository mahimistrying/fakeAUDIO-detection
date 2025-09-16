"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Home, Activity, ShieldCheck, ShieldAlert } from "lucide-react";
import { useDetection } from "@/context/DetectionContext";
import { useEffect } from "react";

const CallSummaryPage = () => {
  const router = useRouter();
  const { detectionResults, callStartTime, callEndTime, clearResults } =
    useDetection();

  useEffect(() => {
    if (!callEndTime || detectionResults.length === 0) {
      router.push("/dashboard");
    }

    // Clear results when navigating away
    return () => {
      clearResults();
    };
  }, [callEndTime, detectionResults.length, router, clearResults]);

  const getScaledProgress = (value: number): number => {
    const scaled = ((value - 0.5) / 0.4) * 100;
    return Math.max(0, Math.min(100, scaled));
  };

  const getAverageRisk = () => {
    const total = detectionResults.reduce(
      (acc, result) => acc + result.deepfake_probability,
      0
    );
    return total / detectionResults.length;
  };

  const getConfidenceLabel = (probability: number): string => {
    if (probability > 0.75) return "Very High Risk";
    if (probability > 0.7) return "High Risk";
    if (probability > 0.65) return "Moderate Risk";
    if (probability > 0.6) return "Low Risk";
    return "Minimal Risk";
  };

  if (!callStartTime || !callEndTime) return null;

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Call Analysis Summary</span>
            <span className="text-sm font-medium">
              {new Date(callEndTime).toLocaleTimeString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Analysis */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Risk Level</span>
              <span className="font-medium">
                {getConfidenceLabel(getAverageRisk())}
              </span>
            </div>
            <Progress
              value={getScaledProgress(getAverageRisk())}
              className="h-2"
            />
          </div>

          {/* Detection Results */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Detection History ({detectionResults.length})
            </h3>
            <div className="space-y-2">
              {detectionResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.deepfake_probability < 0.65 ? (
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{result.prediction_score}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={getScaledProgress(result.deepfake_probability)}
                    className="w-24 h-1.5"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallSummaryPage;
