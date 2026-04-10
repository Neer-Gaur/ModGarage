import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, ChatCircle, ShareNetwork, Plus, ArrowRight, DotsThreeVertical } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
    if (activeComments === postId) { setActiveComments(null); return; }
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
    <div className="min-h-screen bg-mg-surface" data-testid="community-page">
      <main className="pt-32 pb-24 max-w-5xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-5xl md:text-7xl font-headline font-black uppercase tracking-tighter text-mg-text mb-4">
            The <span className="text-mg-red">Feed</span>
          </h1>
          <p className="font-body text-neutral-400 text-lg max-w-xl border-l-4 border-mg-red pl-6">
            Engineered for inspiration. Browse the latest high-performance builds from the ModGarage community.
          </p>
        </header>

        {/* Feed */}
        {loading ? (
          <div className="flex flex-col gap-24">
            {[1, 2].map(i => (
              <div key={i} className="bg-mg-surface-dim">
                <div className="p-6 bg-mg-surface-card"><div className="h-12 bg-mg-surface-bright animate-pulse w-48" /></div>
                <div className="aspect-video bg-mg-surface-bright animate-pulse" />
                <div className="p-8"><div className="h-6 bg-mg-surface-bright animate-pulse w-3/4" /></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 font-body mb-4">No posts yet. Be the first to share your build!</p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="bg-mg-red text-white px-6 py-3 font-headline font-bold uppercase tracking-widest" data-testid="create-post-btn">
                  Share Your Build
                </button>
              </DialogTrigger>
              <DialogContent className="bg-mg-surface-card border-white/10 max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-headline text-sm font-bold uppercase tracking-wider text-mg-text">New Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <textarea
                    value={newPost.caption}
                    onChange={e => setNewPost(p => ({ ...p, caption: e.target.value }))}
                    placeholder="Share your build..."
                    rows={3}
                    className="w-full bg-mg-surface border border-white/10 px-4 py-3 text-mg-text font-body text-sm focus:border-mg-red focus:outline-none transition-colors resize-none"
                    data-testid="post-caption-input"
                  />
                  <input
                    value={newPost.media_url}
                    onChange={e => setNewPost(p => ({ ...p, media_url: e.target.value }))}
                    placeholder="Image URL (optional)"
                    className="w-full bg-mg-surface border border-white/10 px-4 py-3 text-mg-text font-body text-sm focus:border-mg-red focus:outline-none transition-colors"
                    data-testid="post-media-input"
                  />
                  <button
                    onClick={handleCreatePost}
                    className="w-full bg-mg-red text-white font-headline text-xs tracking-widest uppercase py-3 hover:brightness-110 transition-colors"
                    data-testid="submit-post-btn"
                  >
                    Publish
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="flex flex-col gap-24">
            {posts.map(post => (
              <article key={post.post_id} className="group relative bg-mg-surface-dim" data-testid={`post-${post.post_id}`}>
                {/* Post Header */}
                <div className="flex items-center justify-between p-6 bg-mg-surface-card">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-mg-surface-bright overflow-hidden">
                      {post.author?.picture ? (
                        <img src={post.author.picture} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-mg-text font-headline font-bold">
                          {post.author?.name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-headline font-bold uppercase tracking-wider text-mg-text">{post.author?.name || 'Anonymous'}</p>
                      <p className="text-xs font-label uppercase tracking-widest text-mg-cyan">Community Member</p>
                    </div>
                  </div>
                  <DotsThreeVertical size={20} className="text-neutral-500 cursor-pointer hover:text-mg-orange transition-colors" />
                </div>

                {/* Post Image */}
                {post.media_urls?.[0] && (
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={post.media_urls[0]}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Content Grid */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <p className="font-body text-lg text-mg-text mb-6 leading-relaxed">{post.caption}</p>
                    <div className="flex items-center space-x-8">
                      <button
                        onClick={() => handleLike(post.post_id)}
                        className="flex items-center space-x-2 text-mg-orange hover:text-mg-red transition-colors"
                        data-testid={`like-${post.post_id}`}
                      >
                        <Heart size={20} weight="fill" />
                        <span className="font-headline font-bold">{post.likes_count}</span>
                      </button>
                      <button
                        onClick={() => loadComments(post.post_id)}
                        className="flex items-center space-x-2 text-neutral-400 hover:text-mg-text transition-colors"
                        data-testid={`comment-toggle-${post.post_id}`}
                      >
                        <ChatCircle size={20} />
                        <span className="font-headline font-bold">{post.comments_count}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-neutral-400 hover:text-mg-text transition-colors">
                        <ShareNetwork size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Tagged Products */}
                  {post.tagged_product_details?.length > 0 && (
                    <div className="bg-mg-surface-card p-6">
                      <h4 className="text-xs font-label uppercase tracking-widest text-mg-red mb-4 font-bold">Tagged Parts</h4>
                      <ul className="space-y-3">
                        {post.tagged_product_details.map(tp => (
                          <li
                            key={tp.product_id}
                            onClick={() => navigate(`/product/${tp.slug}`)}
                            className="flex items-center justify-between group/part cursor-pointer"
                          >
                            <span className="text-sm font-headline text-neutral-400 group-hover/part:text-mg-text transition-colors">{tp.name}</span>
                            <ArrowRight size={12} className="text-white/20 group-hover/part:text-mg-cyan transition-colors" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                {activeComments === post.post_id && (
                  <div className="px-8 pb-8 border-t border-white/5 pt-6">
                    {comments.map(c => (
                      <div key={c.comment_id} className="mb-3 flex items-start gap-3">
                        <div className="w-8 h-8 bg-mg-surface-bright shrink-0 flex items-center justify-center text-xs font-headline text-mg-text">
                          {c.author?.name?.[0] || '?'}
                        </div>
                        <div>
                          <span className="font-headline text-xs font-bold text-mg-text mr-2">{c.author?.name}</span>
                          <span className="font-body text-xs text-neutral-400">{c.content}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-4">
                      <input
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-mg-surface border border-white/10 px-4 py-3 text-mg-text font-body text-xs focus:border-mg-red focus:outline-none"
                        onKeyDown={e => e.key === 'Enter' && handleComment(post.post_id)}
                        data-testid={`comment-input-${post.post_id}`}
                      />
                      <button
                        onClick={() => handleComment(post.post_id)}
                        className="bg-mg-red text-white px-4 py-3 font-headline font-bold text-xs uppercase tracking-widest"
                        data-testid={`comment-submit-${post.post_id}`}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="fixed bottom-12 right-12 w-16 h-16 bg-mg-red text-white shadow-[0_0_30px_rgba(250,93,0,0.4)] flex items-center justify-center group active:scale-90 transition-all z-50"
            data-testid="create-post-btn"
          >
            <Plus size={28} weight="bold" className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </DialogTrigger>
        <DialogContent className="bg-mg-surface-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-sm font-bold uppercase tracking-wider text-mg-text">Share Your Build</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <textarea
              value={newPost.caption}
              onChange={e => setNewPost(p => ({ ...p, caption: e.target.value }))}
              placeholder="What did you build today?"
              rows={4}
              className="w-full bg-mg-surface border border-white/10 px-4 py-3 text-mg-text font-body text-sm focus:border-mg-red focus:outline-none transition-colors resize-none"
              data-testid="post-caption-input"
            />
            <input
              value={newPost.media_url}
              onChange={e => setNewPost(p => ({ ...p, media_url: e.target.value }))}
              placeholder="Image URL (optional)"
              className="w-full bg-mg-surface border border-white/10 px-4 py-3 text-mg-text font-body text-sm focus:border-mg-red focus:outline-none transition-colors"
              data-testid="post-media-input"
            />
            <button
              onClick={handleCreatePost}
              className="w-full bg-mg-red text-white font-headline font-bold text-xs tracking-widest uppercase py-4 hover:brightness-110 transition-colors"
              data-testid="submit-post-btn"
            >
              Publish
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
