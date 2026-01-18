import type { JWTPayload } from "./auth.types.js";

export type Variables = {
  user: JWTPayload;
};
