import { fileTypeFromBuffer } from "file-type";

/**
 * @param {ArrayBuffer | Uint8Array<ArrayBufferLike>} buffer - A Uint8Array or ArrayBuffer representing file data.
 * @returns {Promise<import("file-type").FileTypeResult | undefined>} The detected file type, or `undefined` when there is no match.
 */
export async function getFileType(buffer) {
  return fileTypeFromBuffer(buffer);
}

/**
 *
 * @param {ArrayBuffer | Uint8Array<ArrayBufferLike>} fileBuffer - A Uint8Array or ArrayBuffer representing file data.
 * @param {string[]} allowedTypes - An array of allowed file mime types.
 * @returns {Promise<{ type: string, ext: string, isValid: boolean}>} Whether the file type is allowed.
 */
export async function fileFilter(fileBuffer, allowedTypes) {
  const res = await getFileType(fileBuffer);

  if (!res) {
    return { isValid: false };
  }

  const { ext, mime } = res;

  return { type: mime, ext, isValid: allowedTypes.includes(mime) };
}
