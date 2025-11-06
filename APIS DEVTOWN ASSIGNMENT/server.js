require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const videosRouter = require('./routes/videos');
const open = require('open'); // Auto opens browser

const app = express();

// Load env variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

//  Serve video file publicly
app.use(express.static('public'));

// Handle JSON
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send(`
    <h2>Video API Server </h2>
    <video width="600" controls autoplay>
      <source src="/sam.mp4" type="video/mp4">
      Your browser does not support video playback.
    </video>
  `);
});

// API Routes
app.use('/api/videos', videosRouter);

// Connect MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log(' Connected to MongoDB Atlas');
  app.listen(PORT, async () => {
    console.log(` Server running: http://localhost:${5000}`);
    
    //  Auto open browser and play video
    await open(`http://localhost:${5000}/sam.mp4`);
  });
}).catch((err) => {
  console.error(' MongoDB connection error:', err.message);
});
