import os
import numpy as np
import librosa
from tensorflow.keras.models import load_model
import argparse

def preprocess_audio_to_melspec(file_path, n_mels=128, n_fft=2048, hop_length=512, duration=2.5, sr=16000):
    # Load the audio file with a specific sampling rate (e.g., 16kHz) and duration
    audio, sr = librosa.load(file_path, sr=sr, duration=duration)
    
    # Compute the mel-spectrogram
    mel_spec = librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=n_mels, n_fft=n_fft, hop_length=hop_length)
    
    # Convert power spectrogram (amplitude squared) to decibel (logarithmic) scale
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    # If the mel-spectrogram has fewer time frames, pad with zeros to ensure it's 128x400
    if mel_spec_db.shape[1] < 400:
        pad_width = 400 - mel_spec_db.shape[1]
        mel_spec_db = np.pad(mel_spec_db, ((0, 0), (0, pad_width)), mode='constant')
    
    # Reshape the mel-spectrogram to match the model's expected input: (128, 400, 1)
    mel_spec_db = mel_spec_db[..., np.newaxis]  # Add channel dimension
    mel_spec_db = mel_spec_db.reshape(1, 128, 400, 1)  # Reshape to (1, 128, 400, 1)
    
    return mel_spec_db

def main(audio_file_path):
    # Load the fine-tuned model
    model_path = 'newfine_tuned_audio_deepfake_model.keras'
    model = load_model(model_path)

    # Preprocess the single audio file into a mel-spectrogram
    audio_data = preprocess_audio_to_melspec(audio_file_path)

    # Make prediction using the model
    prediction = model.predict(audio_data)

    # Output the prediction result
    if prediction > 0.5:
        print("Prediction: Fake audio")
    else:
        print("Prediction: Real audio")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deepfake Audio Detection")
    parser.add_argument("audio_file", type=str, help="Path to the audio file to analyze")
    args = parser.parse_args()
    
    main(args.audio_file)
