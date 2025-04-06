import numpy as np
import sounddevice as sd
import librosa
from tensorflow.keras.models import load_model

# Load your pre-trained deepfake detection model
model_path = 'fine_tuned_audio_deepfake_model.keras'
model = load_model(model_path)

# Define parameters for audio capture and processing
sampling_rate = 16000  # Sample rate for audio (16 kHz)
chunk_duration = 2.5  # Duration of each chunk in seconds
chunk_samples = int(sampling_rate * chunk_duration)  # Number of samples per chunk

# Preprocess audio into mel-spectrogram
def preprocess_audio_to_melspec(audio, n_mels=128, n_fft=2048, hop_length=512):
    # Compute the mel-spectrogram
    mel_spec = librosa.feature.melspectrogram(y=audio, sr=sampling_rate, n_mels=n_mels, n_fft=n_fft, hop_length=hop_length)
    
    # Convert to decibel scale
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    # Ensure the mel-spectrogram has a consistent shape (128x400)
    if mel_spec_db.shape[1] < 400:
        pad_width = 400 - mel_spec_db.shape[1]
        mel_spec_db = np.pad(mel_spec_db, ((0, 0), (0, pad_width)), mode='constant')
    
    mel_spec_db = mel_spec_db[..., np.newaxis]  # Add channel dimension
    mel_spec_db = mel_spec_db.reshape(1, 128, 400, 1)  # Reshape to fit model input
    
    return mel_spec_db

# Real-time prediction function
def predict_in_real_time(indata, frames, time, status):
    # Reshape the incoming audio data
    audio_chunk = indata[:, 0]  # Use only one channel (mono audio)
    
    # Preprocess the audio chunk
    mel_spectrogram = preprocess_audio_to_melspec(audio_chunk)
    
    # Make a prediction using the model
    prediction = model.predict(mel_spectrogram)
    
    # Interpret the prediction
    result = 'Fake audio' if prediction > 0.5 else 'Real audio'
    
    # Output the result
    print(f"Prediction: {result}")

# Start recording and processing audio in real-time
def start_real_time_detection():
    print("Starting real-time deepfake audio detection...")
    
    # Stream audio from the microphone in real time
    with sd.InputStream(callback=predict_in_real_time, channels=1, samplerate=sampling_rate, blocksize=chunk_samples):
        print("Press Ctrl+C to stop.")
        try:
            while True:
                sd.sleep(1000)  # Keep the stream open
        except KeyboardInterrupt:
            print("Real-time detection stopped.")

# Run the real-time detection
if __name__ == '__main__':
    start_real_time_detection()
