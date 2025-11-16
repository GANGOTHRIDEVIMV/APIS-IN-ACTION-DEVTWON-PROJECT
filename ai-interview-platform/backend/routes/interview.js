const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Interview = require('../models/Interview');
const User = require('../models/User');
const AIService = require('../services/aiService');

// Start new interview
router.post('/start', auth, async (req, res) => {
  try {
    const { jobRole, difficulty } = req.body;
    
    const user = await User.findById(req.userId);
    
    // Generate questions
    const questions = AIService.generateQuestions(
      jobRole || user.targetRole,
      user.resumeData,
      difficulty || 'Medium',
      5
    );

    // Create interview
    const interview = new Interview({
      userId: req.userId,
      jobRole: jobRole || user.targetRole,
      difficulty: difficulty || 'Medium',
      questions: questions.map(q => ({
        questionText: q.questionText,
        category: q.category,
        difficulty: q.difficulty,
        answer: '',
        timeSpent: 0,
        score: 0
      })),
      status: 'in-progress'
    });

    await interview.save();

    // Add to user's history
    user.interviewHistory.push(interview._id);
    await user.save();

    res.json({
      message: 'Interview started',
      interview: {
        id: interview._id,
        jobRole: interview.jobRole,
        difficulty: interview.difficulty,
        questions: interview.questions,
        status: interview.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit answer
router.post('/:interviewId/answer', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { questionIndex, answer, timeSpent } = req.body;

    const interview = await Interview.findById(interviewId);
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update question with answer
    const question = interview.questions[questionIndex];
    question.answer = answer;
    question.timeSpent = timeSpent;

    // Analyze answer
    const analysis = AIService.analyzeAnswer(
      answer,
      AIService.extractKeywords(question.questionText, interview.jobRole),
      question.category
    );
    
    question.score = analysis.score;

    // Analyze speech if transcript provided
    if (answer) {
      interview.audioAnalysis = AIService.analyzeSpeech(answer);
    }

    await interview.save();

    res.json({
      message: 'Answer submitted',
      score: analysis.score,
      feedback: analysis.feedback,
      audioAnalysis: interview.audioAnalysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete interview
router.post('/:interviewId/complete', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Calculate scores
    const questionScores = interview.questions.map(q => q.score);
    const avgQuestionScore = questionScores.reduce((a, b) => a + b, 0) / questionScores.length;

    // Facial analysis
    interview.facialAnalysis = AIService.analyzeFacialExpression();

    // Calculate category scores
    interview.scores = {
      technical: avgQuestionScore,
      communication: interview.audioAnalysis?.clarity || 75,
      confidence: interview.facialAnalysis?.confidence || 75,
      clarity: interview.audioAnalysis?.clarity || 75,
      professionalism: Math.floor(Math.random() * 20) + 75,
      creativity: Math.floor(Math.random() * 20) + 70,
      leadership: Math.floor(Math.random() * 20) + 70,
      teamwork: Math.floor(Math.random() * 20) + 75,
      attitude: interview.facialAnalysis?.engagement || 75
    };

    // Overall score
    const scoreValues = Object.values(interview.scores);
    interview.overallScore = Math.round(
      scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
    );

    // Generate feedback
    interview.feedback = AIService.generateFeedback(interview);
    interview.status = 'completed';
    interview.completedAt = new Date();

    await interview.save();

    // Update user readiness score
    const user = await User.findById(req.userId);
    const allInterviews = await Interview.find({ 
      userId: req.userId, 
      status: 'completed' 
    });
    
    const avgReadiness = allInterviews.reduce((sum, int) => sum + int.overallScore, 0) / allInterviews.length;
    user.readinessScore = Math.round(avgReadiness);
    await user.save();

    res.json({
      message: 'Interview completed',
      interview: {
        id: interview._id,
        overallScore: interview.overallScore,
        scores: interview.scores,
        feedback: interview.feedback,
        audioAnalysis: interview.audioAnalysis,
        facialAnalysis: interview.facialAnalysis
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get interview details
router.get('/:interviewId', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ interview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all interviews for user
router.get('/', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({ interviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const interviews = await Interview.find({ 
      userId: req.userId,
      status: 'completed'
    }).sort({ createdAt: -1 });

    const totalInterviews = interviews.length;
    const avgScore = interviews.length > 0
      ? interviews.reduce((sum, int) => sum + int.overallScore, 0) / interviews.length
      : 0;

    // Calculate progress over time
    const recentInterviews = interviews.slice(0, 5);
    
    // Get average scores by category
    const categoryAverages = {
      technical: 0,
      communication: 0,
      confidence: 0,
      clarity: 0,
      professionalism: 0,
      creativity: 0,
      leadership: 0,
      teamwork: 0,
      attitude: 0
    };

    if (interviews.length > 0) {
      interviews.forEach(interview => {
        Object.keys(categoryAverages).forEach(key => {
          categoryAverages[key] += interview.scores[key] || 0;
        });
      });

      Object.keys(categoryAverages).forEach(key => {
        categoryAverages[key] = Math.round(categoryAverages[key] / interviews.length);
      });
    }

    res.json({
      user: {
        name: user.name,
        email: user.email,
        targetRole: user.targetRole,
        readinessScore: user.readinessScore
      },
      stats: {
        totalInterviews,
        avgScore: Math.round(avgScore),
        categoryAverages,
        recentInterviews: recentInterviews.map(int => ({
          id: int._id,
          jobRole: int.jobRole,
          score: int.overallScore,
          date: int.createdAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
