/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { admobService, ADMOB_CONFIG } from '../services/admobService';

interface AdMobContextType {
  config: typeof ADMOB_CONFIG;
  isReady: boolean;
  isRewardedReady: boolean;
  showRewardedAd: (onReward?: (reward: any) => void) => Promise<boolean>;
  triggerInterstitial: (contextName?: string, isDirectAction?: boolean) => Promise<boolean>;
  showBanner: () => Promise<void>;
  hideBanner: () => Promise<void>;
}

const AdMobContext = createContext<AdMobContextType | null>(null);

// General viewing screens where banner ads run consistently without disturbing work
const BANNER_VIEWING_SCREENS = [
  '/',
  '/dashboard',
  '/reports',
  '/guidelines',
  '/profile',
  '/privacy-policy',
  '/chicks',
  '/store',
  '/shop',
  '/hatchery',
  '/marketplace',
];

// Content exploration screens where interstitial transition is pleasant
const NAV_INTERSTITIAL_SCREENS = [
  '/reports',
  '/guidelines',
  '/chicks',
  '/marketplace',
  '/store',
];

// Critical data-entry or calculation screens where ads must NEVER disturb the user
const SENSITIVE_DATA_ENTRY_SCREENS = [
  '/fcr',
  '/feed',
  '/batches',
  '/sales',
  '/expenses',
  '/medicine',
  '/mortality',
  '/dues',
  '/login',
];

export function AdMobProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isRewardedReady, setIsRewardedReady] = useState(false);
  const location = useLocation();

  // Initialize AdMob once when the app mounts
  useEffect(() => {
    let mounted = true;
    admobService.initialize().then((success) => {
      if (mounted) {
        setIsReady(success);
        setIsRewardedReady(admobService.isRewardedReady());
      }
    });

    const checkInterval = setInterval(() => {
      if (mounted) {
        setIsRewardedReady(admobService.isRewardedReady());
      }
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(checkInterval);
    };
  }, []);

  // Handle banner visibility based on route
  useEffect(() => {
    const currentPath = location.pathname.toLowerCase();

    // Check if current screen is sensitive for data entry
    const isSensitive = SENSITIVE_DATA_ENTRY_SCREENS.some(p => currentPath === p || currentPath.startsWith(p + '/'));
    const isBannerScreen = BANNER_VIEWING_SCREENS.some(p => currentPath === p || currentPath.startsWith(p + '/'));
    const isNavInterstitialScreen = NAV_INTERSTITIAL_SCREENS.some(p => currentPath === p || currentPath.startsWith(p + '/'));

    if (isSensitive) {
      // Remove banner on sensitive data entry screens to avoid blocking keyboard or buttons
      admobService.removeBanner();
    } else if (isBannerScreen) {
      // Show bottom banner ad on dashboard, home and browsing screens
      admobService.showBanner();
    } else {
      // On neutral screens, keep workspace clean
      admobService.removeBanner();
    }

    // Attempt respectful interstitial transition when visiting content exploration screens
    if (isNavInterstitialScreen && !isSensitive) {
      admobService.showInterstitialIfEligible(`nav:${currentPath}`);
    }
  }, [location.pathname]);

  const value = useMemo(() => ({
    config: ADMOB_CONFIG,
    isReady,
    isRewardedReady,
    showRewardedAd: (onReward?: (reward: any) => void) => admobService.showRewarded(onReward),
    triggerInterstitial: (contextName?: string, isDirectAction?: boolean) => admobService.showInterstitialIfEligible(contextName, isDirectAction),
    showBanner: () => admobService.showBanner(),
    hideBanner: () => admobService.hideBanner(),
  }), [isReady, isRewardedReady]);

  return (
    <AdMobContext.Provider value={value}>
      {children}
    </AdMobContext.Provider>
  );
}

export function useAdMob() {
  const ctx = useContext(AdMobContext);
  if (!ctx) {
    // Return safe fallback if used outside provider
    return {
      config: ADMOB_CONFIG,
      isReady: false,
      isRewardedReady: false,
      showRewardedAd: async () => false,
      triggerInterstitial: async () => false,
      showBanner: async () => {},
      hideBanner: async () => {},
    };
  }
  return ctx;
}
