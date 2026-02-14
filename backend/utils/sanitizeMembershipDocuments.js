/**
 * Replace document URL/public_id with a safe flag so frontend never receives
 * permanent URLs or Cloudinary asset IDs. Frontend must request time-bound signed URLs
 * via GET /api/memberships/:id/documents/:documentType/url
 */
const DOCUMENT_FIELDS = ['aadharUpload', 'aadharUploadBack', 'panUpload', 'passportPhoto'];

/**
 * @param {Object} obj - Membership or object containing membership (e.g. loan with membership)
 * @param {boolean} isMembership - If true, sanitize obj itself; if false, sanitize obj.membership
 * @returns {Object} - New object with document fields replaced by { hasDocument: true }
 */
export function sanitizeDocumentUrls(obj, isMembership = true) {
  if (!obj) return obj;
  const plain = obj.toObject ? obj.toObject() : obj;
  const target = isMembership ? plain : plain.membership;
  if (!target) return plain;

  const out = Array.isArray(plain) ? [...plain] : { ...plain };
  const targetOut = isMembership ? out : (out.membership = target ? { ...target } : target);

  if (targetOut && typeof targetOut === 'object') {
    for (const field of DOCUMENT_FIELDS) {
      if (targetOut[field] && (targetOut[field].secure_url || targetOut[field].public_id)) {
        targetOut[field] = { hasDocument: true };
      }
    }
  }

  return out;
}

/**
 * Sanitize a single membership (plain or mongoose doc).
 */
export function sanitizeMembership(membership) {
  if (!membership) return membership;
  const plain = membership.toObject ? membership.toObject() : { ...membership };
  return sanitizeDocumentUrls(plain, true);
}

/**
 * Sanitize membership when nested (e.g. in loan).
 */
export function sanitizeMembershipInLoan(loan) {
  if (!loan) return loan;
  const plain = loan.toObject ? loan.toObject() : { ...loan };
  return sanitizeDocumentUrls(plain, false);
}
