import React from 'react';

interface NeonCardProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'pink' | 'purple';
  className?: string;
  hoverable?: boolean;
}

export const NeonCard: React.FC<NeonCardProps> = ({
  children,
  variant = 'cyan',
  className = '',
  hoverable = true,
}) => {
  const baseClasses = 'rounded-lg p-6 bg-dark-card backdrop-blur-xl transition-all duration-300';
  
  const variantClasses = {
    cyan: `neon-border-cyan ${hoverable ? 'neon-hover-cyan' : ''}`,
    pink: `neon-border-pink ${hoverable ? 'neon-hover-pink' : ''}`,
    purple: `neon-border-purple ${hoverable ? 'neon-hover-purple' : ''}`,
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};
