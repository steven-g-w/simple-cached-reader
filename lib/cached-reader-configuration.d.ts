export interface CachedReaderConfiguration<T> {
    entityName: string;
    readFromSource: () => Promise<T>;
    timeToLive?: number;
    errorLog?: (error: any) => void;
}
