const express = require('express');
const router = express.Router();
const {
  startInterview,
  submitAnswer,
  endInterview,
  getInterviewResults,
  getInterviewHistory,
  getAnalytics,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

router.post('/start', protect, startInterview);
router.post('/answer', protect, submitAnswer);
router.post('/end', protect, endInterview);
router.get('/results/:interviewId', protect, getInterviewResults);
router.get('/history', protect, getInterviewHistory);
router.get('/analytics', protect, getAnalytics);

module.exports = router;
