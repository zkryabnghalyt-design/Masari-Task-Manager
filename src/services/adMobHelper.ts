/**
 * AdMobHelper - Safe AdMob Integration Manager
 *
 * This utility ensures that the app never displays or requests real AdMob Ad Unit IDs
 * during development or testing, protecting your AdMob account from accidental invalid clicks
 * and policy violations.
 */
export class AdMobHelper {
  private static cachedRealAdUnitId: string | null = null;
  private static cachedRealAppId: string | null = null;
  private static testAdUnitId = 'ca-app-pub-3940256099942544/5224354917'; // Google's standard test rewarded ad unit ID
  private static fallbackRealAdUnitId = 'ca-app-pub-8483717253760668/5809420943';
  private static testAppId = 'ca-app-pub-3940256099942544~3347511713'; // Google's standard test App ID
  private static fallbackRealAppId = 'ca-app-pub-8483717253760668~5083075326';

  /**
   * Checks if the application is running in DEBUG/Development mode.
   * By default, it checks Vite's environment flags (import.meta.env.DEV).
   * It also allows a manual debug override stored in localStorage to simulate production/release behaviors.
   */
  public static isDebugMode(): boolean {
    // 1. Check local storage override first (useful for testing production mode in preview)
    const localOverride = localStorage.getItem('admob_debug_override');
    if (localOverride === 'true') return true;
    if (localOverride === 'false') return false;

    // 2. Default to Vite's standard development check
    return !!(import.meta as any).env?.DEV;
  }

  /**
   * Sets a manual override for debug mode to test behaviors in real-time.
   */
  public static setDebugOverride(value: boolean | null): void {
    if (value === null) {
      localStorage.removeItem('admob_debug_override');
    } else {
      localStorage.setItem('admob_debug_override', value ? 'true' : 'false');
    }
  }

  /**
   * Returns the standard Google Test Ad Unit ID for Rewarded Ads.
   */
  public static getTestAdUnitId(): string {
    return this.testAdUnitId;
  }

  /**
   * Returns the standard Google Test App ID.
   */
  public static getTestAppId(): string {
    return this.testAppId;
  }

  /**
   * Async method to fetch and parse the real App ID from strings.xml.
   */
  public static async fetchRealAppIdFromXml(): Promise<string> {
    if (this.cachedRealAppId) {
      return this.cachedRealAppId;
    }

    try {
      const response = await fetch('/strings.xml');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} loading strings.xml`);
      }
      
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const stringElements = xmlDoc.getElementsByTagName('string');
      
      for (let i = 0; i < stringElements.length; i++) {
        const nameAttr = stringElements[i].getAttribute('name');
        if (nameAttr === 'admob_app_id') {
          const parsedValue = stringElements[i].textContent?.trim() || '';
          if (parsedValue) {
            this.cachedRealAppId = parsedValue;
            return parsedValue;
          }
        }
      }
    } catch (error) {
      console.warn('[AdMobHelper] Could not load or parse strings.xml for admob_app_id.', error);
    }

    return this.fallbackRealAppId;
  }

  /**
   * Async method to fetch and parse the real Ad Unit ID from strings.xml.
   * This mimics the Android asset loading process for production environments.
   */
  public static async fetchRealAdUnitIdFromXml(): Promise<string> {
    if (this.cachedRealAdUnitId) {
      return this.cachedRealAdUnitId;
    }

    try {
      const response = await fetch('/strings.xml');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} loading strings.xml`);
      }
      
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const stringElements = xmlDoc.getElementsByTagName('string');
      
      for (let i = 0; i < stringElements.length; i++) {
        const nameAttr = stringElements[i].getAttribute('name');
        if (nameAttr === 'admob_rewarded_ad_unit_id') {
          const parsedValue = stringElements[i].textContent?.trim() || '';
          if (parsedValue) {
            this.cachedRealAdUnitId = parsedValue;
            return parsedValue;
          }
        }
      }
    } catch (error) {
      console.warn('[AdMobHelper] Could not load or parse strings.xml. Falling back to default real ID.', error);
    }

    // Default real ID fallback if strings.xml is unavailable or parse fails
    return this.fallbackRealAdUnitId;
  }

  /**
   * Resolves the appropriate App ID depending on the current mode.
   */
  public static async getAppId(): Promise<string> {
    if (this.isDebugMode()) {
      return this.testAppId;
    }
    return await this.fetchRealAppIdFromXml();
  }

  /**
   * Resolves the appropriate Ad Unit ID depending on the current mode.
   * If DEBUG is true, always returns the Google Test ID to protect your account.
   * If RELEASE/Production is active, safely fetches the real ID from strings.xml.
   */
  public static async getRewardedAdUnitId(): Promise<string> {
    if (this.isDebugMode()) {
      return this.testAdUnitId;
    }
    return await this.fetchRealAdUnitIdFromXml();
  }

  /**
   * Synchronous getter for quick UI rendering. Returns cached real ID or test ID.
   * If no real ID is cached yet, returns the fallback real ID for production.
   */
  public static getRewardedAdUnitIdSync(): string {
    if (this.isDebugMode()) {
      return this.testAdUnitId;
    }
    return this.cachedRealAdUnitId || this.fallbackRealAdUnitId;
  }

  /**
   * Synchronous getter for quick UI rendering of the App ID.
   */
  public static getAppIdSync(): string {
    if (this.isDebugMode()) {
      return this.testAppId;
    }
    return this.cachedRealAppId || this.fallbackRealAppId;
  }
}
