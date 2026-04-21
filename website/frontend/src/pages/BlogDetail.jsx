import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Eye, Tag, ArrowLeft, Share2, ThumbsUp,
  Download, Sparkles, X, User, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { backendUrl, token, userData } = useContext(AppContext);
  const [blog, setBlog] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchBlogDetail();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchBlogDetail = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${backendUrl}/api/admin/blog/posts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.data.success) {
        const post = response.data.data.post;
        setBlog(post);
        setLikeCount(post.likes ? post.likes.length : 0);

        if (userData && post.likes && post.likes.includes(userData._id)) {
          setIsLiked(true);
        }

        await axios.post(`${backendUrl}/api/admin/blog/posts/${id}/views`);

        const relatedResponse = await axios.get(`${backendUrl}/api/admin/blog/posts`, {
          params: {
            category: post.category,
            status: 'published',
            limit: 3
          }
        });

        if (relatedResponse.data.success) {
          const related = relatedResponse.data.data.posts.filter(p => p._id !== post._id);
          setRelatedPosts(related.slice(0, 3));
        }
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      toast.error('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!token) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/admin/blog/posts/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setIsLiked(response.data.data.isLiked);
        setLikeCount(response.data.data.likes);
        toast.success(response.data.data.isLiked ? 'Post liked!' : 'Like removed');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to update like');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.summary,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(blog.title, 20, 20, { maxWidth: 170 });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`By ${blog.userName} | ${new Date(blog.createdAt).toLocaleDateString()}`, 20, 40);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(blog.summary, 20, 50, { maxWidth: 170 });
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = blog.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(textContent, 170);
    doc.text(splitText, 20, 70);
    doc.save(`${blog.slug}.pdf`);
    toast.success('Download started!');
  };

  const handleAIAnalysis = async () => {
    if (!token) {
      toast.error('Please login to use AI analysis');
      return;
    }

    setShowAnalysis(true);
    if (analysisData) return;

    setAnalyzing(true);
    try {
      const response = await axios.get(
        `${backendUrl}/api/admin/blog/posts/${id}/analyze`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAnalysisData(response.data.data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing post:', error);
      toast.error('Failed to analyze post');
      setShowAnalysis(false);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
        style={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Back to Articles
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Sidebar - Actions */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-32 flex flex-col gap-6 items-center">
              <div className="flex flex-col gap-2 items-center group">
                <button
                  onClick={handleLike}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isLiked
                      ? 'bg-red-50 text-red-500 shadow-sm'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                  title="Like this post"
                >
                  <ThumbsUp size={20} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                  {likeCount}
                </span>
              </div>

              <button
                onClick={handleShare}
                className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center transition-all duration-300"
                title="Share"
              >
                <Share2 size={20} />
              </button>

              <button
                onClick={handleDownload}
                className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center transition-all duration-300"
                title="Download PDF"
              >
                <Download size={20} />
              </button>

              <div className="w-8 h-[1px] bg-gray-200 my-2"></div>

              <button
                onClick={handleAIAnalysis}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-600 hover:shadow-md hover:scale-110 flex items-center justify-center transition-all duration-300 border border-purple-100"
                title="AI Analysis"
              >
                <Sparkles size={20} />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8"
          >
            {/* Article Header */}
            <header className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold tracking-wide uppercase rounded-full">
                  {blog.category}
                </span>
                <span className="text-gray-400 text-sm">•</span>
                <span className="text-gray-500 text-sm font-medium">{blog.readTime} min read</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                {blog.title}
              </h1>

              <div className="flex items-center justify-between py-6 border-y border-gray-100">
                <div className="flex items-center gap-3">
                  {blog.userImage ? (
                    <img
                      src={blog.userImage}
                      alt={blog.userName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <User size={20} />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{blog.userName}</p>
                    <p className="text-xs text-gray-500">{new Date(blog.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Eye size={16} />
                    <span>{blog.views}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {blog.featuredImage && (
              <div className="mb-10 rounded-2xl overflow-hidden shadow-sm">
                <img
                  src={blog.featuredImage}
                  alt={blog.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-blue-600 prose-img:rounded-xl prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 text-sm rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Tag size={14} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Sidebar - Related */}
          <div className="lg:col-span-3 space-y-8">
            <div className="sticky top-32">
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Related Articles</h3>
              <div className="space-y-6">
                {relatedPosts.map((post) => (
                  <Link
                    key={post._id}
                    to={`/blog/${post.slug || post._id}`}
                    className="group block"
                  >
                    <div className="flex gap-4 items-start">
                      {post.featuredImage && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 line-clamp-2 text-sm group-hover:text-blue-600 transition-colors mb-1">
                          {post.title}
                        </h4>
                        <span className="text-xs text-gray-500">{post.readTime} min read</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mobile Actions (Visible only on small screens) */}
              <div className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex items-center gap-6 border border-gray-100 z-40">
                <button onClick={handleLike} className="flex items-center gap-2 text-gray-600">
                  <ThumbsUp size={20} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-red-500" : ""} />
                  <span className="text-sm font-medium">{likeCount}</span>
                </button>
                <div className="w-[1px] h-4 bg-gray-200"></div>
                <button onClick={handleShare} className="text-gray-600">
                  <Share2 size={20} />
                </button>
                <button onClick={handleAIAnalysis} className="text-purple-600">
                  <Sparkles size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAnalysis(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">AI Insights</h2>
                    <p className="text-xs text-gray-500">Powered by Gemini</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-purple-100 rounded-full"></div>
                      <div className="w-12 h-12 border-4 border-purple-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="mt-4 text-gray-500 font-medium animate-pulse">Analyzing content...</p>
                  </div>
                ) : (
                  <div className="prose prose-purple max-w-none">
                    <div className="whitespace-pre-line text-gray-700 leading-relaxed text-base">
                      {analysisData}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogDetail;
