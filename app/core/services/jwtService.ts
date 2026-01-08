import Constants from 'expo-constants';
import JWT from 'expo-jwt';

const secretKey ='K9p#L2mRx$8qW!tzJ0cN4bF7gH3kM6sP1eA&dUwXyZ@cV'; // Clé secrète pour signer les JWT
const jwtExpirationMs = Constants.expoConfig?.extra?.jwtExpiration || 604800000; // 24 heures par défaut

export interface UserForToken {
  id: number;
  email: string;
  role: string;
}

class JwtService {

 generateToken(user: UserForToken): string {
  const payload = {
    role: user.role,
    id: user.id,
    sub: user.email,           // subject = email (comme en Java)
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + Math.floor(jwtExpirationMs / 1000),
  };

  // Passe l'algorithme comme string directement dans les options
 return JWT.encode(payload, secretKey);
 }

  extractUsername(token: string): string | null {
    try {
      const decoded = JWT.decode(token, secretKey);
      return decoded.sub || null;
    } catch (error) {
      console.error('Token invalide ou expiré');
      return null;
    }
  }

  /**
   * Extrait une claim spécifique
   */
  extractClaim<T>(token: string, claim: string): T | null {
    try {
      const decoded = JWT.decode(token, secretKey);
      return (decoded as any)[claim] || null;
    } catch (error) {
      return null;
    }
  }

 
  isTokenValid(token: string, email: string): boolean {
    try {
      const decoded = JWT.decode(token, secretKey);
      const username = decoded.sub;
      const exp = decoded.exp;

      if (!username || !exp) return false;

      const isNotExpired = exp > Math.floor(Date.now() / 1000);
      return username === email && isNotExpired;
    } catch (error) {
      return false;
    }
  }


  extractUserId(token: string): number | null {
    return this.extractClaim<number>(token, 'id');
  }

  /**
   * Récupère le rôle depuis le token
   */
  extractRole(token: string): string | null {
    return this.extractClaim<string>(token, 'role');
  }
}

export const jwtService = new JwtService();