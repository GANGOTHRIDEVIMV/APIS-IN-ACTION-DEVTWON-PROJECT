# AI-Driven Real-Time Virtual Interview Platform

## Overview
A comprehensive full-stack AI-powered interview preparation platform that provides real-time voice interaction, multimodal assessment, and personalized feedback to job seekers.

## Features
- **Resume Analysis**: AI-powered resume parsing and job role matching
- **Real-time Voice Interviews**: Interactive AI interviewer with natural conversation flow
- **Multimodal Assessment**: Analysis of verbal communication, tone, and facial expressions
- **Adaptive Question Generation**: Dynamic, job-specific questions based on performance
- **Interactive Dashboard**: Comprehensive progress tracking and performance visualization
- **Secure Storage**: Hybrid MongoDB + IPFS for data integrity and privacy

## Technology Stack
- **Frontend**: React.js 18, Bootstrap 5, Recharts, WebRTC
- **Backend**: Express.js, Node.js 22
- **Database**: MongoDB (Atlas compatible)
- **Storage**: IPFS for decentralized file storage
- **AI/ML**: OpenAI GPT-4 for NLP, Web Speech API, face-api.js for facial analysis
- **Authentication**: JWT tokens

## Project Structure
```
ai-interview-platform/
├── frontend/              # React.js application
│   ├── public/           # Static files
│   └── src/
│       ├── components/   # React components
│       ├── pages/        # Page components
│       ├── services/     # API services
│       ├── utils/        # Utility functions
│       └── styles/       # CSS files
├── backend/              # Express.js API
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   └── utils/           # Helper functions
└── README.md

```

## Installation

### Prerequisites
- Node.js 22+
- MongoDB (local or Atlas)
- IPFS node (optional, can use Infura)
- OpenAI API key

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-interview
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_project_secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
```

## Key Modules

### 1. User Profile & Resume Upload
- User registration and authentication
- Resume upload and parsing
- Job role selection and preference settings

### 2. Interactive Dashboard
- Performance metrics visualization
- Progress tracking
- Session history and analytics

### 3. AI Question Generator
- NLP-based question generation
- Role-specific question banks
- Adaptive difficulty adjustment

### 4. Speech & Facial Analysis
- Real-time speech recognition
- Tone and fluency analysis
- Facial expression detection
- Body language assessment

### 5. Adaptive Feedback Engine
- Instant performance feedback
- Strength and weakness identification
- Personalized improvement suggestions

### 6. Secure Storage
- MongoDB for structured data
- IPFS for resume and recording storage
- Encrypted data transmission

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile

### Interview
- POST `/api/interview/start` - Start new interview session
- POST `/api/interview/answer` - Submit answer
- GET `/api/interview/questions` - Get next question
- POST `/api/interview/end` - End interview session

### Results
- GET `/api/results/:sessionId` - Get interview results
- GET `/api/results/history` - Get user's interview history
- GET `/api/results/analytics` - Get performance analytics

### Resume
- POST `/api/resume/upload` - Upload resume
- GET `/api/resume/analysis` - Get resume analysis

## Usage

1. **Register/Login**: Create an account or login
2. **Upload Resume**: Upload your CV and select target job role
3. **Start Interview**: Begin AI-powered mock interview
4. **Get Feedback**: Receive instant feedback on performance
5. **Track Progress**: View detailed analytics on dashboard

## Security Features
- JWT-based authentication
- Password encryption with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization
- Secure file upload handling

## Future Enhancements
- Multilingual support
- Behavioral psychology integration
- Gamification elements
- Real-time labor market data integration
- Mobile application
- Advanced AI models for better accuracy

## License
MIT License

## Contributors
Final Year Project Team

## Support
For issues and questions, please create an issue in the repository.
