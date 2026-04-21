import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    TrendingUp,
    MessageCircle,
    ThumbsUp,
    Eye,
    Award,
    Activity
} from 'lucide-react';

const BlogAnalytics = ({ stats }) => {
    if (!stats) return null;

    const {
        totalViews = 0,
        totalLikes = 0,
        totalComments = 0,
        topPosts = [],
        topCategories = []
    } = stats;

    // Calculate engagement rate
    const engagementRate = totalViews > 0
        ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(2)
        : 0;

    // Prepare data for charts
    const categoryData = topCategories.map(cat => ({
        name: cat._id,
        count: cat.count
    }));

    const topPostsData = topPosts.map(post => ({
        name: post.title.length > 20 ? post.title.substring(0, 20) + '...' : post.title,
        views: post.views,
        likes: post.likes ? post.likes.length : 0,
        comments: post.comments ? post.comments.length : 0,
        fullTitle: post.title
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Eye className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Total
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{totalViews.toLocaleString()}</h3>
                    <p className="text-sm text-gray-500 mt-1">Total Views</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-pink-50 rounded-lg">
                            <ThumbsUp className="w-6 h-6 text-pink-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">
                            Lifetime
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{totalLikes.toLocaleString()}</h3>
                    <p className="text-sm text-gray-500 mt-1">Total Likes</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <MessageCircle className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">
                            Lifetime
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{totalComments.toLocaleString()}</h3>
                    <p className="text-sm text-gray-500 mt-1">Total Comments</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <Activity className="w-6 h-6 text-orange-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">
                            (Likes+Comments)/Views
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{engagementRate}%</h3>
                    <p className="text-sm text-gray-500 mt-1">Engagement Rate</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Posts Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        Top Performing Posts
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topPostsData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend />
                                <Bar dataKey="views" name="Views" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="likes" name="Likes" fill="#EC4899" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Category Distribution</h3>
                    <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="count"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Posts Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Detailed Performance</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topPosts.map((post, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {post.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                            {post.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {post.views}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {post.likes ? post.likes.length : 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {post.comments ? post.comments.length : 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BlogAnalytics;
