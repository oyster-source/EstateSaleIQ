import React from 'react';

interface HoneycombButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const HoneycombButton: React.FC<HoneycombButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'md',
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-bold tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none cursor-pointer";
  
  const variants = {
    primary: "bg-gold-500 text-background hover:bg-gold-400 hover:shadow-glow",
    secondary: "bg-honey-grid text-gold-500 border border-gold-600 hover:border-gold-400 hover:text-gold-400",
    outline: "bg-transparent text-gold-500 border-2 border-gold-500 hover:bg-gold-500/10"
  };

  const sizes = {
    sm: "h-10 px-6 text-xs",
    md: "h-12 px-8 text-sm",
    lg: "h-16 px-10 text-base"
  };

  // Hexagon clip-path style
  const hexagonStyle = {
    clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)", // Slight slant instead of full hex to keep text readable, or we can use full hex backing
    // thorough hex: clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" - this cuts off text often.
    // Let's use a "tech" bevel or just rounded with a gold border for now, or the slanted one.
    // User asked for Honeycomb aesthetic.
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{
        clipPath: "polygon(5% 0, 100% 0, 95% 100%, 0% 100%)"
      }}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      {/* Glow effect container if needed */}
    </button>
  );
};
