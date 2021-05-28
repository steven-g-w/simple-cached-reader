import moment from 'moment';
import { CachedReaderConfiguration } from './cached-reader-configuration';

export class CachedReader<T> {
  private cached: T;

  private caching: Promise<T>;

  private updatedAt: moment.Moment;

  private failureInRow: number = 0;

  private readonly maximumFailureInRow: number = 3;

  private readonly config: CachedReaderConfiguration<T>;

  constructor(
    config: CachedReaderConfiguration<T>,
  ) {
    this.config = config;
  }

  get entityName(): string {
    return this.config.entityName;
  }

  private async readFromSource(): Promise<T> {
    try {
      const result = await this.config.readFromSource();
      this.failureInRow = 0;
      this.updatedAt = moment();
      return result;
    } catch (err) {
      this.failureInRow += 1;
      if (this.config.errorLog) {
        this.config.errorLog(err);
      }
      throw new Error(`Failed to read from source for ${this.entityName} ${err.message}`);
    }
  }

  private async tryRefreshCache() {
    try {
      this.caching = this.caching || this.readFromSource();
      this.cached = await this.caching;
    } finally {
      this.caching = null;
    }
  }

  private get cacheExpired(): boolean {
    return this.config.timeToLive // cache never expire if timeToLive is unset or zero
      && moment().diff(this.updatedAt, 'ms') > this.config.timeToLive;
  }

  async read(): Promise<T> {
    if (this.cached) {
      if (this.cacheExpired) {
        // we don't await here so let the refresh go
        this.tryRefreshCache();
      }
      return this.cached;
    }
    await this.tryRefreshCache();
    return this.cached;
  }

  get isHealthy(): boolean {
    return this.failureInRow <= this.maximumFailureInRow;
  }
}
