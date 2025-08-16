import React from 'react';
import { Home, Play, ShoppingBag, MessageCircle, User, ShoppingCart } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  labels?: { id: string; label: string }[];
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, labels }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'content', icon: Play, label: 'Content' },
    { id: 'merch', icon: ShoppingBag, label: 'Merch' },
    { id: 'cart', icon: ShoppingCart, label: 'Cart' },
    { id: 'community', icon: MessageCircle, label: 'Community' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const displayTabs = labels ? tabs.map(tab => ({
    ...tab,
    label: labels.find(l => l.id === tab.id)?.label || tab.label
  })) : tabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 z-50 overflow-x-auto">
      <div className="flex justify-around items-center py-2 px-1 min-w-max">
        {displayTabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center py-2 px-1 rounded transition-all duration-300 min-w-0 ${
              activeTab === id
                ? 'text-primary bg-white/5'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Icon size={20} className="mb-1" />
            <span className="text-xs font-medium font-josefin whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};