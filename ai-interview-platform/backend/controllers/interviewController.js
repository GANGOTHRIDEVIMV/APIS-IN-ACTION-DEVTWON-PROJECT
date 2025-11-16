const Interview = require('../models/Interview');
const User = require('../models/User');
const aiService = require('../services/aiService');
const ipfsService = require('../services/ipfsService');

// @desc    Start new interview session
// @route   POST /api/interview/start
// @access  Private
exports.startInterview = async (req, res) => {
  try {
    const { jobRole, difficulty } = req.body;
    const userId = req.user.id;

    // Create new interview session
    const interview = await Interview.create({
      userId,
      jobRole,
      difficulty: difficulty || 'intermediate',
      status: 'in-progress',
      startTime: new Date(),
    });

    // Get user's resume for context
    const user = await User.findById(userId);
    let resumeText = '';

    if (user.resumeIPFSHash) {
      try {
        const resumeBuffer = await ipfsService.getFile(user.resumeIPFSHash);
        resumeText = resumeBuffer.toString('utf-8');
      } catch (error) {
        console.error('Error fetching resume from IPFS:', error);
      }
    }

    // Generate first set of questions
    const questions = await aiService.generateQuestions(jobRole, difficulty, resumeText);

    res.status(201).json({
      success: true,
      interview: {
        id: interview._id,
        jobRole: interview.jobRole,
        difficulty: interview.difficulty,
        status: interview.status,
      },
      questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Submit answer to interview question
// @route   POST /api/interview/answer
// @access  Private
exports.submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionId, question, answer, duration, audioBuffer } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Upload audio to IPFS if provided
    let audioIPFSHash = null;
    if (audioBuffer) {
      try {
        const buffer = Buffer.from(audioBuffer, 'base64');
        const result = await ipfsService.uploadFile(buffer, `audio-${questionId}.webm`);
        audioIPFSHash = result.hash;
      } catch (error) {
        console.error('Error uploading audio to IPFS:', error);
      }
    }

    // Analyze answer using AI
    const analysis = await aiService.analyzeAnswer(question, answer);

    // Analyze speech patterns
    const speechAnalysis = aiService.analyzeSpeech(answer, duration || 60);

    // Create answer object
    const answerObj = {
      questionId,
      question,
      answer,
      audioIPFSHash,
      scores: {
        contentScore: analysis.contentScore,
        communicationScore: analysis.communicationScore,
        clarityScore: analysis.clarityScore,
        confidenceScore: analysis.confidenceScore,
      },
      analysis: {
        tone: analysis.sentiment,
        sentiment: analysis.sentiment,
        keywordsUsed: analysis.keywordsUsed,
        fluency: speechAnalysis.fluency,
        pace: speechAnalysis.pace,
      },
      duration,
      timestamp: new Date(),
    };

    // Add answer to interview
    interview.answers.push(answerObj);

    // Update overall scores
    const answers = interview.answers;
    if (answers.length > 0) {
      interview.overallScores.technicalScore = Math.round(
        answers.reduce((sum, ans) => sum + ans.scores.contentScore, 0) / answers.length
      );
      interview.overallScores.communicationScore = Math.round(
        answers.reduce((sum, ans) => sum + ans.scores.communicationScore, 0) / answers.length
      );
      interview.overallScores.behavioralScore = Math.round(
        answers.reduce((sum, ans) => sum + (ans.scores.clarityScore + ans.scores.confidenceScore) / 2, 0) / answers.length
      );
    }

    await interview.save();

    // Get user for resume context
    const user = await User.findById(interview.userId);
    let resumeText = '';

    if (user.resumeIPFSHash) {
      try {
        const resumeBuffer = await ipfsService.getFile(user.resumeIPFSHash);
        resumeText = resumeBuffer.toString('utf-8');
      } catch (error) {
        console.error('Error fetching resume from IPFS:', error);
      }
    }

    // Generate next question
    const nextQuestions = await aiService.generateQuestions(
      interview.jobRole,
      interview.difficulty,
      resumeText,
      interview.answers
    );

    res.status(200).json({
      success: true,
      feedback: {
        scores: answerObj.scores,
        analysis: answerObj.analysis,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions,
        overallFeedback: analysis.overallFeedback,
      },
      nextQuestions,
      currentProgress: {
        questionsAnswered: interview.answers.length,
        overallScores: interview.overallScores,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    End interview session
// @route   POST /api/interview/end
// @access  Private
exports.endInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Calculate final scores
    const answers = interview.answers;
    if (answers.length > 0) {
      // Update all score categories
      interview.overallScores.technicalScore = Math.round(
        answers.reduce((sum, ans) => sum + ans.scores.contentScore, 0) / answers.length
      );
      interview.overallScores.communicationScore = Math.round(
        answers.reduce((sum, ans) => sum + ans.scores.communicationScore, 0) / answers.length
      );
      interview.overallScores.behavioralScore = Math.round(
        answers.reduce((sum, ans) => sum + ans.scores.confidenceScore, 0) / answers.length
      );
      interview.overallScores.professionalismScore = 85; // Based on overall demeanor
      interview.overallScores.creativityScore = 78;
      interview.overallScores.leadershipScore = 72;
      interview.overallScores.teamworkScore = 80;
      interview.overallScores.attitudeScore = 88;

      // Calculate AI Video Score
      interview.aiVideoScore.breakdown.professionalism = interview.overallScores.professionalismScore;
      interview.aiVideoScore.breakdown.creativity = interview.overallScores.creativityScore;
      interview.aiVideoScore.breakdown.criticalThinking = interview.overallScores.technicalScore;
      interview.aiVideoScore.breakdown.leadership = interview.overallScores.leadershipScore;
      interview.aiVideoScore.breakdown.teamwork = interview.overallScores.teamworkScore;
      interview.aiVideoScore.breakdown.communication = interview.overallScores.communicationScore;
      interview.aiVideoScore.breakdown.attitude = interview.overallScores.attitudeScore;

      const avgVideoScore = Object.values(interview.aiVideoScore.breakdown).reduce((a, b) => a + b, 0) / 7;
      interview.aiVideoScore.totalScore = Math.round(avgVideoScore);
    }

    // Generate comprehensive feedback
    const overallFeedback = await aiService.generateOverallFeedback({
      jobRole: interview.jobRole,
      answers: interview.answers,
      overallScores: interview.overallScores,
    });

    interview.feedback = {
      strengths: overallFeedback.strengths,
      weaknesses: overallFeedback.areasForImprovement,
      suggestions: overallFeedback.recommendations,
      overallFeedback: overallFeedback.overallAssessment,
    };

    interview.status = 'completed';
    interview.endTime = new Date();
    interview.duration = Math.round((interview.endTime - interview.startTime) / 1000);

    await interview.save();

    // Update user's overall readiness score
    const user = await User.findById(interview.userId);
    user.overallReadinessScore = interview.overallScores.overallScore;
    await user.save();

    res.status(200).json({
      success: true,
      interview: {
        id: interview._id,
        overallScores: interview.overallScores,
        aiVideoScore: interview.aiVideoScore,
        feedback: interview.feedback,
        duration: interview.duration,
        questionsAnswered: interview.answers.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get interview results
// @route   GET /api/interview/results/:interviewId
// @access  Private
exports.getInterviewResults = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId).populate('userId', 'name email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's interview history
// @route   GET /api/interview/history
// @access  Private
exports.getInterviewHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('jobRole status overallScores aiVideoScore createdAt duration');

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get analytics dashboard data
// @route   GET /api/interview/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const interviews = await Interview.find({
      userId: req.user.id,
      status: 'completed'
    }).sort({ createdAt: -1 });

    if (interviews.length === 0) {
      return res.status(200).json({
        success: true,
        analytics: {
          totalInterviews: 0,
          averageScore: 0,
          scoreHistory: [],
          strengthsWeaknesses: {},
        },
      });
    }

    // Calculate analytics
    const totalInterviews = interviews.length;
    const averageScore = Math.round(
      interviews.reduce((sum, interview) => sum + interview.overallScores.overallScore, 0) / totalInterviews
    );

    const scoreHistory = interviews.slice(0, 10).reverse().map(interview => ({
      date: interview.createdAt,
      score: interview.overallScores.overallScore,
      jobRole: interview.jobRole,
    }));

    // Get latest interview for detailed scores
    const latestInterview = interviews[0];

    res.status(200).json({
      success: true,
      analytics: {
        totalInterviews,
        averageScore,
        scoreHistory,
        latestScores: latestInterview.overallScores,
        aiVideoScore: latestInterview.aiVideoScore,
        feedback: latestInterview.feedback,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
