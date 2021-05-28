import { CachedReaderConfiguration } from './cached-reader-configuration';
export declare class CachedReader<T> {
    private cached;
    private caching;
    private updatedAt;
    private failureInRow;
    private readonly maximumFailureInRow;
    private readonly config;
    constructor(config: CachedReaderConfiguration<T>);
    get entityName(): string;
    private readFromSource;
    private tryRefreshCache;
    private get cacheExpired();
    read(): Promise<T>;
    get isHealthy(): boolean;
}
