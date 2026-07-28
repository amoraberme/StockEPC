import React from 'react';

interface MgSolarLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const MgSolarLogo: React.FC<MgSolarLogoProps> = ({
  className = '',
  size = 'md'
}) => {
  const sizeMap = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-20',
    xl: 'h-32'
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src="/MGSOLARLOGO.png"
        alt="MG SOLAR LOGO"
        className={`${sizeMap[size]} w-auto object-contain transition-transform duration-200 hover:scale-[1.02] drop-shadow-xs`}
      />
    </div>
  );
};


