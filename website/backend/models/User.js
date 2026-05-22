const userSchema = new mongoose.Schema({
  // ... existing fields ...
  googleId: String,
  githubId: String,
  isVerified: {
    type: Boolean,
    default: false
  }
}); 