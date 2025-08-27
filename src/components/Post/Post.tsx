import { useState, type FormEvent } from 'react';
import { Heart, MessageCircle, Share, Bookmark } from 'lucide-react';
import { postsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Post as PostType } from '../../types';

// Local type extensions
interface User {
  id: string;
  username: string;
}

interface Reply {
  userId: string | User;
  text: string;
  timestamp: Date;
}

interface Comment {
  _id?: string;
  userId: string | User;
  username?: string | User;
  text: string;
  timestamp: Date;
  replies?: Reply[];
}

interface PostProps {
  post: PostType & {
    comments: Comment[]; // override to match our local Comment type
    userId: string | User;
    likes: string[];
  };
}

const Post = ({ post }: PostProps) => {
  const { user } = useAuth();
  const [comment, setComment] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.id) : false);
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);

  const handleLike = async () => {
    if (!user) return;
    try {
      await postsAPI.likePost(post._id);
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    try {
      await postsAPI.commentPost(post._id, comment);
      const newComment: Comment = {
        userId: user.id,
        text: comment,
        username:user.username,
        timestamp: new Date(),
        replies: [],
      };
      setComments((prev) => [...prev, newComment]);
      setComment('');
    } catch (error) {
      console.error('Failed to comment:', error);
    }
  };

  const handleReply = async (e: FormEvent, commentIndex: number) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;
    try {
      const comment = comments[commentIndex];
      const commentId = comment._id || commentIndex.toString(); // Use actual comment ID if available
      
      await postsAPI.replyToComment(post._id, commentId, replyText);
      
      const newReply: Reply = {
        userId: user.id,
        text: replyText,
        timestamp: new Date(),
      };
      setComments((prev) =>
        prev.map((c, i) =>
          i === commentIndex
            ? { ...c, replies: [...(c.replies || []), newReply] }
            : c
        )
      );
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  const getUsername = (userId: User | string): string => {
    if (typeof userId === 'object') return userId.username;
    if (typeof userId === 'string' && user && user.id === userId) return user.username;
    return typeof userId === 'string' ? userId : 'you';
  };

  const formatTime = (timestamp: Date | string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-md">
            {getUsername(post.userId)[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">
              {getUsername(post.userId)}
            </div>
            <div className="text-xs text-gray-500">
              {formatTime(post.timestamp)}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Image Container */}
      <div className="relative bg-gray-50">
        <img
          src={post.imageUrl}
          alt="post"
          className="w-full max-h-96 object-contain"
          style={{ minHeight: '200px' }}
        />
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-full transition-all duration-200 group"
            >
              <Heart
                size={24}
                fill={isLiked ? '#ff3040' : 'none'}
                color={isLiked ? '#ff3040' : '#374151'}
                className={`transition-transform duration-200 ${
                  isLiked ? 'scale-110' : 'group-hover:scale-105'
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                {likesCount}
              </span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-full transition-all duration-200 group"
            >
              <MessageCircle
                size={24}
                className="text-gray-700 group-hover:scale-105 transition-transform duration-200"
              />
              <span className="text-sm font-medium text-gray-700">
                {comments.length}
              </span>
            </button>

            <button className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-full transition-all duration-200 group">
              <Share
                size={24}
                className="text-gray-700 group-hover:scale-105 transition-transform duration-200"
              />
            </button>
          </div>

          <button className="hover:bg-gray-50 p-2 rounded-full transition-all duration-200 group">
            <Bookmark
              size={24}
              className="text-gray-700 group-hover:scale-105 transition-transform duration-200"
            />
          </button>
        </div>

        {likesCount > 0 && (
          <div className="text-sm font-semibold text-gray-900 mb-2">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed text-gray-900">
          <span className="font-semibold mr-2">
            {getUsername(post.userId)}
          </span>
          {post.caption}
        </p>
      </div>

      {/* View Comments */}
      {comments.length > 0 && !showComments && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            View all {comments.length} comments
          </button>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-3 max-h-60 overflow-y-auto">
          <div className="space-y-3">
            {comments.map((c, i) => (
              <div key={i}>
                <div className="text-sm text-gray-900">
                  <span className="font-semibold mr-2">
                    {getUsername(c.username || c.userId)}
                  </span>
                  {c.text}
                  <button
                    onClick={() =>
                      setReplyingTo(replyingTo === i ? null : i)
                    }
                    className="ml-3 text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Reply
                  </button>
                </div>

                {c.replies && c.replies.length > 0 && (
                  <div className="ml-4 mt-2 space-y-2 border-l-2 border-gray-100 pl-3">
                    {c.replies.map((reply, ri) => (
                      <div key={ri} className="text-sm text-gray-800">
                        <span className="font-semibold mr-2">
                          {getUsername(reply.userId)}
                        </span>
                        {reply.text}
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === i && (
                  <form onSubmit={(e) => handleReply(e, i)} className="mt-2">
                    <div className="flex gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 text-sm py-2 px-3 border border-gray-200 rounded-full outline-none focus:border-blue-500 bg-gray-50"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className={`text-xs px-4 py-2 rounded-full font-medium transition-colors ${
                          replyText.trim()
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Reply
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment Input */}
      <div className="px-4 pb-4 border-t border-gray-100">
        <form
          onSubmit={handleComment}
          className="flex gap-3 items-center pt-3"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border-none outline-none text-sm py-2 px-3 bg-gray-50 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all"
          />
          {comment.trim() && (
            <button
              type="submit"
              className="text-blue-500 hover:text-blue-600 font-semibold text-sm transition-colors"
            >
              Post
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Post;
