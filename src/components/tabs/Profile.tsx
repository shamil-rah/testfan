import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Settings, Heart, ShoppingBag, Bell, LogOut, Star, Download, MessageCircle, Calendar, TrendingUp } from 'lucide-react';
import { 
  getCurrentUser, 
  getUserProfile, 
  updateUserProfile, 
  getCurrentUserEmail,
  fetchUserLikesCount,
  fetchUserCommentsCount,
  fetchUserPostLikesCount
} from '../../lib/supabase';

interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface EngagementData {
  fanLevel: number;
  engagementScore: number;
  totalContentLikes: number;
  totalPostLikes: number;
  totalComments: number;
  accountAgeDays: number;
  nextLevelScore: number;
}
export const Profile: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'info' | 'purchase-history' | 'settings'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null);

  // Calculate fan level based on engagement metrics
  const calculateFanLevel = (
    accountAgeDays: number,
    totalContentLikes: number,
    totalPostLikes: number,
    totalComments: number
  ): EngagementData => {
    // Calculate engagement score with weighted metrics
    const accountAgeScore = Math.floor(accountAgeDays / 30) * 10; // 10 points per month
    const contentLikesScore = totalContentLikes * 2; // 2 points per content like
    const postLikesScore = totalPostLikes * 1; // 1 point per post like
    const commentsScore = totalComments * 3; // 3 points per comment (higher weight)
    
    const engagementScore = accountAgeScore + contentLikesScore + postLikesScore + commentsScore;
    
    // Define fan level thresholds
    let fanLevel = 1;
    let nextLevelScore = 50;
    
    if (engagementScore >= 500) {
      fanLevel = 7;
      nextLevelScore = 500; // Max level
    } else if (engagementScore >= 300) {
      fanLevel = 6;
      nextLevelScore = 500;
    } else if (engagementScore >= 200) {
      fanLevel = 5;
      nextLevelScore = 300;
    } else if (engagementScore >= 120) {
      fanLevel = 4;
      nextLevelScore = 200;
    } else if (engagementScore >= 75) {
      fanLevel = 3;
      nextLevelScore = 120;
    } else if (engagementScore >= 50) {
      fanLevel = 2;
      nextLevelScore = 75;
    } else {
      fanLevel = 1;
      nextLevelScore = 50;
    }
    
    return {
      fanLevel,
      engagementScore,
      totalContentLikes,
      totalPostLikes,
      totalComments,
      accountAgeDays,
      nextLevelScore
    };
  };
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          console.error('No authenticated user found');
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await getUserProfile(currentUser.id);
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return;
        }

        // Get user email
        const email = await getCurrentUserEmail();

        // Fetch engagement metrics
        const [contentLikesResult, postLikesResult, commentsResult] = await Promise.all([
          fetchUserLikesCount(currentUser.id),
          fetchUserPostLikesCount(currentUser.id),
          fetchUserCommentsCount(currentUser.id)
        ]);

        // Calculate account age in days
        const accountCreatedDate = new Date(profile?.created_at || Date.now());
        const currentDate = new Date();
        const accountAgeDays = Math.floor((currentDate.getTime() - accountCreatedDate.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate fan level and engagement data
        const calculatedEngagement = calculateFanLevel(
          accountAgeDays,
          contentLikesResult.count,
          postLikesResult.count,
          commentsResult.count
        );

        setUserProfile(profile);
        setUserEmail(email);
        setEditedName(profile?.name || '');
        setEngagementData(calculatedEngagement);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSaveChanges = async () => {
    if (!userProfile || !editedName.trim()) return;

    try {
      setIsSaving(true);
      const { data, error } = await updateUserProfile(userProfile.id, {
        name: editedName.trim()
      });

      if (error) {
        console.error('Error updating profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const purchasedItems = [
    { id: '1', name: 'Midnight Sessions Hoodie', price: 75, date: '2024-01-15', status: 'Delivered' },
    { id: '2', name: 'Producer Pack Vol. 3', price: 35, date: '2024-01-10', status: 'Downloaded' },
    { id: '3', name: 'Athletic Joggers (AOP)', price: 119.99, date: '2024-01-05', status: 'Delivered' },
    { id: '4', name: 'Cashless Society Knit Beanie', price: 49.99, date: '2023-12-20', status: 'Delivered' }
  ];

  const notifications = [
    { id: '1', title: 'New drop available', message: 'Fresh beats just dropped!', time: '2 hours ago', read: false },
    { id: '2', title: 'Comment reply', message: 'Someone replied to your comment', time: '1 day ago', read: true },
    { id: '3', title: 'Merch restock', message: 'Your wishlist item is back in stock', time: '3 days ago', read: true }
  ];

  const getFanLevelName = (level: number = 0) => {
    if (level >= 10) return 'Legend';
    if (level >= 7) return 'Legend';
    if (level >= 6) return 'Superfan';
    if (level >= 5) return 'Enthusiast';
    if (level >= 4) return 'Supporter';
    if (level >= 3) return 'Active Fan';
    if (level >= 2) return 'Fan';
    return 'New Fan';
  };

  const getFanLevelColor = (level: number = 0) => {
    if (level >= 7) return 'text-yellow-400';
    if (level >= 6) return 'text-purple-400';
    if (level >= 5) return 'text-pink-400';
    if (level >= 4) return 'text-blue-400';
    if (level >= 3) return 'text-green-400';
    if (level >= 2) return 'text-cyan-400';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6 pb-24 md:pb-6 px-2 md:px-0">
        <Card className="text-center p-4 md:p-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded mx-auto mb-4 bg-gray-800 animate-pulse"></div>
          <div className="h-4 md:h-6 bg-gray-800 rounded w-32 sm:w-48 mx-auto mb-2 animate-pulse"></div>
          <div className="h-3 md:h-4 bg-gray-800 rounded w-24 sm:w-32 mx-auto mb-4 animate-pulse"></div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 md:h-6 bg-gray-800 rounded animate-pulse"></div>
                <div className="h-3 md:h-4 bg-gray-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (!userProfile || !engagementData) {
    return (
      <div className="space-y-4 md:space-y-6 pb-24 md:pb-6 px-2 md:px-0">
        <Card className="text-center p-4 md:p-8">
          <p className="text-text-muted">Unable to load profile data</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-6 px-2 md:px-0">
      {/* Profile Header */}
      <Card className="text-center p-4 md:p-6 lg:p-8">
        <div className="relative">
          <img 
            src={userProfile.avatar_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'} 
            alt={userProfile.name}
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded mx-auto mb-4 object-cover border-2 md:border-4 border-primary"
          />
          <div className={`absolute top-0 right-1/2 transform translate-x-6 sm:translate-x-8 md:translate-x-10 lg:translate-x-12 -translate-y-2 bg-gray-900 px-2 py-1 rounded-full border-2 border-gray-700 ${getFanLevelColor(engagementData.fanLevel)}`}>
            <div className="flex items-center space-x-1">
              <Star size={10} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
              <span className="text-xs font-semibold">{engagementData.fanLevel}</span>
            </div>
          </div>
        </div>
        
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-text mb-1 break-all font-cinzel">{userProfile.name}</h1>
        <p className={`font-semibold mb-2 text-sm md:text-base font-cinzel ${getFanLevelColor(engagementData.fanLevel)}`}>
          {getFanLevelName(engagementData.fanLevel)}
        </p>
        <p className="text-text-muted text-xs sm:text-sm mb-4 font-josefin">Member since {formatJoinDate(userProfile.created_at)}</p>
        
        {/* Enhanced Engagement Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center max-w-2xl mx-auto mb-4">
          <div>
            <p className="text-sm sm:text-lg md:text-xl font-bold text-text font-josefin">{engagementData.totalContentLikes + engagementData.totalPostLikes}</p>
            <p className="text-text-muted text-xs font-josefin">Total Likes</p>
          </div>
          <div>
            <p className="text-sm sm:text-lg md:text-xl font-bold text-text font-josefin">{engagementData.totalComments}</p>
            <p className="text-text-muted text-xs font-josefin">Comments</p>
          </div>
          <div>
            <p className="text-sm sm:text-lg md:text-xl font-bold text-text font-josefin">{engagementData.accountAgeDays}</p>
            <p className="text-text-muted text-xs font-josefin">Days Active</p>
          </div>
          <div>
            <p className="text-sm sm:text-lg md:text-xl font-bold text-red-400 font-josefin">{engagementData.engagementScore}</p>
            <p className="text-text-muted text-xs font-josefin">Score</p>
          </div>
        </div>

        {/* Fan Level Progress */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-text-muted font-josefin">Level {engagementData.fanLevel}</span>
            <span className="text-text-muted font-josefin">
              {engagementData.fanLevel < 7 ? `Next: ${engagementData.nextLevelScore}` : 'Max Level'}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                engagementData.fanLevel >= 7 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                  : 'bg-gradient-to-r from-primary to-primary-light'
              }`}
              style={{ 
                width: engagementData.fanLevel >= 7 
                  ? '100%' 
                  : `${Math.min((engagementData.engagementScore / engagementData.nextLevelScore) * 100, 100)}%` 
              }}
            />
          </div>
          <p className="text-text-muted text-xs font-josefin">
            {engagementData.fanLevel >= 7 
              ? 'You\'ve reached the maximum fan level!' 
              : `${engagementData.nextLevelScore - engagementData.engagementScore} points to next level`
            }
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
  <Card className="text-center p-3 md:p-4">
    <Heart className="w-6 h-6 md:w-8 md:h-8 text-primary-light mx-auto mb-2" />
    <div className="text-lg md:text-xl font-bold text-text font-josefin">
      {engagementData.totalContentLikes}
    </div>
    <div className="text-text-muted text-xs md:text-sm font-josefin">Content Likes</div>
  </Card>

  <Card className="text-center p-3 md:p-4">
    <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-blue-400 mx-auto mb-2" />
    <div className="text-lg md:text-xl font-bold text-text font-josefin">
      {engagementData.totalComments}
    </div>
    <div className="text-text-muted text-xs md:text-sm font-josefin">Comments</div>
  </Card>

  <Card className="text-center p-3 md:p-4">
    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-green-400 mx-auto mb-2" />
    <div className="text-lg md:text-xl font-bold text-text font-josefin">
      {engagementData.accountAgeDays}
    </div>
    <div className="text-text-muted text-xs md:text-sm font-josefin">Days Active</div>
  </Card>

  <Card className="text-center p-3 md:p-4">
    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary-light mx-auto mb-2" />
    <div className="text-lg md:text-xl font-bold text-text font-josefin">
      {engagementData.totalPostLikes}
    </div>
    <div className="text-text-muted text-xs md:text-sm font-josefin">Post Likes</div>
  </Card>
</div>

      {/* Section Navigation */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 overflow-x-auto mx-2 md:mx-0">
        {[
          { id: 'info', label: 'Info', icon: User },
          { id: 'purchase-history', label: 'Purchases', icon: ShoppingBag },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id as any)}
            className={`flex-shrink-0 py-2 px-2 sm:px-3 md:px-4 rounded transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-josefin ${
              activeSection === id
                ? 'bg-primary text-text'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Icon size={14} className="sm:w-4 sm:h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Profile Info Section */}
      {activeSection === 'info' && (
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold text-text font-cinzel">Account Information</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs md:text-sm"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Username"
                value={isEditing ? editedName : userProfile.name}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={!isEditing}
                className="text-sm md:text-base"
              />
              <Input
                label="Email"
                type="email"
                value={userEmail}
                disabled={true}
                className="text-sm md:text-base"
              />
              
              {isEditing && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button 
                    size="sm" 
                    onClick={handleSaveChanges}
                    disabled={isSaving || !editedName.trim()}
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-text mb-4 font-cinzel">Engagement Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-text-muted font-josefin">Current Level: {getFanLevelName(engagementData.fanLevel)}</span>
                <span className="text-text-muted font-josefin">Level {engagementData.fanLevel}/7</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    engagementData.fanLevel >= 7 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                      : 'bg-gradient-to-r from-primary to-primary-light'
                  }`}
                  style={{ width: `${(engagementData.fanLevel / 7) * 100}%` }}
                />
              </div>
              
              {/* Detailed breakdown */}
              <div className="space-y-2 pt-2 border-t border-secondary/10">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-text-muted font-josefin">Account Age Bonus:</span>
                  <span className="text-text font-josefin">{Math.floor(engagementData.accountAgeDays / 30) * 10} pts</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-text-muted font-josefin">Content Likes:</span>
                  <span className="text-text font-josefin">{engagementData.totalContentLikes * 2} pts</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-text-muted font-josefin">Post Likes:</span>
                  <span className="text-text font-josefin">{engagementData.totalPostLikes * 1} pts</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-text-muted font-josefin">Comments:</span>
                  <span className="text-text font-josefin">{engagementData.totalComments * 3} pts</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm font-semibold border-t border-secondary/10 pt-2">
                  <span className="text-primary-light font-cinzel">Total Score:</span>
                  <span className="text-primary-light font-josefin">{engagementData.engagementScore} pts</span>
                </div>
              </div>
              
              <p className="text-text-muted text-xs md:text-sm font-josefin">
                {engagementData.fanLevel >= 7 
                  ? 'Congratulations! You\'ve reached Legend status!' 
                  : 'Keep engaging to unlock exclusive perks and reach the next level!'
                }
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Purchase History Section */}
      {activeSection === 'purchase-history' && (
        <div className="space-y-6">
          <Card className="p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-text mb-6 flex items-center font-cinzel">
              <ShoppingBag className="mr-2" size={24} />
              Purchase History ({purchasedItems.length} items)
            </h3>
            <div className="space-y-4">
              {purchasedItems.map((item) => (
                <Card key={item.id} className="bg-gray-900/50 border-secondary/10 p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h4 className="text-text font-semibold font-cinzel mb-1">{item.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-text-muted">
                        <span className="font-josefin">${item.price} AUD</span>
                        <span className="font-josefin">{item.date}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold font-cinzel ${
                          item.status === 'Delivered' 
                            ? 'bg-success-alpha-20 text-success border border-success-alpha-30' 
                            : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-start sm:self-center">
                      {item.status === 'Downloaded' && (
                        <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                          <Download size={16} />
                          <span>Download</span>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Purchase Summary */}
            <div className="mt-8 pt-6 border-t border-secondary/10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg md:text-2xl font-bold text-primary-light font-josefin">
                    ${purchasedItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                  </p>
                  <p className="text-text-muted text-xs md:text-sm font-josefin">Total Spent</p>
                </div>
                <div>
                  <p className="text-lg md:text-2xl font-bold text-primary-light font-josefin">{purchasedItems.length}</p>
                  <p className="text-text-muted text-xs md:text-sm font-josefin">Items Purchased</p>
                </div>
                <div>
                  <p className="text-lg md:text-2xl font-bold text-primary-light font-josefin">
                    {purchasedItems.filter(item => item.status === 'Delivered').length}
                  </p>
                  <p className="text-text-muted text-xs md:text-sm font-josefin">Delivered</p>
                </div>
                <div>
                  <p className="text-lg md:text-2xl font-bold text-primary-light font-josefin">
                    {purchasedItems.filter(item => item.status === 'Downloaded').length}
                  </p>
                  <p className="text-text-muted text-xs md:text-sm font-josefin">Downloads</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          {/* Notifications */}
          <Card className="lg:col-span-2 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-text mb-4 flex items-center font-cinzel">
              <Bell className="mr-2" size={20} />
              Notifications
            </h3>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className={`p-3 rounded border ${
                  notif.read ? 'bg-gray-800/50 border-gray-800' : 'bg-primary-alpha-10 border-primary-alpha-30'
                }`}>
                  <div className="flex items-start justify-between space-x-3">
                    <div className="flex-1">
                      <h4 className="text-text font-medium text-sm font-cinzel">{notif.title}</h4>
                      <p className="text-text-muted text-sm font-josefin">{notif.message}</p>
                      <span className="text-text-muted text-xs">{notif.time}</span>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Account Settings */}
          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-text mb-4 font-cinzel">Account Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text font-medium text-sm md:text-base font-cinzel">Push Notifications</p>
                  <p className="text-text-muted text-xs md:text-sm font-josefin">Get notified about new drops and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-text after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text font-medium text-sm md:text-base font-cinzel">Email Updates</p>
                  <p className="text-text-muted text-xs md:text-sm font-josefin">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-text after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>
          </Card>

          {/* Support & Account Actions */}
          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-text mb-4 font-cinzel">Support & Account</h3>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start text-sm">
                Contact Support
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                Privacy Policy
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                Terms of Service
              </Button>
              <hr className="border-gray-800" />
              <Button variant="ghost" className="w-full justify-start text-error hover:text-error text-sm">
                <LogOut className="mr-2" size={18} />
                Sign Out
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};