# Audio Spam Call Detection - Capstone Project

A real-time audio deepfake detection system with voice calling capabilities, built as a capstone project. The application combines WebRTC-based voice calls with AI-powered deepfake detection to help users identify potentially fraudulent or manipulated audio during conversations.

## 🚀 Features

### Core Functionality
- **Real-time Voice Calling**: WebRTC-powered peer-to-peer voice communication
- **Deepfake Detection**: AI-powered analysis of audio streams to detect potential voice manipulation
- **Live Audio Analysis**: Continuous monitoring of call audio with real-time detection results
- **Detection History**: Historical view of detection results with confidence scores
- **User Authentication**: Secure user management with Clerk authentication
- **Online User Management**: View and call other online users

### Technical Features
- **Socket.io Integration**: Real-time communication between users
- **Audio Visualization**: Live audio waveform visualization during calls
- **File Upload Detection**: Upload and analyze audio files for deepfake detection
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Type Safety**: Full TypeScript implementation

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library

### Backend & Real-time
- **Node.js** - Runtime environment
- **Socket.io** - WebSocket communication
- **WebRTC** - Peer-to-peer communication
- **Simple Peer** - WebRTC wrapper library

### Authentication & State
- **Clerk** - Authentication and user management
- **React Context** - State management for calls and detection

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Formidable** - File upload handling

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── (main)/            # Main app routes
│   │   ├── dashboard/     # User dashboard
│   │   ├── calls/         # Call interface and summary
│   │   ├── deepfake-detection/  # File upload detection
│   │   └── online-users/  # User directory
│   └── (clerk)/           # Authentication routes
├── api/                   # Flask ML backend
│   ├── model/            # TensorFlow model files
│   ├── utils/            # Audio processing utilities
│   ├── app.py            # Main Flask application
│   └── requirements.txt  # Python dependencies
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   ├── AudioCall.tsx     # Call interface
│   ├── DeepFakeDetection.tsx  # Detection logic
│   └── ...
├── context/              # React context providers
├── socket-events/        # Socket.io event handlers
├── lib/                  # Utility functions
│   └── ml-api.ts         # ML API client
├── providers/            # Context providers
├── public/               # Static assets
├── types.ts              # TypeScript type definitions
├── middleware.ts         # Next.js middleware
└── server.js             # Socket.io server
```

## 🚦 Getting Started

### Prerequisites
- **Node.js** (version 18 or higher)
- **Python** (version 3.8 or higher)
- **npm** or **yarn** package manager
- **Clerk** account for authentication setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd audio-spam-call-detection-capstone-project
   ```

2. **Install dependencies**
   ```bash
   # Install Node.js dependencies
   npm install

   # Install Python dependencies for ML backend
   cd api && pip install -r requirements.txt && cd ..
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```

4. **Run the development server**
   ```bash
   # Option 1: Run both frontend and ML API together
   npm run dev-full

   # Option 2: Run frontend only (uses fallback detection)
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 📱 Usage

### Authentication
1. Sign up or sign in using the Clerk authentication system
2. Complete your profile setup

### Making Calls
1. Navigate to the **Dashboard** to see online users
2. Click on an online user to initiate a voice call
3. Accept incoming calls through the notification system
4. Use the call controls to mute/unmute or hang up

### Deepfake Detection
1. **Real-time Detection**: During calls, the system automatically analyzes audio streams
2. **File Upload**: Use the "DeepFake Detection" page to upload and analyze audio files
3. **View Results**: Check detection history with confidence scores and timestamps
4. **Call Summary**: Review detailed detection results after calls end

### Detection Results
- **Likely Real** (Green): High confidence the audio is authentic
- **Possibly Real** (Light Green): Moderate confidence the audio is authentic
- **Uncertain** (Yellow): Unclear results, requires human judgment
- **Possibly Fake** (Orange): Moderate confidence of manipulation
- **Likely Fake** (Red): High confidence the audio is manipulated

## 🔧 Development

### Available Scripts

```bash
# Start both frontend and ML API
npm run dev-full

# Start development server with Socket.io only
npm run dev

# Start Next.js development server only
npm run next-dev

# Start ML API only
npm run ml-api

# Install Python dependencies
npm run setup-ml

# Build for production
npm run build

# Run ESLint
npm run lint
```

### Key Components

#### Socket Context (`context/SocketContext.tsx`)
- Manages WebSocket connections
- Handles peer-to-peer call setup
- Manages call state and user presence

#### Audio Call (`components/AudioCall.tsx`)
- Call interface with controls
- Real-time audio recording and analysis
- Integration with deepfake detection

#### Detection Components
- `DeepFakeDetection.tsx`: Real-time detection display
- `DeepfakeUpload.tsx`: File upload interface
- `DetectionResult.tsx`: Result visualization

## 🤖 AI/ML Integration

This project now includes **real TensorFlow-powered deepfake detection** with 94.6% accuracy. The system automatically uses the ML model when available and falls back to intelligent mock analysis during development.

### ML Backend Features
- **Flask API** with TensorFlow model integration
- **Real-time audio analysis** during voice calls
- **File upload detection** for audio samples
- **Automatic fallback** when ML API is unavailable
- **Multiple audio format support** (WAV, MP3, M4A, FLAC, OGG)

### Quick Setup
```bash
# Install Python dependencies for ML backend
cd api && pip install -r requirements.txt && cd ..

# Run both frontend and ML API
npm run dev-full
```

### ML API Endpoints
- `GET /health` - Service status and model availability
- `POST /predict` - Analyze uploaded audio files
- `POST /analyze-stream` - Real-time audio chunk analysis

## 🔒 Security Considerations

- **Audio Privacy**: Audio streams are processed client-side when possible
- **Secure Authentication**: Clerk provides enterprise-grade authentication
- **Data Protection**: Temporary audio storage is cleared after analysis
- **WebRTC Security**: Peer-to-peer connections with STUN/TURN support

## 📊 Performance & Scalability

- **Real-time Processing**: Optimized for low-latency audio analysis
- **Efficient Storage**: Temporary audio chunks with automatic cleanup
- **WebRTC Optimization**: Direct peer connections reduce server load
- **Component Optimization**: React optimization patterns implemented

## 🐛 Troubleshooting

### Common Issues

**Audio not working in calls:**
- Check browser microphone permissions
- Ensure HTTPS is used (required for WebRTC)
- Verify audio device availability

**Socket connection issues:**
- Check if server is running on port 3000
- Verify firewall settings
- Check browser console for WebSocket errors

**Authentication problems:**
- Verify Clerk environment variables
- Check Clerk dashboard configuration
- Ensure proper redirect URLs

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all Clerk keys and any ML model API keys are properly configured in your production environment.

### Deployment Platforms
- **Vercel**: Native Next.js support with Edge Functions
- **Railway/Render**: Full-stack deployment with WebSocket support
- **Docker**: Containerized deployment (create Dockerfile as needed)

## 🤝 Contributing

This is a capstone project, but contributions and improvements are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -m 'Add some improvement'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Open a Pull Request


## 🙏 Acknowledgments

- **Clerk** - Authentication infrastructure
- **Socket.io** - Real-time communication
- **Radix UI** - Component primitives
- **WebRTC** - Peer-to-peer communication standards
- **Next.js Team** - React framework and development experience


.