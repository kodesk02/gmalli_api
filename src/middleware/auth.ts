import { FastifyRequest, FastifyReply } from "fastify";
import { supabase } from "../lib/supabase";

export async function authMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization token" });
  }

  const token = authHeader.split(" ")[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }

  req.admin = {
    id:    data.user.id,
    email: data.user.email ?? "",
  };
}