import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    summary: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
    },
    slug: {
        type: String,
        unique: true,
        required: true
    },
    featuredImage: {
        type: String,
        required: false,
        default: null
    },
    featuredImagePublicId: {
        type: String,
        required: false,
        default: null
    },
    readTime: {
        type: Number,
        required: true,
        default: 5
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Health Tips',
            'Medical News',
            'Patient Stories',
            'Healthcare Technology',
            'Wellness',
            'Nutrition',
            'Mental Health',
            'Preventive Care'
        ]
    },
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userImage: {
        type: String
    },
    userCanPost: {
        type: Boolean,
        default: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;