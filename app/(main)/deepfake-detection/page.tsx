"use client";

import DeepFakeUpload from "@/components/DeepfakeUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeepFakeDetectionPage() {
  return (
    <div className="container mx-auto p-4">
      {/* DeepFake Detection Card */}
      <Card>
        <CardHeader>
          <CardTitle>DeepFake Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <DeepFakeUpload />
        </CardContent>
      </Card>
    </div>
  );
}
