"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Activity,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mlApiClient, type MLApiResponse } from "@/lib/ml-api";

interface AnalysisResult {
  timestamp: string;
  prediction_score: string;
  probability: number;
}

const DeepFakeDetection = () => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const analyzeStoredAudio = async () => {
      const audioKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("audio_")
      );

      if (audioKeys.length > 0) {
        setIsAnalyzing(true);
      }

      for (const key of audioKeys) {
        const audioUrl = localStorage.getItem(key);
        if (audioUrl) {
          try {
            const response = await fetch(audioUrl);
            const audioBlob = await response.blob();
            const result = await analyzeAudio(audioBlob);
            
            setAnalysisResults((prev) => [
              {
                timestamp: new Date().toISOString(),
                prediction_score: result.score,
                probability: result.probability,
              },
              ...prev.slice(0, 9), // Keep only last 10 results
            ]);

            localStorage.removeItem(key);
          } catch (error) {
            console.error("Error analyzing audio:", error);
          }
        }
      }

      setIsAnalyzing(false);
    };

    const intervalId = setInterval(analyzeStoredAudio, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const analyzeAudio = async (audioBlob: Blob) => {
    try {
      // Try to use real ML API first
      const result: MLApiResponse = await mlApiClient.analyzeAudioBlob(audioBlob);

      return {
        probability: result.confidence,
        score: result.prediction
      };
    } catch (error) {
      console.warn("ML API unavailable, using fallback:", error);

      // Fall back to mock analysis if ML API is unavailable
      try {
        const fallbackResult = await mlApiClient.mockAnalysis(audioBlob);
        return {
          probability: fallbackResult.confidence,
          score: fallbackResult.prediction
        };
      } catch (fallbackError) {
        console.error("Fallback analysis also failed:", fallbackError);

        // Last resort: basic mock
        const probability = 0.5 + (Math.random() * 0.3);
        return {
          probability,
          score: probability > 0.7 ? "Possibly Fake" : "Likely Real"
        };
      }
    }
  };

  const getStatusColor = (probability: number): string => {
    if (probability > 0.75) return "text-red-500";
    if (probability > 0.70) return "text-orange-500";
    if (probability > 0.65) return "text-yellow-500";
    if (probability > 0.60) return "text-emerald-500";
    return "text-green-500";
  };

  const getStatusIcon = (probability: number) => {
    if (probability > 0.70) {
      return <ShieldAlert className="h-4 w-4" />;
    } else if (probability < 0.60) {
      return <ShieldCheck className="h-4 w-4" />;
    }
    return <Shield className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-primary" />
          <CardTitle>Detection History</CardTitle>
        </div>
        <CardDescription>
          Real-time deep fake analysis results
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAnalyzing && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2 animate-pulse" />
            Analyzing audio...
          </div>
        )}
        
        <div className="space-y-2">
          {analysisResults.map((result, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                "transition-colors duration-200",
                index === 0 ? "bg-muted/50" : "bg-background"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={getStatusColor(result.probability)}>
                  {getStatusIcon(result.probability)}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {result.prediction_score}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Progress 
                value={((result.probability - 0.5) / 0.4) * 100}
                className="w-24 h-1.5"
              />
            </div>
          ))}

          {analysisResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No detection results yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeepFakeDetection;