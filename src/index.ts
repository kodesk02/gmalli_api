import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env";
import { requireAdmin } from "./middleware/auth";
import { meRoutes } from "./routes/me";
import { productRoutes } from "./routes/products";
import { toErrorResponse } from "./utils/errors";
import multipart from "@fastify/multipart";
import { uploadRoutes } from "./routes/uploads";

const app = Fastify({
  trustProxy: true, 
  logger: {
    transport: env.nodeEnv === "development" ? { target: "pino-pretty" } : undefined,
  },
});

app.register(cors, {
  origin: [env.adminFrontendUrl],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

app.setErrorHandler((error, req, reply) => {
  const { statusCode, message } = toErrorResponse(error);
  if (statusCode >= 500) req.log.error(error);
  return reply.status(statusCode).send({ error: message });
});

app.get("/health", async () => ({
  status: "ok",
  commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? "local",
  timestamp: new Date().toISOString(),
}));

app.register(
  async (admin) => {
    admin.addHook("onRequest", requireAdmin);
    admin.register(meRoutes);
    admin.register(productRoutes);
    admin.register(uploadRoutes);
  },
  { prefix: "/admin" }
);

app.listen({ port: env.port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});