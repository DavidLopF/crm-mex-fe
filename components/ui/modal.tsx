'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

const sizeStyles = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-6xl',
  full: 'sm:max-w-[95vw]',
};

export function Modal({ isOpen, onClose, title, children, size = 'lg', className }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 animate-fadeIn"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
        {/* En móvil: bottom sheet (items-end). En sm+: centrado */}
        <div className="flex min-h-screen items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={cn(
              'pointer-events-auto relative w-full overflow-hidden bg-white text-left shadow-xl',
              'rounded-t-2xl sm:rounded-lg',
              'animate-slideUp sm:my-8',
              sizeStyles[size],
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}

            {!title && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}

            {/* Máximo 85vh en móvil para que se vea el backdrop, más alto en desktop */}
            <div className={cn(
              'max-h-[85vh] sm:max-h-[calc(100vh-160px)] overflow-y-auto',
              title ? 'px-4 py-4 sm:px-6' : 'px-4 py-5 sm:px-6'
            )}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
