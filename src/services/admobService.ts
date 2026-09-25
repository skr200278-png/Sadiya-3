/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  type AdMobRewardItem
} from '@capacitor-community/admob';

// Detect if running in development/testing mode
const IS_DEV = import.meta.env.DEV;

// Google Official Test Ad Unit IDs (Android)
export const GOOGLE_TEST_AD_CONFIG = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  bannerId: 'ca-app-pub-3940256099942544/6300978111',
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
};

// Production Real Ad Unit IDs (User's real credentials)
export const PRODUCTION_AD_CONFIG = {
  appId: 'ca-app-pub-3618509805187884~7910799044',
  bannerId: 'ca-app-pub-3618509805187884/2127989321',
  interstitialId: 'ca-app-pub-3618509805187884/9455815009',
  rewardedId: 'ca-app-pub-3618509805187884/8434552386',
};

// Automatically switch: Test Ads in Dev/Testing, Real Unit IDs in Production
export const ADMOB_CONFIG = IS_DEV ? GOOGLE_TEST_AD_CONFIG : PRODUCTION_AD_CONFIG;

// Frequency Capping & Policies (Non-intrusive)
const COOLDOWN_BETWEEN_INTERSTITIALS_MS = 6 * 60 * 1000; // 6 minutes between interstitials
const MIN_APP_UPTIME_BEFORE_FIRST_INTERSTITIAL_MS = 2 * 60 * 1000; // 2 minutes after app start
const MAX_INTERSTITIALS_PER_SESSION = 3;

class AdMobService {
  private isInitialized = false;
  private isInitializing = false;
  private isBannerVisible = false;
  private isInterstitialLoaded = false;
  private isInterstitialLoading = false;
  private isRewardedLoaded = false;
  private isRewardedLoading = false;

  private appStartTime = Date.now();
  private lastInterstitialShownTime = 0;
  private interstitialShownCount = 0;

  /**
   * Initialize AdMob on Android / Native platforms.
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.isInitializing) return false;

    if (!Capacitor.isNativePlatform()) {
      // In web browser / dev environment, AdMob native is disabled to prevent errors
      this.isInitialized = true;
      return true;
    }

    try {
      this.isInitializing = true;
      try {
        await AdMob.requestTrackingAuthorization();
      } catch {
        // Ignored on Android/Web
      }

      await AdMob.initialize({
        initializeForTesting: IS_DEV,
      });

      this.setupEventListeners();
      this.isInitialized = true;

      // Silently pre-load interstitial in background (will only be shown after cooldown)
      setTimeout(() => {
        this.prepareInterstitial();
        this.prepareRewarded();
      }, 5000);

      return true;
    } catch (error) {
      console.warn('AdMob initialization failed or skipped:', error);
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  private setupEventListeners(): void {
    try {
      AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err) => {
        console.warn('AdMob Banner failed to load:', err);
        this.isBannerVisible = false;
      });

      AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        this.isInterstitialLoaded = true;
        this.isInterstitialLoading = false;
      });

      AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (err) => {
        console.warn('AdMob Interstitial failed to load:', err);
        this.isInterstitialLoaded = false;
        this.isInterstitialLoading = false;
      });

      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        this.isInterstitialLoaded = false;
        this.lastInterstitialShownTime = Date.now();
        // Pre-load next interstitial for when future cooldown expires
        setTimeout(() => this.prepareInterstitial(), 30000);
      });

      AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        this.isRewardedLoaded = true;
        this.isRewardedLoading = false;
      });

      AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
        console.warn('AdMob Rewarded failed to load:', err);
        this.isRewardedLoaded = false;
        this.isRewardedLoading = false;
      });

      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        this.isRewardedLoaded = false;
        // Pre-load next rewarded ad
        setTimeout(() => this.prepareRewarded(), 15000);
      });
    } catch (e) {
      console.warn('Error adding AdMob event listeners:', e);
    }
  }

  /* -------------------------------------------------------------
   * BANNER ADS
   * ----------------------------------------------------------- */

  /**
   * Shows standard banner ad at the top or bottom.
   */
  async showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (this.isBannerVisible) return;

    try {
      await this.initialize();
      await AdMob.showBanner({
        adId: ADMOB_CONFIG.bannerId,
        adSize: BannerAdSize.BANNER,
        position,
        isTesting: IS_DEV,
      });
      this.isBannerVisible = true;
    } catch (error) {
      console.warn('AdMob showBanner failed:', error);
    }
  }

  /**
   * Hides the current banner ad.
   */
  async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.isBannerVisible) return;
    try {
      await AdMob.hideBanner();
      this.isBannerVisible = false;
    } catch (error) {
      console.warn('AdMob hideBanner failed:', error);
    }
  }

  /**
   * Resumes a previously hidden banner ad.
   */
  async resumeBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.resumeBanner();
      this.isBannerVisible = true;
    } catch (error) {
      console.warn('AdMob resumeBanner failed:', error);
    }
  }

  /**
   * Destroys and removes banner ad.
   */
  async removeBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.removeBanner();
      this.isBannerVisible = false;
    } catch (error) {
      console.warn('AdMob removeBanner failed:', error);
    }
  }

  /* -------------------------------------------------------------
   * INTERSTITIAL ADS (Strictly rate-limited & polite)
   * ----------------------------------------------------------- */

  /**
   * Silently prepares/pre-caches an interstitial ad in background.
   */
  async prepareInterstitial(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    if (this.isInterstitialLoaded || this.isInterstitialLoading) return this.isInterstitialLoaded;

    try {
      this.isInterstitialLoading = true;
      await this.initialize();
      await AdMob.prepareInterstitial({
        adId: ADMOB_CONFIG.interstitialId,
        isTesting: IS_DEV,
      });
      this.isInterstitialLoaded = true;
      return true;
    } catch (error) {
      console.warn('AdMob prepareInterstitial error:', error);
      this.isInterstitialLoaded = false;
      return false;
    } finally {
      this.isInterstitialLoading = false;
    }
  }

  /**
   * Shows an interstitial ad ONLY if all frequency capping and policy conditions are met:
   * 1. App has been running for at least 2 minutes (no launch popups).
   * 2. At least 6 minutes have passed since last interstitial.
   * 3. Max 3 interstitials per session.
   * 4. Interstitial is loaded and ready.
   */
  async showInterstitialIfEligible(contextReason?: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    const now = Date.now();

    // Condition 1: Never show right after opening app
    if (now - this.appStartTime < MIN_APP_UPTIME_BEFORE_FIRST_INTERSTITIAL_MS) {
      return false;
    }

    // Condition 2: Cooldown check
    if (this.lastInterstitialShownTime > 0 && (now - this.lastInterstitialShownTime) < COOLDOWN_BETWEEN_INTERSTITIALS_MS) {
      return false;
    }

    // Condition 3: Session limit check
    if (this.interstitialShownCount >= MAX_INTERSTITIALS_PER_SESSION) {
      return false;
    }

    // Check if ready
    if (!this.isInterstitialLoaded) {
      this.prepareInterstitial();
      return false;
    }

    try {
      await AdMob.showInterstitial();
      this.interstitialShownCount += 1;
      this.lastInterstitialShownTime = now;
      this.isInterstitialLoaded = false;
      return true;
    } catch (error) {
      console.warn('AdMob showInterstitial failed:', error, 'Context:', contextReason);
      return false;
    }
  }

  /* -------------------------------------------------------------
   * REWARDED ADS (Integration ready without attaching to features)
   * ----------------------------------------------------------- */

  /**
   * Pre-caches a rewarded video ad in background.
   */
  async prepareRewarded(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    if (this.isRewardedLoaded || this.isRewardedLoading) return this.isRewardedLoaded;

    try {
      this.isRewardedLoading = true;
      await this.initialize();
      await AdMob.prepareRewardVideoAd({
        adId: ADMOB_CONFIG.rewardedId,
        isTesting: IS_DEV,
      });
      this.isRewardedLoaded = true;
      return true;
    } catch (error) {
      console.warn('AdMob prepareRewarded error:', error);
      this.isRewardedLoaded = false;
      return false;
    } finally {
      this.isRewardedLoading = false;
    }
  }

  /**
   * Checks if a rewarded ad is currently cached and ready.
   */
  isRewardedReady(): boolean {
    return this.isRewardedLoaded;
  }

  /**
   * Shows a rewarded ad and invokes onReward callback when earned.
   * Ready for future features whenever needed.
   */
  async showRewarded(onReward?: (reward: AdMobRewardItem) => void): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      if (onReward) onReward({ type: 'coins', amount: 1 });
      return true;
    }

    if (!this.isRewardedLoaded) {
      await this.prepareRewarded();
      return false;
    }

    try {
      const reward = await AdMob.showRewardVideoAd();
      this.isRewardedLoaded = false;
      if (onReward && reward) {
        onReward(reward);
      }
      return true;
    } catch (error) {
      console.warn('AdMob showRewarded failed:', error);
      return false;
    }
  }
}

export const admobService = new AdMobService();
