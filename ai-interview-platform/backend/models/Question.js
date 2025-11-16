const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
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
