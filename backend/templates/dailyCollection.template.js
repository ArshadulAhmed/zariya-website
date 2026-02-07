import PDFDocument from 'pdfkit';
import { drawPDFHeader } from './pdfHeader.template.js';

/**
 * Daily Collection PDF – Table Layout with Same Header as NOC
 */
export const generateDailyCollectionPDF = (doc, date, repayments, totalCollection, collectionByMethod, logoPath) => {

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
  const registrationNumber = 'B-03/2025-26';
  const addressLineY = 30 + 18 + 12;
  const registrationY = addressLineY + 12;
  
  doc.fontSize(9.5).font('Helvetica');
  const regLabel = 'Registration No.: ';
  const regFullText = regLabel + registrationNumber;
  doc.text(regFullText, START_X, registrationY, {
    width: PAGE_WIDTH,
    align: 'center'
  });

  /* -------------------- HEADING WITH LINES -------------------- */

  const headingText = 'DAILY COLLECTION REPORT';
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

  /* -------------------- SUMMARY INFORMATION (Table Format) -------------------- */

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Date: ', value: formatDate(date) },
    { w: PAGE_WIDTH / 2, label: 'Total Collections: ', value: formatCurrency(totalCollection) },
  ]);

  drawFullRow('Total Transactions: ', String(repayments.length));

  y += 10;

  /* -------------------- COLLECTIONS TABLE -------------------- */

  if (repayments.length === 0) {
    doc.fontSize(FONT_SIZE).font('Helvetica');
    doc.text('No collections found for the selected date.', START_X, y);
    return;
  }

  // Table column widths (adjusted to fit within PAGE_WIDTH)
  // Total should equal PAGE_WIDTH to match top summary section
  const colWidths = {
    sno: 30,
    loanAccount: 85,
    memberName: 95,
    amount: 80,
    method: 60,
    recordedBy: 80,
    remarks: 65,
  };

  // Calculate current total and scale to match PAGE_WIDTH exactly
  const currentTotal = Object.values(colWidths).reduce((sum, w) => sum + w, 0);
  const scale = PAGE_WIDTH / currentTotal;
  const tableWidth = PAGE_WIDTH;
  
  // Scale all columns proportionally to match PAGE_WIDTH
  Object.keys(colWidths).forEach(key => {
    colWidths[key] = Math.floor(colWidths[key] * scale);
  });
  
  // Adjust for any rounding differences to ensure exact PAGE_WIDTH
  const adjustedTotal = Object.values(colWidths).reduce((sum, w) => sum + w, 0);
  const difference = PAGE_WIDTH - adjustedTotal;
  if (difference !== 0) {
    // Add the difference to the largest column (remarks)
    colWidths.remarks += difference;
  }

  // Table header with cell borders
  const headerHeight = 20;
  const headerPadding = 5;
  doc.fontSize(TABLE_HEADER_FONT_SIZE).font('Helvetica-Bold');
  let x = START_X;
  const headerY = y;
  
  // Draw header background
  doc.rect(START_X, headerY, tableWidth, headerHeight)
     .fill('#f0f0f0');

  // Header cells with borders (centered vertically and horizontally)
  doc.fillColor('#000000');
  
  const headerTexts = ['S.No', 'Loan Account', 'Member Name', 'Amount', 'Method', 'Recorded By', 'Remarks'];
  const headerWidths = [colWidths.sno, colWidths.loanAccount, colWidths.memberName, colWidths.amount, colWidths.method, colWidths.recordedBy, colWidths.remarks];
  
  headerTexts.forEach((text, idx) => {
    const cellWidth = headerWidths[idx];
    doc.rect(x, headerY, cellWidth, headerHeight).lineWidth(0.7).stroke(BORDER_COLOR);
    
    // Calculate text height for vertical centering
    const textHeight = doc.heightOfString(text, { width: cellWidth - headerPadding * 2 });
    const verticalOffset = (headerHeight - textHeight) / 2;
    
    doc.text(text, x + headerPadding, headerY + verticalOffset, { 
      width: cellWidth - headerPadding * 2, 
      align: 'center' 
    });
    x += cellWidth;
  });

  y += 20;

  // Table rows with dynamic height
  doc.fontSize(FONT_SIZE).font('Helvetica');
  const cellPadding = 5;
  const minRowHeight = 20;
  
  repayments.forEach((repayment, index) => {
    // Check if we need a new page
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }

    // Calculate cell heights for this row
    const cellTexts = {
      sno: String(index + 1),
      loanAccount: repayment.loan?.loanAccountNumber || 'N/A',
      memberName: repayment.loan?.membership?.fullName || 'N/A',
      amount: formatCurrency(repayment.amount),
      method: repayment.paymentMethod === 'cash' ? 'Cash' :
              repayment.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
              repayment.paymentMethod === 'cheque' ? 'Cheque' : 'Other',
      recordedBy: repayment.recordedBy?.fullName || repayment.recordedBy?.username || 'N/A',
      remarks: repayment.remarks || '-',
    };

    // Calculate height for each cell (with text wrapping)
    const cellHeights = {
      sno: doc.heightOfString(cellTexts.sno, { width: colWidths.sno - cellPadding * 2 }) + cellPadding * 2,
      loanAccount: doc.heightOfString(cellTexts.loanAccount, { width: colWidths.loanAccount - cellPadding * 2 }) + cellPadding * 2,
      memberName: doc.heightOfString(cellTexts.memberName, { width: colWidths.memberName - cellPadding * 2 }) + cellPadding * 2,
      amount: doc.heightOfString(cellTexts.amount, { width: colWidths.amount - cellPadding * 2 }) + cellPadding * 2,
      method: doc.heightOfString(cellTexts.method, { width: colWidths.method - cellPadding * 2 }) + cellPadding * 2,
      recordedBy: doc.heightOfString(cellTexts.recordedBy, { width: colWidths.recordedBy - cellPadding * 2 }) + cellPadding * 2,
      remarks: doc.heightOfString(cellTexts.remarks, { width: colWidths.remarks - cellPadding * 2 }) + cellPadding * 2,
    };

    // Row height is the maximum of all cell heights
    const rowHeight = Math.max(...Object.values(cellHeights), minRowHeight);
    const baseY = y;
    x = START_X;

    // Draw all cells with centered content (both horizontally and vertically)
    const cellKeys = ['sno', 'loanAccount', 'memberName', 'amount', 'method', 'recordedBy', 'remarks'];
    const cellWidths = [colWidths.sno, colWidths.loanAccount, colWidths.memberName, colWidths.amount, colWidths.method, colWidths.recordedBy, colWidths.remarks];
    
    cellKeys.forEach((key, idx) => {
      const cellWidth = cellWidths[idx];
      const cellText = cellTexts[key];
      
      // Calculate actual text height for this cell
      const actualTextHeight = doc.heightOfString(cellText, { width: cellWidth - cellPadding * 2 });
      
      // Draw cell border
      doc.rect(x, baseY, cellWidth, rowHeight).lineWidth(0.5).stroke(BORDER_COLOR);
      
      // Calculate vertical offset for centering
      const verticalOffset = (rowHeight - actualTextHeight) / 2;
      
      // Draw text centered both horizontally and vertically
      doc.text(cellText, x + cellPadding, baseY + verticalOffset, { 
        width: cellWidth - cellPadding * 2, 
        align: 'center' 
      });
      
      x += cellWidth;
    });

    y += rowHeight;
  });

  y += 10;

  // Summary section
  // doc.fontSize(FONT_SIZE).font('Helvetica-Bold');
  // doc.text('Summary:', START_X, y);
  // y += 15;

  // doc.font('Helvetica');
  // doc.text(`Total Transactions: ${repayments.length}`, START_X, y);
  // y += 12;

  // doc.text(`Total Collection: ${formatCurrency(totalCollection)}`, START_X, y);
};

