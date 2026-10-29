import Fastify, { FastifyError } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { env } from "./config/env";
import { requireAdmin } from "./middleware/auth";
import { productRoutes } from "./routes/products";
import { meRoutes } from "./routes/me";
// import { orderRoutes } from "./routes/orders";
// import { deliveryRoutes } from "./routes/delivery";
// import { pickupRoutes } from "./routes/pickup";
// import { analyticsRoutes } from "./routes/analytics";
// import { uploadRoutes } from "./routes/uploads";

const app = Fastify({
  logger: {
    transport: env.nodeEnv === "development"
      ? { target: "pino-pretty" }
      : undefined,
  },
});

app.register(cors, {
  origin: [
    env.adminFrontendUrl,
    "http://localhost:3003",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 },
});


app.addHook("preHandler", async (req, reply) => {
  if (req.url === "/health") return;
  await requireAdmin(req, reply);
});


app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

app.register(
  async (admin) => {
    admin.addHook("onRequest", requireAdmin);
    admin.register(meRoutes);
    admin.register(productRoutes);
    // admin.register(orderRoutes);
  },
  { prefix: "/admin" }
);
app.register(productRoutes,   { prefix: "/admin" });
// app.register(orderRoutes,     { prefix: "/admin" });
// app.register(deliveryRoutes,  { prefix: "/admin" });
// app.register(pickupRoutes,    { prefix: "/admin" });
// app.register(analyticsRoutes, { prefix: "/admin" });
// app.register(uploadRoutes,    { prefix: "/admin" });

app.listen({ port: env.port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

app.setErrorHandler((error: FastifyError, req, reply) => {
  req.log.error(error);
  const status = error.statusCode ?? 500;
  reply.status(status).send({
    error: status >= 500 ? "Internal server error" : error.message,
  });
});