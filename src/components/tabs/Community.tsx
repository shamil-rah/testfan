import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Send, Heart, MessageCircle, Share, UserPlus, Camera, Music, Smile, X, Loader2, Trash2 } from 'lucide-react';
import { Post, Comment } from '../../types';
import { 
  getCurrentUser, 
  getUserProfile, 
  createPost, 
  fetchPosts, 
  togglePostLike, 
  getUserLikesForPosts,
  createComment,
  fetchCommentsForPost,
  uploadImage,
  fetchContentForSelection,
  deletePost
} from '../../lib/supabase';

interface CommunityProps {
  currentUser?: any;
  onTabChange?: (tab: string) => void;
}

export const Community: React.FC<CommunityProps> = ({ currentUser, onTabChange }) => {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [availableContent, setAvailableContent] = useState<any[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showContentSelectionModal, setShowContentSelectionModal] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    const loadCommunityData = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      try {
        // Get user profile
        const { data: profile } = await getUserProfile(currentUser.id);
        setUserProfile(profile);

        // Fetch posts
        const { data: postsData } = await fetchPosts();
        
        if (postsData && postsData.length > 0) {
          // Get user's likes for these posts
          const postIds = postsData.map(post => post.id);
          const userLikedPosts = await getUserLikesForPosts(postIds, currentUser.id);
          
          // Update posts with user's like status
          const postsWithLikes = postsData.map(post => ({
            ...post,
            userHasLiked: userLikedPosts.includes(post.id)
          }));
          
          setPosts(postsWithLikes);
        } else {
          setPosts([]);
        }

        // Fetch available content for linking
        const { data: contentData } = await fetchContentForSelection();
        setAvailableContent(contentData || []);
      } catch (error) {
        console.error('Error loading community data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunityData();
  }, [currentUser?.id]);

  const handleLinkedContentClick = (contentId: string) => {
    if (onTabChange) {
      onTabChange('content');
    }
  };

  const handleContentSelection = (contentId: string) => {
    setSelectedContentId(contentId);
    setShowContentSelectionModal(false);
  };

  const getSelectedContentTitle = () => {
    if (!selectedContentId) return '';
    const content = availableContent.find(c => c.id === selectedContentId);
    return content ? content.title : '';
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPost.trim() || !currentUser || !userProfile) return;
    
    setIsCreatingPost(true);
    try {
      let imageUrl = '';
      
      // Upload image if selected
      if (selectedImageFile) {
        setIsUploadingImage(true);
        const { data: uploadData, error: uploadError } = await uploadImage(selectedImageFile, currentUser.id);
        
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          return;
        }
        
        imageUrl = uploadData || '';
        setIsUploadingImage(false);
      }
      
      const { data, error } = await createPost(
        currentUser.id, 
        newPostTitle,
        newPost, 
        imageUrl || undefined,
        selectedContentId || undefined
      );
      
      if (error) {
        console.error('Error creating post:', error);
        return;
      }
      
      if (data) {
        // Find linked content details if content was linked
        const linkedContent = selectedContentId 
          ? availableContent.find(content => content.id === selectedContentId)
          : undefined;

        // Create a new post object to add to the state
        const newPostObj: Post = {
          id: data.id,
          author: {
            id: userProfile.id,
            name: userProfile.name,
            avatar: userProfile.avatar_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'
          },
          title: data.title,
          content: data.content,
          image: data.image_url,
          content_id: data.content_id,
          linkedContent: linkedContent ? {
            id: linkedContent.id,
            title: linkedContent.title,
            type: linkedContent.type,
            thumbnail: linkedContent.cover_image_url,
            file_url: linkedContent.file_url
          } : undefined,
          timestamp: new Date(data.created_at),
          likes_count: 0,
          comments_count: 0,
          isAnnouncement: false,
          userHasLiked: false
        };
        
        // Add the new post to the beginning of the posts array
        setPosts(prevPosts => [newPostObj, ...prevPosts]);
      }
      
      setNewPostTitle('');
      setNewPost('');
      setSelectedContentId('');
      setSelectedImageFile(null);
      setImagePreview('');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsCreatingPost(false);
      setIsUploadingImage(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      const { liked } = await togglePostLike(postId, currentUser.id);
      
      // Update the post in the state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                userHasLiked: liked,
                likes_count: liked ? post.likes_count + 1 : post.likes_count - 1
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleViewComments = async (post: Post) => {
    setSelectedPost(post);
    setIsLoadingComments(true);
    
    try {
      const { data: commentsData } = await fetchCommentsForPost(post.id);
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCreateComment = async () => {
    if (!newComment.trim() || !currentUser || !selectedPost || !userProfile) return;
    
    setIsCreatingComment(true);
    try {
      const { data, error } = await createComment(selectedPost.id, currentUser.id, newComment);
      
      if (error) {
        console.error('Error creating comment:', error);
        return;
      }
      
      if (data) {
        // Create a new comment object
        const newCommentObj: Comment = {
          id: data.id,
          post_id: data.post_id,
          author: {
            id: userProfile.id,
            name: userProfile.name,
            avatar: userProfile.avatar_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'
          },
          content: data.content,
          timestamp: new Date(data.created_at)
        };
        
        // Add the new comment to the comments array
        setComments(prevComments => [...prevComments, newCommentObj]);
        
        // Update the comments count in the posts array
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === selectedPost.id 
              ? { ...post, comments_count: post.comments_count + 1 }
              : post
          )
        );
      }
      
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsCreatingComment(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImageFile(null);
    setImagePreview('');
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    
    setDeletingPostId(postId);
    try {
      const { error } = await deletePost(postId);
      
      if (error) {
        console.error('Error deleting post:', error);
        return;
      }
      
      // Remove the post from the state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setDeletingPostId(null);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    return `${diffInHours} hours ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6 px-2 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-text font-cinzel">Community Feed</h1>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-secondary hover:bg-gray-700 transition-colors">
            <UserPlus size={20} />
          </button>
        </div>
      </div>

      {/* Community Feed */}
      <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
        {/* Create Post */}
        <Card className="lg:col-span-2 border-secondary/20 bg-gradient-to-br from-black to-gray-900/50">
          <div className="border-b border-secondary/10 pb-4 mb-4">
            <h3 className="text-text font-cinzel font-semibold">Share with the Community</h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
            {userProfile && (
              <img 
                src={userProfile.avatar_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'} 
                alt={userProfile.name}
                className="w-12 h-12 rounded object-cover border-2 border-secondary/10 flex-shrink-0 self-start"
              />
            )}
            <div className="flex-1">
              <Input
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="Post title..."
                className="mb-4 border bg-secondary border-secondary rounded p-3 text-secondary placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-alpha-20 transition-all duration-300 font-josefin"
              />
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind? Share your thoughts..."
                className="w-full bg-secondary border border-secondary rounded p-4 text-secondary placeholder-gray-400 resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-alpha-20 transition-all duration-300 font-josefin"
                rows={3}
              />
              
              {/* Content Linking */}
              {selectedContentId && (
                <div className="mt-4 p-3 bg-primary-alpha-10 border border-primary-alpha-30 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-secondary font-cinzel font-semibold text-sm">Linked Content:</p>
                      <p className="text-primary-light text-sm font-josefin">{getSelectedContentTitle()}</p>
                    </div>
                    <button
                      onClick={() => setSelectedContentId('')}
                      className="text-gray-400 hover:text-secondary transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-4 relative">
                  <img 
                    src={imagePreview} 
                    className="w-full h-48 object-cover rounded border border-secondary/20"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-black/80 text-text rounded-full w-8 h-8 flex items-center justify-center hover:bg-primary transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 space-y-3 sm:space-y-0">
                <div className="flex space-x-3 text-gray-400 justify-center sm:justify-start">
                  <label className="p-2 rounded hover:text-red-400 hover:bg-red-600/10 transition-all duration-300 cursor-pointer">
                    <Camera size={18} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  <button 
                    onClick={() => setShowContentSelectionModal(true)}
                    className="p-2 rounded hover:text-primary-light hover:bg-primary-alpha-10 transition-all duration-300"
                  >
                    <Music size={18} />
                  </button>
                  <button className="p-2 rounded hover:text-red-400 hover:bg-red-600/10 transition-all duration-300">
                    <Smile size={18} />
                  </button>
                </div>
                <Button 
                  onClick={handleCreatePost}
                  disabled={!newPostTitle.trim() || !newPost.trim() || isCreatingPost || isUploadingImage}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : isCreatingPost ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4 lg:col-span-2">
          {posts.map((post) => (
            <Card key={post.id} className={`transition-all duration-300 hover:border-secondary/30 ${post.isAnnouncement ? 'border-red-600/50 bg-gradient-to-br from-red-600/5 to-red-600/10' : 'border-secondary/10 hover:shadow-xl'}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover border-2 border-secondary/10"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-text font-cinzel text-base sm:text-lg break-words min-w-0">{post.title}</h3>
                    {post.isAnnouncement && (
                      <span className="bg-primary text-text px-2 py-1 rounded-full text-xs font-semibold font-cinzel flex-shrink-0">
                        ARTIST
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-text-muted font-cinzel text-xs sm:text-sm truncate">by {post.author.name}</span>
                    <span className="text-text-muted text-xs sm:text-sm font-josefin flex-shrink-0">• {formatTimeAgo(post.timestamp)}</span>
                  </div>
                  
                  <p className="text-text text-sm sm:text-base leading-relaxed mb-4 font-josefin break-words">{post.content}</p>
                  
                  {/* Linked Content Display */}
                  {post.linkedContent && (
                    <div 
                      className="mb-4 p-4 bg-primary-alpha-10 border border-primary-alpha-30 rounded cursor-pointer hover:bg-primary-alpha-20 transition-colors"
                      onClick={() => handleLinkedContentClick(post.linkedContent!.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <img 
                          src={post.linkedContent.thumbnail || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'} 
                          alt={post.linkedContent.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h4 className="text-text font-cinzel font-semibold">{post.linkedContent.title}</h4>
                          <p className="text-primary-light text-sm font-josefin capitalize">{post.linkedContent.type} Content</p>
                          <p className="text-text-muted text-xs font-josefin mt-1">Click to view content</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {post.image && (
                    <div className="mb-4 rounded overflow-hidden border border-secondary/10">
                      <img 
                        src={post.image} 
                        alt="Post content"
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-text-muted pt-3 border-t border-secondary/10">
                    <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-6">
                      <button 
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center space-x-2 px-3 py-1 rounded transition-all duration-300 ${
                          post.userHasLiked 
                            ? 'text-primary-light bg-primary-alpha-10' 
                            : 'hover:text-primary-light hover:bg-primary-alpha-10'
                        }`}
                      >
                        <Heart size={18} className={post.userHasLiked ? 'fill-current' : ''} />
                        <span className="font-josefin">{post.likes_count}</span>
                      </button>
                      <button 
                        onClick={() => handleViewComments(post)}
                        className="flex items-center space-x-2 px-3 py-1 rounded hover:text-primary-light hover:bg-primary-alpha-10 transition-all duration-300"
                      >
                        <MessageCircle size={18} />
                        <span className="font-josefin">{post.comments_count}</span>
                      </button>
                      <button className="flex items-center space-x-2 px-3 py-1 rounded hover:text-primary-light hover:bg-primary-alpha-10 transition-all duration-300">
                        <Share size={18} />
                        <span className="font-josefin hidden xs:inline">Share</span>
                      </button>
                      {/* Delete button - only show for post author */}
                      {currentUser && post.author.id === currentUser.id && (
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deletingPostId === post.id}
                          className="flex items-center space-x-2 px-3 py-1 rounded hover:text-error hover:bg-error-alpha-10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingPostId === post.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                          <span className="font-josefin">
                            <span className="hidden xs:inline">
                              {deletingPostId === post.id ? 'Deleting...' : 'Delete'}
                            </span>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
      </div>

      {/* Comments Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-black border border-secondary/20 rounded overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-secondary/10 flex-shrink-0">
              <h3 className="text-text font-cinzel font-semibold text-lg">Comments</h3>
              <button 
                onClick={() => {
                  setSelectedPost(null);
                  setComments([]);
                  setNewComment('');
                }}
                className="text-text-muted hover:text-text transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Original Post */}
            <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-secondary/10 flex-shrink-0 z-10 max-h-[40vh] overflow-y-auto">
              <div className="p-6 bg-gradient-to-r from-primary-alpha-10 to-primary-alpha-5 border border-primary-alpha-20 rounded-lg m-4 mb-2 max-h-[35vh] overflow-y-auto">
                <div className="flex items-start space-x-3">
                  <img 
                    src={selectedPost.author.avatar} 
                    alt={selectedPost.author.name}
                    className="w-12 h-12 rounded object-cover border-2 border-primary-alpha-30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-text font-cinzel text-base">{selectedPost.author.name}</h4>
                      {selectedPost.isAnnouncement && (
                        <span className="bg-primary text-text px-2 py-1 rounded-full text-xs font-semibold font-cinzel">
                          ARTIST
                        </span>
                      )}
                      <span className="text-text-muted text-sm font-josefin">{formatTimeAgo(selectedPost.timestamp)}</span>
                    </div>
                    <h5 className="text-text font-cinzel font-semibold text-lg mb-2">{selectedPost.title}</h5>
                    <p className="text-text-secondary text-base font-josefin leading-relaxed mb-3">{selectedPost.content}</p>
                    
                    {/* Linked Content in Modal */}
                    {selectedPost.linkedContent && (
                      <div 
                        className="mt-3 p-3 bg-primary-alpha-10 border border-primary-alpha-30 rounded cursor-pointer hover:bg-primary-alpha-20 transition-colors"
                        onClick={() => handleLinkedContentClick(selectedPost.linkedContent!.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <img 
                            src={selectedPost.linkedContent.thumbnail || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'} 
                            alt={selectedPost.linkedContent.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <h5 className="text-text font-cinzel font-semibold text-sm">{selectedPost.linkedContent.title}</h5>
                            <p className="text-primary-light text-xs font-josefin capitalize">{selectedPost.linkedContent.type} Content</p>
                            <p className="text-text-muted text-xs font-josefin">Click to view content</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedPost.image && (
                      <div className="mt-4 p-2 rounded overflow-hidden border border-secondary/10">
                        <img 
                          src={selectedPost.image} 
                          alt="Post content"
                          className="w-full max-h-64 object-cover rounded"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-3 text-text-muted text-sm">
                      <div className="flex items-center space-x-1">
                        <Heart size={16} className={selectedPost.userHasLiked ? 'fill-current text-primary-light' : ''} />
                        <span className="font-josefin">{selectedPost.likes_count} likes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle size={16} />
                        <span className="font-josefin">{selectedPost.comments_count} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 sm:p-6">
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-text-muted font-josefin text-sm sm:text-base">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded hover:bg-secondary/5 transition-colors">
                        <img 
                          src={comment.author.avatar} 
                          alt={comment.author.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover border border-secondary/10 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-1 sm:space-x-2 mb-1 flex-wrap">
                            <h5 className="font-semibold text-text font-cinzel text-sm sm:text-base">{comment.author.name}</h5>
                            <span className="text-text-muted text-xs sm:text-sm font-josefin">{formatTimeAgo(comment.timestamp)}</span>
                          </div>
                          <p className="text-text-secondary font-josefin leading-relaxed text-sm sm:text-base break-words">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comment Input */}
            <div className="p-3 sm:p-6 border-t border-secondary/10 flex-shrink-0">
              <div className="flex items-start space-x-2 sm:space-x-3">
                {userProfile && (
                  <img 
                    src={userProfile.avatar_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'} 
                    alt={userProfile.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover border border-secondary/10 flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-gray-900 border border-secondary/20 rounded-lg p-3 sm:p-4 text-text placeholder-text-muted resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-alpha-20 transition-all duration-300 font-josefin text-sm sm:text-base"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2 sm:mt-3">
                    <Button 
                      onClick={handleCreateComment}
                      disabled={!newComment.trim() || isCreatingComment}
                      size="sm"
                    >
                      {isCreatingComment ? (
                        <>
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send size={14} className="sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Selection Modal */}
      {showContentSelectionModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-black border border-secondary/20 rounded overflow-hidden my-8 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-secondary/10 flex-shrink-0">
              <h3 className="text-text font-cinzel font-semibold text-lg">Link Content</h3>
              <button 
                onClick={() => setShowContentSelectionModal(false)}
                className="text-text-muted hover:text-text transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6">
              {availableContent.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-text-muted font-josefin">No content available to link</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableContent.map((content) => (
                    <div
                      key={content.id}
                      onClick={() => handleContentSelection(content.id)}
                      className="flex items-center space-x-4 p-4 rounded border border-secondary/10 hover:border-primary-alpha-50 hover:bg-primary-alpha-5 cursor-pointer transition-all duration-300"
                    >
                      <img 
                        src={content.cover_image_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'} 
                        alt={content.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="text-text font-cinzel font-semibold">{content.title}</h4>
                        <p className="text-primary-light text-sm font-josefin capitalize">{content.type} Content</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};