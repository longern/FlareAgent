import { verifyJwt } from "../auth/utils";

interface Env {
  SECRET_KEY?: string;
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async function (context) {
  const { env, params } = context;
  const isJwtVerified = await verifyJwt(context);
  if (!isJwtVerified) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const id = params.id;
  const db = env.DB;
  const d1result = await db
    .prepare(
      "SELECT * FROM flare_agent_conversations WHERE conversation_id = ?"
    )
    .bind(id)
    .run<{
      conversation_id: string;
    }>();
  return Response.json(d1result);
};
