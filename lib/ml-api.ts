interface MLApiResponse {
  prediction: string;
  confidence: number;
  is_fake: boolean;
  probability: number;
  filename?: string;
}

interface MLApiError {
  error: string;
}

interface StreamAnalysisRequest {
  audio_data: number[];
  sample_rate?: number;
  timestamp?: string;
}

interface StreamAnalysisResponse {
  prediction: string;
  confidence: number;
  is_fake: boolean;
  timestamp?: string;
}

class MLApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:5000';
    this.timeout = 30000; // 30 seconds
  }

  async analyzeAudioFile(audioFile: File): Promise<MLApiResponse> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: MLApiError = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - ML API is taking too long to respond');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  async analyzeAudioBlob(audioBlob: Blob, filename = 'audio.wav'): Promise<MLApiResponse> {
    const file = new File([audioBlob], filename, { type: audioBlob.type });
    return this.analyzeAudioFile(file);
  }

  async analyzeAudioStream(audioData: number[], sampleRate = 16000, timestamp?: string): Promise<StreamAnalysisResponse> {
    const request: StreamAnalysisRequest = {
      audio_data: audioData,
      sample_rate: sampleRate,
      timestamp: timestamp || new Date().toISOString(),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Shorter timeout for streams

    try {
      const response = await fetch(`${this.baseUrl}/analyze-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: MLApiError = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Stream analysis timeout');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  async checkHealth(): Promise<{ status: string; model_loaded: boolean; version: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`ML API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fallback mock analysis for when ML API is unavailable
  async mockAnalysis(audioBlob: Blob): Promise<MLApiResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    const probability = 0.3 + (Math.random() * 0.4); // Between 0.3 and 0.7
    const is_fake = probability > 0.5;

    let prediction: string;
    if (probability > 0.8) {
      prediction = is_fake ? "Likely Fake" : "Likely Real";
    } else if (probability > 0.6) {
      prediction = is_fake ? "Possibly Fake" : "Possibly Real";
    } else {
      prediction = "Uncertain";
    }

    return {
      prediction,
      confidence: probability,
      is_fake,
      probability: is_fake ? probability : 1 - probability,
      filename: 'mock_audio.wav'
    };
  }
}

export const mlApiClient = new MLApiClient();
export type { MLApiResponse, StreamAnalysisResponse };