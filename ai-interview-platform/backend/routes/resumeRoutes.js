const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadResume,
  getResumeAnalysis,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
    }
  },
});

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/analysis', protect, getResumeAnalysis);

module.exports = router;
