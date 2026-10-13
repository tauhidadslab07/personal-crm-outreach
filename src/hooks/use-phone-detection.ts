'use client';

import { useState, useMemo } from 'react';
import { CountryInfo } from '@/types/crm';
import { parsePhoneAndDetectCountry, sanitizePhoneForWhatsApp } from '@/lib/phone';

export function usePhoneDetection(initialPhone: string = '') {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);

  const countryInfo: CountryInfo = useMemo(() => {
    return parsePhoneAndDetectCountry(phoneNumber);
  }, [phoneNumber]);

  const sanitized = useMemo(() => {
    return sanitizePhoneForWhatsApp(countryInfo.e164 || phoneNumber);
  }, [countryInfo.e164, phoneNumber]);

  return {
    phoneNumber,
    setPhoneNumber,
    countryInfo,
    sanitized,
    isValid: countryInfo.isValid,
    hasPrefix: Boolean(countryInfo.countryCode),
  };
}
