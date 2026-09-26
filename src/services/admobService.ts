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

export const ADMOB_CONFIG = PRODUCTION_AD_CONFIG;

// Frequency Capping & Policies (Non-intrusive)
const COOLDOWN_BETWEEN_INTERSTITIALS_MS = 90 * 1000; // 90 seconds minimum cooldown between interstitials
const MIN_APP_UPTIME_BEFORE_FIRST_INTERSTITIAL_MS = 15 * 1000; // 15 seconds after app launch
const MAX_INTERSTITIALS_PER_SESSION = 10; // Up to 10 interstitials per session
const MIN_ACTIONS_BEFORE_INTERSTITIAL = 2; // For general navigation

const STORAGE_KEY_LAST_SHOWN = 'farm_admob_last_interstitial_time';
const STORAGE_KEY_SESSION_COUNT = 'farm_admob_session_ad_count';

class AdMobService {
  private isInitialized = false;
  private isInitializing = false;
  private isBannerVisible = false;
  private isBannerLoading = false;
  private bannerFallbackAttempted = false;

  private isInterstitialLoaded = false;
  private isInterstitialLoading = false;
  private interstitialFallbackAttempted = false;

  private isRewardedLoaded = false;
  private isRewardedLoading = false;
  private rewardedFallbackAttempted = false;

  private appStartTime = Date.now();
  private lastInterstitialShownTime = 0;
  private interstitialShownCount = 0;
  private actionCounter = 0;
  private lastContextReason = '';

  /**
   * Initialize AdMob on Android / Native platforms.
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.isInitializing) return false;

    if (!Capacitor.isNativePlatform()) {
      this.isInitialized = true;
      return true;
    }

    try {
      this.isInitializing = true;
      try {
        await AdMob.requestTrackingAuthorization();
      } catch {
        // Ignored on Android
      }

      await AdMob.initialize({
        initializeForTesting: true,
      });

      this.setupEventListeners();
      this.isInitialized = true;
      console.log('[AdMob] Initialized successfully on native platform');

      // Silently pre-load interstitial in background
      setTimeout(() => {
        this.prepareInterstitial();
        this.prepareRewarded();
      }, 3000);

      return true;
    } catch (error) {
      console.warn('[AdMob] Initialization warning:', error);
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  private setupEventListeners(): void {
    try {
      AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        console.log('[AdMob] Banner loaded successfully');
        this.isBannerVisible = true;
        this.isBannerLoading = false;
      });

      AdMob.addListener(BannerAdPluginEvents.FailedToLoad, async (err) => {
        console.warn('[AdMob] Banner failed to load with primary ID:', err);
        this.isBannerVisible = false;
        this.isBannerLoading = false;

        // Auto-fallback: If real ad had No-Fill (e.g. testing APK or pending approval), load Google Test Ad so ads always show
        if (!this.bannerFallbackAttempted) {
          console.log('[AdMob] Triggering test banner fallback...');
          await this.showTestBannerFallback();
        }
      });

      AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        console.log('[AdMob] Interstitial loaded successfully');
        this.isInterstitialLoaded = true;
        this.isInterstitialLoading = false;
      });

      AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, async (err) => {
        console.warn('[AdMob] Interstitial failed to load with primary ID:', err);
        this.isInterstitialLoaded = false;
        this.isInterstitialLoading = false;

        if (!this.interstitialFallbackAttempted) {
          console.log('[AdMob] Triggering test interstitial fallback...');
          this.interstitialFallbackAttempted = true;
          try {
            await AdMob.prepareInterstitial({
              adId: GOOGLE_TEST_AD_CONFIG.interstitialId,
              isTesting: true,
            });
            this.isInterstitialLoaded = true;
            console.log('[AdMob] Test interstitial fallback cached ready');
          } catch (e) {
            console.warn('[AdMob] Test interstitial fallback failed:', e);
          }
        }
      });

      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        console.log('[AdMob] Interstitial dismissed');
        this.isInterstitialLoaded = false;
        this.interstitialFallbackAttempted = false;
        this.lastInterstitialShownTime = Date.now();
        setTimeout(() => this.prepareInterstitial(), 20000);
      });

      AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        console.log('[AdMob] Rewarded ad loaded successfully');
        this.isRewardedLoaded = true;
        this.isRewardedLoading = false;
      });

      AdMob.addListener(RewardAdPluginEvents.FailedToLoad, async (err) => {
        console.warn('[AdMob] Rewarded ad failed to load with primary ID:', err);
        this.isRewardedLoaded = false;
        this.isRewardedLoading = false;

        if (!this.rewardedFallbackAttempted) {
          this.rewardedFallbackAttempted = true;
          try {
            await AdMob.prepareRewardVideoAd({
              adId: GOOGLE_TEST_AD_CONFIG.rewardedId,
              isTesting: true,
            });
            this.isRewardedLoaded = true;
            console.log('[AdMob] Test rewarded fallback cached ready');
          } catch (e) {
            console.warn('[AdMob] Test rewarded fallback failed:', e);
          }
        }
      });

      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        this.isRewardedLoaded = false;
        this.rewardedFallbackAttempted = false;
        setTimeout(() => this.prepareRewarded(), 15000);
      });
    } catch (e) {
      console.warn('[AdMob] Error adding event listeners:', e);
    }
  }

  /* -------------------------------------------------------------
   * BANNER ADS
   * ----------------------------------------------------------- */

  /**
   * Shows banner ad. Placed at bottom above bottom navigation (margin: 60)
   * or top of screen without overlapping navigation.
   */
  async showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (this.isBannerVisible || this.isBannerLoading) return;

    try {
      this.isBannerLoading = true;
      this.bannerFallbackAttempted = false;
      await this.initialize();

      // Cleanly clear existing banner before showing to avoid Capacitor GONE bug
      try {
        await AdMob.removeBanner();
      } catch {
        // Safe ignore
      }

      console.log('[AdMob] Requesting banner with ID:', PRODUCTION_AD_CONFIG.bannerId);
      await AdMob.showBanner({
        adId: PRODUCTION_AD_CONFIG.bannerId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position,
        margin: 60, // Above bottom navigation bar (60dp)
        isTesting: false,
      });

      this.isBannerVisible = true;
    } catch (error) {
      console.warn('[AdMob] showBanner error with real ID, falling back to test banner:', error);
      await this.showTestBannerFallback(position);
    } finally {
      this.isBannerLoading = false;
    }
  }

  private async showTestBannerFallback(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (this.bannerFallbackAttempted) return;
    this.bannerFallbackAttempted = true;

    try {
      try {
        await AdMob.removeBanner();
      } catch {
        // Safe ignore
      }

      console.log('[AdMob] Requesting fallback test banner:', GOOGLE_TEST_AD_CONFIG.bannerId);
      await AdMob.showBanner({
        adId: GOOGLE_TEST_AD_CONFIG.bannerId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position,
        margin: 60,
        isTesting: true,
      });

      this.isBannerVisible = true;
      console.log('[AdMob] Fallback test banner active and displayed');
    } catch (fallbackError) {
      console.warn('[AdMob] Both real and test banner failed:', fallbackError);
      this.isBannerVisible = false;
    }
  }

  /**
   * Completely removes banner ad to avoid Capacitor plugin view-hide bugs.
   */
  async removeBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.removeBanner();
      this.isBannerVisible = false;
      this.bannerFallbackAttempted = false;
    } catch (error) {
      console.warn('[AdMob] removeBanner failed:', error);
      this.isBannerVisible = false;
    }
  }

  /**
   * Backwards compatible hideBanner
   */
  async hideBanner(): Promise<void> {
    await this.removeBanner();
  }

  /**
   * Backwards compatible resumeBanner
   */
  async resumeBanner(): Promise<void> {
    if (!this.isBannerVisible) {
      await this.showBanner();
    }
  }

  /* -------------------------------------------------------------
   * INTERSTITIAL ADS
   * ----------------------------------------------------------- */

  /**
   * Pre-caches an interstitial ad in background.
   */
  async prepareInterstitial(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    if (this.isInterstitialLoaded || this.isInterstitialLoading) return this.isInterstitialLoaded;

    try {
      this.isInterstitialLoading = true;
      this.interstitialFallbackAttempted = false;
      await this.initialize();

      await AdMob.prepareInterstitial({
        adId: PRODUCTION_AD_CONFIG.interstitialId,
        isTesting: false,
      });

      this.isInterstitialLoaded = true;
      return true;
    } catch (error) {
      console.warn('[AdMob] prepareInterstitial real ID failed, trying test ad:', error);
      this.interstitialFallbackAttempted = true;
      try {
        await AdMob.prepareInterstitial({
          adId: GOOGLE_TEST_AD_CONFIG.interstitialId,
          isTesting: true,
        });
        this.isInterstitialLoaded = true;
        return true;
      } catch (testError) {
        console.warn('[AdMob] prepareInterstitial fallback failed:', testError);
        this.isInterstitialLoaded = false;
        return false;
      }
    } finally {
      this.isInterstitialLoading = false;
    }
  }

  private getLastInterstitialTime(): number {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_LAST_SHOWN);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > this.lastInterstitialShownTime) {
          return parsed;
        }
      }
    } catch {
      // Safe fallback
    }
    return this.lastInterstitialShownTime;
  }

  private getSessionAdCount(): number {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_SESSION_COUNT);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > this.interstitialShownCount) {
          return parsed;
        }
      }
    } catch {
      // Safe fallback
    }
    return this.interstitialShownCount;
  }

  private recordInterstitialShown(timestamp: number, contextReason?: string): void {
    this.lastInterstitialShownTime = timestamp;
    this.interstitialShownCount += 1;
    this.actionCounter = 0; // Reset action counter after ad is shown
    if (contextReason) {
      this.lastContextReason = contextReason;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY_LAST_SHOWN, timestamp.toString());
      sessionStorage.setItem(STORAGE_KEY_SESSION_COUNT, this.interstitialShownCount.toString());
    } catch {
      // Safe fallback
    }
  }

  /**
   * Shows interstitial ad politely with frequency capping.
   * If isDirectAction is true, user just completed saving a task/record, so minimum page count check is skipped.
   */
  async showInterstitialIfEligible(contextReason?: string, isDirectAction: boolean = false): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    // Increment user action / navigation counter
    this.actionCounter += 1;

    const now = Date.now();

    // 1. App uptime check (minimum 15s - never immediately upon opening app)
    if (now - this.appStartTime < MIN_APP_UPTIME_BEFORE_FIRST_INTERSTITIAL_MS) {
      return false;
    }

    // 2. Minimum actions threshold (applies only to background navigation, not direct save actions)
    if (!isDirectAction && this.actionCounter < MIN_ACTIONS_BEFORE_INTERSTITIAL) {
      return false;
    }

    // 3. Consecutive same action/screen check (prevent back-to-back ad on repeated action)
    if (contextReason && contextReason === this.lastContextReason) {
      return false;
    }

    // 4. Cooldown check (minimum 90s between interstitials to keep app comfortable)
    const lastShownTime = this.getLastInterstitialTime();
    if (lastShownTime > 0 && (now - lastShownTime) < COOLDOWN_BETWEEN_INTERSTITIALS_MS) {
      return false;
    }

    // 5. Session limit check
    if (this.getSessionAdCount() >= MAX_INTERSTITIALS_PER_SESSION) {
      return false;
    }

    // If not cached yet, trigger background load
    if (!this.isInterstitialLoaded) {
      this.prepareInterstitial();
      return false;
    }

    try {
      await AdMob.showInterstitial();
      this.recordInterstitialShown(now, contextReason);
      this.isInterstitialLoaded = false;
      this.interstitialFallbackAttempted = false;
      console.log('[AdMob] Interstitial shown successfully. Context:', contextReason);
      // Preload next interstitial cleanly after 8s
      setTimeout(() => this.prepareInterstitial(), 8000);
      return true;
    } catch (error) {
      console.warn('[AdMob] showInterstitial failed:', error);
      this.isInterstitialLoaded = false;
      return false;
    }
  }

  /* -------------------------------------------------------------
   * REWARDED ADS
   * ----------------------------------------------------------- */

  async prepareRewarded(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    if (this.isRewardedLoaded || this.isRewardedLoading) return this.isRewardedLoaded;

    try {
      this.isRewardedLoading = true;
      this.rewardedFallbackAttempted = false;
      await this.initialize();

      await AdMob.prepareRewardVideoAd({
        adId: PRODUCTION_AD_CONFIG.rewardedId,
        isTesting: false,
      });

      this.isRewardedLoaded = true;
      return true;
    } catch (error) {
      console.warn('[AdMob] prepareRewarded real ID failed, trying test ad:', error);
      this.rewardedFallbackAttempted = true;
      try {
        await AdMob.prepareRewardVideoAd({
          adId: GOOGLE_TEST_AD_CONFIG.rewardedId,
          isTesting: true,
        });
        this.isRewardedLoaded = true;
        return true;
      } catch (testError) {
        this.isRewardedLoaded = false;
        return false;
      }
    } finally {
      this.isRewardedLoading = false;
    }
  }

  isRewardedReady(): boolean {
    return this.isRewardedLoaded;
  }

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
      this.rewardedFallbackAttempted = false;
      if (onReward && reward) {
        onReward(reward);
      }
      return true;
    } catch (error) {
      console.warn('[AdMob] showRewarded failed:', error);
      return false;
    }
  }
}

export const admobService = new AdMobService();
