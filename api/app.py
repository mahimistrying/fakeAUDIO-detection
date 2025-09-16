from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
import librosa
import tempfile
import logging
from utils.audio_processor import AudioProcessor
from utils.model_loader import ModelLoader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Initialize model and audio processor
model_loader = ModelLoader()
audio_processor = AudioProcessor()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_loader.is_loaded(),
        'version': '1.0.0'
    })

@app.route('/predict', methods=['POST'])
def predict_audio():
    """Predict if uploaded audio file is real or fake"""
    try:
        # Check if audio file is provided
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': 'No audio file selected'}), 400

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            audio_file.save(temp_file.name)
            temp_path = temp_file.name

        try:
            # Process audio and make prediction
            audio_data = audio_processor.preprocess_audio_file(temp_path)
            prediction = model_loader.predict(audio_data)

            # Calculate confidence and result
            confidence = float(prediction[0][0])
            is_fake = confidence > 0.5

            # Determine result category
            if confidence > 0.8:
                result = "Likely Fake" if is_fake else "Likely Real"
            elif confidence > 0.6:
                result = "Possibly Fake" if is_fake else "Possibly Real"
            else:
                result = "Uncertain"

            response = {
                'prediction': result,
                'confidence': confidence,
                'is_fake': is_fake,
                'probability': confidence if is_fake else 1 - confidence,
                'filename': audio_file.filename
            }

            logger.info(f"Prediction for {audio_file.filename}: {result} (confidence: {confidence:.3f})")
            return jsonify(response)

        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except OSError:
                pass

    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return jsonify({'error': f'Error processing audio: {str(e)}'}), 500

@app.route('/analyze-stream', methods=['POST'])
def analyze_stream():
    """Analyze audio stream chunk for real-time detection"""
    try:
        # Get audio data from request
        if 'audio_data' not in request.json:
            return jsonify({'error': 'No audio data provided'}), 400

        audio_data = np.array(request.json['audio_data'])
        sample_rate = request.json.get('sample_rate', 16000)

        # Process audio chunk
        processed_audio = audio_processor.preprocess_audio_array(audio_data, sample_rate)
        prediction = model_loader.predict(processed_audio)

        # Calculate confidence and result
        confidence = float(prediction[0][0])
        is_fake = confidence > 0.5

        # Simplified result for real-time
        if confidence > 0.7:
            result = "Fake" if is_fake else "Real"
        else:
            result = "Uncertain"

        response = {
            'prediction': result,
            'confidence': confidence,
            'is_fake': is_fake,
            'timestamp': request.json.get('timestamp')
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error analyzing stream: {str(e)}")
        return jsonify({'error': f'Error analyzing stream: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'

    logger.info(f"Starting Flask ML API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)