import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { LoginPage } from './components/auth/LoginPage';
import { OnboardingPopup } from './components/auth/OnboardingPopup';
import { BottomNav } from './components/layout/BottomNav';
import { Home } from './components/tabs/Home';
import { Content } from './components/tabs/Content';
import { Merch } from './components/tabs/Merch';
import { Cart } from './components/tabs/Cart';
import { Community } from './components/tabs/Community';
import { Profile } from './components/tabs/Profile';
import { CartItem } from './types';
import { supabase, getCurrentUser, getUserProfile } from './lib/supabase';
import { useTheme } from './context/ThemeContext';

type AppState = 'loading' | 'login' | 'onboarding' | 'main-app';

function App() {
  const { theme } = useTheme();
  const [appState, setAppState] = useState<AppState>('loading');
  const [activeTab, setActiveTab] = useState('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is logged in, check if they need onboarding
          const { data: profile, error: profileError } = await getUserProfile(session.user.id);
          
          if (profileError) {
            // JWT expired or other auth error, clear session and redirect to login
            await supabase.auth.signOut();
            setAppState('login');
            return;
          }
          
          const needsOnboarding = !profile || profile.name === 'New User';
          
          setCurrentUser(session.user);
          
          if (needsOnboarding) {
            setAppState('onboarding');
          } else {
            setAppState('main-app');
          }
        } else {
          // No session, go to login
          setAppState('login');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Clear any invalid session data
        await supabase.auth.signOut();
        setAppState('login');
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setAppState('login');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLoginComplete = (user: any, needsOnboarding: boolean) => {
    setCurrentUser(user);
    if (needsOnboarding) {
      setAppState('onboarding');
    } else {
      setAppState('main-app');
    }
  };

  const handleOnboardingComplete = () => {
    setAppState('main-app');
  };

  const addToCart = (item: any, selectedOptions?: { [optionName: string]: string }, printifyVariantId?: number) => {
    const existingItem = cart.find(cartItem => 
      cartItem.item.id === item.id && 
      JSON.stringify(cartItem.selectedOptions) === JSON.stringify(selectedOptions) &&
      cartItem.printifyVariantId === printifyVariantId
    );

    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.item.id === item.id && 
        JSON.stringify(cartItem.selectedOptions) === JSON.stringify(selectedOptions) &&
        cartItem.printifyVariantId === printifyVariantId
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { 
        id: Date.now().toString(), 
        item, 
        quantity: 1, 
        selectedOptions,
        printifyVariantId
      }]);
    }
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // The auth state change listener will handle the rest
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderContent = () => {

    switch (activeTab) {
      case 'home':
        return <Home onTabChange={setActiveTab} />;
      case 'content':
        return <Content />;
      case 'merch':
        return <Merch cart={cart} addToCart={addToCart} onViewCart={() => setActiveTab('cart')} />;
      case 'cart':
        return <Cart 
          cart={cart} 
          updateQuantity={updateCartQuantity} 
          removeFromCart={removeFromCart} 
          onBackToMerch={() => setActiveTab('merch')} 
        />;
      case 'community':
        return <Community currentUser={currentUser} onTabChange={setActiveTab} />;
      case 'profile':
        return <Profile />;
      default:
        return <Home onTabChange={setActiveTab} />;
    }
  };

  const getNavLabels = () => [
      { id: 'home', label: 'Home' },
      { id: 'content', label: 'Content' },
      { id: 'merch', label: 'Merch' },
      { id: 'cart', label: 'Cart' },
      { id: 'community', label: 'Community' },
      { id: 'profile', label: 'Profile' }
  ];

  // Show loading state
  if (appState === 'loading') {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text font-josefin">Loading...</p>
        </div>
      </div>
    );
  }


  if (appState === 'login') {
    return <LoginPage onLogin={handleLoginComplete} />;
  }

  if (appState === 'onboarding' && currentUser) {
    return <OnboardingPopup userId={currentUser.id} onComplete={handleOnboardingComplete} />;
  }

  const appTitle = theme.appName;
  const logoSrc = theme.logoSrc;

 return (
  <div className="min-h-screen bg-background flex">
    {/* Desktop Sidebar Navigation */}
    <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-30 flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <img 
            src={logoSrc}
            alt={`${appTitle} Logo`}
            className="w-12 h-12 object-contain"
          />
          <h1 className="text-text text-lg font-cinzel font-semibold tracking-wider leading-tight text-center">
                         {appTitle}
          </h1>
        </div>
        
        <nav className="space-y-2">
          {getNavLabels().map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center justify-start px-4 py-3 transition-all duration-300 font-josefin ${
                activeTab === id
                  ? 'text-primary border-l-2 border-primary bg-white-alpha-5'
                  : 'text-text hover:text-primary hover:bg-white-alpha-5'
              }`}
            >
              <span className="font-medium">{label}</span>
              {id === 'cart' && cart.length > 0 && (
                <span className="ml-auto bg-primary text-text text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          ))}
        
        <div className="mt-8 pt-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-start px-4 py-3 transition-all duration-300 font-josefin text-primary hover:text-primary-light hover:bg-primary-alpha-10 rounded"
          >
            <LogOut size={20} className="mr-3" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
        </nav>
      </div>
    </div>

    {/* Main Content Area (shifted right for sidebar) */}
    <div className="flex-1 md:ml-64 flex flex-col">
           {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <img 
              src={logoSrc}
              alt={`${appTitle} Logo`}
              className="w-10 h-10 md:w-12 md:h-12 object-contain"
            />
            <h1 className="text-text text-lg md:text-xl font-cinzel font-semibold tracking-wider">
              {appTitle}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Add header icons/buttons here if needed */}
          </div>
        </div>
      </header>

        
      {/* Main Content */}
      <main className="flex-1 px-4 py-6 pb-20 md:pb-6">
        {renderContent()}
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} labels={getNavLabels()} />
      </div>
    </div>
  </div>
);

}

export default App;