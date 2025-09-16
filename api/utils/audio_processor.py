import numpy as np
import librosa
import logging

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self,
                 sample_rate=16000,
                 duration=2.5,
                 n_mels=128,
                 n_fft=2048,
                 hop_length=512):
        self.sample_rate = sample_rate
        self.duration = duration
        self.n_mels = n_mels
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.target_width = 400  # Target width for mel-spectrogram

    def preprocess_audio_file(self, file_path):
        """Preprocess audio file into mel-spectrogram format expected by the model"""
        try:
            # Load audio file
            audio, sr = librosa.load(file_path, sr=self.sample_rate, duration=self.duration)
            return self._audio_to_melspec(audio)
        except Exception as e:
            logger.error(f"Error preprocessing audio file {file_path}: {str(e)}")
            raise

    def preprocess_audio_array(self, audio_array, sample_rate=None):
        """Preprocess audio array into mel-spectrogram format"""
        try:
            if sample_rate and sample_rate != self.sample_rate:
                # Resample if necessary
                audio_array = librosa.resample(audio_array, orig_sr=sample_rate, target_sr=self.sample_rate)

            # Ensure duration
            target_samples = int(self.sample_rate * self.duration)
            if len(audio_array) > target_samples:
                audio_array = audio_array[:target_samples]
            elif len(audio_array) < target_samples:
                audio_array = np.pad(audio_array, (0, target_samples - len(audio_array)), mode='constant')

            return self._audio_to_melspec(audio_array)
        except Exception as e:
            logger.error(f"Error preprocessing audio array: {str(e)}")
            raise

    def _audio_to_melspec(self, audio):
        """Convert audio to mel-spectrogram"""
        try:
            # Compute mel-spectrogram
            mel_spec = librosa.feature.melspectrogram(
                y=audio,
                sr=self.sample_rate,
                n_mels=self.n_mels,
                n_fft=self.n_fft,
                hop_length=self.hop_length
            )

            # Convert to decibel scale
            mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)

            # Ensure consistent width
            if mel_spec_db.shape[1] < self.target_width:
                pad_width = self.target_width - mel_spec_db.shape[1]
                mel_spec_db = np.pad(mel_spec_db, ((0, 0), (0, pad_width)), mode='constant')
            elif mel_spec_db.shape[1] > self.target_width:
                mel_spec_db = mel_spec_db[:, :self.target_width]

            # Add channel dimension and reshape for model input
            mel_spec_db = mel_spec_db[..., np.newaxis]
            mel_spec_db = mel_spec_db.reshape(1, self.n_mels, self.target_width, 1)

            return mel_spec_db

        except Exception as e:
            logger.error(f"Error converting audio to mel-spectrogram: {str(e)}")
            raise

    def validate_audio_format(self, file_path):
        """Validate audio file format"""
        try:
            # Try to load the file
            audio, sr = librosa.load(file_path, sr=None, duration=0.1)  # Load just a small chunk

            return {
                'valid': True,
                'sample_rate': sr,
                'duration': librosa.get_duration(filename=file_path),
                'channels': audio.shape[0] if audio.ndim > 1 else 1
            }
        except Exception as e:
            return {
                'valid': False,
                'error': str(e)
            }