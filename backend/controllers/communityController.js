import communityPostModel from '../models/communityModel.js';
import userModel from '../models/userModel.js';

// Create a new community post
export const createPost = async (req, res) => {
    try {
        const { userId, title, content, tags } = req.body;

        // Check if user has posting permission
        const user = await userModel.findById(userId);
        if (!user || !user.canPostInCommunity) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to post in the community'
            });
        }

        const newPost = new communityPostModel({
            userId,
            userName: user.name,
            userImage: user.image,
            title,
            content,
            tags
        });

        await newPost.save();
        res.json({ success: true, post: newPost });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all community posts
export const getPosts = async (req, res) => {
    try {
        const posts = await communityPostModel.find({})
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, posts });

    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add comment to a post
export const addComment = async (req, res) => {
    try {
        const { userId, postId, content } = req.body;

        // Check if user has commenting permission
        const user = await userModel.findById(userId);
        if (!user || !user.canPostInCommunity) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to comment in the community'
            });
        }

        const post = await communityPostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const comment = {
            userId,
            userName: user.name,
            userImage: user.image,
            content
        };

        post.comments.push(comment);
        await post.save();

        res.json({ success: true, comment });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle like on a post
export const toggleLike = async (req, res) => {
    try {
        const { userId, postId } = req.body;

        const post = await communityPostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const likeIndex = post.likes.indexOf(userId);
        if (likeIndex === -1) {
            post.likes.push(userId);
        } else {
            post.likes.splice(likeIndex, 1);
        }

        await post.save();
        res.json({ success: true, likes: post.likes });

    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};