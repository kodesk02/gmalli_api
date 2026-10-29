import type { FastifyReply, FastifyRequest, FastifySchema, FastifyTypeProviderDefault, RouteGenericInterface } from "fastify";
import { env } from "../config/env";
import { supabase } from "../lib/supabase";
import { AppError } from "../utils/errors";
import { Server, IncomingMessage, ServerResponse } from "node:http";

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply<RouteGenericInterface, Server<typeof IncomingMessage, typeof ServerResponse>, IncomingMessage, ServerResponse<IncomingMessage>, unknown, FastifySchema, FastifyTypeProviderDefault, unknown>): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Missing authorization token");
  }

  const { data, error } = await supabase.auth.getUser(header.slice(7).trim());
  if (error || !data.user) throw new AppError(401, "Invalid or expired token");

  const email = (data.user.email ?? "").toLowerCase();
  if (!env.adminEmails.includes(email)) throw new AppError(403, "Not an admin");

  req.admin = { id: data.user.id, email };
}