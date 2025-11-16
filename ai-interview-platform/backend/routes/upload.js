const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const AIService = require('../services/aiService');

// Upload resume
router.post('/resume', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const resumeUrl = `/uploads/${req.file.filename}`;
    
    // Parse resume (mock implementation)
    const resumeData = AIService.parseResume(req.file.filename);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.userId,
      { 
        resumeUrl,
        resumeData
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl,
      resumeData,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resume data
router.get('/resume', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('resumeUrl resumeData');
    
    if (!user.resumeUrl) {
      return res.status(404).json({ error: 'No resume uploaded' });
    }

    res.json({
      resumeUrl: user.resumeUrl,
      resumeData: user.resumeData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
