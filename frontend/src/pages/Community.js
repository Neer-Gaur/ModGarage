import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowFatUp, ArrowFatDown, ChatCircle, ShareNetwork, BookmarkSimple,
  Plus, ArrowRight, DotsThreeVertical, Users, Fire, Clock, TrendUp,
  CaretDown, Hash, X, ImageSquare, Link as LinkIcon, Copy, Check
} from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ChannelPill({ channel, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap transition-all text-xs font-bold tracking-widest uppercase font-label ${
        active
          ? 'bg-mg-red text-white'
          : 'bg-mg-surface-card hover:bg-mg-surface-high text-neutral-400 hover:text-mg-text'
      }`}
      data-testid={`channel-${channel?.slug || 'all'}`}
    >
      {channel ? <Hash size={12} weight="bold" /> : <Fire size={12} weight="bold" />}
      {channel?.name || 'All Channels'}
    </button>
  );
}

function VoteButtons({ post, onVote }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <button
        onClick={() => onVote(post.post_id, 'up')}
        className="p-1.5 hover:bg-mg-red/20 transition-colors group"
        data-testid={`upvote-${post.post_id}`}
      >
        <ArrowFatUp size={22} weight="bold" className="text-neutral-500 group-hover:text-mg-red transition-colors" />
      </button>
      <span className={`font-headline font-black text-lg tabular-nums ${
        (post.vote_count || 0) > 0 ? 'text-mg-red' : (post.vote_count || 0) < 0 ? 'text-blue-400' : 'text-neutral-500'
      }`}>
        {post.vote_count || 0}
      </span>
      <button
        onClick={() => onVote(post.post_id, 'down')}
        className="p-1.5 hover:bg-blue-500/20 transition-colors group"
        data-testid={`downvote-${post.post_id}`}
      >
        <ArrowFatDown size={22} weight="bold" className="text-neutral-500 group-hover:text-blue-400 transition-colors" />
      </button>
    </div>
  );
}

function PostCard({ post, onVote, onComment, onShare, onSave, user }) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    try {
      const r = await axios.get(`${API}/posts/${post.post_id}/comments`);
      setComments(r.data);
    } catch {}
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    if (!user) { toast.error('Login to comment'); return; }
    try {
      await axios.post(`${API}/posts/${post.post_id}/comments`, { content: commentText }, { withCredentials: true });
      setCommentText('');
      const r = await axios.get(`${API}/posts/${post.post_id}/comments`);
      setComments(r.data);
      onComment(post.post_id);
    } catch { toast.error('Failed to comment'); }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/community?post=${post.post_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  return (
    <article className="bg-mg-surface-dim hover:bg-mg-surface-card transition-colors border border-transparent hover:border-white/5" data-testid={`post-${post.post_id}`}>
      <div className="flex gap-0">
        {/* Vote Column */}
        <div className="bg-mg-surface-lowest p-3 flex flex-col items-center pt-5">
          <VoteButtons post={post} onVote={onVote} />
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-4 pb-2 text-xs">
            {post.channel && (
              <span className="font-headline font-bold text-mg-red uppercase tracking-wider flex items-center gap-1">
                <Hash size={10} weight="bold" />
                {post.channel.name}
              </span>
            )}
            <span className="text-neutral-600">|</span>
            <div className="flex items-center gap-2">
              {post.author?.picture ? (
                <img src={post.author.picture} alt="" className="w-5 h-5 object-cover rounded-full" />
              ) : (
                <div className="w-5 h-5 bg-mg-surface-bright flex items-center justify-center text-[9px] font-bold rounded-full text-mg-text">{post.author?.name?.[0]}</div>
              )}
              <span className="text-neutral-400 font-label">Posted by <span className="text-mg-orange font-bold">{post.author?.name}</span></span>
            </div>
            <span className="text-neutral-600">{timeAgo(post.created_at)}</span>
          </div>

          {/* Caption */}
          <div className="px-5 pb-3">
            <p className="font-body text-mg-text leading-relaxed">{post.caption}</p>
          </div>

          {/* Image */}
          {post.media_urls?.[0] && (
            <div className="mx-5 mb-3 max-h-[500px] overflow-hidden bg-mg-surface-lowest">
              <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}

          {/* Tagged Products */}
          {post.tagged_product_details?.length > 0 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {post.tagged_product_details.map(tp => (
                <button
                  key={tp.product_id}
                  onClick={() => navigate(`/product/${tp.slug}`)}
                  className="flex items-center gap-1.5 bg-mg-surface-lowest px-3 py-1 text-[10px] font-label uppercase tracking-widest text-neutral-400 hover:text-mg-cyan hover:bg-mg-cyan/10 transition-colors"
                >
                  <LinkIcon size={10} /> {tp.name}
                </button>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center gap-1 px-3 py-2 border-t border-white/5">
            <button
              onClick={loadComments}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-500 hover:bg-mg-surface-high hover:text-mg-text transition-colors uppercase tracking-wider"
              data-testid={`comments-${post.post_id}`}
            >
              <ChatCircle size={16} /> {post.comments_count} Comments
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-500 hover:bg-mg-surface-high hover:text-mg-text transition-colors uppercase tracking-wider"
              data-testid={`share-${post.post_id}`}
            >
              {copied ? <Check size={16} className="text-mg-cyan" /> : <ShareNetwork size={16} />} Share
            </button>
            <button
              onClick={() => onSave(post.post_id)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-500 hover:bg-mg-surface-high hover:text-mg-text transition-colors uppercase tracking-wider"
              data-testid={`save-${post.post_id}`}
            >
              <BookmarkSimple size={16} /> Save
            </button>
          </div>

          {/* Comments */}
          {showComments && (
            <div className="px-5 pb-5 border-t border-white/5 pt-4">
              {user && (
                <div className="flex gap-2 mb-5">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitComment()}
                    placeholder="What are your thoughts?"
                    className="flex-1 bg-mg-surface border border-white/10 px-4 py-3 text-sm text-mg-text font-body focus:border-mg-red focus:outline-none"
                    data-testid={`comment-input-${post.post_id}`}
                  />
                  <button
                    onClick={submitComment}
                    className="bg-mg-red text-white px-5 font-headline font-bold text-xs uppercase tracking-widest hover:brightness-110"
                    data-testid={`comment-submit-${post.post_id}`}
                  >
                    Reply
                  </button>
                </div>
              )}
              {comments.length === 0 && <p className="text-neutral-600 text-xs font-label uppercase tracking-widest">No comments yet. Be the first!</p>}
              <div className="space-y-4">
                {comments.map(c => (
                  <div key={c.comment_id} className="flex gap-3 pl-2 border-l-2 border-mg-surface-high">
                    <div className="w-7 h-7 bg-mg-surface-bright shrink-0 flex items-center justify-center text-[10px] font-bold rounded-full text-mg-text">
                      {c.author?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-headline text-xs font-bold text-mg-text">{c.author?.name}</span>
                        <span className="text-neutral-600 text-[10px]">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="font-body text-sm text-neutral-300">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [sortBy, setSortBy] = useState('new');
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ caption: '', media_url: '', channel_id: '' });
  const [newChannel, setNewChannel] = useState({ name: '', description: '' });
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);

  const loadChannels = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/channels`);
      setChannels(r.data);
    } catch {}
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort_by: sortBy });
      if (activeChannel) params.set('channel', activeChannel);
      const r = await axios.get(`${API}/posts?${params}`);
      setPosts(r.data);
    } catch {}
    setLoading(false);
  }, [activeChannel, sortBy]);

  useEffect(() => { loadChannels(); }, [loadChannels]);
  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/community';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleVote = async (postId, direction) => {
    if (!user) { handleLogin(); return; }
    try {
      const r = await axios.post(`${API}/posts/${postId}/vote`, { vote: direction }, { withCredentials: true });
      loadPosts();
    } catch {}
  };

  const handleSave = async (postId) => {
    if (!user) { handleLogin(); return; }
    try {
      const r = await axios.post(`${API}/posts/${postId}/save`, {}, { withCredentials: true });
      toast.success(r.data.saved ? 'Post saved!' : 'Post unsaved');
    } catch {}
  };

  const handleCommentAdded = (postId) => {
    setPosts(prev => prev.map(p =>
      p.post_id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
    ));
  };

  const handleCreatePost = async () => {
    if (!newPost.caption.trim()) return;
    try {
      await axios.post(`${API}/posts`, {
        caption: newPost.caption,
        media_urls: newPost.media_url ? [newPost.media_url] : [],
        tagged_products: [],
        channel_id: newPost.channel_id || null,
      }, { withCredentials: true });
      toast.success('Post published!');
      setNewPost({ caption: '', media_url: '', channel_id: '' });
      setPostDialogOpen(false);
      loadPosts();
    } catch { toast.error('Failed to create post'); }
  };

  const handleCreateChannel = async () => {
    if (!newChannel.name.trim()) return;
    try {
      await axios.post(`${API}/channels`, newChannel, { withCredentials: true });
      toast.success('Channel created!');
      setNewChannel({ name: '', description: '' });
      setChannelDialogOpen(false);
      loadChannels();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to create channel'); }
  };

  return (
    <div className="min-h-screen bg-mg-surface" data-testid="community-page">
      <main className="pt-28 pb-24 max-w-6xl mx-auto px-4 md:px-8">

        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter text-mg-text leading-none">
              Community
            </h1>
            <p className="text-neutral-500 mt-2 font-label text-xs uppercase tracking-widest">Browse channels. Share your builds. Vote on the best.</p>
          </div>
          <div className="flex gap-3">
            {user && (
              <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
                <DialogTrigger asChild>
                  <button className="border border-white/10 text-neutral-400 hover:text-mg-text hover:bg-mg-surface-high px-4 py-2 font-headline font-bold text-xs uppercase tracking-widest transition-colors" data-testid="create-channel-btn">
                    + Channel
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-mg-surface-card border-white/10 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-headline font-bold uppercase tracking-wider text-mg-text">Create Channel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <input
                      value={newChannel.name}
                      onChange={e => setNewChannel(p => ({ ...p, name: e.target.value }))}
                      placeholder="Channel name (e.g. Honda Civic Builds)"
                      className="w-full bg-mg-surface border border-white/10 px-4 py-3 text-mg-text font-body text-sm focus:border-mg-red focus:outline-none"
                      data-testid="channel-name-input"
                    />
                    <textarea
                      value={newChannel.description}
                      onChange={e => setNewChannel(p => ({ ...p, description: e.target.value }))}
                      placeholder="What is this channel about?"
                      rows={2}
                      className="w-full bg-mg-surface border border-white/10 px-4 py-3 text-mg-text font-body text-sm focus:border-mg-red focus:outline-none resize-none"
                      data-testid="channel-desc-input"
                    />
                    <button
                      onClick={handleCreateChannel}
                      className="w-full bg-mg-red text-white font-headline font-bold text-xs tracking-widest uppercase py-3 hover:brightness-110"
                      data-testid="submit-channel-btn"
                    >
                      Create Channel
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>

        {/* Channel Filter Bar */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 mb-2">
          <ChannelPill channel={null} active={!activeChannel} onClick={() => setActiveChannel(null)} />
          {channels.map(ch => (
            <ChannelPill key={ch.channel_id} channel={ch} active={activeChannel === ch.slug} onClick={() => setActiveChannel(activeChannel === ch.slug ? null : ch.slug)} />
          ))}
        </div>

        {/* Sort Bar + Post Button */}
        <div className="flex items-center justify-between py-3 mb-6 border-b border-white/5">
          <div className="flex gap-1">
            {[
              { key: 'hot', label: 'Hot', icon: Fire },
              { key: 'new', label: 'New', icon: Clock },
              { key: 'top', label: 'Top', icon: TrendUp },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`flex items-center gap-1.5 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider transition-colors ${
                  sortBy === key ? 'text-mg-red bg-mg-red/10' : 'text-neutral-500 hover:text-mg-text hover:bg-mg-surface-card'
                }`}
                data-testid={`sort-${key}`}
              >
                <Icon size={14} weight={sortBy === key ? 'fill' : 'regular'} /> {label}
              </button>
            ))}
          </div>
          <Dialog open={postDialogOpen} onOpenChange={(v) => { if (!user && v) { handleLogin(); return; } setPostDialogOpen(v); }}>
            <DialogTrigger asChild>
              <button className="bg-mg-red text-white px-5 py-2 font-headline font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-colors flex items-center gap-2" data-testid="create-post-btn">
                <Plus size={14} weight="bold" /> Create Post
              </button>
            </DialogTrigger>
            <DialogContent className="bg-mg-surface-card border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-headline font-bold uppercase tracking-wider text-mg-text">Create Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <select
                  value={newPost.channel_id}
                  onChange={e => setNewPost(p => ({ ...p, channel_id: e.target.value }))}
                  className="w-full bg-mg-surface border border-white/10 px-4 py-3 text-mg-text font-body text-sm focus:border-mg-red focus:outline-none"
                  data-testid="post-channel-select"
                >
                  <option value="">Select Channel (optional)</option>
                  {channels.map(ch => <option key={ch.channel_id} value={ch.channel_id}>{ch.name}</option>)}
                </select>
                <textarea
                  value={newPost.caption}
                  onChange={e => setNewPost(p => ({ ...p, caption: e.target.value }))}
                  placeholder="What's your build story?"
                  rows={4}
                  className="w-full bg-mg-surface border border-white/10 px-4 py-3 text-mg-text font-body text-sm focus:border-mg-red focus:outline-none resize-none"
                  data-testid="post-caption-input"
                />
                <div className="flex items-center gap-2">
                  <ImageSquare size={18} className="text-neutral-500" />
                  <input
                    value={newPost.media_url}
                    onChange={e => setNewPost(p => ({ ...p, media_url: e.target.value }))}
                    placeholder="Image URL (optional)"
                    className="flex-1 bg-mg-surface border border-white/10 px-4 py-3 text-mg-text font-body text-sm focus:border-mg-red focus:outline-none"
                    data-testid="post-media-input"
                  />
                </div>
                <button
                  onClick={handleCreatePost}
                  className="w-full bg-mg-red text-white font-headline font-bold text-xs tracking-widest uppercase py-4 hover:brightness-110"
                  data-testid="submit-post-btn"
                >
                  Publish Post
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Feed */}
          <div className="lg:col-span-8 space-y-4">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-mg-surface-dim flex">
                  <div className="w-12 bg-mg-surface-lowest p-3" />
                  <div className="flex-1 p-5 space-y-3">
                    <div className="h-3 bg-mg-surface-bright animate-pulse w-48" />
                    <div className="h-5 bg-mg-surface-bright animate-pulse w-full" />
                    <div className="h-40 bg-mg-surface-bright animate-pulse" />
                  </div>
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-mg-surface-dim">
                <p className="text-neutral-500 font-body mb-2">No posts {activeChannel ? 'in this channel' : ''} yet.</p>
                <p className="text-neutral-600 text-sm font-body">Be the first to share your build!</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.post_id}
                  post={post}
                  user={user}
                  onVote={handleVote}
                  onComment={handleCommentAdded}
                  onShare={() => {}}
                  onSave={handleSave}
                />
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Active Channel Info or About */}
            <div className="bg-mg-surface-dim p-6 border-t-4 border-mg-red">
              <h3 className="font-headline font-bold text-lg uppercase tracking-tight text-mg-text mb-2">
                {activeChannel ? channels.find(c => c.slug === activeChannel)?.name : 'ModGarage Community'}
              </h3>
              <p className="text-neutral-500 text-sm font-body mb-4">
                {activeChannel
                  ? channels.find(c => c.slug === activeChannel)?.description
                  : 'The home for car modification enthusiasts. Share builds, get advice, and connect with fellow gearheads.'
                }
              </p>
              {activeChannel && (
                <div className="flex gap-6 text-xs font-label uppercase tracking-widest text-neutral-400 border-t border-white/5 pt-4">
                  <span><span className="text-mg-text font-bold">{channels.find(c => c.slug === activeChannel)?.member_count}</span> Members</span>
                  <span><span className="text-mg-text font-bold">{channels.find(c => c.slug === activeChannel)?.post_count}</span> Posts</span>
                </div>
              )}
            </div>

            {/* Channels List */}
            <div className="bg-mg-surface-dim p-5">
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center justify-between">
                Channels
                <span className="text-mg-text">{channels.length}</span>
              </h4>
              <div className="space-y-1">
                {channels.map(ch => (
                  <button
                    key={ch.channel_id}
                    onClick={() => setActiveChannel(activeChannel === ch.slug ? null : ch.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 transition-colors text-left group ${
                      activeChannel === ch.slug ? 'bg-mg-red/10 text-mg-red' : 'hover:bg-mg-surface-high text-neutral-400 hover:text-mg-text'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-headline text-sm font-bold uppercase tracking-tight">
                      <Hash size={12} weight="bold" /> {ch.name}
                    </span>
                    <span className="text-[10px] font-label text-neutral-600 group-hover:text-neutral-400">
                      <Users size={10} className="inline mr-1" />{ch.member_count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Community Rules */}
            <div className="bg-mg-surface-dim p-5">
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-neutral-500 mb-3">Community Rules</h4>
              <ol className="space-y-2 text-xs text-neutral-400 font-body">
                <li className="flex gap-2"><span className="text-mg-red font-bold">1.</span> Be respectful to fellow builders</li>
                <li className="flex gap-2"><span className="text-mg-red font-bold">2.</span> Share real builds and modifications only</li>
                <li className="flex gap-2"><span className="text-mg-red font-bold">3.</span> No spam or self-promotion</li>
                <li className="flex gap-2"><span className="text-mg-red font-bold">4.</span> Tag parts when sharing builds</li>
                <li className="flex gap-2"><span className="text-mg-red font-bold">5.</span> Keep discussions on-topic per channel</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
