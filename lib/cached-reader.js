"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedReader = void 0;
const moment_1 = __importDefault(require("moment"));
class CachedReader {
    constructor(config) {
        this.failureInRow = 0;
        this.maximumFailureInRow = 3;
        this.config = config;
    }
    get entityName() {
        return this.config.entityName;
    }
    readFromSource() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.config.readFromSource();
                this.failureInRow = 0;
                this.updatedAt = moment_1.default();
                return result;
            }
            catch (err) {
                this.failureInRow += 1;
                if (this.config.errorLog) {
                    this.config.errorLog(err);
                }
                throw new Error(`Failed to read from source for ${this.entityName} ${err.message}`);
            }
        });
    }
    tryRefreshCache() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.caching = this.caching || this.readFromSource();
                this.cached = yield this.caching;
            }
            finally {
                this.caching = null;
            }
        });
    }
    get cacheExpired() {
        return this.config.timeToLive // cache never expire if timeToLive is unset or zero
            && moment_1.default().diff(this.updatedAt, 'ms') > this.config.timeToLive;
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cached) {
                if (this.cacheExpired) {
                    // we don't await here so let the refresh go
                    this.tryRefreshCache();
                }
                return this.cached;
            }
            yield this.tryRefreshCache();
            return this.cached;
        });
    }
    get isHealthy() {
        return this.failureInRow <= this.maximumFailureInRow;
    }
}
exports.CachedReader = CachedReader;
//# sourceMappingURL=cached-reader.js.map