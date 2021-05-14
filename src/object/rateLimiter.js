const performance = global.performance;

function hrtime(previousTimestamp) {
    const clocktime = performance.now() * 1e-3;
    let seconds = Math.floor(clocktime);
    let nanoseconds = Math.floor((clocktime % 1) * 1e9);
    if (previousTimestamp != undefined) {
        seconds = seconds - previousTimestamp[0];
        nanoseconds = nanoseconds - previousTimestamp[1];
        if (nanoseconds < 0) {
            seconds--;
            nanoseconds += 1e9;
        }
    }
    return [seconds, nanoseconds];
}

function getMilliseconds() {
    const [seconds, nanoseconds] = hrtime();
    return seconds * 1e3 + Math.floor(nanoseconds / 1e6);
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

class TokenBucket {
    constructor({ bucketSize, tokensPerInterval, interval, parentBucket }) {
        this.bucketSize = bucketSize;
        this.tokensPerInterval = tokensPerInterval;
        if (typeof interval === "string") {
            switch (interval) {
                case "sec":
                case "second":
                    this.interval = 1000;
                    break;
                case "min":
                case "minute":
                    this.interval = 1000 * 60;
                    break;
                case "hr":
                case "hour":
                    this.interval = 1000 * 60 * 60;
                    break;
                case "day":
                    this.interval = 1000 * 60 * 60 * 24;
                    break;
                default:
                    throw new Error("Invalid interval " + interval);
            }
        } else {
            this.interval = interval;
        }
        this.parentBucket = parentBucket;
        this.content = 0;
        this.lastDrip = getMilliseconds();
    }

    async removeTokens(count) {
            // Is this an infinite size bucket?
            if (this.bucketSize === 0) {
                return Number.POSITIVE_INFINITY;
            }
            // Make sure the bucket can hold the requested number of tokens
            if (count > this.bucketSize) {
                throw new Error(`Requested tokens ${count} exceeds bucket size ${this.bucketSize}`);
            }
            // Drip new tokens into this bucket
            this.drip();
            const comeBackLater = async() => {
                // How long do we need to wait to make up the difference in tokens?
                const waitMs = Math.ceil((count - this.content) * (this.interval / this.tokensPerInterval));
                await wait(waitMs);
                return this.removeTokens(count);
            };
            // If we don't have enough tokens in this bucket, come back later
            if (count > this.content)
                return comeBackLater();
            if (this.parentBucket != undefined) {
                // Remove the requested from the parent bucket first
                const remainingTokens = await this.parentBucket.removeTokens(count);
                // Check that we still have enough tokens in this bucket
                if (count > this.content)
                    return comeBackLater();
                // Tokens were removed from the parent bucket, now remove them from
                // this bucket. Note that we look at the current bucket and parent
                // bucket's remaining tokens and return the smaller of the two values
                this.content -= count;
                return Math.min(remainingTokens, this.content);
            } else {
                // Remove the requested tokens from this bucket
                this.content -= count;
                return this.content;
            }
        }
        /**
         * Attempt to remove the requested number of tokens and return immediately.
         * If the bucket (and any parent buckets) contains enough tokens this will
         * return true, otherwise false is returned.
         * @param {Number} count The number of tokens to remove.
         * @param {Boolean} True if the tokens were successfully removed, otherwise
         *  false.
         */
    tryRemoveTokens(count) {
            // Is this an infinite size bucket?
            if (!this.bucketSize)
                return true;
            // Make sure the bucket can hold the requested number of tokens
            if (count > this.bucketSize)
                return false;
            // Drip new tokens into this bucket
            this.drip();
            // If we don't have enough tokens in this bucket, return false
            if (count > this.content)
                return false;
            // Try to remove the requested tokens from the parent bucket
            if (this.parentBucket && !this.parentBucket.tryRemoveTokens(count))
                return false;
            // Remove the requested tokens from this bucket and return
            this.content -= count;
            return true;
        }
        /**
         * Add any new tokens to the bucket since the last drip.
         * @returns {Boolean} True if new tokens were added, otherwise false.
         */
    drip() {
        if (this.tokensPerInterval === 0) {
            const prevContent = this.content;
            this.content = this.bucketSize;
            return this.content > prevContent;
        }
        const now = getMilliseconds();
        const deltaMS = Math.max(now - this.lastDrip, 0);
        this.lastDrip = now;
        const dripAmount = deltaMS * (this.tokensPerInterval / this.interval);
        const prevContent = this.content;
        this.content = Math.min(this.content + dripAmount, this.bucketSize);
        return Math.floor(this.content) > Math.floor(prevContent);
    }
}

class RateLimiter {

    constructor({ tokensPerInterval, interval, fireImmediately }) {
        this.tokenBucket = new TokenBucket({
            bucketSize: tokensPerInterval,
            tokensPerInterval,
            interval,
        });
        this.tokenBucket.content = tokensPerInterval;
        this.curIntervalStart = getMilliseconds();
        this.tokensThisInterval = 0;
        this.fireImmediately = fireImmediately || false;
    }

    async removeTokens(count) {
        // Make sure the request isn't for more than we can handle
        if (count > this.tokenBucket.bucketSize) {
            throw new Error(`Requested tokens ${count} exceeds maximum tokens per interval ${this.tokenBucket.bucketSize}`);
        }
        const now = getMilliseconds();
        // Advance the current interval and reset the current interval token count
        // if needed
        if (now < this.curIntervalStart || now - this.curIntervalStart >= this.tokenBucket.interval) {
            this.curIntervalStart = now;
            this.tokensThisInterval = 0;
        }
        // If we don't have enough tokens left in this interval, wait until the
        // next interval
        if (count > this.tokenBucket.tokensPerInterval - this.tokensThisInterval) {
            if (this.fireImmediately) {
                return -1;
            } else {
                const waitMs = Math.ceil(this.curIntervalStart + this.tokenBucket.interval - now);
                await wait(waitMs);
                const remainingTokens = await this.tokenBucket.removeTokens(count);
                this.tokensThisInterval += count;
                return remainingTokens;
            }
        }
        // Remove the requested number of tokens from the token bucket
        const remainingTokens = await this.tokenBucket.removeTokens(count);
        this.tokensThisInterval += count;
        return remainingTokens;
    }

    tryRemoveTokens(count) {
        // Make sure the request isn't for more than we can handle
        if (count > this.tokenBucket.bucketSize)
            return false;
        const now = getMilliseconds();
        // Advance the current interval and reset the current interval token count
        // if needed
        if (now < this.curIntervalStart || now - this.curIntervalStart >= this.tokenBucket.interval) {
            this.curIntervalStart = now;
            this.tokensThisInterval = 0;
        }
        // If we don't have enough tokens left in this interval, return false
        if (count > this.tokenBucket.tokensPerInterval - this.tokensThisInterval)
            return false;
        // Try to remove the requested number of tokens from the token bucket
        const removed = this.tokenBucket.tryRemoveTokens(count);
        if (removed) {
            this.tokensThisInterval += count;
        }
        return removed;
    }

    getTokensRemaining() {
        this.tokenBucket.drip();
        return this.tokenBucket.content;
    }
}

function getLimiterInstance({ tokensPerInterval, interval, fireImmediately }) {
    const limiter = new RateLimiter({ tokensPerInterval, interval, fireImmediately });
    return limiter;
}

const limiter = {
    getLimiterInstance,
}

var rateLimiterExports = {
    limiter,
}

module.exports = rateLimiterExports