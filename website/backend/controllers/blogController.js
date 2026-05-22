import Blog from '../models/Blog.js';
import { validateObjectId } from '../utils/validation.js';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Toggle like on a post
export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const post = await Blog.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const isLiked = post.likes.includes(userId);

        if (isLiked) {
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
        } else {
            post.likes.push(userId);
        }

        await post.save();

        res.json({
            success: true,
            data: {
                likes: post.likes.length,
                isLiked: !isLiked
            }
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle like' });
    }
};

// Analyze post using Google Gemini AI
export const analyzePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Blog.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (!process.env.GOOGLE_AI_API_KEY) {
            return res.status(500).json({ success: false, message: 'AI service not configured' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            Analyze the following blog post content and provide:
            1. A concise summary (max 3 sentences).
            2. Key takeaways (bullet points).
            3. Sentiment analysis (Positive/Neutral/Negative).
            4. Estimated reading difficulty (Easy/Medium/Hard).
            
            Title: ${post.title}
            Content: ${post.content.replace(/<[^>]*>?/gm, '')}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({
            success: true,
            data: { analysis: text }
        });

    } catch (error) {
        console.error('Error analyzing post:', error);
        res.status(500).json({ success: false, message: 'Failed to analyze post' });
    }
};

// Add a comment to a post
export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user._id;
        const userName = req.user.name || 'Anonymous';

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Comment content is required' });
        }

        const post = await Blog.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const newComment = {
            userId,
            userName,
            content: content.trim(),
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        res.json({
            success: true,
            message: 'Comment added successfully',
            data: {
                comments: post.comments,
                newComment
            }
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
};

// Delete a comment
export const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const userId = req.user._id;

        if (!validateObjectId(id) || !validateObjectId(commentId)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }

        const post = await Blog.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        // Check if user is authorized to delete (admin or comment owner)
        if (!req.user.isAdmin && comment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
        }

        // Remove the comment
        post.comments.pull(commentId);
        await post.save();

        res.json({
            success: true,
            message: 'Comment deleted successfully',
            data: { comments: post.comments }
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ success: false, message: 'Failed to delete comment' });
    }
};

// ... existing exports ...


// Configure Cloudinary (make sure to set these in your environment variables)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to generate slug
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100); // Limit slug length
};

// Helper function to calculate read time
const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (file, folder = 'blog-images') => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: 'image',
            transformation: [
                { width: 1200, height: 630, crop: 'fill', quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image');
    }
};

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
    }
};

// Get all blog posts with filtering, pagination, and search
export const getAllPosts = async (req, res) => {
    try {
        const {
            search,
            category,
            status,
            author,
            tags,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = {};

        // Search functionality
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { summary: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by author
        if (author) {
            query.userId = author;
        }

        // Filter by tags
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }

        // Only show published posts for non-admin users
        if (!req.user || !req.user.isAdmin) {
            query.status = 'published';
            // query.isPublished = true; // Removed to allow posts with status='published' even if isPublished flag is inconsistent
        }

        console.log('Fetching posts with query:', JSON.stringify(query));

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [posts, total] = await Promise.all([
            Blog.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-__v')
                .lean(),
            Blog.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalPosts: total,
                    postsPerPage: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blog posts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get a single blog post by ID or slug
export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        let post;

        // Try to find by MongoDB ObjectId first, then by slug
        if (validateObjectId(id)) {
            post = await Blog.findById(id).select('-__v').lean();
        } else {
            post = await Blog.findOne({ slug: id }).select('-__v').lean();
        }

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Check if user can view unpublished posts
        if (post.status !== 'published' && (!req.user || (!req.user.isAdmin && post.userId.toString() !== req.user._id.toString()))) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to unpublished post'
            });
        }

        res.json({
            success: true,
            data: { post }
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blog post',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Increment view count for a blog post
export const incrementViews = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validateObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID format'
            });
        }

        const post = await Blog.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true, select: 'views' }
        );

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }

        res.json({
            success: true,
            data: { views: post.views }
        });
    } catch (error) {
        console.error('Error incrementing views:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update view count',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Create a new blog post
export const createPost = async (req, res) => {
    console.log('=== CREATE BLOG POST REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User:', req.user ? { id: req.user._id, name: req.user.name, isAdmin: req.user.isAdmin } : 'Not authenticated');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('File:', req.file ? { filename: req.file.filename, size: req.file.size } : 'No file');

    try {
        // Check authentication
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required to create blog posts'
            });
        }

        const { title, content, category, tags, status, summary, metaDescription } = req.body;

        // Validate required fields
        if (!title || !content || !category || !summary) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                required: ['title', 'content', 'category', 'summary']
            });
        }

        // Validate category
        const validCategories = [
            'Health Tips',
            'Medical News',
            'Patient Stories',
            'Healthcare Technology',
            'Wellness',
            'Nutrition',
            'Mental Health',
            'Preventive Care'
        ];

        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category',
                validCategories
            });
        }

        // Parse and validate tags
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
                if (!Array.isArray(parsedTags)) {
                    parsedTags = [];
                }
                // Limit to 10 tags and sanitize
                parsedTags = parsedTags
                    .slice(0, 10)
                    .map(tag => tag.toString().trim())
                    .filter(tag => tag.length > 0);
            } catch (error) {
                console.warn('Error parsing tags:', error);
                parsedTags = [];
            }
        }

        // Generate unique slug
        let slug = generateSlug(title);
        let slugExists = await Blog.findOne({ slug }).lean();
        let counter = 1;

        while (slugExists) {
            slug = `${generateSlug(title)}-${counter}`;
            slugExists = await Blog.findOne({ slug }).lean();
            counter++;
        }

        // Calculate read time
        const readTime = calculateReadTime(content);

        // Handle featured image upload to Cloudinary
        let featuredImage = null;
        let featuredImagePublicId = null;

        if (req.file) {
            try {
                const uploadResult = await uploadToCloudinary(req.file, 'prescripto/blog-images');
                featuredImage = uploadResult.url;
                featuredImagePublicId = uploadResult.publicId;
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload featured image'
                });
            }
        }

        // Determine publication status
        const isPublished = status === 'published';
        const publishedAt = isPublished ? new Date() : null;

        // Create new blog post
        const blogPost = new Blog({
            title: title.trim(),
            content: content.trim(),
            summary: summary.trim(),
            metaDescription: metaDescription ? metaDescription.trim() : summary.trim(),
            category,
            slug,
            readTime,
            isPublished,
            publishedAt,
            tags: parsedTags,
            status: status || 'draft',
            userId: req.user._id,
            userName: req.user.name || 'Anonymous',
            userImage: req.user.profileImage || null,
            featuredImage,
            featuredImagePublicId,
            views: 0
        });

        // Save to database
        const savedPost = await blogPost.save();
        console.log('Blog post created successfully:', savedPost._id);

        res.status(201).json({
            success: true,
            message: 'Blog post created successfully',
            data: { post: savedPost }
        });

    } catch (error) {
        console.error('Error creating blog post:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create blog post',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update an existing blog post
export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validateObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID format'
            });
        }

        // Find the existing post
        const existingPost = await Blog.findById(id);
        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Check permissions
        if (!req.user.isAdmin && existingPost.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this post'
            });
        }

        const { title, content, category, tags, status, summary, metaDescription } = req.body;
        const updateData = {};

        // Update fields if provided
        if (title) {
            updateData.title = title.trim();
            // Regenerate slug if title changed
            if (title.trim() !== existingPost.title) {
                let newSlug = generateSlug(title);
                let slugExists = await Blog.findOne({ slug: newSlug, _id: { $ne: id } }).lean();
                let counter = 1;

                while (slugExists) {
                    newSlug = `${generateSlug(title)}-${counter}`;
                    slugExists = await Blog.findOne({ slug: newSlug, _id: { $ne: id } }).lean();
                    counter++;
                }
                updateData.slug = newSlug;
            }
        }

        if (content) {
            updateData.content = content.trim();
            updateData.readTime = calculateReadTime(content);
        }

        if (summary) updateData.summary = summary.trim();
        if (metaDescription) updateData.metaDescription = metaDescription.trim();
        if (category) updateData.category = category;

        // Handle tags
        if (tags !== undefined) {
            try {
                const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
                updateData.tags = Array.isArray(parsedTags) ?
                    parsedTags.slice(0, 10).map(tag => tag.toString().trim()).filter(tag => tag.length > 0) :
                    [];
            } catch (error) {
                updateData.tags = [];
            }
        }

        // Handle status changes
        if (status) {
            updateData.status = status;
            updateData.isPublished = status === 'published';

            // Set publishedAt if publishing for the first time
            if (status === 'published' && !existingPost.publishedAt) {
                updateData.publishedAt = new Date();
            }
        }

        // Handle featured image update
        if (req.file) {
            try {
                // Delete old image from Cloudinary if exists
                if (existingPost.featuredImagePublicId) {
                    await deleteFromCloudinary(existingPost.featuredImagePublicId);
                }

                // Upload new image
                const uploadResult = await uploadToCloudinary(req.file, 'prescripto/blog-images');
                updateData.featuredImage = uploadResult.url;
                updateData.featuredImagePublicId = uploadResult.publicId;
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload featured image'
                });
            }
        }

        // Update the post
        const updatedPost = await Blog.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true, select: '-__v' }
        );

        res.json({
            success: true,
            message: 'Blog post updated successfully',
            data: { post: updatedPost }
        });

    } catch (error) {
        console.error('Error updating blog post:', error);

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update blog post',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete a blog post
export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!validateObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID format'
            });
        }

        // Find the post
        const post = await Blog.findById(id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Check permissions
        if (!req.user.isAdmin && post.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this post'
            });
        }

        // Delete featured image from Cloudinary if exists
        if (post.featuredImagePublicId) {
            await deleteFromCloudinary(post.featuredImagePublicId);
        }

        // Delete the post
        await Blog.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Blog post deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete blog post',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get blog statistics (for admin dashboard)
export const getBlogStats = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const [
            totalPosts,
            publishedPosts,
            draftPosts,
            aggregatedStats,
            recentPosts,
            topPosts,
            topCategories
        ] = await Promise.all([
            Blog.countDocuments(),
            Blog.countDocuments({ status: 'published' }),
            Blog.countDocuments({ status: 'draft' }),
            Blog.aggregate([
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: '$views' },
                        totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
                        totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
                    }
                }
            ]),
            Blog.find().sort({ createdAt: -1 }).limit(5).select('title createdAt status views'),
            Blog.find({ status: 'published' }).sort({ views: -1 }).limit(5).select('title views likes comments category publishedAt'),
            Blog.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        const stats = aggregatedStats[0] || { totalViews: 0, totalLikes: 0, totalComments: 0 };

        res.json({
            success: true,
            data: {
                totalPosts,
                publishedPosts,
                draftPosts,
                totalViews: stats.totalViews,
                totalLikes: stats.totalLikes,
                totalComments: stats.totalComments,
                recentPosts,
                topPosts,
                topCategories
            }
        });

    } catch (error) {
        console.error('Error fetching blog stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blog statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get available categories
export const getCategories = async (req, res) => {
    try {
        const categories = [
            'Health Tips',
            'Medical News',
            'Patient Stories',
            'Healthcare Technology',
            'Wellness',
            'Nutrition',
            'Mental Health',
            'Preventive Care'
        ];

        res.json({
            success: true,
            data: { categories }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
};

// Toggle user posting permission (Admin only)
export const toggleUserPostingPermission = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { userId, permission } = req.body;

        // Validate userId
        if (!validateObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Validate permission boolean
        if (typeof permission !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Permission must be a boolean value'
            });
        }

        // Update all posts by this user to set posting permission
        const updateResult = await Blog.updateMany(
            { userId },
            { $set: { userCanPost: permission } }
        );

        // If no posts found for this user, still return success
        // as the permission setting is applied for future posts
        res.json({
            success: true,
            message: `User posting permission ${permission ? 'granted' : 'revoked'} successfully`,
            data: {
                userId,
                permission,
                postsUpdated: updateResult.modifiedCount
            }
        });

    } catch (error) {
        console.error('Error toggling user posting permission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user posting permission',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get posts by specific user (for user dashboard)
export const getPostsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, status = 'all' } = req.query;

        // Validate userId
        if (!validateObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Check if user can view these posts (own posts or admin)
        if (!req.user.isAdmin && req.user._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these posts'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = { userId };

        // Filter by status if specified
        if (status !== 'all') {
            query.status = status;
        }

        const [posts, total] = await Promise.all([
            Blog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-__v')
                .lean(),
            Blog.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalPosts: total,
                    postsPerPage: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user posts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Bulk delete posts (Admin only)
export const bulkDeletePosts = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { postIds } = req.body;

        // Validate postIds array
        if (!Array.isArray(postIds) || postIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Post IDs array is required'
            });
        }

        // Validate all post IDs
        const invalidIds = postIds.filter(id => !validateObjectId(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID format',
                invalidIds
            });
        }

        // Find posts to get their featured images for Cloudinary cleanup
        const postsToDelete = await Blog.find({
            _id: { $in: postIds }
        }).select('featuredImagePublicId').lean();

        // Delete featured images from Cloudinary
        const deleteImagePromises = postsToDelete
            .filter(post => post.featuredImagePublicId)
            .map(post => deleteFromCloudinary(post.featuredImagePublicId));

        await Promise.allSettled(deleteImagePromises);

        // Delete posts from database
        const deleteResult = await Blog.deleteMany({
            _id: { $in: postIds }
        });

        res.json({
            success: true,
            message: `${deleteResult.deletedCount} blog posts deleted successfully`,
            data: {
                deletedCount: deleteResult.deletedCount,
                requestedCount: postIds.length
            }
        });

    } catch (error) {
        console.error('Error bulk deleting posts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete posts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};