import PDFDocument from 'pdfkit';
import { drawPDFHeader } from './pdfHeader.template.js';

/**
 * Loan NOC PDF – Boxed Table Layout with Auto-Wrapping Cells
 */
export const generateLoanNOCPDF = (doc, loan, totalPaid, logoPath) => {

  /* -------------------- Helpers -------------------- */

  const formatCurrency = (amt) =>
    `Rs ${Number(amt || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (d) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-IN');
    } catch {
      return '';
    }
  };

  /* -------------------- Layout Constants -------------------- */

  const PAGE_WIDTH = 515;
  const START_X = 40;
  const BORDER_COLOR = '#333333';
  const PAD_X = 8;
  const PAD_Y = 7;
  const FONT_SIZE = 9;

  let y = 30;

  /* -------------------- Height Calculation -------------------- */

  const getCellHeight = (label, value, width) => {
    doc.fontSize(FONT_SIZE);
    // Calculate height for label and value on same line (like contract PDF)
    const combinedText = `${label}${value || ''}`;
    const textHeight = doc
      .font('Helvetica-Bold')
      .heightOfString(combinedText, { width: width - PAD_X * 2 });
    
    return textHeight + PAD_Y * 2;
  };

  /* -------------------- Draw Cell -------------------- */

  const drawCell = (x, y, w, h, label, value) => {
    const baseY = y;
    const oldDocY = doc.y; // lock internal cursor

    doc.rect(x, baseY, w, h).lineWidth(0.7).stroke(BORDER_COLOR);

    // Draw label and value on same line
    doc.fontSize(FONT_SIZE).font('Helvetica-Bold');
    const combinedText = `${label}: `;
    const labelWidth = doc.widthOfString(combinedText);
    
    doc.text(
      combinedText,
      x + PAD_X,
      baseY + PAD_Y,
      { width: w - PAD_X * 2 }
    );

    doc.font('Helvetica').text(
      value || '',
      x + PAD_X + labelWidth,
      baseY + PAD_Y,
      { width: w - PAD_X * 2 - labelWidth }
    );

    doc.y = oldDocY; // restore cursor
  };

  /* -------------------- Draw Row -------------------- */

  const drawRow = (cells) => {
    const heights = cells.map(c =>
      getCellHeight(c.label, c.value, c.w)
    );

    const rowHeight = Math.max(...heights);

    let x = START_X;
    cells.forEach((cell) => {
      drawCell(x, y, cell.w, rowHeight, cell.label, cell.value);
      x += cell.w;
    });

    y += rowHeight;
  };

  const drawFullRow = (label, value) => {
    const h = getCellHeight(label, value, PAGE_WIDTH);
    drawCell(START_X, y, PAGE_WIDTH, h, label, value);
    y += h;
  };

  /* -------------------- HEADER -------------------- */
  y = drawPDFHeader(doc, {
    logoPath,
    logoWidth: 40,
    startX: START_X,
    pageWidth: PAGE_WIDTH,
    startY: y,
    registrationText: 'Registered Under The Assam Co-operative Societies Act, 2007 (Act IV of 2012)',
    addressText: 'DEWRIKUCHI (SONKUCHI COLONY BAZAR), DIST. BARPETA (ASSAM), PIN-781314',
    spacingAfter: 46
  });

  /* -------------------- REGISTRATION NUMBER -------------------- */
  // Position registration number exactly below address line, center aligned
  const registrationNumber = 'B-03/2025-26';
  const addressLineY = 30 + 18 + 12; // y = 60 (address line position)
  const registrationY = addressLineY + 12; // Position below address line
  
  // Center align registration number with label, matching address font style
  doc.fontSize(9.5).font('Helvetica');
  const regLabel = 'Registration No.: ';
  const regFullText = regLabel + registrationNumber;
  doc.text(regFullText, START_X, registrationY, {
    width: PAGE_WIDTH,
    align: 'center'
  });

  /* -------------------- HEADING WITH LINES -------------------- */

  const headingText = 'NO OBJECTION CERTIFICATE';
  const headingWidth = doc.fontSize(14).font('Helvetica-Bold').widthOfString(headingText);
  const centerX = START_X + PAGE_WIDTH / 2;
  const lineY = y + 5;

  // Left line
  doc.moveTo(START_X, lineY)
     .lineTo(centerX - headingWidth / 2 - 12, lineY)
     .lineWidth(1)
     .stroke('#000000');

  // Right line
  doc.moveTo(centerX + headingWidth / 2 + 12, lineY)
     .lineTo(START_X + PAGE_WIDTH, lineY)
     .lineWidth(1)
     .stroke('#000000');

  // Heading text
  doc.text(headingText, START_X, y, {
    width: PAGE_WIDTH,
    align: 'center',
  });

  y += 82;

  /* -------------------- MEMBER INFORMATION -------------------- */

  drawRow([
    { w: PAGE_WIDTH / 2, label: "Member Name", value: loan.membership?.fullName || 'N/A' },
    { w: PAGE_WIDTH / 2, label: "Father's / Husband's Name", value: loan.membership?.fatherOrHusbandName || 'N/A' },
  ]);

  drawFullRow(
    'Address',
    loan.membership?.address
      ? `Vill/Ward ${loan.membership.address.village}, PO ${loan.membership.address.postOffice}, PS ${loan.membership.address.policeStation}, Dist ${loan.membership.address.district}, PIN-${loan.membership.address.pinCode}`
      : 'N/A'
  );

  drawRow([
    { w: PAGE_WIDTH / 3, label: 'Date of Birth', value: loan.membership?.dateOfBirth ? formatDate(loan.membership.dateOfBirth) || 'N/A' : 'N/A' },
    { w: PAGE_WIDTH / 3, label: 'Occupation', value: loan.membership?.occupation || 'N/A' },
    { w: PAGE_WIDTH / 3, label: 'Mobile No', value: loan.mobileNumber || 'N/A' },
  ]);

  y += 10;

  /* -------------------- LOAN INFORMATION -------------------- */

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Membership No', value: loan.membership?.userId || 'N/A' },
    { w: PAGE_WIDTH / 2, label: 'Loan Account No', value: loan.loanAccountNumber || 'N/A' },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Loan Amount', value: formatCurrency(loan.loanAmount) },
    { w: PAGE_WIDTH / 2, label: 'Total Paid', value: formatCurrency(totalPaid) },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Loan Tenure', value: `${loan.loanTenure} days` },
    { w: PAGE_WIDTH / 2, label: 'Outstanding Amount', value: formatCurrency(Math.max(0, loan.loanAmount - totalPaid)) },
  ]);

  y += 14;



  /* -------------------- DATE OF ISSUE & PLACE -------------------- */
  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Date of Issue', value: formatDate(new Date()) },
    { w: PAGE_WIDTH / 2, label: 'Place', value: 'Barpeta, Assam' },
  ]);

  y += 14;

  /* -------------------- CERTIFICATE STATEMENT (plain text, no box) -------------------- */
    const statementText = 'This is to certify that the above-mentioned loan account has been fully closed, and all outstanding dues have been settled. As of the date of issuance of this certificate, there are no pending liabilities against the member in respect of the said loan.';
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(statementText, START_X, y, {
      width: PAGE_WIDTH,
      align: 'left',
      lineGap: 2,
    });
    y = doc.y + 24;

  /* -------------------- FOOTER (LOCKED TO BOTTOM) -------------------- */

  const footerY = doc.page.height - doc.page.margins.bottom - 90;

  doc.fontSize(9)
    .font('Helvetica-Bold')
    .text("Chairman's Signature", START_X, footerY + 25);

  const sealX = START_X + PAGE_WIDTH - 200;

  doc.fontSize(9)
    .font('Helvetica-Bold')
    .text('OFFICIAL SEAL', sealX + 10, footerY, {
      width: 180,
      align: 'center',
    });

  doc.fontSize(8)
    .font('Helvetica')
    .text(
      'ZARIYA THE THRIFT AND CREDIT CO-OPERATIVE SOCIETY LIMITED',
      sealX,
      footerY + 14,
      { width: 200, align: 'center' }
    );

  /* -------------------- SINGLE PAGE GUARANTEE -------------------- */

  if (footerY < y + 20) {
    throw new Error('NOC layout exceeded single page');
  }
};
