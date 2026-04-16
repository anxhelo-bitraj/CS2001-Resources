import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
  cache: true,
  rateLimit: true,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid || '', (err, key) => {
    if (err || !key) return callback(err || new Error('No key found'));
    callback(null, key.getPublicKey());
  });
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  accessToken?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  req.accessToken = token;

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err || !decoded || typeof decoded === 'string') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const claims = decoded as Record<string, string>;
    req.userId = claims.oid || claims.sub;
    req.userEmail = claims.preferred_username || claims.upn || claims.email;
    next();
  });
}
