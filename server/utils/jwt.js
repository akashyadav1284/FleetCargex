const jwt = require('jsonwebtoken');

/**
 * Generates an Access Token and a Refresh Token
 * @param {String} userId - The MongoDB ObjectId of the user
 * @param {String} role - The role of the user (admin, driver, user)
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Sets the Access and Refresh tokens as HTTP-Only cookies on the response object
 * @param {Object} res - Express Response Object
 * @param {String} accessToken - The generated JWT Access Token
 * @param {String} refreshToken - The generated JWT Refresh Token
 */
const setAuthCookies = (res, accessToken, refreshToken, role = 'user') => {
  const isProd = process.env.NODE_ENV === 'production';
  const prefix = role.includes('admin') ? 'admin' : role === 'driver' ? 'driver' : 'user';

  res.cookie(`accessToken_${prefix}`, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  res.cookie(`refreshToken_${prefix}`, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh'
  });
};

/**
 * Clears the auth cookies upon logout
 */
const clearAuthCookies = (res, role = 'user') => {
  const isProd = process.env.NODE_ENV === 'production';
  const prefix = role.includes('admin') ? 'admin' : role === 'driver' ? 'driver' : 'user';
  res.cookie(`accessToken_${prefix}`, '', { httpOnly: true, expires: new Date(0), secure: isProd, sameSite: isProd ? 'None' : 'Lax' });
  res.cookie(`refreshToken_${prefix}`, '', { httpOnly: true, expires: new Date(0), secure: isProd, sameSite: isProd ? 'None' : 'Lax', path: '/api/auth/refresh' });
}

module.exports = {
  generateTokens,
  setAuthCookies,
  clearAuthCookies
};
