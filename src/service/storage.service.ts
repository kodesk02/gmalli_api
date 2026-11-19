import { randomUUID } from "node:crypto";
import { supabase } from "../lib/supabase";
import type { DetectedImage } from "../utils/image";

const PRODUCT_IMAGES_BUCKET = "product-images";

export async function uploadProductImage(buffer: Buffer, image: DetectedImage): Promise<string> {
  const path = `products/${randomUUID()}.${image.extension}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: image.contentType,
      cacheControl: "31536000", 
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}