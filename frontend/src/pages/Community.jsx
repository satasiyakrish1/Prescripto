import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const Community = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await fetch('/api/community/posts');
            const data = await response.json();
            if (data.success) {
                setPosts(data.posts);
            } else {
                setError('Failed to fetch posts');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = () => {
        navigate('/community/create');
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    if (error) return <div className="text-red-500 text-center py-4">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <SEO title="Medical Community - Prescripto" description="Join our medical community to share knowledge and discuss cases" />
            
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Medical Community</h1>
                <button
                    onClick={handleCreatePost}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Create Post
                </button>
            </div>

            <div className="grid gap-6">
                {posts.map((post) => (
                    <div key={post._id} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <img
                                src={post.userImage || '/assets/profile_pic.png'}
                                alt={post.userName}
                                className="w-10 h-10 rounded-full mr-4"
                            />
                            <div>
                                <h3 className="font-semibold text-gray-800">{post.userName}</h3>
                                <p className="text-sm text-gray-500">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                        <p className="text-gray-600 mb-4">{post.content}</p>
                        <div className="flex gap-2 mb-4">
                            {post.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                            <button className="flex items-center mr-4">
                                <span className="mr-1">{post.likes.length}</span> Likes
                            </button>
                            <button className="flex items-center">
                                <span className="mr-1">{post.comments.length}</span> Comments
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Community;