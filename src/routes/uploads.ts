import type { FastifyInstance } from "fastify";
import { AppError } from "../utils/errors";
import { detectImage } from "../utils/image";
import { uploadProductImage } from "../service/storage.service";

const UPLOAD_LIMIT = { rateLimit: { max: 20, timeWindow: "1 minute" } };

export async function uploadRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    "/uploads/product-image",
    { config: UPLOAD_LIMIT },
    async (req, reply): Promise<{ url: string }> => {
      const file = await req.file();
      if (!file) throw new AppError(400, "No image was uploaded");

      const buffer = await file.toBuffer();

      const image = detectImage(buffer);
      if (!image) throw new AppError(400, "Only JPG, PNG or WebP images are allowed");

      const url = await uploadProductImage(buffer, image);
      reply.status(201);
      return { url };
    }
  );
}