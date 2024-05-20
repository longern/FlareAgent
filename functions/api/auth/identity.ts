import jwt from "@tsndr/cloudflare-worker-jwt";

import { decodeJwt, verifyJwt } from "../auth/utils";

interface Env {
  SECRET_KEY?: string;
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async function (context) {
  const isJwtVerified = await verifyJwt(context);
  if (!isJwtVerified) {
    return Response.json({ id: null });
  }

  const payload = decodeJwt(context);
  const { id } = payload;
  return Response.json({ id });
};
