const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const PYTHON_SERVICE_URL = 'http://localhost:8000/process';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/video_scoring', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Video Schema
const VideoSchema = new mongoose.Schema({
  originalName: String,
  filename: String,
  path: String,
  status: { type: String, default: 'uploaded' }, // uploaded, processing, completed, error
  score: Number,
  details: Object, // detailed scoring breakdown
  transcript: String,
  createdAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', VideoSchema);

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Processing Queue
const queue = [];
let activeWorkers = 0;
const MAX_CONCURRENT_WORKERS = 2; // Limit parallel processing to avoid freezing the machine

const processQueue = async () => {
  if (activeWorkers >= MAX_CONCURRENT_WORKERS || queue.length === 0) return;

  activeWorkers++;
  const videoId = queue.shift();

  try {
    const video = await Video.findById(videoId);
    if (!video) throw new Error('Video not found');

    video.status = 'processing';
    await video.save();

    // Call Python Service
    // We send absolute path to Python service
    const absolutePath = path.resolve(video.path);

    const response = await axios.post(PYTHON_SERVICE_URL, {
      video_id: video._id.toString(),
      file_path: absolutePath
    });

    // Update with results
    video.status = 'completed';
    video.score = response.data.score;
    video.transcript = response.data.transcript;
    video.details = response.data.details;
    await video.save();

    console.log(`Processed video: ${video.originalName}`);

  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error.message);
    try {
      await Video.findByIdAndUpdate(videoId, { status: 'error', details: { error: error.message } });
    } catch (e) {
      console.error('Failed to update error status:', e);
    }
  } finally {
    activeWorkers--;
    processQueue(); // Process next
  }
};

const addToQueue = (videoId) => {
  queue.push(videoId);
  processQueue();
};

// Routes
app.post('/api/upload', upload.array('videos', 100), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const videos = await Promise.all(files.map(async (file) => {
      const newVideo = new Video({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path
      });
      await newVideo.save();
      addToQueue(newVideo._id);
      return newVideo;
    }));

    res.json({ message: `Uploaded ${videos.length} files. Processing started.` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Video
app.put('/api/videos/:id', async (req, res) => {
  try {
    const { originalName } = req.body;
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { originalName },
      { new: true }
    );
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear Database
app.delete('/api/videos/clear', async (req, res) => {
  try {
    await Video.deleteMany({});

    // Optional: Clear uploads directory files but keep the directory
    const uploadDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    }

    res.json({ message: 'Database and files cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Open File Location
app.post('/api/videos/:id/open', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const absolutePath = path.resolve(video.path);
    // Command to open file explorer with file selected (Windows)
    require('child_process').exec(`explorer.exe /select,"${absolutePath}"`);

    res.json({ message: 'Opened file location' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
