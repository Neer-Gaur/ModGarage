import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, ChatCircle, PaperPlaneTilt, Plus, Tag } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ caption: '', media_url: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeComments, setActiveComments] = useState(null);
  const [comments, setComments] = useState([]);

  const loadPosts = async () => {
    try {
      const r = await axios.get(`${API}/posts`);
      setPosts(r.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadPosts(); }, []);

  const handleCreatePost = async () => {
    if (!newPost.caption.trim()) return;
    try {
      await axios.post(`${API}/posts`, {
        caption: newPost.caption,
        media_urls: newPost.media_url ? [newPost.media_url] : [],
        tagged_products: [],
      }, { withCredentials: true });
      toast.success('Post created!');
      setNewPost({ caption: '', media_url: '' });
      setDialogOpen(false);
      loadPosts();
    } catch { toast.error('Failed to create post'); }
  };

  const handleLike = async (postId) => {
    try {
      const r = await axios.post(`${API}/posts/${postId}/like`, {}, { withCredentials: true });
      setPosts(prev => prev.map(p =>
        p.post_id === postId
          ? { ...p, likes_count: r.data.liked ? p.likes_count + 1 : p.likes_count - 1 }
          : p
      ));
    } catch {}
  };

  const loadComments = async (postId) => {
    setActiveComments(postId);
    try {
      const r = await axios.get(`${API}/posts/${postId}/comments`);
      setComments(r.data);
    } catch {}
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      await axios.post(`${API}/posts/${postId}/comments`, { content: commentText }, { withCredentials: true });
      setCommentText('');
      loadComments(postId);
      setPosts(prev => prev.map(p => p.post_id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-mg-dark pt-24 pb-12 px-6" data-testid="community-page">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-3">Social</p>
            <h1 className="font-unbounded text-3xl md:text-4xl font-bold tracking-tight uppercase text-white">Community</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="bg-mg-red text-white font-mono text-xs tracking-wider uppercase px-4 py-2.5 hover:bg-[#E62600] transition-colors flex items-center gap-2" data-testid="create-post-btn">
                <Plus size={14} weight="bold" /> Post
              </button>
            </DialogTrigger>
            <DialogContent className="bg-mg-surface border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle className="font-unbounded text-sm font-bold uppercase tracking-wider text-white">New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <textarea
                  value={newPost.caption}
                  onChange={e => setNewPost(p => ({ ...p, caption: e.target.value }))}
                  placeholder="Share your build..."
                  rows={3}
                  className="w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white font-manrope text-sm focus:border-mg-red focus:outline-none transition-colors resize-none"
                  data-testid="post-caption-input"
                />
                <input
                  value={newPost.media_url}
                  onChange={e => setNewPost(p => ({ ...p, media_url: e.target.value }))}
                  placeholder="Image URL (optional)"
                  className="w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white font-manrope text-sm focus:border-mg-red focus:outline-none transition-colors"
                  data-testid="post-media-input"
                />
                <button
                  onClick={handleCreatePost}
                  className="w-full bg-mg-red text-white font-unbounded text-xs tracking-widest uppercase py-3 hover:bg-[#E62600] transition-colors"
                  data-testid="submit-post-btn"
                >
                  Publish
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="bg-mg-surface h-96 animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 font-manrope">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-[1px] bg-white/5">
            {posts.map(post => (
              <div key={post.post_id} className="bg-mg-dark" data-testid={`post-${post.post_id}`}>
                {/* Post Header */}
                <div className="px-4 py-3 flex items-center gap-3">
                  {post.author?.picture ? (
                    <img src={post.author.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-mg-surface flex items-center justify-center font-mono text-xs text-white/40">
                      {post.author?.name?.[0] || '?'}
                    </div>
                  )}
                  <span className="font-manrope text-sm font-semibold text-white">{post.author?.name}</span>
                </div>

                {/* Post Image */}
                {post.media_urls?.[0] && (
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" />
                    {/* Hotspots for tagged products */}
                    {post.tagged_product_details?.map((tp, idx) => (
                      <div
                        key={tp.product_id}
                        className="absolute group cursor-pointer"
                        style={{ top: `${30 + idx * 20}%`, left: `${20 + idx * 25}%` }}
                        onClick={() => navigate(`/product/${tp.slug}`)}
                      >
                        <div className="w-6 h-6 bg-mg-red/80 rounded-full flex items-center justify-center hotspot-pulse">
                          <Tag size={12} weight="bold" className="text-white" />
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-mg-dark/95 backdrop-blur-sm border border-white/10 px-3 py-2 whitespace-nowrap">
                            <p className="font-manrope text-xs text-white font-semibold">{tp.name}</p>
                            <p className="font-mono text-[10px] text-mg-red">{formatINR(tp.price)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 py-3 flex items-center gap-6">
                  <button onClick={() => handleLike(post.post_id)} className="flex items-center gap-2 text-white/40 hover:text-mg-red transition-colors" data-testid={`like-${post.post_id}`}>
                    <Heart size={20} weight="bold" /> <span className="font-mono text-xs">{post.likes_count}</span>
                  </button>
                  <button onClick={() => loadComments(post.post_id)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors" data-testid={`comment-toggle-${post.post_id}`}>
                    <ChatCircle size={20} weight="bold" /> <span className="font-mono text-xs">{post.comments_count}</span>
                  </button>
                </div>

                {/* Caption */}
                <div className="px-4 pb-3">
                  <p className="text-white/70 font-manrope text-sm"><span className="font-semibold text-white mr-2">{post.author?.name}</span>{post.caption}</p>
                </div>

                {/* Comments */}
                {activeComments === post.post_id && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    {comments.map(c => (
                      <div key={c.comment_id} className="mb-2">
                        <span className="font-manrope text-xs font-semibold text-white mr-2">{c.author?.name}</span>
                        <span className="font-manrope text-xs text-white/60">{c.content}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-3">
                      <input
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-[#0A0A0A] border border-white/10 px-3 py-2 text-white font-manrope text-xs focus:border-mg-red focus:outline-none"
                        onKeyDown={e => e.key === 'Enter' && handleComment(post.post_id)}
                        data-testid={`comment-input-${post.post_id}`}
                      />
                      <button
                        onClick={() => handleComment(post.post_id)}
                        className="bg-mg-red text-white px-3 py-2"
                        data-testid={`comment-submit-${post.post_id}`}
                      >
                        <PaperPlaneTilt size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
