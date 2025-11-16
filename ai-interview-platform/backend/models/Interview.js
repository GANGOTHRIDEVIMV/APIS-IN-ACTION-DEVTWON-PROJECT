const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  audioIPFSHash: {
    type: String,
  },
  scores: {
    contentScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    clarityScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
  },
  analysis: {
    tone: { type: String },
    sentiment: { type: String },
    keywordsUsed: [String],
    fluency: { type: Number },
    pace: { type: String },
  },
  facialAnalysis: {
    dominantEmotion: { type: String },
    confidence: { type: Number },
    eyeContact: { type: Number },
    expressions: [{
      emotion: String,
      intensity: Number,
      timestamp: Number,
    }],
  },
  duration: {
    type: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobRole: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  answers: [answerSchema],
  overallScores: {
    technicalScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    behavioralScore: { type: Number, default: 0 },
    professionalismScore: { type: Number, default: 0 },
    creativityScore: { type: Number, default: 0 },
    leadershipScore: { type: Number, default: 0 },
    teamworkScore: { type: Number, default: 0 },
    attitudeScore: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
  },
  aiVideoScore: {
    totalScore: { type: Number, default: 0 },
    breakdown: {
      professionalism: { type: Number, default: 0 },
      creativity: { type: Number, default: 0 },
      criticalThinking: { type: Number, default: 0 },
      leadership: { type: Number, default: 0 },
      teamwork: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      attitude: { type: Number, default: 0 },
    },
  },
  feedback: {
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    overallFeedback: String,
  },
  duration: {
    type: Number,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate overall score before saving
interviewSchema.pre('save', function(next) {
  if (this.answers.length > 0) {
    const scores = this.overallScores;
    const totalScore = (
      scores.technicalScore +
      scores.communicationScore +
      scores.behavioralScore +
      scores.professionalismScore +
      scores.creativityScore +
      scores.leadershipScore +
      scores.teamworkScore +
      scores.attitudeScore
    ) / 8;
    this.overallScores.overallScore = Math.round(totalScore);
  }
  next();
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
