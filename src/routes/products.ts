import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import pool from "../lib/db";
import {
  ProductQuery,
  ProductParams,
  CreateProductBody,
  UpdateProductBody,
  StockBody,
} from "../types";

const UPDATABLE_FIELDS = [
  "name",
  "brand",
  "category",
  "price",
  "price_range",
  "image",
  "in_stock",
  "tags",
] as const;

const toBoundedInt = (value: string | undefined, fallback: number, max: number) => {
  const n = parseInt(value ?? "", 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return Math.min(n, max);
};

const isValidPrice = (price: unknown): price is number =>
  typeof price === "number" && Number.isFinite(price) && price >= 0;

export async function productRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ProductQuery }>(
    "/products",
    async (req: FastifyRequest<{ Querystring: ProductQuery }>, reply: FastifyReply) => {
      const { category, brand, in_stock, search } = req.query;

      const page   = toBoundedInt(req.query.page, 1, 100_000);
      const limit  = toBoundedInt(req.query.limit, 20, 100);
      const offset = (page - 1) * limit;

      const conditions: string[] = [];
      const params: unknown[] = [];
      let i = 1;

      if (category) {
        conditions.push(`LOWER(category) = LOWER($${i++})`);
        params.push(category);
      }
      if (brand) {
        conditions.push(`LOWER(brand) = LOWER($${i++})`);
        params.push(brand);
      }
      if (in_stock !== undefined) {
        conditions.push(`in_stock = $${i++}`);
        params.push(in_stock === "true");
      }
      if (search) {
        conditions.push(`(name ILIKE $${i} OR brand ILIKE $${i})`);
        params.push(`%${search}%`);
        i++;
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

      const [productsResult, countResult] = await Promise.all([
        pool.query(
          `SELECT * FROM products ${where}
           ORDER BY created_at DESC
           LIMIT $${i} OFFSET $${i + 1}`,
          [...params, limit, offset]
        ),
        pool.query(`SELECT COUNT(*)::int AS count FROM products ${where}`, params),
      ]);

      return reply.send({
        products: productsResult.rows,
        total: countResult.rows[0].count,
        page,
        limit,
      });
    }
  );

  fastify.get<{ Params: ProductParams }>(
    "/products/:id",
    async (req: FastifyRequest<{ Params: ProductParams }>, reply: FastifyReply) => {
      const result = await pool.query("SELECT * FROM products WHERE id = $1", [
        req.params.id,
      ]);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "Product not found" });
      }
      return reply.send({ product: result.rows[0] });
    }
  );

  fastify.post<{ Body: CreateProductBody }>(
    "/products",
    async (req: FastifyRequest<{ Body: CreateProductBody }>, reply: FastifyReply) => {
      const {
        name,
        brand,
        category,
        price,
        price_range = null,
        image = null,
        in_stock = true,
        tags = [],
      } = req.body;

      if (!name?.trim() || !brand?.trim() || !category?.trim()) {
        return reply.status(400).send({ error: "name, brand and category are required" });
      }
      if (!isValidPrice(price)) {
        return reply.status(400).send({ error: "price must be a number, 0 or more" });
      }

      const result = await pool.query(
        `INSERT INTO products
           (name, brand, category, price, price_range, image, in_stock, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [name.trim(), brand.trim(), category.trim(), price, price_range, image, in_stock, tags]
      );

      return reply.status(201).send({ product: result.rows[0] });
    }
  );

  fastify.patch<{ Params: ProductParams; Body: UpdateProductBody }>(
    "/products/:id",
    async (
      req: FastifyRequest<{ Params: ProductParams; Body: UpdateProductBody }>,
      reply: FastifyReply
    ) => {
      const body = (req.body ?? {}) as Record<string, unknown>;

      const fields = UPDATABLE_FIELDS.filter((f) => body[f] !== undefined);

      if (fields.length === 0) {
        return reply.status(400).send({ error: "No valid fields to update" });
      }
      if (body.price !== undefined && !isValidPrice(body.price)) {
        return reply.status(400).send({ error: "price must be a number, 0 or more" });
      }

      const setClauses = fields.map((field, idx) => `${field} = $${idx + 1}`);
      const values = fields.map((field) => body[field]);

      const result = await pool.query(
        `UPDATE products
         SET ${setClauses.join(", ")}
         WHERE id = $${fields.length + 1}
         RETURNING *`,
        [...values, req.params.id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "Product not found" });
      }
      return reply.send({ product: result.rows[0] });
    }
  );

  fastify.patch<{ Params: ProductParams; Body: StockBody }>(
    "/products/:id/stock",
    async (
      req: FastifyRequest<{ Params: ProductParams; Body: StockBody }>,
      reply: FastifyReply
    ) => {
      const { in_stock } = req.body ?? {};

      if (typeof in_stock !== "boolean") {
        return reply.status(400).send({ error: "in_stock must be a boolean" });
      }

      const result = await pool.query(
        "UPDATE products SET in_stock = $1 WHERE id = $2 RETURNING *",
        [in_stock, req.params.id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "Product not found" });
      }
      return reply.send({ product: result.rows[0] });
    }
  );

  fastify.delete<{ Params: ProductParams }>(
    "/products/:id",
    async (req: FastifyRequest<{ Params: ProductParams }>, reply: FastifyReply) => {
      const result = await pool.query(
        "DELETE FROM products WHERE id = $1 RETURNING id",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: "Product not found" });
      }
      return reply.status(204).send();
    }
  );
}