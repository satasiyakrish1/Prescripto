import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createAxiosWithRetry } from '../utils/connectionHelper';
import { useAdmin } from '../context/AdminContext';

const BlogEditor = ({ post, onSave, onCancel }) => {
    const axiosInstance = createAxiosWithRetry();
    const { aToken } = useAdmin();
    const [title, setTitle] = useState(post?.title || '');
    const [content, setContent] = useState(post?.content || '');
    const [tags, setTags] = useState(post?.tags || []);
    const [newTag, setNewTag] = useState('');
    const [category, setCategory] = useState(post?.category || '');
    const [status, setStatus] = useState(post?.status || 'draft');
    const [featuredImage, setFeaturedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = [
        'Health Tips',
        'Medical News',
        'Patient Stories',
        'Healthcare Technology',
        'Wellness'
    ];

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFeaturedImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('category', category);
            formData.append('status', status);
            formData.append('tags', JSON.stringify(tags));
            if (featuredImage) {
                formData.append('image', featuredImage);
            }

            const endpoint = post ? `/api/admin/blog/${post._id}` : '/api/admin/blog';
            const method = post ? 'put' : 'post';

            const response = await axiosInstance[method](endpoint, formData, {
                headers: {
                    'aToken': aToken,
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${aToken}`
                }
            });

            // Check if we have a response and data
            if (response && response.data) {
                console.log('API response:', response.data);
                // Handle different response structures
                if (response.data.post) {
                    // If the response has a post object directly
                    onSave(response.data.post);
                } else if (response.data.success) {
                    // For responses with success flag
                    if (response.data.posts && response.data.posts.length > 0) {
                        // If posts array is available
                        onSave(response.data.posts[0]);
                    } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
                        // If the response itself might be the post object
                        // Extract only the relevant post data to avoid passing the success flag
                        const postData = { ...response.data };
                        delete postData.success;
                        onSave(postData);
                    } else {
                        // Fallback
                        onSave(response.data);
                    }
                } else {
                    setError(response.data.message || 'Failed to save post');
                }
            } else {
                setError('Invalid response from server');
            }
        } catch (error) {
            setError('Error saving post: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                    </label>
                    <ReactQuill
                        value={content}
                        onChange={setContent}
                        className="h-64 mb-12"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                    </label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add a tag"
                        />
                        <button
                            type="button"
                            onClick={handleAddTag}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Featured Image
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>

                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 disabled:bg-blue-300"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (post ? 'Update' : 'Create')} Post
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BlogEditor;