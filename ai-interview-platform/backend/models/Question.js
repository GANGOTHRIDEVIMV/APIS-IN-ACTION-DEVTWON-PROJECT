const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['technical', 'behavioral', 'situational', 'general'],
  },
  jobRole: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  expectedKeywords: [{
    type: String,
  }],
  sampleAnswer: {
    type: String,
  },
  evaluationCriteria: {
    technical: { type: Number, min: 0, max: 100 },
    communication: { type: Number, min: 0, max: 100 },
    problemSolving: { type: Number, min: 0, max: 100 },
  },
  tags: [{
    type: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: String,
    enum: ['system', 'ai-generated'],
    default: 'system',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
questionSchema.index({ jobRole: 1, difficulty: 1, category: 1 });

  jobRole: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Technical', 'Behavioral', 'Situational', 'Communication']
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  questionText: {
    type: String,
    required: true
  },
  expectedKeywords: [String],
  sampleAnswer: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', questionSchema);
