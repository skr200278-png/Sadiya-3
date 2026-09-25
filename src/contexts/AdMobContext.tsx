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
  triggerInterstitial: (contextName?: string) => Promise<boolean>;
  showBanner: () => Promise<void>;
  hideBanner: () => Promise<void>;
}

const AdMobContext = createContext<AdMobContextType | null>(null);

// General viewing screens where banner ads are appropriate and non-intrusive
const GENERAL_VIEWING_SCREENS = [
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
    const isGeneral = GENERAL_VIEWING_SCREENS.some(p => currentPath === p || currentPath.startsWith(p + '/'));

    if (isSensitive) {
      // Hide banner on sensitive data entry screens
      admobService.hideBanner();
    } else if (isGeneral) {
      // Show banner on general non-intrusive viewing screens
      admobService.showBanner();
    }

    // Attempt respectful interstitial transition only when visiting general reading screens (e.g. guidelines or reports)
    if (isGeneral && !isSensitive) {
      admobService.showInterstitialIfEligible(`nav:${currentPath}`);
    }
  }, [location.pathname]);

  const value = useMemo(() => ({
    config: ADMOB_CONFIG,
    isReady,
    isRewardedReady,
    showRewardedAd: (onReward?: (reward: any) => void) => admobService.showRewarded(onReward),
    triggerInterstitial: (contextName?: string) => admobService.showInterstitialIfEligible(contextName),
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
