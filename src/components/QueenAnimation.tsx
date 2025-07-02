import React, { useEffect, useState } from 'react';
import { Crown, Heart, Sparkles, Star } from 'lucide-react';

interface QueenAnimationProps {
  onComplete?: () => void;
}

const QueenAnimation: React.FC<QueenAnimationProps> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);
  
  useEffect(() => {
    console.log("Queen animation mounted - animation should be visible now");
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Animation will play for 5 seconds, then start fade out
    const completeTimer = setTimeout(() => {
      console.log("Starting animation fade out");
      setFadeOut(true);
      
      // After fade out animation completes, call onComplete
      setTimeout(() => {
        document.body.style.overflow = ''; // Restore scrolling
        if (onComplete) {
          console.log("Animation complete, calling onComplete callback");
          onComplete();
        }
      }, 1000); // 1 second for fade out
    }, 5000); // 5 seconds for the animation to play
    
    return () => {
      console.log("Queen animation unmounting");
      clearTimeout(completeTimer);
      document.body.style.overflow = ''; // Restore scrolling
    };
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-1000"
      style={{
        background: 'linear-gradient(135deg, #42275a 0%, #734b6d 100%)',
        opacity: fadeOut ? 0 : 1
      }}
    >
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(120, 0, 120, 0.8) 0%, rgba(50, 0, 80, 0.9) 70%, rgba(20, 0, 40, 1) 100%)',
          opacity: 0.6
        }}
      />
      
      {/* Animated particles for depth */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              height: `${1 + Math.random() * 3}px`, 
              width: `${1 + Math.random() * 3}px`,
              opacity: 0.3 + Math.random() * 0.5,
              animation: `floatUp ${5 + Math.random() * 15}s linear infinite`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      
      {/* Floating hearts background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <Heart 
            key={i}
            className="absolute text-pink-400"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              height: `${10 + Math.random() * 20}px`, 
              width: `${10 + Math.random() * 20}px`,
              opacity: 0.2 + Math.random() * 0.3,
              animation: `floatUp ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
              transform: `rotate(${Math.random() * 90 - 45}deg)`
            }}
          />
        ))}
      </div>
      
      {/* Main content */}
      <div className="text-center relative z-10 max-w-xl mx-auto px-4">
        {/* Crown with animation */}
        <div className="relative mb-8">
          <div className="inline-block">
            <div className="relative">
              <Crown 
                className="h-36 w-36 text-yellow-400 animate-bounce" 
                style={{ 
                  filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.7))'
                }} 
              />
              <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping"></div>
            </div>
            
            <Sparkles className="absolute -right-10 -top-6 h-10 w-10 text-yellow-300 animate-pulse" />
            <Sparkles className="absolute -left-10 -top-6 h-10 w-10 text-yellow-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
        
        {/* Welcome text */}
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 mb-6">
          Welcome, Queen!
        </h1>
        
        <p className="text-white text-xl mb-8 animate-fadeIn">
          Your royal dashboard awaits your command.
        </p>
        
        {/* Love message with animated hearts */}
        <div className="mt-8 mb-12 animate-fadeIn">
          <div className="flex justify-center items-center">
            <div className="h-10 w-10 mr-3">
              <Heart className="h-full w-full text-pink-500 animate-pulse" />
            </div>
            <p className="text-white text-xl font-medium">With love from Rishit</p>
            <div className="h-10 w-10 ml-3">
              <Heart className="h-full w-full text-pink-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
        
        {/* Crown trail */}
        <div className="mt-12 flex justify-center space-x-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i}
              className="crown-particle"
              style={{
                animationDelay: `${i * 0.3}s`,
              }}
            >
              <Crown className={`h-12 w-12 text-yellow-${400 - i * 50}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QueenAnimation;