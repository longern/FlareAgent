import { verifyJwt } from "../auth/utils";

interface Env {
  SECRET_KEY?: string;
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async function (context) {
  const { request, env, params } = context;
  const isJwtVerified = await verifyJwt(context);
  if (!isJwtVerified) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await request.json<{
    user_id: string;
    title: string;
  }>();
  const id = crypto.randomUUID();
  const db = env.DB;
  db.prepare(
    "INSERT INTO flare_agent_conversations (conversation_id, user_id, title) VALUES (?, ?, ?)"
  )
    .bind(id, body.user_id, body.title)
    .run();
  return Response.json({ conversation_id: id });
};
