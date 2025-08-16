import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Play, Pause, Heart, Eye, Filter, ArrowLeft, Share, Headphones, Video, Image as ImageIcon, Flame, Music, Film, Mic, Palette, Volume2, VolumeX, SkipBack, SkipForward, Maximize, Minimize, Loader2 } from 'lucide-react';
import { MediaContent } from '../../types';
import { supabase, getCurrentUser, toggleContentLike, getUserLikesForContent } from '../../lib/supabase';

export const Content: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [contentData, setContentData] = useState<MediaContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likingContent, setLikingContent] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>('');
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [tempProgress, setTempProgress] = useState(0);
  const [tempVolume, setTempVolume] = useState(0.7);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoVolume, setVideoVolume] = useState(0.7);
  const [isDraggingVideoProgress, setIsDraggingVideoProgress] = useState(false);
  const [isDraggingVideoVolume, setIsDraggingVideoVolume] = useState(false);
  const [tempVideoProgress, setTempVideoProgress] = useState(0);
  const [tempVideoVolume, setTempVideoVolume] = useState(0.7);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const videoProgressRef = useRef<HTMLDivElement>(null);
  const videoVolumeRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'all', label: 'All', icon: Flame },
    { id: 'beats', label: 'Beats/Audios', icon: Headphones },
    { id: 'behind-scenes', label: 'Images', icon: Palette },
    { id: 'visuals', label: 'Videos', icon: Film }
  ];

  const filteredContent = selectedCategory === 'all' 
    ? contentData 
    : contentData.filter(item => item.category === selectedCategory);

  const selectedMedia = selectedMediaId 
    ? contentData.find(item => item.id === selectedMediaId) 
    : null;

  // Array of sample audio URLs for random playback
  const audioUrls = [
    '/DJ Khaled ft. Drake - GREECE (Official Visualizer).mp3'
  ];

  // Select random audio URL
  const selectRandomAudio = () => {
    const randomIndex = Math.floor(Math.random() * audioUrls.length);
    return audioUrls[randomIndex];
  };

  // Fetch content from Supabase
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('content')
          .select('id, title, type, description, file_url, cover_image_url, likes, created_at, tags, status, is_active')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Get current user
        const user = await getCurrentUser();
        setCurrentUser(user);

        // Get user likes for all content
        const likedContentIds = user ? await getUserLikesForContent((data || []).map(item => item.id), user.id) : [];

        // Map Supabase data to MediaContent interface
        const mappedContent: MediaContent[] = (data || []).map((item) => {
          // Determine category based on type and tags
          let category = 'all';
          if (item.type === 'audio') {
            category = item.tags?.includes('freestyle') ? 'freestyles' : 'beats';
          } else if (item.type === 'video') {
            category = item.tags?.includes('behind-scenes') ? 'behind-scenes' : 'visuals';
          } else if (item.type === 'image') {
            category = 'visuals';
          }

          // Check if content is new (created within last 7 days)
          const createdDate = new Date(item.created_at);
          const now = new Date();
          const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
          const isNew = daysDiff <= 7;

          return {
            id: item.id,
            title: item.title,
            type: item.type as 'audio' | 'video' | 'image',
            thumbnail: item.cover_image_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg',
            url: item.file_url,
            category,
            likes: item.likes || 0,
            views: 0, // Not stored in database yet
            userHasLiked: user ? likedContentIds.includes(item.id) : false,
            description: item.description || '',
            isNew
          };
        });

        setContentData(mappedContent);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleLike = async (contentId: string) => {
    if (!currentUser || likingContent) return;

    setLikingContent(contentId);

    try {
      const result = await toggleContentLike(contentId, currentUser.id);
      
      // Update local state
      setContentData(prevContent => 
        prevContent.map(item => {
          if (item.id === contentId) {
            return {
              ...item,
              likes: result.liked ? item.likes + 1 : item.likes - 1,
              userHasLiked: result.liked
            };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('Error liking content:', error);
    } finally {
      setLikingContent(null);
    }
  };

  // Format time in mm:ss format
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause toggle
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  // Handle video play/pause toggle
  const toggleVideoPlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        await videoRef.current.play();
        setIsVideoPlaying(true);
      }
    } catch (error) {
      console.error('Error playing video:', error);
      setIsVideoPlaying(false);
    }
  };

  // Handle progress bar interactions
  const getProgressFromEvent = (e: MouseEvent | React.MouseEvent, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || !progressRef.current) return;
    
    setIsDraggingProgress(true);
    const progress = getProgressFromEvent(e, progressRef.current);
    const newTime = progress * duration;
    setTempProgress(progress);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current || !duration) return;
      const progress = getProgressFromEvent(e, progressRef.current);
      setTempProgress(progress);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!audioRef.current || !progressRef.current || !duration) return;
      const progress = getProgressFromEvent(e, progressRef.current);
      const newTime = progress * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setIsDraggingProgress(false);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle video progress bar interactions
  const handleVideoProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !videoDuration || !videoProgressRef.current) return;
    
    setIsDraggingVideoProgress(true);
    const progress = getProgressFromEvent(e, videoProgressRef.current);
    const newTime = progress * videoDuration;
    setTempVideoProgress(progress);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!videoProgressRef.current || !videoDuration) return;
      const progress = getProgressFromEvent(e, videoProgressRef.current);
      setTempVideoProgress(progress);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!videoRef.current || !videoProgressRef.current || !videoDuration) return;
      const progress = getProgressFromEvent(e, videoProgressRef.current);
      const newTime = progress * videoDuration;
      videoRef.current.currentTime = newTime;
      setVideoCurrentTime(newTime);
      setIsDraggingVideoProgress(false);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle volume bar interactions
  const getVolumeFromEvent = (e: MouseEvent | React.MouseEvent, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !volumeRef.current) return;
    
    setIsDraggingVolume(true);
    const newVolume = getVolumeFromEvent(e, volumeRef.current);
    setTempVolume(newVolume);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!volumeRef.current) return;
      const newVolume = getVolumeFromEvent(e, volumeRef.current);
      setTempVolume(newVolume);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!audioRef.current || !volumeRef.current) return;
      const newVolume = getVolumeFromEvent(e, volumeRef.current);
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsDraggingVolume(false);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle video volume bar interactions
  const handleVideoVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !videoVolumeRef.current) return;
    
    setIsDraggingVideoVolume(true);
    const newVolume = getVolumeFromEvent(e, videoVolumeRef.current);
    setTempVideoVolume(newVolume);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!videoVolumeRef.current) return;
      const newVolume = getVolumeFromEvent(e, videoVolumeRef.current);
      setTempVideoVolume(newVolume);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!videoRef.current || !videoVolumeRef.current) return;
      const newVolume = getVolumeFromEvent(e, videoVolumeRef.current);
      videoRef.current.volume = newVolume;
      setVideoVolume(newVolume);
      setIsDraggingVideoVolume(false);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  // Handle video controls visibility
  const showControls = () => {
    setShowVideoControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      if (isVideoPlaying) {
        setShowVideoControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  const hideControls = () => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    if (isVideoPlaying) {
      setShowVideoControls(false);
    }
  };

  // Load new random audio
  const loadRandomAudio = () => {
    const newAudioUrl = selectRandomAudio();
    setCurrentAudioUrl(newAudioUrl);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  };

  // Initialize audio when media is selected
  useEffect(() => {
    const selectedMedia = selectedMediaId 
      ? contentData.find(item => item.id === selectedMediaId) 
      : null;
    
    if (selectedMedia && selectedMedia.type === 'audio') {
    // Use the actual file URL from the selected media
    setCurrentAudioUrl(selectedMedia.url);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }
}, [selectedMediaId]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDraggingProgress) {
        setCurrentTime(audio.currentTime);
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Stop playback when audio ends (no auto-next)
    };
    const handleVolumeChange = () => {
      if (!isDraggingVolume) {
        setVolume(audio.volume);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('volumechange', handleVolumeChange);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [currentAudioUrl, isDraggingProgress, isDraggingVolume]);

  // Set initial volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedMedia || selectedMedia.type !== 'video') return;

    const handleVideoTimeUpdate = () => {
      if (!isDraggingVideoProgress) {
        setVideoCurrentTime(video.currentTime);
      }
    };
    const handleVideoLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setVideoDuration(video.duration);
      }
    };
    const handleVideoLoadedData = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setVideoDuration(video.duration);
      }
    };
    const handleVideoDurationChange = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setVideoDuration(video.duration);
      }
    };
    const handleVideoEnded = () => setIsVideoPlaying(false);
    const handleVideoVolumeChange = () => {
      if (!isDraggingVideoVolume) {
        setVideoVolume(video.volume);
      }
    };
    const handleVideoPlay = () => setIsVideoPlaying(true);
    const handleVideoPause = () => setIsVideoPlaying(false);

    video.addEventListener('timeupdate', handleVideoTimeUpdate);
    video.addEventListener('loadedmetadata', handleVideoLoadedMetadata);
    video.addEventListener('loadeddata', handleVideoLoadedData);
    video.addEventListener('durationchange', handleVideoDurationChange);
    video.addEventListener('ended', handleVideoEnded);
    video.addEventListener('volumechange', handleVideoVolumeChange);
    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('pause', handleVideoPause);

    return () => {
      video.removeEventListener('timeupdate', handleVideoTimeUpdate);
      video.removeEventListener('loadedmetadata', handleVideoLoadedMetadata);
      video.removeEventListener('loadeddata', handleVideoLoadedData);
      video.removeEventListener('durationchange', handleVideoDurationChange);
      video.removeEventListener('ended', handleVideoEnded);
      video.removeEventListener('volumechange', handleVideoVolumeChange);
      video.removeEventListener('play', handleVideoPlay);
      video.removeEventListener('pause', handleVideoPause);
    };
  }, [isDraggingVideoProgress, isDraggingVideoVolume, selectedMedia]);

  // Reset video state when media changes
  useEffect(() => {
    if (selectedMedia && selectedMedia.type === 'video') {
      setVideoCurrentTime(0);
      setVideoDuration(0);
      setIsVideoPlaying(false);
    }
  }, [selectedMedia?.id]);

  // Set initial video volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = videoVolume;
    }
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMediaClick = (media: MediaContent) => {
    // Directly show player with immediate playback readiness
    setSelectedMediaId(media.id);
  };

  const handleBackToContent = () => {
    setSelectedMediaId(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'audio':
        return Music;
      case 'image':
        return ImageIcon;
      default:
        return Play;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-primary/80';
      case 'audio':
        return 'bg-gray-700/80 border border-primary-alpha-40';
      case 'image':
        return 'bg-gray-700/80';
      default:
        return 'bg-gray-700/80';
    }
  };

  // If a media item is selected, show the player view
  if (selectedMedia) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-josefin">Loading content...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-cinzel">Error Loading Content</h3>
            <p className="text-gray-400 font-josefin mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Back Button */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToContent}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Back to Content</span>
          </Button>
        </div>

        {/* Media Player */}
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden bg-gradient-to-br from-primary-900/20 via-black to-black">
            {selectedMedia.type === 'video' ? (
              // Video Player
              <div 
                ref={videoContainerRef}
                className={`aspect-video bg-black relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 aspect-auto' : ''}`}
                onMouseMove={showControls}
                onMouseLeave={hideControls}
              >
               <video
  ref={videoRef}
  className="w-full h-full object-cover cursor-pointer"
  poster={selectedMedia.thumbnail}
  onClick={toggleVideoPlayPause}
  onDoubleClick={toggleFullscreen}
  preload="auto"
  crossOrigin="anonymous"
  src={selectedMedia.url} // <-- now it uses the URL from your content array
>
  Your browser does not support the video tag.
</video>


                
                {/* Custom Video Controls */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${showVideoControls ? 'opacity-100' : 'opacity-0'}`}>
                  {/* Top Controls */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="inline-flex items-center justify-center px-2 py-1 sm:px-3 rounded bg-primary/80 text-white text-xs sm:text-sm font-semibold font-cinzel">
                        <Video size={12} className="mr-1 sm:w-4 sm:h-4" />
                        VIDEO
                      </div>
                      {selectedMedia.isNew && (
                        <span className="bg-primary text-white px-2 py-1 sm:px-3 rounded text-xs sm:text-sm font-semibold font-cinzel">
                          NEW
                        </span>
                      )}
                    </div>
                    <button
                      onClick={toggleFullscreen}
                      className="p-1.5 sm:p-2 rounded bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      {isFullscreen ? <Minimize size={16} className="sm:w-5 sm:h-5" /> : <Maximize size={16} className="sm:w-5 sm:h-5" />}
                    </button>
                  </div>

                  {/* Center Play Button */}
                  {!isVideoPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={toggleVideoPlayPause}
                        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 /90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-primary transition-all duration-300 transform hover:scale-110"
                      >
                        <Play size={16} fill="white" className="ml-0.5 sm:ml-1 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                      </button>
                    </div>
                  )}

                  {/* Bottom Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-white">
                      <span className="font-josefin text-xs sm:text-sm">{formatTime(isDraggingVideoProgress ? tempVideoProgress * videoDuration : videoCurrentTime)}</span>
                      <div 
                        ref={videoProgressRef}
                        className="flex-1 bg-white/20 rounded-full h-1 sm:h-1.5 relative cursor-pointer group"
                        onMouseDown={handleVideoProgressMouseDown}
                      >
                        <div 
                          className="bg-primary h-1 sm:h-1.5 rounded-full relative transition-all duration-100"
                          style={{ 
                            width: videoDuration 
                              ? `${(isDraggingVideoProgress ? tempVideoProgress : (videoCurrentTime / videoDuration)) * 100}%` 
                              : '0%' 
                          }}
                        >
                          <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full border border-white shadow-lg transition-all duration-200 ${isDraggingVideoProgress ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'}`}></div>
                        </div>
                      </div>
                      <span className="font-josefin text-xs sm:text-sm">{formatTime(videoDuration)}</span>
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                        <button 
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = Math.max(0, videoCurrentTime - 10);
                            }
                          }}
                          className="text-white hover:text-primary-400 transition-colors p-1 sm:p-0"
                        >
                          <SkipBack size={16} className="sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          onClick={toggleVideoPlayPause}
                          className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
                        >
                          {isVideoPlaying ? (
                            <Pause size={14} fill="white" className="sm:w-5 sm:h-5" />
                          ) : (
                            <Play size={14} fill="white" className="ml-0.5 sm:w-5 sm:h-5" />
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = Math.min(videoDuration, videoCurrentTime + 10);
                            }
                          }}
                          className="text-white hover:text-primary-400 transition-colors p-1 sm:p-0"
                        >
                          <SkipForward size={16} className="sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      
                      {/* Volume Control */}
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button 
                          onClick={() => {
                            const newVolume = (isDraggingVideoVolume ? tempVideoVolume : videoVolume) > 0 ? 0 : 0.7;
                            if (videoRef.current) {
                              videoRef.current.volume = newVolume;
                            }
                            setVideoVolume(newVolume);
                          }}
                          className="text-white hover:text-primary-400 transition-colors p-1 sm:p-0"
                        >
                          {(isDraggingVideoVolume ? tempVideoVolume : videoVolume) > 0 ? <Volume2 size={16} className="sm:w-5 sm:h-5" /> : <VolumeX size={16} className="sm:w-5 sm:h-5" />}
                        </button>
                        <div 
                          ref={videoVolumeRef}
                          className="w-12 sm:w-16 md:w-20 bg-white/20 rounded-full h-1 sm:h-1.5 relative cursor-pointer group"
                          onMouseDown={handleVideoVolumeMouseDown}
                        >
                          <div 
                            className="bg-primary h-1 sm:h-1.5 rounded-full relative transition-all duration-100"
                            style={{ width: `${(isDraggingVideoVolume ? tempVideoVolume : videoVolume) * 100}%` }}
                          >
                            <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full border border-white shadow-lg transition-all duration-200 ${isDraggingVideoVolume ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'}`}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Type Badge */}
                <div className={`absolute top-4 left-4 transition-opacity duration-300 ${showVideoControls ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="inline-flex items-center justify-center px-2 py-1 sm:px-3 rounded bg-primary/80 text-white text-xs sm:text-sm font-semibold font-cinzel">
                    <Video size={12} className="mr-1 sm:w-4 sm:h-4" />
                    VIDEO
                  </div>
                </div>

                {/* New Badge */}
                {selectedMedia.isNew && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                    <span className="bg-primary text-white px-2 py-1 sm:px-3 rounded text-xs sm:text-sm font-semibold font-cinzel">
                      NEW
                    </span>
                  </div>
                )}
              </div>
            ) : selectedMedia.type === 'audio' ? (
              // Audio Player with Rotating Vinyl
              <div className="bg-gradient-to-br from-primary-900/10 to-black p-8">
                <div className="flex flex-col items-center space-y-6">
                  {/* Rotating Vinyl Record */}
                  <div className="relative">
                    <div className={`w-64 h-64 rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 border-4 border-gray-700 relative overflow-hidden ${isPlaying ? 'animate-spin-slow' : ''}`}>
                      {/* Vinyl grooves */}
                      <div className="absolute inset-4 rounded-full border border-gray-600 opacity-30"></div>
                      <div className="absolute inset-8 rounded-full border border-gray-600 opacity-20"></div>
                      <div className="absolute inset-12 rounded-full border border-gray-600 opacity-15"></div>
                      <div className="absolute inset-16 rounded-full border border-gray-600 opacity-10"></div>
                      
                      {/* Center label */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      </div>
                      
                      {/* Album art in center */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full overflow-hidden border-2 border-primary-600">
                        <img 
                          src={selectedMedia.thumbnail} 
                          alt={selectedMedia.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    {/* Needle/Tonearm */}
                    <div className="absolute -top-2 right-8 w-32 h-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full transform rotate-12 origin-right">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                  </div>

                  {/* Audio Element (hidden) */}
                  <audio
                    ref={audioRef}
                    src={currentAudioUrl}
                    className="hidden"
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>

                  {/* Player Controls */}
                  <div className="w-full max-w-md space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white font-cinzel mb-1">{selectedMedia.title}</h3>
                      <p className="text-primary-400 font-josefin">Cashless Society</p>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-3 text-sm text-gray-400 font-josefin">
                      <span>{formatTime(isDraggingProgress ? tempProgress * duration : currentTime)}</span>
                      <div 
                        ref={progressRef}
                        className="flex-1 bg-gray-800 rounded-full h-2 relative cursor-pointer group"
                        onMouseDown={handleProgressMouseDown}
                      >
                        <div 
                          className="bg-primary h-2 rounded-full relative transition-all duration-100"
                          style={{ 
                            width: duration 
                              ? `${(isDraggingProgress ? tempProgress : (currentTime / duration)) * 100}%` 
                              : '0%' 
                          }}
                        >
                          <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg transition-all duration-200 ${isDraggingProgress ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'}`}></div>
                        </div>
                      </div>
                      <span>{formatTime(duration)}</span>
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-center space-x-6">
                      <button 
                        onClick={loadRandomAudio}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <SkipBack size={20} />
                      </button>
                      <button 
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = Math.max(0, currentTime - 10);
                          }
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={togglePlayPause}
                        className="w-12 h-12 bg-primary rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause size={24} fill="white" />
                        ) : (
                          <Play size={24} fill="white" className="ml-1" />
                        )}
                      </button>
                      <button 
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = Math.min(duration, currentTime + 10);
                          }
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13 6v12l8.5-6L13 6zM4 18l8.5-6L4 6v12z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={loadRandomAudio}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <SkipForward size={20} />
                      </button>
                    </div>
                    
                    {/* Volume Control */}
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => {
                          const newVolume = (isDraggingVolume ? tempVolume : volume) > 0 ? 0 : 0.7;
                          if (audioRef.current) {
                            audioRef.current.volume = newVolume;
                          }
                          setVolume(newVolume);
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {(isDraggingVolume ? tempVolume : volume) > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
                      </button>
                      <div 
                        ref={volumeRef}
                        className="flex-1 bg-gray-800 rounded-full h-2 relative cursor-pointer group"
                        onMouseDown={handleVolumeMouseDown}
                      >
                        <div 
                          className="bg-primary h-2 rounded-full relative transition-all duration-100"
                          style={{ width: `${(isDraggingVolume ? tempVolume : volume) * 100}%` }}
                        >
                          <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg transition-all duration-200 ${isDraggingVolume ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Type Badge */}
                <div className="absolute top-4 left-4">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded bg-gray-700/80 border border-primary-alpha-40 text-white text-sm font-semibold font-cinzel">
                    <Music size={16} className="mr-1" />
                    AUDIO
                  </div>
                </div>

                {/* New Badge */}
                {selectedMedia.isNew && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-primary text-white px-3 py-1 rounded text-sm font-semibold font-cinzel">
                      NEW
                    </span>
                  </div>
                )}
              </div>
            ) : (
              // Image Display
              <div className="aspect-video bg-black flex items-center justify-center relative w-full">
                <img 
                  src={selectedMedia.thumbnail} 
                  alt={selectedMedia.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Type Badge */}
                <div className="absolute top-4 left-4">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded bg-gray-700/80 text-white text-sm font-semibold font-cinzel">
                    <ImageIcon size={16} className="mr-1" />
                    IMAGE
                  </div>
                </div>

                {/* New Badge */}
                {selectedMedia.isNew && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-primary text-white px-3 py-1 rounded text-sm font-semibold font-cinzel">
                      NEW
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Media Info */}
            <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-2 sm:space-y-0">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-text mb-2 font-cinzel break-words">
                  {selectedMedia.title}
                </h1>
                <p className="text-text-muted mb-4 leading-relaxed font-josefin text-sm sm:text-base">
                  {selectedMedia.description}
                </p>
                <div className="flex items-center space-x-4 sm:space-x-6 text-gray-400 text-sm">
                  <span className="flex items-center space-x-1">
                    <Eye size={16} />
                    <span>{selectedMedia.views.toLocaleString()} views</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Heart size={16} />
                    <span>{selectedMedia.likes.toLocaleString()} likes</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button 
                onClick={() => handleLike(selectedMedia.id)}
                disabled={!currentUser || likingContent === selectedMedia.id}
                className={`flex items-center justify-center space-x-2 ${
                  selectedMedia.userHasLiked 
                    ? 'bg-primary hover:bg-primary-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {likingContent === selectedMedia.id ? (
                  <Loader2 size={18} className="animate-spin text-primary" />
                ) : (
                  <Heart size={18} className={selectedMedia.userHasLiked ? 'fill-current' : ''} />
                )}
                <span>{selectedMedia.userHasLiked ? 'Liked' : 'Like'}</span>
              </Button>
              <Button variant="secondary" className="flex items-center justify-center space-x-2">
                <Share size={18} />
                <span>Share</span>
              </Button>
              <Button variant="ghost" className="justify-center">
                Add to Favorites
              </Button>
            </div>
            </div>
          </Card>
        </div>

        {/* Related Content */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-text mb-4 font-cinzel px-2 sm:px-0">Related Content</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 px-2 sm:px-0">
            {contentData
              .filter(item => item.id !== selectedMedia.id && item.category === selectedMedia.category)
              .slice(0, 4)
              .map((item) => (
                <Card 
                  key={item.id} 
                  className="p-0 overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => handleMediaClick(item)}
                >
                  <div className="relative">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title}
                      className="w-full h-20 sm:h-24 md:h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="text-white ml-0.5" size={12} />
                      </div>
                    </div>

                    {/* Title */}
                    <div className="absolute bottom-1 left-1 right-1 sm:bottom-2 sm:left-2 sm:right-2">
                      <h3 className="text-white font-semibold text-xs sm:text-sm font-cinzel truncate">{item.title}</h3>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // Default content grid view
  if (isLoading || error) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between px-2 sm:px-0">
          <h1 className="text-lg sm:text-xl md:text-3xl font-bold text-white font-cinzel truncate">Content Library</h1>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-josefin">Loading content...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-cinzel">Error Loading Content</h3>
            <p className="text-gray-400 font-josefin mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2 sm:px-0">
        <h1 className="text-lg sm:text-xl md:text-3xl font-bold text-text font-cinzel truncate">Content Library</h1>
        <button className="p-1.5 sm:p-2 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0 ml-2">
          <Filter size={20} />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 sm:space-x-2 md:space-x-3 overflow-x-auto pb-2 scrollbar-hide px-2 sm:px-0 -mx-2 sm:mx-0">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 rounded transition-all duration-200 font-josefin flex items-center space-x-1 md:space-x-2 text-xs sm:text-sm md:text-base whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <IconComponent size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-cinzel">No Content Found</h3>
          <p className="text-gray-400 font-josefin">No content available in this category.</p>
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6 px-2 sm:px-0">
        {filteredContent.map((item) => {
          const TypeIcon = getTypeIcon(item.type);
          return (
            <Card 
              key={item.id} 
              className="p-0 overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300 w-full"
              onClick={() => handleMediaClick(item)}
            >
              <div className="relative">
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-24 xs:h-28 sm:h-32 md:h-40 lg:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Type Icon */}
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 md:top-3 md:left-3">
                  <div className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded text-white text-xs md:text-sm ${getTypeColor(item.type)}`}>
                    <TypeIcon size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                  </div>
                </div>

                {/* New Badge */}
                {item.isNew && (
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 md:top-3 md:right-3">
                    <span className="bg-primary text-white px-1 py-0.5 sm:px-1.5 md:px-2 md:py-1 rounded text-xs font-semibold font-cinzel">
                      NEW
                    </span>
                  </div>
                )}

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-primary backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="text-white ml-0.5 md:ml-1" size={12} />
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-1 left-1 right-1 sm:bottom-2 sm:left-2 sm:right-2 md:bottom-3 md:left-3 md:right-3">
                  <h3 className="text-text-muted font-semibold mb-0.5 sm:mb-1 font-cinzel text-xs sm:text-sm lg:text-base truncate leading-tight">{item.title}</h3>
                  <div className="flex items-center justify-between text-gray-300 text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Eye size={10} className="sm:w-3 sm:h-3" />
                        <span className="hidden xs:inline text-xs">{(item.views / 1000).toFixed(1)}k</span>
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item.id);
                        }}
                        disabled={!currentUser || likingContent === item.id}
                        className={`flex items-center space-x-1 transition-colors ${
                          item.userHasLiked 
                            ? 'text-primary-500 hover:text-primary-400' 
                            : 'text-gray-300 hover:text-primary-400'
                        }`}
                      >
                        {likingContent === item.id ? (
                          <Loader2 size={10} className="animate-spin sm:w-3 sm:h-3 text-primary" />
                        ) : (
                          <Heart size={10} className={`sm:w-3 sm:h-3 ${item.userHasLiked ? 'fill-current' : ''}`} />
                        )}
                        <span className="hidden xs:inline text-xs">{(item.likes / 1000).toFixed(1)}k</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
};