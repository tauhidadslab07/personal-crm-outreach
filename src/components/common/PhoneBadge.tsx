'use client';

import React from 'react';
import { MessageSquare, PhoneCall } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { sanitizePhoneForWhatsApp } from '@/lib/phone';

interface PhoneBadgeProps {
  phone: string;
  sanitizedPhone?: string;
  flagEmoji?: string;
  isoCode?: string;
  prefilledText?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  showIcon?: boolean;
}

export const PhoneBadge: React.FC<PhoneBadgeProps> = ({
  phone,
  sanitizedPhone,
  flagEmoji = '🌐',
  isoCode,
  prefilledText = 'Hello!',
  className = '',
  onClick,
  showIcon = true,
}) => {
  const cleanPhone = sanitizedPhone || sanitizePhoneForWhatsApp(phone);
  const whatsappUrl = buildWhatsAppUrl(cleanPhone, prefilledText);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title={`Open WhatsApp chat with ${phone}`}
      className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-150 border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-950/50 ${className}`}
    >
      <span className="text-sm select-none" aria-hidden="true">
        {flagEmoji}
      </span>
      <span className="font-semibold tracking-tight">{phone}</span>
      {showIcon && (
        <MessageSquare className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white transition-transform group-hover:scale-110 ml-0.5" />
      )}
    </a>
  );
};
