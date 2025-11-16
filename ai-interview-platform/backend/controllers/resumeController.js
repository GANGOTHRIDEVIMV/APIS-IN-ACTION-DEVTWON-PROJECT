const User = require('../models/User');
const aiService = require('../services/aiService');
const ipfsService = require('../services/ipfsService');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// @desc    Upload and parse resume
// @route   POST /api/resume/upload
// @access  Private
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    const file = req.file;
    let resumeText = '';

    // Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      resumeText = data.text;
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      resumeText = result.value;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Please upload PDF or DOCX',
      });
    }

    // Upload to IPFS
    const ipfsResult = await ipfsService.uploadFile(file.buffer, file.originalname);

    // Parse resume using AI
    const parsedData = await aiService.parseResume(resumeText);

    // Update user profile
    const user = await User.findById(req.user.id);
    user.resumeIPFSHash = ipfsResult.hash;
    user.resumeFileName = file.originalname;

    // Update user details from parsed resume
    if (parsedData.skills && parsedData.skills.length > 0) {
      user.skills = parsedData.skills;
    }
    if (parsedData.experience) {
      user.experience = parsedData.experience;
    }
    if (parsedData.education) {
      user.education = parsedData.education;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      resume: {
        fileName: file.originalname,
        ipfsHash: ipfsResult.hash,
        ipfsUrl: ipfsResult.url,
      },
      parsedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get resume analysis
// @route   GET /api/resume/analysis
// @access  Private
exports.getResumeAnalysis = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.resumeIPFSHash) {
      return res.status(404).json({
        success: false,
        message: 'No resume found. Please upload your resume first.',
      });
    }

    // Fetch resume from IPFS
    const resumeBuffer = await ipfsService.getFile(user.resumeIPFSHash);
    const resumeText = resumeBuffer.toString('utf-8');

    // Re-parse for latest analysis
    const parsedData = await aiService.parseResume(resumeText);

    res.status(200).json({
      success: true,
      resume: {
        fileName: user.resumeFileName,
        ipfsHash: user.resumeIPFSHash,
      },
      analysis: parsedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
