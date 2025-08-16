import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Music, Mail, Shield, Headphones } from 'lucide-react';
import { supabase, createUserProfile } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

interface LoginPageProps {
  onLogin: (user: any, needsOnboarding: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!isLogin && password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (isLogin) {
        // Sign in existing user
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          // Check if user profile exists and if they need onboarding
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const needsOnboarding = !profile || profile.name === 'New User';
          onLogin(data.user, needsOnboarding);
        }
      } else {
        // Sign up new user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Create user profile with default values
          const { error: profileError } = await createUserProfile(data.user.id);

          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Continue anyway, we can handle this later
          }

          // New users always need onboarding
          onLogin(data.user, true);
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background relative flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex w-1/2 h-full absolute left-0 top-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-alpha-20 via-background to-background" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${encodeURIComponent(theme.colors.primary)}' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-12 text-text">
          <div className="mb-8">
            <img 
              src={theme.logoSrc} 
              alt={`${theme.appName} Logo`} 
              className="w-24 h-24 object-contain mb-6"
            />
            <h1 className="text-5xl font-semibold mb-4 font-[Cinzel] tracking-wider">
              {theme.appName.split(' ').map((word, index) => (
                <span key={index}>
                  {word}
                  {index < theme.appName.split(' ').length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="text-xl text-text-secondary font-josefin leading-relaxed">
              Enter the darkness.<br/>
              Join the collective.<br/>
              Experience the sound.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4 text-text-muted">
              <div className="w-12 h-12 bg-primary-alpha-20 rounded border border-primary-alpha-30 flex items-center justify-center">
                <Music size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-text font-cinzel">Exclusive Content</p>
                <p className="text-sm font-josefin">Access unreleased tracks and behind-the-scenes content</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-text-muted">
              <div className="w-12 h-12 bg-primary-alpha-20 rounded border border-primary-alpha-30 flex items-center justify-center">
                <Headphones size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-text font-cinzel">Live Sessions</p>
                <p className="text-sm font-josefin">Join live streaming sessions and interact with the artist</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-text-muted">
              <div className="w-12 h-12 bg-primary-alpha-20 rounded border border-primary-alpha-30 flex items-center justify-center">
                <Shield size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-text font-cinzel">Community Access</p>
                <p className="text-sm font-josefin">Connect with other fans and share your passion</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="ml-auto w-full lg:w-1/2 flex items-center justify-center px-4 lg:px-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="mb-4">
              <img 
                src={theme.logoSrc} 
                alt={`${theme.appName} Logo`} 
                className="w-16 h-16 mx-auto object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-text mb-2 font-cinzel">
              {isLogin ? 'WELCOME BACK' : 'JOIN THE SOCIETY'}
            </h1>
            <p className="text-text-secondary font-josefin">
              {isLogin ? 'Enter the darkness' : 'Become one with the collective'}
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-8">
            <h1 className="text-4xl font-bold text-text mb-2 font-cinzel tracking-wider">
              {isLogin ? 'WELCOME BACK' : 'JOIN THE SOCIETY'}
            </h1>
            <p className="text-text-secondary font-josefin text-lg">
              {isLogin ? 'Enter the darkness' : 'Become one with the collective'}
            </p>
          </div>

          <div className="noir-card rounded p-8 mb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {!isLogin && (
                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-primary-alpha-20 border border-primary-alpha-30 rounded text-primary text-sm font-josefin">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Entering...' : (isLogin ? 'Enter' : 'Join Society')}
              </Button>
            </form>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-text-muted font-josefin">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Mail className="w-5 h-5 relative top-[1px]" />
                <span className="font-[Cinzel]">GOOGLE</span>
              </Button>

              <Button
                variant="secondary"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Music className="w-5 h-5 relative top-[1px]" />
                <span className="font-[Cinzel]">APPLE</span>
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-primary-light transition-colors font-josefin"
            >
              {isLogin ? "Don't have an account? Join us" : "Already a member? Enter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
