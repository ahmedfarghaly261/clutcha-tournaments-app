export type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  version: number;
  jti: string;
  type: 'refresh';
};
