import PDFDocument from 'pdfkit';
import { drawPDFHeader } from './pdfHeader.template.js';

/**
 * Repayment History PDF – Table Layout with Same Header as NOC
 */
export const generateRepaymentHistoryPDF = (doc, loan, repayments, totalPaid, logoPath) => {

  /* -------------------- Helpers -------------------- */

  const formatCurrency = (amt) =>
    `Rs ${Number(amt || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
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
  const TABLE_HEADER_FONT_SIZE = 8;

  let y = 30;

  /* -------------------- Table Helpers (Same as Contract PDF) -------------------- */

  const getCellHeight = (label, value, width) => {
    doc.fontSize(FONT_SIZE);
    // Calculate height for label and value on same line (like contract PDF)
    const combinedText = `${label}${value || ''}`;
    const textHeight = doc
      .font('Helvetica-Bold')
      .heightOfString(combinedText, { width: width - CELL_PADDING * 2 });
    
    return textHeight + CELL_PADDING * 2;
  };

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
  // Address line Y position: startY (30) + 18 (company name) + 12 (registration text) = 60
  // Address text height is approximately 9px, so registration number should be at y = 60 + 9 + 3 = 72
  const registrationNumber = 'B-03/2025-26';
  const addressLineY = 30 + 18 + 12; // y = 60 (address line position)
  const registrationY = addressLineY + 12; // Position below address line
  
  // Center align registration number with label, matching address font style
  doc.fontSize(9.5).font('Helvetica'); // Match address font style
  const regLabel = 'Registration No.: ';
  const regFullText = regLabel + registrationNumber;
  doc.text(regFullText, START_X, registrationY, {
    width: PAGE_WIDTH,
    align: 'center'
  });

  /* -------------------- HEADING WITH LINES -------------------- */

  const headingText = 'REPAYMENT HISTORY';
  doc.fontSize(14).font('Helvetica-Bold');
  const headingWidth = doc.widthOfString(headingText);
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

  y += 30;

  /* -------------------- LOAN INFORMATION (Table Format) -------------------- */

  const remainingAmount = Math.max(0, (loan.loanAmount || 0) - totalPaid);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Loan Account Number: ', value: loan.loanAccountNumber || 'N/A' },
    { w: PAGE_WIDTH / 2, label: 'Member Name: ', value: loan.membership?.fullName || 'N/A' },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Loan Amount: ', value: formatCurrency(loan.loanAmount || 0) },
    { w: PAGE_WIDTH / 2, label: 'Total Paid: ', value: formatCurrency(totalPaid) },
  ]);

  drawFullRow('Remaining Amount: ', formatCurrency(remainingAmount));

  y += 10;

  /* -------------------- REPAYMENT TABLE -------------------- */

  if (repayments.length === 0) {
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text('No repayment records found.', START_X, y);
    return;
  }

  // Table column widths (removed recordedBy and recordedAt)
  const colWidths = {
    sno: 50,
    date: 150,
    amount: 150,
    method: 165,
  };

  const tableWidth = Object.values(colWidths).reduce((sum, w) => sum + w, 0);

  // Table header
  doc.fontSize(TABLE_HEADER_FONT_SIZE).font('Helvetica-Bold');
  let x = START_X;
  
  // Draw header background
  doc.rect(START_X, y, tableWidth, 20)
     .fill('#f0f0f0');

  // Header cells
  doc.fillColor('#000000');
  doc.text('S.No', x + 5, y + 6);
  x += colWidths.sno;

  doc.text('Date', x + 5, y + 6);
  x += colWidths.date;

  doc.text('Amount', x + 5, y + 6);
  x += colWidths.amount;

  doc.text('Method', x + 5, y + 6);

  // Draw header border
  doc.rect(START_X, y, tableWidth, 20)
     .lineWidth(0.7)
     .stroke(BORDER_COLOR);

  y += 20;

  // Table rows
  doc.fontSize(FONT_SIZE).font('Helvetica');
  repayments.forEach((repayment, index) => {
    // Check if we need a new page
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }

    const rowHeight = 25;
    x = START_X;

    // Draw row border
    doc.rect(START_X, y, tableWidth, rowHeight)
       .lineWidth(0.5)
       .stroke(BORDER_COLOR);

    // S.No
    doc.text(String(index + 1), x + 5, y + 8);
    x += colWidths.sno;

    // Date
    doc.text(formatDate(repayment.paymentDate), x + 5, y + 8);
    x += colWidths.date;

    // Amount
    doc.text(formatCurrency(repayment.amount), x + 5, y + 8);
    x += colWidths.amount;

    // Method
    const method = repayment.paymentMethod === 'cash' ? 'Cash' :
                   repayment.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                   repayment.paymentMethod === 'cheque' ? 'Cheque' : 'Other';
    doc.text(method, x + 5, y + 8);

    y += rowHeight;
  });

  // Draw final bottom border
  doc.rect(START_X, y, tableWidth, 0)
     .lineWidth(0.7)
     .stroke(BORDER_COLOR);

  y += 20;

  // Summary section
  doc.fontSize(FONT_SIZE).font('Helvetica-Bold');
  doc.text('Summary:', START_X, y);
  y += 15;

  doc.font('Helvetica');
  doc.text(`Total Repayments: ${repayments.length}`, START_X, y);
  y += 12;

  doc.text(`Total Amount Paid: ${formatCurrency(totalPaid)}`, START_X, y);
  y += 12;

  if (remainingAmount > 0) {
    doc.text(`Remaining Amount: ${formatCurrency(remainingAmount)}`, START_X, y);
  } else {
    doc.text('Loan Status: Fully Paid', START_X, y);
  }
};

