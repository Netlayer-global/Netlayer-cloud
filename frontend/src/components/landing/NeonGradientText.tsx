import React from 'react';

interface NeonGradientTextProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'pink' | 'purple' | 'mixed';
  glowing?: boolean;
  className?: string;
}

export const NeonGradientText: React.FC<NeonGradientTextProps> = ({
  children,
  variant = 'cyan',
  glowing = false,
  className = '',
}) => {
  const variantClasses = {
    cyan: 'neon-text-cyan',
    pink: 'neon-text-pink',
    purple: 'neon-text-purple',
    mixed: 'neon-text-mixed',
  };

  const glowClasses = {
    cyan: glowing ? 'neon-glow-cyan' : '',
    pink: glowing ? 'neon-glow-pink' : '',
    purple: glowing ? 'neon-glow-purple' : '',
    mixed: glowing ? 'neon-glow-cyan' : '',
  };

  return (
    <span className={`${variantClasses[variant]} ${glowClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};
