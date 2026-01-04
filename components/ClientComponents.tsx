"use client";

import dynamic from 'next/dynamic';

export const EuroLoyaltyProgressBar = dynamic(() => import('@/components/EuroLoyaltyProgressBar'), { ssr: false });
export const DailyConnectionReward = dynamic(() => import('@/components/DailyConnectionReward'), { ssr: false });
export const PageVisitTracker = dynamic(() => import('@/components/PageVisitTracker'), { ssr: false });
export const AnalyticsTracker = dynamic(() => import('@/components/AnalyticsTracker'), { ssr: false });
export const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'), { ssr: false });
export const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
export const CookiePreferencesButton = dynamic(() => import('@/components/CookiePreferencesButton'), { ssr: false });
export const OneSignalProvider = dynamic(() => import('@/components/OneSignalProvider'), { ssr: false });
export const Toaster = dynamic(() => import('@/components/ui/sonner').then(mod => ({ default: mod.Toaster })), { ssr: false });
