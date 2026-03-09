/**
 * Servicio de subida de imágenes a S3.
 *
 * Flujo:
 *   1. El componente ImageUploader convierte el File a base64
 *   2. Llama a uploadImage() con el base64 y carpeta destino
 *   3. El backend recibe el base64, lo sube a S3 y devuelve la URL pública
 *   4. El componente devuelve la URL al formulario padre
 */

import { post } from "../http-client";

const UPLOAD_PATH = "/api/upload";

interface UploadResponse {
  url: string;
}

/**
 * Sube una imagen a S3 a través del backend y devuelve la URL pública.
 *
 * @param imageData - Imagen en base64 (con o sin prefijo data:...)
 * @param folder    - Carpeta destino en S3 (ej. "products", "users", "clients", "suppliers")
 * @returns URL pública de la imagen en S3
 */
export async function uploadImage(
  imageData: string,
  folder: string,
): Promise<string> {
  const response = await post<UploadResponse>(UPLOAD_PATH, { imageData, folder });
  return response.url;
}

/**
 * Convierte un File del input a base64.
 * Devuelve el data URI completo (con prefijo "data:image/...;base64,...").
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
