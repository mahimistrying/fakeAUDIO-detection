import os
import logging
import numpy as np
from tensorflow.keras.models import load_model

logger = logging.getLogger(__name__)

class ModelLoader:
    def __init__(self, model_path=None):
        self.model = None
        self.model_path = model_path or os.environ.get('ML_MODEL_PATH', './model/deepfakeAudioDetectionModel.keras')
        self._load_model()

    def _load_model(self):
        """Load the TensorFlow model"""
        try:
            if os.path.exists(self.model_path):
                self.model = load_model(self.model_path)
                logger.info(f"Model loaded successfully from {self.model_path}")
            else:
                logger.warning(f"Model file not found at {self.model_path}")
                logger.info("Using mock predictions until model is available")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            logger.info("Using mock predictions until model is available")

    def is_loaded(self):
        """Check if model is loaded"""
        return self.model is not None

    def predict(self, audio_data):
        """Make prediction on audio data"""
        if self.model is not None:
            try:
                prediction = self.model.predict(audio_data, verbose=0)
                return prediction
            except Exception as e:
                logger.error(f"Error making prediction: {str(e)}")
                return self._mock_prediction()
        else:
            return self._mock_prediction()

    def _mock_prediction(self):
        """Generate mock prediction when model is not available"""
        # Generate realistic mock prediction for testing
        fake_probability = 0.3 + (np.random.random() * 0.4)  # Between 0.3 and 0.7
        return np.array([[fake_probability]])

    def get_model_info(self):
        """Get model information"""
        if self.model is not None:
            return {
                'loaded': True,
                'input_shape': self.model.input_shape,
                'output_shape': self.model.output_shape,
                'model_path': self.model_path
            }
        else:
            return {
                'loaded': False,
                'model_path': self.model_path,
                'status': 'Model not found or failed to load'
            }