import PDFDocument from 'pdfkit';

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
    try {
      return new Date(d).toLocaleDateString('en-IN');
    } catch {
      return '';
    }
  };

  /* -------------------- Layout Constants -------------------- */

  const PAGE_WIDTH = 515;
  const START_X = 40;
  const BORDER_COLOR = '#333333';
  const CELL_PADDING = 8;
  const FONT_SIZE = 9;

  let y = 30;

  /* -------------------- Height Calculation -------------------- */

  const getCellHeight = (label, value, width) => {
    doc.fontSize(FONT_SIZE);

    const labelWidth = doc.font('Helvetica-Bold').widthOfString(label);
    const usableWidth = width - CELL_PADDING * 2;

    const valueHeight = doc
      .font('Helvetica')
      .heightOfString(value || 'N/A', {
        width: usableWidth - labelWidth,
      });

    const labelHeight = doc
      .font('Helvetica-Bold')
      .heightOfString(label, {
        width: usableWidth,
      });

    return Math.max(
      labelHeight + valueHeight + CELL_PADDING * 2,
      FONT_SIZE + CELL_PADDING * 2
    );
  };

  /* -------------------- Draw Cell -------------------- */

  const drawCell = (x, y, w, h, label, value) => {
    doc.rect(x, y, w, h).lineWidth(0.7).stroke(BORDER_COLOR);

    const startX = x + CELL_PADDING;
    const startY = y + CELL_PADDING;
    const usableWidth = w - CELL_PADDING * 2;

    doc.fontSize(FONT_SIZE)
      .font('Helvetica-Bold')
      .text(label, startX, startY, { width: usableWidth });

    const labelWidth = doc.widthOfString(label);

    doc.font('Helvetica')
      .text(value || 'N/A', startX + labelWidth, startY, {
        width: usableWidth - labelWidth,
      });
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

  if (logoPath) {
    try {
      doc.image(logoPath, START_X, y, { width: 40 });
      doc.image(logoPath, START_X + PAGE_WIDTH - 40, y, { width: 40 });
    } catch {}
  }

  doc.fontSize(13)
    .font('Helvetica-Bold')
    .text(
      'ZARIYA THE THRIFT AND CREDIT CO-OPERATIVE SOCIETY LIMITED',
      START_X,
      y,
      { width: PAGE_WIDTH, align: 'center' }
    );

  y += 18;

  doc.fontSize(9)
    .font('Helvetica')
    .text(
      'Registered Under The Assam Co-operative Societies Act, 2007 (Act IV of 2012)',
      START_X,
      y,
      { width: PAGE_WIDTH, align: 'center' }
    );

  y += 12;

  doc.text(
    'DEWRIKUCHI (SONKUCHI COLONY BAZAR), DIST. BARPETA (ASSAM), PIN-781314',
    START_X,
    y,
    { width: PAGE_WIDTH, align: 'center' }
  );

  y += 46;

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
    { w: PAGE_WIDTH / 2, label: 'Member Name: ', value: loan.membership?.fullName },
    { w: PAGE_WIDTH / 2, label: "Father's / Husband's Name: ", value: loan.membership?.fatherName },
  ]);

  drawFullRow(
    'Address: ',
    loan.membership?.address
      ? `Vill/Ward ${loan.membership.address.village}, PO ${loan.membership.address.postOffice}, PS ${loan.membership.address.policeStation}, Dist ${loan.membership.address.district}, PIN ${loan.membership.address.pinCode}`
      : ''
  );

  drawRow([
    { w: PAGE_WIDTH / 3, label: 'Date of Birth: ', value: formatDate(loan.membership?.dob) },
    { w: PAGE_WIDTH / 3, label: 'Occupation: ', value: loan.membership?.occupation },
    { w: PAGE_WIDTH / 3, label: 'Mobile No: ', value: loan.mobileNumber },
  ]);

  y += 10;

  /* -------------------- LOAN INFORMATION -------------------- */

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Membership No: ', value: loan.membership?.userId },
    { w: PAGE_WIDTH / 2, label: 'Loan Account No: ', value: loan.loanAccountNumber },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Loan Amount: ', value: formatCurrency(loan.loanAmount) },
    { w: PAGE_WIDTH / 2, label: 'Total Paid: ', value: formatCurrency(totalPaid) },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Loan Tenure: ', value: `${loan.loanTenure} days` },
    { w: PAGE_WIDTH / 2, label: 'Outstanding Amount: ', value: formatCurrency(Math.max(0, loan.loanAmount - totalPaid)) },
  ]);

  y += 10;

  /* -------------------- CERTIFICATE STATEMENT -------------------- */

  drawFullRow(
    'Statement: ',
    'This is to certify that the above loan account has been fully closed and all dues have been cleared. There are no outstanding liabilities against the member as on the date of issue.'
  );

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Date of Issue: ', value: formatDate(new Date()) },
    { w: PAGE_WIDTH / 2, label: 'Place: ', value: 'Barpeta, Assam' },
  ]);

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
