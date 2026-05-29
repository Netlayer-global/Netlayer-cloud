import React from 'react';

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'pink' | 'purple' | 'mixed';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 cursor-pointer inline-flex items-center justify-center gap-2';
  
  const variantClasses = {
    cyan: 'bg-transparent border border-neon-cyan text-neon-cyan hover:shadow-glow-cyan-lg hover:border-neon-cyan hover:text-neon-cyan',
    pink: 'bg-transparent border border-neon-pink text-neon-pink hover:shadow-glow-pink-lg hover:border-neon-pink hover:text-neon-pink',
    purple: 'bg-transparent border border-neon-purple text-neon-purple hover:shadow-glow-purple-lg hover:border-neon-purple hover:text-neon-purple',
    mixed: 'bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple text-white border border-transparent hover:shadow-glow-cyan-lg',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
