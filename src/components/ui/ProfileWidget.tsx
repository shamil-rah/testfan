import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { User, Star, Settings } from 'lucide-react';

interface ProfileWidgetProps {
  onViewProfile: () => void;
}

export const ProfileWidget: React.FC<ProfileWidgetProps> = ({ onViewProfile }) => {
  const user = {
    username: 'VibeMaster_99',
    fanLevel: 7,
    avatar: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'
  };

  const getFanLevelName = (level: number) => {
    if (level >= 10) return 'Legend';
    if (level >= 7) return 'Superfan';
    if (level >= 4) return 'Supporter';
    return 'New Fan';
  };

  const getFanLevelColor = (level: number) => {
    if (level >= 10) return 'text-yellow-400';
    if (level >= 7) return 'text-purple-400';
    if (level >= 4) return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <Card className="border-red-600/40">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img 
            src={user.avatar} 
            alt={user.username}
            className="w-16 h-16 rounded object-cover border-2 border-red-600"
          />
          <div className={`absolute -top-1 -right-1 bg-gray-900 px-2 py-1 rounded-full border border-gray-700 ${getFanLevelColor(user.fanLevel)}`}>
            <div className="flex items-center space-x-1">
              <Star size={12} />
              <span className="text-xs font-semibold">{user.fanLevel}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-text font-semibold font-cinzel">{user.username}</h3>
          <p className={`text-sm font-medium ${getFanLevelColor(user.fanLevel)}`}>
            {getFanLevelName(user.fanLevel)}
          </p>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onViewProfile}
          className="flex items-center space-x-1"
        >
          <User size={16} />
          <span>View</span>
        </Button>
      </div>
    </Card>
  );
};