/**
 * Reusable PDF Header Component
 * Draws the common header section for ZARIYA PDF documents
 * 
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {Object} options - Configuration options
 * @param {string} options.logoPath - Path to logo image (optional)
 * @param {number} options.logoWidth - Logo width in pixels (default: 40)
 * @param {number} options.startX - Starting X position (default: 40)
 * @param {number} options.pageWidth - Page width (default: 515)
 * @param {number} options.startY - Starting Y position (default: 30)
 * @param {string} options.registrationText - Registration text (optional, uses default if not provided)
 * @param {string} options.addressText - Address text (optional, uses default if not provided)
 * @param {number} options.spacingAfter - Spacing after header (default: 46)
 * @returns {number} - Returns the Y position after the header
 */
export const drawPDFHeader = (doc, options = {}) => {
  const {
    logoPath,
    logoWidth = 40,
    startX = 40,
    pageWidth = 515,
    startY = 30,
    registrationText = 'Registered Under The Assam Co-operative Societies Act, 2007',
    addressText = 'DEWRIKUCHI (SONKUCHI COLONY BAZAR), DIST. BARPETA, ASSAM, PIN-781314',
    spacingAfter = 46
  } = options;

  let y = startY;

  /* -------------------- LOGOS -------------------- */
  if (logoPath) {
    try {
      doc.image(logoPath, startX, y, { width: logoWidth });
      doc.image(logoPath, startX + pageWidth - logoWidth, y, { width: logoWidth });
    } catch {}
  }

  /* -------------------- HEADER TEXT -------------------- */
  doc.fontSize(13)
    .font('Helvetica-Bold')
    .text(
      'ZARIYA THE THRIFT AND CREDIT CO-OPERATIVE SOCIETY LIMITED',
      startX,
      y,
      { width: pageWidth, align: 'center' }
    );

  y += 18;

  doc.fontSize(9)
    .font('Helvetica')
    .text(
      registrationText,
      startX,
      y,
      { width: pageWidth, align: 'center' }
    );

  y += 12;

  doc.text(
    addressText,
    startX,
    y,
    { width: pageWidth, align: 'center' }
  );

  y += spacingAfter;

  return y;
};

