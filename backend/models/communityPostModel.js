import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    userName: { type: String, required: true },
    userImage: { type: String },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const communityPostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    userName: { type: String, required: true },
    userImage: { type: String },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    comments: [commentSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const communityPostModel = mongoose.models.communityPost || mongoose.model("communityPost", communityPostSchema);
export default communityPostModel;