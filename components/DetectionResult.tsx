"use client";

import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetectionResultProps {
  probability: number;
  prediction_score: string;
  confidence_metrics: {
    average_probability: number;
    max_probability: number;
  };
}

const DetectionResult = ({
  probability,
  prediction_score,
  confidence_metrics,
}: DetectionResultProps) => {
  const getStatusColor = (score: string): string => {
    switch (score) {
      case "Likely Real":
        return "bg-green-50 border-green-200 text-green-700";
      case "Possibly Real":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "Uncertain":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "Possibly Fake":
        return "bg-orange-50 border-orange-200 text-orange-700";
      case "Likely Fake":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getProgressColor = (score: string): string => {
    switch (score) {
      case "Likely Real":
        return "bg-green-500";
      case "Possibly Real":
        return "bg-emerald-500";
      case "Uncertain":
        return "bg-yellow-500";
      case "Possibly Fake":
        return "bg-orange-500";
      case "Likely Fake":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (score: string) => {
    if (score.includes("Real")) {
      return <ShieldCheck className="h-4 w-4" />;
    } else if (score.includes("Fake")) {
      return <ShieldAlert className="h-4 w-4" />;
    }
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getRiskPercentage = (value: number): number => {
    // Scale from 0.5-0.7 to 0-100
    const minVal = 0.5;
    const maxVal = 0.7;

    // Clamp the input value between minVal and maxVal
    const clampedValue = Math.min(Math.max(value, minVal), maxVal);

    // Calculate percentage
    const percentage = ((clampedValue - minVal) / (maxVal - minVal)) * 100;

    // Round to one decimal place
    return Math.round(percentage * 10) / 10;
  };

  const getDisplayRisk = (value: number): number => {
    if (value <= 0.5) return 0;
    if (value >= 0.7) return 100;
    return getRiskPercentage(value);
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors duration-300",
        getStatusColor(prediction_score)
      )}
    >
      {/* Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>{getStatusIcon(prediction_score)}</span>
          <span className="font-medium text-sm">{prediction_score}</span>
        </div>
        <div className="text-xs font-medium">
          Risk Level: {getDisplayRisk(probability)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <Progress
          value={getDisplayRisk(probability)}
          className="h-1.5"
        >
          <div
            className={cn(
              "h-full transition-all",
              getProgressColor(prediction_score)
            )}
            style={{
              width: `${getDisplayRisk(probability)}%`,
              borderRadius: "inherit",
            }}
          />
        </Progress>
        <div className="flex justify-between text-[10px] opacity-70">
          <span>Authentic</span>
          <span>Synthetic</span>
        </div>
      </div>
    </div>
  );
};

export default DetectionResult;
