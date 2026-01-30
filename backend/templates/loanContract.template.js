import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';
import { drawPDFHeader } from './pdfHeader.template.js';

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-IN');
  } catch {
    return '';
  }
};
const formatCurrency = (amt) =>
  `Rs ${Number(amt || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const numberToWords = (num) => {
    // This is a simplified version - you may want to use a library for full conversion
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
    }
    if (num < 100000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      return numberToWords(thousand) + ' Thousand' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
    }
    if (num < 10000000) {
      const lakh = Math.floor(num / 100000);
      const remainder = num % 100000;
      return numberToWords(lakh) + ' Lakh' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
    }
    return num.toString();
  };

export const generateLoanContractPDF = async (doc, loan, logoPath) => {
  const PAGE_WIDTH = 515;
  const START_X = 40;
  const BORDER = '#333';
  const FONT = 9;
  const PAD_X = 6; // Increased from 4 to fill white space
  const PAD_Y = 5; // Increased from 3 to fill white space
  const PAGE_HEIGHT = doc.page.height;
  const BOTTOM_MARGIN = doc.page.margins.bottom;
  const TOP_MARGIN = doc.page.margins.top;

  let y = 30;
  let currentPage = 1;
  const MAX_PAGES = 1; // Single page only

  /* ---------------- HEADER ---------------- */
  y = drawPDFHeader(doc, {
    logoPath,
    logoWidth: 45,
    startX: START_X,
    pageWidth: PAGE_WIDTH,
    startY: y,
    registrationText: 'Registered Under The Assam Co-operative Societies Act, 2007',
    addressText: 'DEWRIKUCHI (SONKUCHI COLONY BAZAR), DIST. BARPETA, ASSAM, PIN-781314',
    spacingAfter: 50
  });

  /* ---------------- REGISTRATION NUMBER ---------------- */
  // Position registration number exactly below address line, center aligned
  // Address line Y position: startY (30) + 18 (company name) + 12 (registration text) = 60
  // Address text height is approximately 9px, so registration number should be at y = 60 + 9 + 3 = 72
  const registrationNumber = 'B-03/2025-26';
  const addressLineY = 30 + 18 + 12; // y = 60 (address line position)
  const registrationY = addressLineY + 12; // Position below address line
  
  // Center align registration number with label, matching address font style
  doc.fontSize(9.5).font('Helvetica'); // Match address font style, increased from 7.5px by 2px
  const regLabel = 'Registration No.: ';
  const regFullText = regLabel + registrationNumber;
  doc.text(regFullText, START_X, registrationY, {
    width: PAGE_WIDTH,
    align: 'center'
  });

  /* ---------------- HEADING WITH LINES ---------------- */
  const heading = 'LOAN APPLICATION FORM';
  doc.font('Helvetica-Bold').fontSize(14);
  const headingWidth = doc.widthOfString(heading);
  const centerX = START_X + PAGE_WIDTH / 2;
  const headingY = y;

  // Draw lines aligned with text
  const lineY = headingY + 7;
  doc
    .moveTo(START_X, lineY)
    .lineTo(centerX - headingWidth / 2 - 10, lineY)
    .stroke(BORDER);

  doc
    .moveTo(centerX + headingWidth / 2 + 10, lineY)
    .lineTo(START_X + PAGE_WIDTH, lineY)
    .stroke(BORDER);

  // Draw heading text
  doc.text(heading, centerX - headingWidth / 2, headingY);

  y = headingY + 30; // Increased bottom space by 5px (from 25 to 30)

  /* ---------------- TABLE HELPERS ---------------- */
/* ---------------- TABLE HELPERS ---------------- */

const cellHeight = (label, value, width) => {
  doc.fontSize(FONT);
  // Calculate height for label and value on same line
  const combinedText = `${label}: ${value || ''}`;
  const textHeight = doc
    .font('Helvetica-Bold')
    .heightOfString(combinedText, { width });
  
  return textHeight + PAD_Y * 2;
};

const drawRow = (cells) => {
  const heights = cells.map(c =>
    cellHeight(c.label, c.value, c.w - PAD_X * 2)
  );
  const h = Math.max(...heights);
  let x = START_X;

  cells.forEach(c => {
    const baseY = y;          // 🔒 lock Y
    const oldDocY = doc.y;    // 🔒 lock internal cursor

    doc.rect(x, baseY, c.w, h).stroke(BORDER);

    // Draw label and value on same line
    doc.fontSize(FONT).font('Helvetica-Bold');
    const combinedText = `${c.label}: `;
    const labelWidth = doc.widthOfString(combinedText);
    
    doc.text(
      combinedText,
      x + PAD_X,
      baseY + PAD_Y,
      { width: c.w - PAD_X * 2 }
    );

    doc.font('Helvetica').text(
      c.value || '',
      x + PAD_X + labelWidth,
      baseY + PAD_Y,
      { width: c.w - PAD_X * 2 - labelWidth }
    );

    doc.y = oldDocY;          // ✅ restore cursor
    x += c.w;
  });

  y += h;
};

const drawFullRow = (label, value) => {
  const h = cellHeight(label, value, PAGE_WIDTH - PAD_X * 2);
  const baseY = y;
  const oldDocY = doc.y;      // lock internal cursor

  doc.rect(START_X, baseY, PAGE_WIDTH, h).stroke(BORDER);

  // Draw label and value on same line
  doc.fontSize(FONT).font('Helvetica-Bold');
  const combinedText = `${label}: `;
  const labelWidth = doc.widthOfString(combinedText);
  
  doc.text(
    combinedText,
    START_X + PAD_X,
    baseY + PAD_Y,
    { width: PAGE_WIDTH - PAD_X * 2 }
  );

  doc.font('Helvetica').text(
    value || '',
    START_X + PAD_X + labelWidth,
    baseY + PAD_Y,
    { width: PAGE_WIDTH - PAD_X * 2 - labelWidth }
  );

  doc.y = oldDocY;            // ✅ restore cursor
  y += h;
};

const fetchImage = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch image: ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
};

const drawImageCell = async (x, y, w, h, imageUrl, imageMetadata = null) => {
  const baseY = y;
  const oldDocY = doc.y;
  
  doc.rect(x, baseY, w, h).stroke(BORDER);
  
  if (imageUrl) {
    try {
      // Calculate available space for image (with padding)
      const availableWidth = w - PAD_X * 2;
      const availableHeight = h - PAD_Y * 2;
      
      console.log('Attempting to load image:', imageUrl);
      
      if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        // Fetch image from URL and convert to buffer
        const imageBuffer = await fetchImage(imageUrl);
        
        // Get image dimensions from metadata or calculate from buffer
        let imgOriginalWidth = 200; // Default fallback
        let imgOriginalHeight = 200; // Default fallback
        
        if (imageMetadata && imageMetadata.width && imageMetadata.height) {
          imgOriginalWidth = imageMetadata.width;
          imgOriginalHeight = imageMetadata.height;
        }
        
        // Calculate scale to fit within available space while maintaining aspect ratio
        const scaleWidth = availableWidth / imgOriginalWidth;
        const scaleHeight = availableHeight / imgOriginalHeight;
        const scale = Math.min(scaleWidth, scaleHeight);
        
        // Calculate actual rendered dimensions (maintaining aspect ratio)
        const actualWidth = imgOriginalWidth * scale;
        const actualHeight = imgOriginalHeight * scale;
        
        // Center the image horizontally and vertically within the available space
        const imgX = x + PAD_X + (availableWidth - actualWidth) / 2;
        const imgY = baseY + PAD_Y + (availableHeight - actualHeight) / 2;
        
        // Draw image centered
        doc.image(imageBuffer, imgX, imgY, { 
          width: actualWidth, 
          height: actualHeight
        });
        console.log('Image loaded successfully');
      } else {
        console.log('Invalid image URL format:', imageUrl);
        throw new Error('Invalid URL format');
      }
    } catch (err) {
      // If image fails to load, show "N/A"
      console.error('Error loading image:', err.message);
      doc.fontSize(FONT).font('Helvetica')
        .text('N/A', x + PAD_X, baseY + h / 2 - FONT / 2, { width: w - PAD_X * 2, align: 'center' });
    }
  } else {
    console.log('No image URL provided');
    doc.fontSize(FONT).font('Helvetica')
      .text('N/A', x + PAD_X, baseY + h / 2 - FONT / 2, { width: w - PAD_X * 2, align: 'center' });
  }
  
  doc.y = oldDocY;
};

  /* ---------------- APPLICANT ---------------- */
  // Layout matching mock: Photo on right, fields in 2-column grid on left
  const applicantBaseY = y;
  const oldDocYApplicant = doc.y;
  
  // Photo column on right (wider for better display)
  const PHOTO_COLUMN_WIDTH = 120;
  const INFO_SECTION_WIDTH = PAGE_WIDTH - PHOTO_COLUMN_WIDTH;
  const INFO_COLUMN_WIDTH = INFO_SECTION_WIDTH / 2;
  const PHOTO_X = START_X + INFO_SECTION_WIDTH;
  
  let currentY = applicantBaseY;
  
  // Row 1: Applicant's Name (full width, spans 2 info columns)
  const name1Height = cellHeight("Applicant's Name", loan.membership?.fullName || 'N/A', INFO_SECTION_WIDTH - PAD_X * 2);
  doc.rect(START_X, currentY, INFO_SECTION_WIDTH, name1Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const nameLabelText = "Applicant's Name: ";
  const nameLabelWidth = doc.widthOfString(nameLabelText);
  doc.text(nameLabelText, START_X + PAD_X, currentY + PAD_Y, { width: INFO_SECTION_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.membership?.fullName || 'N/A', START_X + PAD_X + nameLabelWidth, currentY + PAD_Y, { width: INFO_SECTION_WIDTH - PAD_X * 2 - nameLabelWidth });
  currentY += name1Height;
  
  // Row 2: Father's/Husband's Name (full width, spans 2 info columns)
  const name2Height = cellHeight("Father's/Husband's Name", loan.membership?.fatherOrHusbandName || 'N/A', INFO_SECTION_WIDTH - PAD_X * 2);
  doc.rect(START_X, currentY, INFO_SECTION_WIDTH, name2Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const fatherLabelText = "Father's/Husband's Name: ";
  const fatherLabelWidth = doc.widthOfString(fatherLabelText);
  doc.text(fatherLabelText, START_X + PAD_X, currentY + PAD_Y, { width: INFO_SECTION_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.membership?.fatherOrHusbandName || 'N/A', START_X + PAD_X + fatherLabelWidth, currentY + PAD_Y, { width: INFO_SECTION_WIDTH - PAD_X * 2 - fatherLabelWidth });
  currentY += name2Height;
  
  // Row 3: Address (spans 2 info columns, full width)
  const addressText = loan.membership?.address
    ? `Vill/Ward ${loan.membership.address.village}, PO ${loan.membership.address.postOffice}, PS ${loan.membership.address.policeStation}, Dist ${loan.membership.address.district}, PIN-${loan.membership.address.pinCode}`
    : 'N/A';
  const addressCellHeight = cellHeight('Address', addressText, INFO_SECTION_WIDTH - PAD_X * 2);
  doc.rect(START_X, currentY, INFO_SECTION_WIDTH, addressCellHeight).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const addressLabelText = 'Address: ';
  const addressLabelWidth = doc.widthOfString(addressLabelText);
  doc.text(addressLabelText, START_X + PAD_X, currentY + PAD_Y, { width: INFO_SECTION_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(addressText, START_X + PAD_X + addressLabelWidth, currentY + PAD_Y, { width: INFO_SECTION_WIDTH - PAD_X * 2 - addressLabelWidth });
  currentY += addressCellHeight;
  
  // Row 4: Date of Birth | Occupation
  const row3Height = Math.max(
    cellHeight('Date of Birth', formatDate(loan.membership?.dateOfBirth), INFO_COLUMN_WIDTH - PAD_X * 2),
    cellHeight('Occupation', loan.membership?.occupation || 'N/A', INFO_COLUMN_WIDTH - PAD_X * 2)
  );
  
  doc.rect(START_X, currentY, INFO_COLUMN_WIDTH, row3Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const dobLabelText = 'Date of Birth: ';
  const dobLabelWidth = doc.widthOfString(dobLabelText);
  doc.text(dobLabelText, START_X + PAD_X, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(formatDate(loan.membership?.dateOfBirth), START_X + PAD_X + dobLabelWidth, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 - dobLabelWidth });
  
  doc.rect(START_X + INFO_COLUMN_WIDTH, currentY, INFO_COLUMN_WIDTH, row3Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const occupationLabelText = 'Occupation: ';
  const occupationLabelWidth = doc.widthOfString(occupationLabelText);
  doc.text(occupationLabelText, START_X + INFO_COLUMN_WIDTH + PAD_X, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.membership?.occupation || 'N/A', START_X + INFO_COLUMN_WIDTH + PAD_X + occupationLabelWidth, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 - occupationLabelWidth });
  currentY += row3Height;
  
  // Row 5: Mobile Number | Bank Account Number
  const row4Height = Math.max(
    cellHeight('Mobile Number', loan.mobileNumber || 'N/A', INFO_COLUMN_WIDTH - PAD_X * 2),
    cellHeight('Bank Account Number', loan.bankAccountNumber || 'N/A', INFO_COLUMN_WIDTH - PAD_X * 2)
  );
  
  doc.rect(START_X, currentY, INFO_COLUMN_WIDTH, row4Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const mobileLabelText = 'Mobile Number: ';
  const mobileLabelWidth = doc.widthOfString(mobileLabelText);
  doc.text(mobileLabelText, START_X + PAD_X, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.mobileNumber || 'N/A', START_X + PAD_X + mobileLabelWidth, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 - mobileLabelWidth });
  
  doc.rect(START_X + INFO_COLUMN_WIDTH, currentY, INFO_COLUMN_WIDTH, row4Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const accountLabelText = 'Bank Account Number: ';
  const accountLabelWidth = doc.widthOfString(accountLabelText);
  doc.text(accountLabelText, START_X + INFO_COLUMN_WIDTH + PAD_X, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.bankAccountNumber || 'N/A', START_X + INFO_COLUMN_WIDTH + PAD_X + accountLabelWidth, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 - accountLabelWidth });
  currentY += row4Height;
  
  // Row 6: Aadhar Number | PAN Number
  const row5Height = Math.max(
    cellHeight('Aadhar Number', loan.membership?.aadhar || 'N/A', INFO_COLUMN_WIDTH - PAD_X * 2),
    cellHeight('PAN', loan.membership?.pan || 'N/A', INFO_COLUMN_WIDTH - PAD_X * 2)
  );
  
  doc.rect(START_X, currentY, INFO_COLUMN_WIDTH, row5Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const aadharLabelText = 'Aadhar Number: ';
  const aadharLabelWidth = doc.widthOfString(aadharLabelText);
  doc.text(aadharLabelText, START_X + PAD_X, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.membership?.aadhar || 'N/A', START_X + PAD_X + aadharLabelWidth, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 - aadharLabelWidth });
  
  doc.rect(START_X + INFO_COLUMN_WIDTH, currentY, INFO_COLUMN_WIDTH, row5Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const panLabelText = 'PAN: ';
  const panLabelWidth = doc.widthOfString(panLabelText);
  doc.text(panLabelText, START_X + INFO_COLUMN_WIDTH + PAD_X, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.membership?.pan || 'N/A', START_X + INFO_COLUMN_WIDTH + PAD_X + panLabelWidth, currentY + PAD_Y, { width: INFO_COLUMN_WIDTH - PAD_X * 2 - panLabelWidth });
  currentY += row5Height;
  
  // Row 7: Email (full width, spans 2 info columns)
  const emailCellHeight = cellHeight('Email', loan.email || loan.membership?.email || 'N/A', INFO_SECTION_WIDTH - PAD_X * 2);
  doc.rect(START_X, currentY, INFO_SECTION_WIDTH, emailCellHeight).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const emailLabelText = 'Email: ';
  const emailLabelWidth = doc.widthOfString(emailLabelText);
  doc.text(emailLabelText, START_X + PAD_X, currentY + PAD_Y, { width: INFO_SECTION_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.email || loan.membership?.email || 'N/A', START_X + PAD_X + emailLabelWidth, currentY + PAD_Y, { width: INFO_SECTION_WIDTH - PAD_X * 2 - emailLabelWidth });
  currentY += emailCellHeight;
  
  // Calculate total section height for photo
  const totalSectionHeight = currentY - applicantBaseY;
  
  // Photo column on right - spans full height
  const photoUrl = loan.membership?.passportPhoto?.secure_url;
  const photoMetadata = loan.membership?.passportPhoto;
  await drawImageCell(PHOTO_X, applicantBaseY, PHOTO_COLUMN_WIDTH, totalSectionHeight, photoUrl, photoMetadata);
  
  // Update y to the end of the section
  y = currentY;
  doc.y = oldDocYApplicant;

  y += 6;

  /* ---------------- CO-APPLICANT ---------------- */
  // Only display co-applicant section if co-applicant data exists
  if (loan.coApplicant && loan.coApplicant.fullName) {
    drawRow([
      { w: PAGE_WIDTH / 2, label: "Co-Applicant's Name", value: loan.coApplicant.fullName },
      { w: PAGE_WIDTH / 2, label: "Father's/Husband's Name", value: loan.coApplicant.fatherOrHusbandName || 'N/A' },
    ]);

    drawFullRow(
      'Address',
      loan.coApplicant.address
        ? `Vill/Ward ${loan.coApplicant.address.village}, PO ${loan.coApplicant.address.postOffice}, PS ${loan.coApplicant.address.policeStation}, Dist ${loan.coApplicant.address.district}, PIN-${loan.coApplicant.address.pinCode}`
        : 'N/A'
    );

    drawRow([
      { w: PAGE_WIDTH / 2, label: 'Mobile Number', value: loan.coApplicant.mobileNumber || 'N/A' },
      { w: PAGE_WIDTH / 2, label: 'Email', value: loan.coApplicant.email || 'N/A' },
    ]);

    y += 8;
  }

  /* ---------------- NOMINEE ---------------- */
  drawRow([
    { w: PAGE_WIDTH / 2, label: "Nominee's Name", value: loan.nominee?.name },
    { w: PAGE_WIDTH / 2, label: 'Relationship', value: loan.nominee?.relationship },
  ]);

  drawFullRow(
    'Address',
    loan.nominee?.address
      ? `Vill/Ward ${loan.nominee.address.village}, PO ${loan.nominee.address.postOffice}, PS ${loan.nominee.address.policeStation}, Dist ${loan.nominee.address.district}, PIN-${loan.nominee.address.pinCode}`
      : ''
  );

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Mobile No', value: loan.nominee?.mobileNumber || 'N/A' },
    { w: PAGE_WIDTH / 2, label: 'Bank Account Number', value: loan.nominee?.bankAccountNumber || 'N/A' },
  ]);

  y += 8;

  /* ---------------- GUARANTOR ---------------- */
  drawRow([
    { w: PAGE_WIDTH / 2, label: "Guarantor's Name", value: loan.guarantor?.name },
    { w: PAGE_WIDTH / 2, label: "Father's/Husband's Name", value: loan.guarantor?.fatherOrHusbandName },
  ]);

  drawFullRow(
    'Address',
    loan.guarantor?.address
      ? `Vill/Ward ${loan.guarantor.address.village}, PO ${loan.guarantor.address.postOffice}, PS ${loan.guarantor.address.policeStation}, Dist ${loan.guarantor.address.district}, PIN-${loan.guarantor.address.pinCode}`
      : ''
  );

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Bank Account Number', value: loan.guarantor?.bankAccountNumber || 'N/A' },
    { w: PAGE_WIDTH / 2, label: 'Mobile Number', value: loan.guarantor?.mobileNumber || 'N/A' },
  ]);

  y += 8;

  /* ---------------- LOAN DETAILS ---------------- */
  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Membership ID', value: loan.membership?.userId },
    { w: PAGE_WIDTH / 2, label: 'Loan ID', value: loan.loanAccountNumber },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Installment Amount', value: formatCurrency(loan.installmentAmount) },
    { w: PAGE_WIDTH / 2, label: 'Membership Fees Paid', value: formatCurrency(100) },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Loan Repayment Period', value: `${loan.loanTenure} days` },
    { w: PAGE_WIDTH / 2, label: 'Loan Amount', value: formatCurrency(loan.loanAmount) },
  ]);
  const amountInWords = numberToWords(Math.floor(loan.loanAmount || 0)) + ' Rupees Only';
  drawFullRow('In Words: ', amountInWords);

  /* ---------------- EXTRA GAP BEFORE FOOTER ---------------- */
  y += 5;

  /* ---------------- DECLARATION ---------------- */
  const declarationText = 'I/We shall be bound to repay the loan regularly as per the decision of the cooperative.';
  doc.fontSize(8).font('Helvetica');
  const declarationHeight = doc.heightOfString(declarationText, { width: PAGE_WIDTH }) + 5;
  
  const oldDocY = doc.y;
  doc.text(declarationText, START_X, y, { width: PAGE_WIDTH });
  doc.y = oldDocY; // Prevent cursor advancement
  y += declarationHeight;

  /* ---------------- OFFICE USE ONLY ---------------- */
  // Position office section at the bottom of the page
  const officeSectionHeight = 105; // Increased height by 30px (from 75 to 105)
  const officeSectionStartY = PAGE_HEIGHT - BOTTOM_MARGIN - officeSectionHeight;
  
  /* ---------------- FOOTER LINE ---------------- */
  // Add space above signatures for manual signing
  const signatureSpaceHeight = 25; // Space for manual signature
  const footerStartY = y + 6;
  
  // Ensure signatures don't overlap with office section
  const maxFooterY = officeSectionStartY - 15; // Leave gap before office section
  let signatureTextY = footerStartY + signatureSpaceHeight + 15; // Shifted down by 15px (10px additional from previous 5px)
  
  // If signatures would overlap, adjust position
  if (signatureTextY + 10 > maxFooterY) {
    signatureTextY = maxFooterY - 10;
  }
  
  // Signatures row - evenly distributed (space-between) - hardcoded positions
  // Use smaller font and condensed style to ensure "Signature of Borrower" fits on one line
  doc.fontSize(6.5).font('Helvetica');
  // Try using condensed/compressed text rendering
  
  const hasCoApplicant = loan.coApplicant && loan.coApplicant.fullName;
  
  if (hasCoApplicant) {
    // Three signatures: Guarantor | Co-Applicant | Borrower
    const guarantorText = "Guarantor's Signature";
    const coApplicantText = "Co-Applicant's Signature";
    // Use shorter text to ensure single line rendering
    const borrowerText = "Borrower's Signature";
    
    // Calculate widths with current font size
    const guarantorWidth = doc.widthOfString(guarantorText);
    const coApplicantWidth = doc.widthOfString(coApplicantText);
    const borrowerWidth = doc.widthOfString(borrowerText);
    
    const totalWidth = guarantorWidth + coApplicantWidth + borrowerWidth;
    const availableSpace = PAGE_WIDTH - totalWidth;
    const spacing = availableSpace / 2; // Space between each signature
    
    // Left: Guarantor's Signature
    doc.text(guarantorText, START_X, signatureTextY);
    
    // Middle: Co-Applicant's Signature
    const coApplicantX = START_X + guarantorWidth + spacing;
    doc.text(coApplicantText, coApplicantX, signatureTextY);
    
    // Right: Signature of Borrower - render without width to prevent wrapping
    const borrowerX = START_X + PAGE_WIDTH - borrowerWidth - 10;
    // Render without width parameter - PDFKit will render as single line
    doc.text(borrowerText, borrowerX, signatureTextY);
  } else {
    // Two signatures: Guarantor | Borrower
    const guarantorText = "Guarantor's Signature";
    // Use shorter text to ensure single line rendering
    const borrowerText = "Borrower's Signature";
    
    const guarantorWidth = doc.widthOfString(guarantorText);
    const borrowerWidth = doc.widthOfString(borrowerText);
    
    // Left: Guarantor's Signature
    doc.text(guarantorText, START_X, signatureTextY);
    
    // Right: Signature of Borrower - render without width to prevent wrapping
    const borrowerX = START_X + PAGE_WIDTH - borrowerWidth - 10;
    // Render without width parameter - PDFKit will render as single line
    doc.text(borrowerText, borrowerX, signatureTextY);
  }

  y = signatureTextY + 10;
  
  // Draw border around entire office section at bottom
  doc.rect(START_X, officeSectionStartY, PAGE_WIDTH, officeSectionHeight).stroke(BORDER);
  
  // Center "OFFICE USE ONLY" title (underline removed)
  let officeY = officeSectionStartY + 4;
  doc.font('Helvetica-Bold').fontSize(7.5); // Reduced font size
  const officeTitle = 'OFFICE USE ONLY';
  const titleWidth = doc.widthOfString(officeTitle);
  doc.text(officeTitle, START_X + (PAGE_WIDTH - titleWidth) / 2, officeY);
  
  officeY += 14; // Space after title (adjusted since underline removed)

  // Office information - compact layout, removed redundant info
  doc.font('Helvetica').fontSize(7); // Reduced font size further
  const infoLeftX = START_X + 15;
  const infoRightX = START_X + PAGE_WIDTH - 15;
  const infoLineHeight = 10; // Reduced from 18
  const infoStartY = officeY;
  
  // Single row: Date (left) and Accepted by Loan Committee (right)
  let infoY = infoStartY;
  
  // Date - left aligned
  doc.font('Helvetica-Bold').text('Loan sectioned date: ', infoLeftX, infoY);
  const dateLabelWidth = doc.widthOfString('Loan sectioned date: ');
  doc.font('Helvetica').text(formatDate(loan.approvedAt), infoLeftX + dateLabelWidth, infoY);
  
  // Accepted by Loan Committee - right aligned
  doc.font('Helvetica-Bold');
  const acceptedLabelText = 'Accepted by Loan Committee: ';
  const acceptedLabelWidth = doc.widthOfString(acceptedLabelText);
  const acceptedValueText = 'Yes';
  const acceptedValueWidth = doc.widthOfString(acceptedValueText);
  const acceptedStartX = infoRightX - acceptedLabelWidth - acceptedValueWidth;
  
  doc.text(acceptedLabelText, acceptedStartX, infoY);
  doc.font('Helvetica').text(acceptedValueText, acceptedStartX + acceptedLabelWidth, infoY);
  
  // Chairman's Signature at the bottom of the office box - left aligned with space for manual signature
  const officeSignatureSpace = 20; // Space for manual signature
  const signatureY = officeSectionStartY + officeSectionHeight - officeSignatureSpace;
  doc.font('Helvetica').fontSize(7);
  doc.text("Chairman's Signature", infoLeftX, signatureY);
  
  // Update y to end of office section
  y = officeSectionStartY + officeSectionHeight;
  
  // Ensure we stay on page 1 - verify content doesn't exceed page height
  if (y > PAGE_HEIGHT - BOTTOM_MARGIN) {
    console.warn('Content may exceed single page limit. Current y:', y, 'Page height:', PAGE_HEIGHT - BOTTOM_MARGIN);
  }
  
  // Ensure document is single page
  if (doc.bufferedPageRange().count > 1) {
    console.warn('Multiple pages detected. Expected single page only.');
  }
};
