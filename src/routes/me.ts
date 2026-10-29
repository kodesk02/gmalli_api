import type { FastifyInstance } from "fastify";
import type { AdminUser } from "../types";
import { AppError } from "../utils/errors";

export async function meRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/me", async (req): Promise<{ admin: AdminUser }> => {
    if (!req.admin) throw new AppError(401, "Not signed in");
    return { admin: req.admin };
  });
}