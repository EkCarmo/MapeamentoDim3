import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { ProductPhoto } from "@/lib/types";

export async function uploadProductPhoto(
  productId: string,
  file: File
): Promise<ProductPhoto> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `products/${productId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteProductPhoto(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // se o arquivo já não existir no Storage, ignora
  }
}
