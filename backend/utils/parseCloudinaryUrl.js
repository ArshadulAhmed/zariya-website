/**
 * Parse public_id, resource_type, delivery type and version from a Cloudinary delivery URL.
 * Used for legacy docs (secure_url only) and to align signed URLs with stored assets (upload + version).
 * Handles: /cloud_name/resource_type/upload|authenticated/.../v123/public_id.ext
 * @param {string} secureUrl - Full Cloudinary URL
 * @returns {{ publicId: string, resourceType: string, type: string, version: number } | null}
 */
export function parsePublicIdFromCloudinaryUrl(secureUrl) {
  if (!secureUrl || typeof secureUrl !== 'string') return null;
  try {
    const path = new URL(secureUrl).pathname;
    const match = path.match(/\/[^/]+\/(image|video|raw)\/(upload|authenticated)\/(?:s--[^/]+--\/)?v(\d+)\/(.+)$/);
    if (!match) return null;
    const resourceType = match[1];
    const deliveryType = match[2];
    const version = parseInt(match[3], 10);
    let publicId = match[4];
    if (publicId) publicId = publicId.replace(/\.[a-zA-Z0-9]+$/, '');
    return publicId ? { publicId, resourceType, type: deliveryType, version } : null;
  } catch {
    return null;
  }
}
