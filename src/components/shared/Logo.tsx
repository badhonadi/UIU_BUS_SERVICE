'use client';

import { Bus } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  href?: string;
}

export function Logo({ size = 'md', showText = true, className = '', href = '/' }: LogoProps) {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-2xl' },
    lg: { icon: 40, text: 'text-4xl' },
  };

  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="bg-gradient-to-br from-[#F37021] to-[#E85D0A] rounded-xl p-2 shadow-lg">
          <Bus size={sizes[size].icon} className="text-white" />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold ${sizes[size].text} bg-gradient-to-r from-[#F37021] to-[#E85D0A] bg-clip-text text-transparent leading-tight`}>
            RideWave
          </span>
          <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase -mt-1">
            UIU Bus Service
          </span>
        </div>
      )}
    </Link>
  );
}
