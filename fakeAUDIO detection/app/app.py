from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import numpy as np
import librosa
from tensorflow.keras.models import load_model

app = Flask(__name__, static_folder='static')

# Load the pre-trained model
model_path = 'newfine_tuned_audio_deepfake_model.keras'
model = load_model(model_path)

# Function to preprocess the audio file into a mel-spectrogram
def preprocess_audio_to_melspec(file_path, n_mels=128, n_fft=2048, hop_length=512, duration=2.5, sr=16000):
    audio, sr = librosa.load(file_path, sr=sr, duration=duration)
    mel_spec = librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=n_mels, n_fft=n_fft, hop_length=hop_length)
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    if mel_spec_db.shape[1] < 400:
        pad_width = 400 - mel_spec_db.shape[1]
        mel_spec_db = np.pad(mel_spec_db, ((0, 0), (0, pad_width)), mode='constant')
    
    mel_spec_db = mel_spec_db[..., np.newaxis]
    mel_spec_db = mel_spec_db.reshape(1, 128, 400, 1)
    
    return mel_spec_db

# Serve the HTML frontend
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# Endpoint to handle audio file upload and prediction
@app.route('/predict', methods=['POST'])
def predict_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    file_path = os.path.join('uploads', audio_file.filename)
    
    # Save the uploaded file
    audio_file.save(file_path)
    
    # Preprocess the audio file
    try:
        audio_data = preprocess_audio_to_melspec(file_path)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    # Make prediction
    prediction = model.predict(audio_data)
    
    # Return the result
    result = 'Fake audio' if prediction > 0.5 else 'Real audio'
    
    return jsonify({'prediction': result})

if __name__ == '__main__':
    # Make sure you have an 'uploads' directory to store files
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    
    app.run(debug=True)
