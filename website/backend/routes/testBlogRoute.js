import express from 'express';

const router = express.Router();

router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Test route works!' });
});

router.get('/posts', (req, res) => {
    res.json({ 
        success: true, 
        data: { 
            posts: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalPosts: 0
            }
        }
    });
});

export default router;
