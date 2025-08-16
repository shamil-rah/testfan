import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play, Heart, MessageSquare, MessageCircle, ShoppingBag, Loader2, User, ArrowRight } from 'lucide-react';
import { 
  fetchFeaturedContent, 
  fetchHomeCommunityPosts, 
  fetchHomeMerchItems 
} from '../../lib/supabase';

interface HomeProps {
  onTabChange: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onTabChange }) => {
  const [featuredDrop, setFeaturedDrop] = useState<any>(null);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [merchItems, setMerchItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setIsLoading(true);
      try {
        // Fetch all home page data
        const [featuredResult, communityResult, merchResult] = await Promise.all([
          fetchFeaturedContent(),
          fetchHomeCommunityPosts(),
          fetchHomeMerchItems()
        ]);

        // Set featured content
        if (featuredResult.data) {
          setFeaturedDrop({
            id: featuredResult.data.id,
            title: featuredResult.data.title,
            type: `New ${featuredResult.data.type} Drop`,
            thumbnail: featuredResult.data.cover_image_url || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
            description: featuredResult.data.description || 'Latest exclusive content from the collective',
            likes: featuredResult.data.likes,
            file_url: featuredResult.data.file_url,
            artist: featuredResult.data.artist
          });
        }

        // Set community posts
        if (communityResult.data) {
          setCommunityPosts(communityResult.data);
        }

        // Set merchandise items
        if (merchResult.data) {
          setMerchItems(merchResult.data);
        }
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const handleContentClick = () => {
    onTabChange('content');
  };

  const handleMerchClick = () => {
    onTabChange('merch');
  };

  const handleCommunityClick = () => {
    onTabChange('community');
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Featured Drop */}
      {featuredDrop ? (
        <Card className="relative overflow-hidden border-primary-alpha-40 md:p-8">
          <div className="absolute top-4 right-4">
            <span className="badge-noir px-3 py-1 rounded text-sm">
              NEW
            </span>
          </div>
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-xl overflow-hidden flex-shrink-0">
              <img 
                src={featuredDrop.thumbnail} 
                alt={featuredDrop.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl md:text-3xl font-bold text-text mb-1 font-cinzel">{featuredDrop.title}</h3>
              <p className="text-primary text-sm mb-2 font-cinzel">{featuredDrop.type}</p>
              {featuredDrop.artist && (
                <p className="text-text-muted text-xs mb-2 font-josefin">
                  by {featuredDrop.artist.stage_name || featuredDrop.artist.name}
                </p>
              )}
              <p className="text-text-secondary text-sm md:text-base leading-relaxed">{featuredDrop.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6">
            <Button 
              variant="primary" 
              className="flex items-center space-x-2"
              onClick={handleContentClick}
            >
              <Play size={18} />
              <span>Play Now</span>
            </Button>
            <div className="flex items-center space-x-4 text-text-muted">
              <div className="flex items-center space-x-1">
                <Heart size={18} />
                <span>{featuredDrop.likes || 0}</span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <p className="text-text-muted font-josefin">No featured content available</p>
        </Card>
      )}

      {/* Community Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-text flex items-center font-cinzel">
            <MessageCircle className="mr-2" size={24} />
            COMMUNITY POSTS
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleCommunityClick}
            className="flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight size={16} />
          </Button>
        </div>
        {communityPosts.length > 0 ? (
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
            {communityPosts.slice(0, 2).map((post) => (
              <Card key={post.id} className="hover:border-primary-alpha-50 cursor-pointer" onClick={handleCommunityClick}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <img 
                      src={post.author.avatar_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'} 
                      alt={post.author.name}
                      className="w-10 h-10 rounded object-cover border bordersecondary/10"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-text font-cinzel">{post.title}</h3>
                      </div>
                      <p className="text-text-muted text-xs mb-2 font-josefin">by {post.author.name}</p>
                      <p className="text-text-secondary text-xs leading-relaxed mb-3">{post.content}</p>
                      {post.image_url && (
                        <div className="mb-3 rounded overflow-hidden">
                          <img 
                            src={post.image_url} 
                            alt="Post content"
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-text-muted text-xs">
                          <div className="flex items-center space-x-1">
                            <Heart size={14} />
                            <span>{post.likes_count}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare size={14} />
                            <span>{post.comments_count}</span>
                          </div>
                        </div>
                        <span className="text-text-muted text-xs">{formatTimeAgo(post.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <p className="text-text-muted font-josefin">No community posts available</p>
          </Card>
        )}
      </div>

      {/* Featured Merch */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-text flex items-center font-cinzel">
            <ShoppingBag className="mr-2" size={24} />
            FEATURED MERCH
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleMerchClick}
            className="flex items-center space-x-1"
          >
            <span>Shop All</span>
            <ArrowRight size={16} />
          </Button>
        </div>
        {merchItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {merchItems.slice(0, 8).map((item, index) => (
              <div 
                key={item.id} 
                className="w-full h-40 md:h-48 rounded-xl overflow-hidden relative group cursor-pointer"
                onClick={handleMerchClick}
              >
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-hover:from-primary-alpha-80 transition-colors duration-300">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-text text-sm font-cinzel font-semibold mb-1 truncate">
                      {item.name}
                    </p>
                    <p className="text-primary-light text-xs font-josefin font-semibold">
                      ${item.price} AUD
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <p className="text-text-muted font-josefin">No merchandise available</p>
          </Card>
        )}
      </div>
    </div>
  );
};