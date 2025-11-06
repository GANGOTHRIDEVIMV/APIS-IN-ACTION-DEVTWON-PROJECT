const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

// Add a new video
router.post('/', async (req, res) => {
  try {
    const { title, description, videoUrl } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, message: "title and videoUrl are required" });
    }

    const newVideo = new Video({ title, description, videoUrl });
    const saved = await newVideo.save();

    res.status(201).json({ success: true, message: "Video added successfully", data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: videos });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
