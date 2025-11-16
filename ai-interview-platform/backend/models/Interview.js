const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobRole: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  questions: [{
    questionText: String,
    category: String,
    difficulty: String,
    answer: String,
    timeSpent: Number,
    score: Number
  }],
  overallScore: {
    type: Number,
    default: 0
  },
  scores: {
    technical: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 },
    professionalism: { type: Number, default: 0 },
    creativity: { type: Number, default: 0 },
    leadership: { type: Number, default: 0 },
    teamwork: { type: Number, default: 0 },
    attitude: { type: Number, default: 0 }
  },
  feedback: {
    strengths: [String],
    improvements: [String],
    summary: String
  },
  videoUrl: String,
  audioAnalysis: {
    tone: String,
    clarity: Number,
    pace: String,
    fillerWords: Number
  },
  facialAnalysis: {
    confidence: Number,
    engagement: Number,
    emotions: [String]
  },
  duration: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

module.exports = mongoose.model('Interview', interviewSchema);
