const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  videoUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

videoSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Video', videoSchema);
