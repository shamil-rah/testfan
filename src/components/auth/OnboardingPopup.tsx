import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Sparkles } from 'lucide-react';
import { updateUserProfile } from '../../lib/supabase';

interface OnboardingPopupProps {
  userId: string;
  onComplete: () => void;
}

export const OnboardingPopup: React.FC<OnboardingPopupProps> = ({ userId, onComplete }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await updateUserProfile(userId, {
        name: username.trim(),
        role: 'user',
      });

      if (updateError) {
        throw updateError;
      }

      onComplete();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-black border border-white/20 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-alpha-20 border border-primary-alpha-30 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-primary-light" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-cinzel">
              Welcome to the Society
            </h2>
            <p className="text-text-secondary font-josefin">
              Choose your identity within the collective
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Input
                label="Your Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                error={error}
                className="pl-12"
                maxLength={50}
              />
              <User className="absolute left-4 top-11 w-5 h-5 text-gray-400" />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!username.trim() || isLoading}
            >
              {isLoading ? 'Joining the Society...' : 'Join the Collective'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm font-josefin">
              Your username will be visible to other members of the society
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};