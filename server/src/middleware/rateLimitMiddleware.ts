import rateLimit from 'express-rate-limit';

/** Auth endpoints — strict: 10 attempts per 15 minutes per IP */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many authentication requests. Please try again later.' } },
});

/** General API — 200 requests per minute per IP */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests. Please try again later.' } },
});

/** Code execution — max 15 executions per minute per IP */
export const executionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Execution rate limit reached. Please wait before running again.' } },
});
