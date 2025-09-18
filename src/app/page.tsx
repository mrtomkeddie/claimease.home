'use client';

import React from 'react';
import { Onboarding } from '@/components/onboarding';

export default function HomePage() {
  // Simple handler that does nothing - keeps the beautiful home screen
  const handleComplete = () => {
    // Do nothing - this keeps us on the home screen
    console.log('Form submitted, but staying on home screen');
  };

  return <Onboarding onComplete={handleComplete} />;
}