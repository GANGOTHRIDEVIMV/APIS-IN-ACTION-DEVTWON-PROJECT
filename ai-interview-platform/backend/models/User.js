const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  phone: {
    type: String,
    trim: true,
  },
  profileImage: {
    type: String,
    default: 'default-avatar.png',
  },
  resumeIPFSHash: {
    type: String,
  },
  resumeFileName: {
    type: String,
  },
  targetRole: {
    type: String,
    trim: true,
  },
  experience: {
    type: Number,
    default: 0,
  },
  skills: [{
    type: String,
  }],
  education: {
    degree: String,
    institution: String,
    year: Number,
  },
  preferences: {
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    interviewDuration: {
      type: Number,
      default: 30,
    },
    focusAreas: [{
      type: String,
    }],
  },
  overallReadinessScore: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  resumeUrl: {
    type: String
  },
  resumeData: {
    skills: [String],
    experience: String,
    education: String,
    summary: String
  },
  targetRole: {
    type: String,
    default: 'Software Developer'
  },
  readinessScore: {
    type: Number,
    default: 0
  },
  interviewHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
