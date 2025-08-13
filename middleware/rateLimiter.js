const { RateLimiterMemory } = require('rate-limiter-flexible');

// Rate limiter for authentication routes
const authLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 5, // Number of attempts
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

// Rate limiter for general API routes
const apiLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // Number of requests
  duration: 900, // Per 15 minutes
});

const rateLimitMiddleware = async (req, res, next) => {
  try {
    await authLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: secs
    });
  }
};

const apiRateLimitMiddleware = async (req, res, next) => {
  try {
    await apiLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: secs
    });
  }
};

module.exports = rateLimitMiddleware;
module.exports.apiRateLimit = apiRateLimitMiddleware;
