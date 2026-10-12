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

// Production Real Ad Unit IDs (User's real credentials)
export const PRODUCTION_AD_CONFIG = {
  appId: 'ca-app-pub-7705479359559924~9344090205',
  bannerId: 'ca-app-pub-7705479359559924/8197337524',
  interstitialId: 'ca-app-pub-7705479359559924/9030983603',
  interstitialBackupId: '',
  rewardedId: 'ca-app-pub-7705479359559924/4122361141',
};

// Google AdMob Official Sample / Test Ad Unit IDs (Safe testing on admin phone without invalid traffic strikes)
export const TEST_AD_CONFIG = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  bannerId: 'ca-app-pub-3940256099942544/6300978111',
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  interstitialBackupId: '',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
};

export const ADMOB_CONFIG = PRODUCTION_AD_CONFIG;

// Frequency Capping & Policies (High Revenue & Compliant with Google AdMob Policies)
const COOLDOWN_DIRECT_ACTION_MS = 20 * 1000; // 20 seconds cooldown between saved records (reliably shows ads on saves while protecting user flow)
const COOLDOWN_BETWEEN_INTERSTITIALS_MS = 50 * 1000; // 50 seconds cooldown for general screen browsing
const MIN_APP_UPTIME_BEFORE_FIRST_INTERSTITIAL_MS = 5 * 1000; // 5 seconds initial buffer so first save immediately triggers ad
const MAX_INTERSTITIALS_PER_SESSION = 50; // Balanced session limit complying with AdMob Excessive Ads policy
const MIN_ACTIONS_BEFORE_INTERSTITIAL = 2; // At least 2 user actions before showing browsing interstitial

const STORAGE_KEY_LAST_SHOWN = 'farm_admob_last_interstitial_time';
const STORAGE_KEY_SESSION_COUNT = 'farm_admob_session_ad_count';

class AdMobService {
  private isInitialized = false;
  private isInitializing = false;
  private isBannerVisible = false;
  private isBannerLoading = false;

  private isInterstitialLoaded = false;
  private isInterstitialLoading = false;

  private isRewardedLoaded = false;
  private isRewardedLoading = false;

  // Premium / VIP / Admin ad suppression
  private isAdsDisabled = false;

  // Admin Test Mode: Uses Google's official Test Ad IDs with zero risk of invalid traffic penalty
  private isTestMode = (() => {
    try {
      return localStorage.getItem('farm_admob_test_mode_enabled') === 'true';
    } catch {
      return false;
    }
  })();

  private appStartTime = Date.now();
  private lastInterstitialShownTime = 0;
  private interstitialShownCount = 0;
  private actionCounter = 0;
  private lastContextReason = '';

  /**
   * Toggle between Real Production Ads and Google Official Test Ads.
   * Admin can safely enable this to test ads without risking invalid traffic strikes.
   */
  setTestMode(enabled: boolean): void {
    this.isTestMode = enabled;
    try {
      localStorage.setItem('farm_admob_test_mode_enabled', enabled ? 'true' : 'false');
    } catch {}
    this.isInterstitialLoaded = false;
    this.isRewardedLoaded = false;
    console.log(`[AdMob] Test mode switched to: ${enabled ? 'ENABLED (Official Test Ads)' : 'DISABLED (Real Production Ads)'}`);
    if (this.isBannerVisible) {
      this.removeBanner().then(() => this.showBanner());
    }
  }

  isTestModeEnabled(): boolean {
    return this.isTestMode;
  }

  getActiveConfig() {
    return this.isTestMode ? TEST_AD_CONFIG : PRODUCTION_AD_CONFIG;
  }

  /**
   * Disables all ads completely for VIP/Premium members.
   */
  setAdsDisabled(disabled: boolean): void {
    this.isAdsDisabled = disabled;
    if (disabled) {
      this.isInterstitialLoaded = false;
      this.isRewardedLoaded = false;
      this.isBannerVisible = false;
      if (Capacitor.isNativePlatform()) {
        AdMob.removeBanner().catch(() => {});
      }
    }
  }

  isAdsSuppressed(): boolean {
    return this.isAdsDisabled;
  }

  /**
   * Initialize AdMob on Android / Native platforms in Production Mode.
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

      // Initialize Google Mobile Ads SDK (using test device mode if enabled)
      await AdMob.initialize({
        initializeForTesting: this.isTestMode,
      });

      this.setupEventListeners();
      this.isInitialized = true;
      console.log(`[AdMob] Initialized successfully in ${this.isTestMode ? 'TEST' : 'PRODUCTION'} mode`);

      // Pre-load interstitial in background
      setTimeout(() => {
        this.prepareInterstitial();
      }, 2000);

      setTimeout(() => {
        this.prepareRewarded();
      }, 6000);

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
        console.log('[AdMob] Production Banner loaded successfully');
        this.isBannerVisible = true;
        this.isBannerLoading = false;
      });

      AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (err: any) => {
        console.warn('[AdMob] Production Banner failed to load (Logcat Error):', err?.code ?? err, err?.message ?? '');
        this.isBannerVisible = false;
        this.isBannerLoading = false;
      });

      AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        console.log('[AdMob] Production Interstitial loaded successfully');
        this.isInterstitialLoaded = true;
        this.isInterstitialLoading = false;
      });

      AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (err: any) => {
        console.warn('[AdMob] Production Interstitial failed to load (Logcat Error):', err?.code ?? err, err?.message ?? '');
        this.isInterstitialLoaded = false;
        this.isInterstitialLoading = false;
        // Retry preparing real interstitial after 15 seconds
        setTimeout(() => this.prepareInterstitial(), 15000);
      });

      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        console.log('[AdMob] Interstitial dismissed');
        this.isInterstitialLoaded = false;
        this.lastInterstitialShownTime = Date.now();
        // Immediately reload next ad in background so chamber is always full
        setTimeout(() => this.prepareInterstitial(), 1500);
      });

      AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        console.log('[AdMob] Production Rewarded ad loaded successfully');
        this.isRewardedLoaded = true;
        this.isRewardedLoading = false;
      });

      AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err: any) => {
        console.warn('[AdMob] Production Rewarded ad failed to load (Logcat Error):', err?.code ?? err, err?.message ?? '');
        this.isRewardedLoaded = false;
        this.isRewardedLoading = false;
        setTimeout(() => this.prepareRewarded(), 15000);
      });

      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        this.isRewardedLoaded = false;
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
   * Shows banner ad anchored at bottom.
   */
  async showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (this.isAdsDisabled || !Capacitor.isNativePlatform()) return;
    if (this.isBannerVisible || this.isBannerLoading) return;

    try {
      this.isBannerLoading = true;
      await this.initialize();

      const activeConfig = this.getActiveConfig();
      console.log(`[AdMob] Requesting banner (${this.isTestMode ? 'TEST' : 'PRODUCTION'}) with ID:`, activeConfig.bannerId);
      await AdMob.showBanner({
        adId: activeConfig.bannerId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position,
        margin: position === BannerAdPosition.BOTTOM_CENTER ? 64 : 0,
        isTesting: this.isTestMode,
      });

      this.isBannerVisible = true;
    } catch (error) {
      console.warn('[AdMob] showBanner error:', error);
      this.isBannerVisible = false;
    } finally {
      this.isBannerLoading = false;
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
    if (this.isAdsDisabled || !Capacitor.isNativePlatform()) return false;
    if (this.isInterstitialLoaded || this.isInterstitialLoading) return this.isInterstitialLoaded;

    try {
      this.isInterstitialLoading = true;
      await this.initialize();

      const activeConfig = this.getActiveConfig();
      await AdMob.prepareInterstitial({
        adId: activeConfig.interstitialId,
        isTesting: this.isTestMode,
      });
      this.isInterstitialLoaded = true;
      return true;
    } catch (error) {
      console.warn('[AdMob] prepareInterstitial failed:', error);
      this.isInterstitialLoaded = false;
      return false;
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
    if (this.isAdsDisabled || !Capacitor.isNativePlatform()) return false;

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

    // 3. Consecutive same action check applies only to background navigation, NOT direct save actions
    if (!isDirectAction && contextReason && contextReason === this.lastContextReason) {
      return false;
    }

    // 4. Cooldown check: 15s for completed tasks (saving records), 35s for general screen browsing
    const activeCooldown = isDirectAction ? COOLDOWN_DIRECT_ACTION_MS : COOLDOWN_BETWEEN_INTERSTITIALS_MS;
    const lastShownTime = this.getLastInterstitialTime();
    if (lastShownTime > 0 && (now - lastShownTime) < activeCooldown) {
      return false;
    }

    // 5. Session limit check
    if (this.getSessionAdCount() >= MAX_INTERSTITIALS_PER_SESSION) {
      return false;
    }

    // If not cached yet, quickly prepare on-the-fly for direct completed actions
    if (!this.isInterstitialLoaded) {
      const prepared = await this.prepareInterstitial();
      if (!prepared || !this.isInterstitialLoaded) {
        return false;
      }
    }

    try {
      await AdMob.showInterstitial();
      this.recordInterstitialShown(now, contextReason);
      this.isInterstitialLoaded = false;
      console.log('[AdMob] Interstitial shown successfully. Context:', contextReason);
      // Preload next interstitial cleanly after 1.5s
      setTimeout(() => this.prepareInterstitial(), 1500);
      return true;
    } catch (error) {
      console.warn('[AdMob] showInterstitial failed:', error);
      this.isInterstitialLoaded = false;
      setTimeout(() => this.prepareInterstitial(), 4000);
      return false;
    }
  }

  /* -------------------------------------------------------------
   * REWARDED ADS
   * ----------------------------------------------------------- */

  async prepareRewarded(): Promise<boolean> {
    if (this.isAdsDisabled || !Capacitor.isNativePlatform()) return false;
    if (this.isRewardedLoaded || this.isRewardedLoading) return this.isRewardedLoaded;

    try {
      this.isRewardedLoading = true;
      await this.initialize();

      const activeConfig = this.getActiveConfig();
      await AdMob.prepareRewardVideoAd({
        adId: activeConfig.rewardedId,
        isTesting: this.isTestMode,
      });

      this.isRewardedLoaded = true;
      return true;
    } catch (error) {
      console.warn('[AdMob] prepareRewarded failed:', error);
      this.isRewardedLoaded = false;
      return false;
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
      if (onReward && reward) {
        onReward(reward);
      }
      return true;
    } catch (error) {
      console.warn('[AdMob] showRewarded failed:', error);
      return false;
    }
  }

  /**
   * Admin-Only: Force trigger test interstitial immediately bypassing cooldowns.
   */
  async forceTestInterstitial(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[AdMob Test] Browser preview: Interstitial triggered');
      return true;
    }

    try {
      await this.prepareInterstitial();
      await AdMob.showInterstitial();
      console.log('[AdMob Test] Test Interstitial displayed successfully');
      setTimeout(() => this.prepareInterstitial(), 2000);
      return true;
    } catch (e) {
      console.warn('[AdMob Test] Test Interstitial failed:', e);
      return false;
    }
  }

  /**
   * Admin-Only: Force trigger test rewarded ad immediately bypassing cooldowns.
   */
  async forceTestRewarded(onReward?: (reward: AdMobRewardItem) => void): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[AdMob Test] Browser preview: Rewarded ad triggered');
      if (onReward) onReward({ type: 'coins', amount: 1 });
      return true;
    }

    try {
      await this.prepareRewarded();
      const reward = await AdMob.showRewardVideoAd();
      if (onReward && reward) onReward(reward);
      console.log('[AdMob Test] Test Rewarded video displayed successfully');
      setTimeout(() => this.prepareRewarded(), 2000);
      return true;
    } catch (e) {
      console.warn('[AdMob Test] Test Rewarded video failed:', e);
      return false;
    }
  }
}

export const admobService = new AdMobService();
