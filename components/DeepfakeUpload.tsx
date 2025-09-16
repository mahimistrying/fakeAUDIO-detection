"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DetectionResult from "./DetectionResult";
import { mlApiClient, type MLApiResponse } from "@/lib/ml-api";

const DeepFakeUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectionResult, setDetectionResult] = useState<{
    deepfake_probability: number;
    prediction_score: string;
    confidence_metrics: {
      average_probability: number;
      max_probability: number;
    };
  } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle form submission and file upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select an audio file first!");
      return;
    }

    try {
      setIsUploading(true);

      // Use ML API client for analysis
      const result: MLApiResponse = await mlApiClient.analyzeAudioFile(selectedFile);
      console.log("ML API Result:", result);

      setDetectionResult({
        deepfake_probability: result.confidence,
        prediction_score: result.prediction,
        confidence_metrics: {
          average_probability: result.confidence,
          max_probability: result.confidence,
        },
      });
    } catch (error) {
      console.error("Error analyzing file:", error);

      // Try fallback analysis
      try {
        const blob = new Blob([selectedFile], { type: selectedFile.type });
        const fallbackResult = await mlApiClient.mockAnalysis(blob);

        setDetectionResult({
          deepfake_probability: fallbackResult.confidence,
          prediction_score: fallbackResult.prediction,
          confidence_metrics: {
            average_probability: fallbackResult.confidence,
            max_probability: fallbackResult.confidence,
          },
        });

        alert("ML API unavailable, using fallback analysis.");
      } catch (fallbackError) {
        console.error("Fallback analysis failed:", fallbackError);
        alert("There was an error processing your file. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">
        Upload Audio File for DeepFake Detection
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* File Input */}
        <input
          type="file"
          accept=".wav,.mp3,.m4a,.flac,.ogg"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300"
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload and Analyze"}
        </Button>
      </form>

      {/* Result Display */}
      {detectionResult && (
        <div className="mt-6">
          {/* Display the detection result message */}
          <DetectionResult
            probability={detectionResult.deepfake_probability}
            prediction_score={detectionResult.prediction_score}
            confidence_metrics={detectionResult.confidence_metrics}
          />
        </div>
      )}
    </div>
  );
};

export default DeepFakeUpload;
