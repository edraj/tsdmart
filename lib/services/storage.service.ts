import { Config } from '../config';

class StorageService {

  get browser() {
    return window && window.localStorage;
  }
  private get ourStorage(): Storage {
    if (this.browser) {
      return localStorage;
    }
    return {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
      key: () => null,
      length: 0,
      clear: () => null,
    };
  }

  constructor() {
    if (this.browser) {
      this._setResetKey();
    }
  }

  private getKey(key: string): string {
    return `${Config.Storage.Key}.${key}`;
  }

  private _setResetKey(): void {
    const _key = this.getKey(Config.Storage.ResetKey);
    const _reset: any = this.ourStorage.getItem(_key);
    if (!_reset || _reset !== 'true') {
      this.clear();
      this.ourStorage.setItem(_key, 'true');
    }
  }

  setItem(
    key: string,
    value: any,
    expiresin: number = Config.Storage.Timeout
  ): void {
    const _storage: any = {
      value: value,
      timestamp: Date.now(), // in milliseconds
      expiresin: expiresin, // in hours
    };

    this.ourStorage.setItem(
      this.getKey(key),
      JSON.stringify(_storage)
    );
  }

  getItem(key: string): any {

    const _key = this.getKey(key);
    const value: any = this.ourStorage.getItem(_key);

    if (value) {
      const _value: any = JSON.parse(value);

      // calculate expiration
      if (Date.now() - _value.timestamp > _value.expiresin * 3600000) {
        this.removeItem(_key);
        return null;
      }

      return _value.value;
    }
    return null;
  }

  removeItem(key: string) {
    this.ourStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    // remove all prefix
    const toClear = [];

    for (let i = 0; i < this.ourStorage.length; i++) {
      const name = this.ourStorage.key(i);
      if (name?.indexOf(Config.Storage.Key) === 0) {
        toClear.push(name);
      }
    }
    toClear.forEach((n) => this.ourStorage.removeItem(n));
  }
}

export const DmartClientStorage = new StorageService();
