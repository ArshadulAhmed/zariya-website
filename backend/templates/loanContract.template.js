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
  const PAD_X = 6;
  const PAD_Y = 6;
  const PAGE_HEIGHT = doc.page.height;
  const BOTTOM_MARGIN = doc.page.margins.bottom;
  const TOP_MARGIN = doc.page.margins.top;

  let y = 30;
  let currentPage = 1;
  const MAX_PAGES = 2; // Hardcode to 2 pages maximum
  
  // Helper to check and handle page breaks
  const checkPageBreak = (requiredHeight) => {
    if (y + requiredHeight > PAGE_HEIGHT - BOTTOM_MARGIN - 30) {
      if (currentPage < MAX_PAGES) {
        currentPage++;
        doc.addPage();
        y = TOP_MARGIN;
        return true;
      }
    }
    return false;
  };

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

  y = headingY + 40;

  /* ---------------- TABLE HELPERS ---------------- */
/* ---------------- TABLE HELPERS ---------------- */

const cellHeight = (label, value, width) => {
  doc.fontSize(FONT);

  const labelHeight = doc
    .font('Helvetica-Bold')
    .heightOfString(label, { width });

  const valueHeight = doc
    .font('Helvetica')
    .heightOfString(value || '', { width });

  return labelHeight + valueHeight + PAD_Y * 2;
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

    doc.fontSize(FONT).font('Helvetica-Bold');
    const labelHeight = doc.heightOfString(c.label, {
      width: c.w - PAD_X * 2,
    });

    doc.text(
      c.label,
      x + PAD_X,
      baseY + PAD_Y,
      { width: c.w - PAD_X * 2 }
    );

    doc.font('Helvetica').text(
      c.value || '',
      x + PAD_X,
      baseY + PAD_Y + labelHeight,
      { width: c.w - PAD_X * 2 }
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

  doc.fontSize(FONT).font('Helvetica-Bold');
  const labelHeight = doc.heightOfString(label, {
    width: PAGE_WIDTH - PAD_X * 2,
  });

  doc.text(
    label,
    START_X + PAD_X,
    baseY + PAD_Y,
    { width: PAGE_WIDTH - PAD_X * 2 }
  );

  doc.font('Helvetica').text(
    value || '',
    START_X + PAD_X,
    baseY + PAD_Y + labelHeight,
    { width: PAGE_WIDTH - PAD_X * 2 }
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
  const applicantBaseY = y;
  const oldDocYApplicant = doc.y;
  const PHOTO_SIZE = 200;
  const LEFT_SECTION_WIDTH = PAGE_WIDTH - PHOTO_SIZE;
  const PHOTO_X = START_X + LEFT_SECTION_WIDTH;
  
  // Left section: Applicant information
  let leftY = applicantBaseY;
  
  // Applicant's Name
  const nameCellHeight = cellHeight("Applicant's Name", loan.membership?.fullName || 'N/A', LEFT_SECTION_WIDTH - PAD_X * 2);
  doc.rect(START_X, leftY, LEFT_SECTION_WIDTH, nameCellHeight).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const nameLabelHeight = doc.heightOfString("Applicant's Name", { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  doc.text("Applicant's Name", START_X + PAD_X, leftY + PAD_Y, { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.membership?.fullName || 'N/A', START_X + PAD_X, leftY + PAD_Y + nameLabelHeight, { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  leftY += nameCellHeight;
  
  // Father's/Husband's Name
  const fatherCellHeight = cellHeight("Father's/Husband's Name", loan.membership?.fatherOrHusbandName || 'N/A', LEFT_SECTION_WIDTH - PAD_X * 2);
  doc.rect(START_X, leftY, LEFT_SECTION_WIDTH, fatherCellHeight).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const fatherLabelHeight = doc.heightOfString("Father's/Husband's Name", { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  doc.text("Father's/Husband's Name", START_X + PAD_X, leftY + PAD_Y, { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.membership?.fatherOrHusbandName || 'N/A', START_X + PAD_X, leftY + PAD_Y + fatherLabelHeight, { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  leftY += fatherCellHeight;
  
  // Address
  const addressText = loan.membership?.address
    ? `Vill/Ward ${loan.membership.address.village}, PO ${loan.membership.address.postOffice}, PS ${loan.membership.address.policeStation}, Dist ${loan.membership.address.district}, PIN-${loan.membership.address.pinCode}`
    : 'N/A';
  const addressCellHeight = cellHeight('Address', addressText, LEFT_SECTION_WIDTH - PAD_X * 2);
  doc.rect(START_X, leftY, LEFT_SECTION_WIDTH, addressCellHeight).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const addressLabelHeight = doc.heightOfString('Address', { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  doc.text('Address', START_X + PAD_X, leftY + PAD_Y, { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(addressText, START_X + PAD_X, leftY + PAD_Y + addressLabelHeight, { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  leftY += addressCellHeight;
  
  // Date of Birth, Occupation, Mobile Number, Account Number in 2x2 grid
  const gridCellWidth = LEFT_SECTION_WIDTH / 2;
  
  // Row 1: Date of Birth, Occupation
  const dobCellHeight = cellHeight('Date of Birth', formatDate(loan.membership?.dateOfBirth), gridCellWidth - PAD_X * 2);
  const occupationCellHeight = cellHeight('Occupation', loan.membership?.occupation || 'N/A', gridCellWidth - PAD_X * 2);
  const gridRow1Height = Math.max(dobCellHeight, occupationCellHeight);
  
  doc.rect(START_X, leftY, gridCellWidth, gridRow1Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const dobLabelHeight = doc.heightOfString('Date of Birth', { width: gridCellWidth - PAD_X * 2 });
  doc.text('Date of Birth', START_X + PAD_X, leftY + PAD_Y, { width: gridCellWidth - PAD_X * 2 });
  doc.font('Helvetica').text(formatDate(loan.membership?.dateOfBirth), START_X + PAD_X, leftY + PAD_Y + dobLabelHeight, { width: gridCellWidth - PAD_X * 2 });
  
  doc.rect(START_X + gridCellWidth, leftY, gridCellWidth, gridRow1Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const occupationLabelHeight = doc.heightOfString('Occupation', { width: gridCellWidth - PAD_X * 2 });
  doc.text('Occupation', START_X + gridCellWidth + PAD_X, leftY + PAD_Y, { width: gridCellWidth - PAD_X * 2 });
  doc.font('Helvetica').text(loan.membership?.occupation || 'N/A', START_X + gridCellWidth + PAD_X, leftY + PAD_Y + occupationLabelHeight, { width: gridCellWidth - PAD_X * 2 });
  leftY += gridRow1Height;
  
  // Row 2: Mobile Number, Account Number
  const mobileCellHeight = cellHeight('Mobile Number', loan.mobileNumber || 'N/A', gridCellWidth - PAD_X * 2);
  const accountCellHeight = cellHeight('Bank Account Number', loan.bankAccountNumber || 'N/A', gridCellWidth - PAD_X * 2);
  const gridRow2Height = Math.max(mobileCellHeight, accountCellHeight);
  
  doc.rect(START_X, leftY, gridCellWidth, gridRow2Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const mobileLabelHeight = doc.heightOfString('Mobile Number', { width: gridCellWidth - PAD_X * 2 });
  doc.text('Mobile Number', START_X + PAD_X, leftY + PAD_Y, { width: gridCellWidth - PAD_X * 2 });
  doc.font('Helvetica').text(loan.mobileNumber || 'N/A', START_X + PAD_X, leftY + PAD_Y + mobileLabelHeight, { width: gridCellWidth - PAD_X * 2 });
  
  doc.rect(START_X + gridCellWidth, leftY, gridCellWidth, gridRow2Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const accountLabelHeight = doc.heightOfString('Bank Account Number', { width: gridCellWidth - PAD_X * 2 });
  doc.text('Bank Account Number', START_X + gridCellWidth + PAD_X, leftY + PAD_Y, { width: gridCellWidth - PAD_X * 2 });
  doc.font('Helvetica').text(loan.bankAccountNumber || 'N/A', START_X + gridCellWidth + PAD_X, leftY + PAD_Y + accountLabelHeight, { width: gridCellWidth - PAD_X * 2 });
  leftY += gridRow2Height;
  
  // Row 3: Aadhar, PAN
  const aadharCellHeight = cellHeight('Aadhar Number', loan.membership?.aadhar || 'N/A', gridCellWidth - PAD_X * 2);
  const panCellHeight = cellHeight('PAN Number', loan.membership?.pan || 'N/A', gridCellWidth - PAD_X * 2);
  const gridRow3Height = Math.max(aadharCellHeight, panCellHeight);
  
  doc.rect(START_X, leftY, gridCellWidth, gridRow3Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const aadharLabelHeight = doc.heightOfString('Aadhar Number', { width: gridCellWidth - PAD_X * 2 });
  doc.text('Aadhar Number', START_X + PAD_X, leftY + PAD_Y, { width: gridCellWidth - PAD_X * 2 });
  doc.font('Helvetica').text(loan.membership?.aadhar || 'N/A', START_X + PAD_X, leftY + PAD_Y + aadharLabelHeight, { width: gridCellWidth - PAD_X * 2 });
  
  doc.rect(START_X + gridCellWidth, leftY, gridCellWidth, gridRow3Height).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const panLabelHeight = doc.heightOfString('PAN Number', { width: gridCellWidth - PAD_X * 2 });
  doc.text('PAN Number', START_X + gridCellWidth + PAD_X, leftY + PAD_Y, { width: gridCellWidth - PAD_X * 2 });
  doc.font('Helvetica').text(loan.membership?.pan || 'N/A', START_X + gridCellWidth + PAD_X, leftY + PAD_Y + panLabelHeight, { width: gridCellWidth - PAD_X * 2 });
  leftY += gridRow3Height;
  
  // Row 4: Email (full width)
  const emailCellHeight = cellHeight('Email', loan.email || loan.membership?.email || 'N/A', LEFT_SECTION_WIDTH - PAD_X * 2);
  doc.rect(START_X, leftY, LEFT_SECTION_WIDTH, emailCellHeight).stroke(BORDER);
  doc.fontSize(FONT).font('Helvetica-Bold');
  const emailLabelHeight = doc.heightOfString('Email', { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  doc.text('Email', START_X + PAD_X, leftY + PAD_Y, { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  doc.font('Helvetica').text(loan.email || loan.membership?.email || 'N/A', START_X + PAD_X, leftY + PAD_Y + emailLabelHeight, { width: LEFT_SECTION_WIDTH - PAD_X * 2 });
  leftY += emailCellHeight;
  
  // Calculate total left section height
  const leftSectionHeight = leftY - applicantBaseY;
  
  // Right section: Passport Photo - height matches left section
  const photoUrl = loan.membership?.passportPhoto?.secure_url;
  const photoMetadata = loan.membership?.passportPhoto;
  console.log('Passport Photo URL:', photoUrl);
  console.log('Passport Photo object:', photoMetadata);
  await drawImageCell(PHOTO_X, applicantBaseY, PHOTO_SIZE, leftSectionHeight, photoUrl, photoMetadata);
  
  // Update y to the end of the section
  y = leftY;
  
  doc.y = oldDocYApplicant;

  y += 12;

  /* ---------------- CO-APPLICANT ---------------- */
  // Always display co-applicant section, show "N/A" if data not present
  drawRow([
    { w: PAGE_WIDTH / 2, label: "Co-Applicant's Name", value: loan.coApplicant?.fullName || 'N/A' },
    { w: PAGE_WIDTH / 2, label: "Father's/Husband's Name", value: loan.coApplicant?.fatherOrHusbandName || 'N/A' },
  ]);

  drawFullRow(
    'Address',
    loan.coApplicant?.address
      ? `Vill/Ward ${loan.coApplicant.address.village}, PO ${loan.coApplicant.address.postOffice}, PS ${loan.coApplicant.address.policeStation}, Dist ${loan.coApplicant.address.district}, PIN-${loan.coApplicant.address.pinCode}`
      : 'N/A'
  );

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Mobile Number', value: loan.coApplicant?.mobileNumber || 'N/A' },
    { w: PAGE_WIDTH / 2, label: 'Email', value: loan.coApplicant?.email || 'N/A' },
  ]);

  y += 12;

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

  y += 12;

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

  y += 12;

  /* ---------------- MOVE TO PAGE 2 ---------------- */
  // Check if we need a new page before LOAN DETAILS section
  const estimatedLoanDetailsHeight = 200; // Estimated height for loan details + footer
  
  // Add page number at bottom of page 1 before moving to page 2
  doc.fontSize(8).font('Helvetica')
    .text('Page 1 of 2', START_X, PAGE_HEIGHT - 60, {
      width: PAGE_WIDTH,
      align: 'center'
    });
  
  if (y + estimatedLoanDetailsHeight > PAGE_HEIGHT - BOTTOM_MARGIN) {
    currentPage++;
    doc.addPage();
    y = TOP_MARGIN;
  }

  /* ---------------- LOAN DETAILS ---------------- */
  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Membership ID', value: loan.membership?.userId },
    { w: PAGE_WIDTH / 2, label: 'Loan ID', value: loan.loanAccountNumber },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Installment Amount', value: formatCurrency(loan.installmentAmount) },
    { w: PAGE_WIDTH / 2, label: 'Membership Fees Deposited', value: formatCurrency(100) },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Loan Repayment Period', value: `${loan.loanTenure} days` },
    { w: PAGE_WIDTH / 2, label: 'Loan Taken Amount', value: formatCurrency(loan.loanAmount) },
  ]);
  const amountInWords = numberToWords(Math.floor(loan.loanAmount || 0)) + ' Rupees Only';
  drawFullRow('In Words: ', amountInWords);

  /* ---------------- EXTRA GAP BEFORE FOOTER ---------------- */
  y += 15;

  /* ---------------- DECLARATION ---------------- */
  const declarationText = 'I/We shall be bound to repay the loan regularly as per the decision of the cooperative.';
  const declarationHeight = doc.heightOfString(declarationText, { width: PAGE_WIDTH }) + 20;
  
  // Check if we need to move to next page for footer content
  const footerContentHeight = declarationHeight + 15 + 15 + 35 + 150; // declaration + signatures + office section
  
  if (y + footerContentHeight > PAGE_HEIGHT - BOTTOM_MARGIN - 30 && currentPage === 1) {
    // Should already be on page 2, but double check
    if (currentPage === 1) {
      currentPage++;
      doc.addPage();
      y = TOP_MARGIN;
    }
  }
  
  const oldDocY = doc.y;
  doc.fontSize(9.5).font('Helvetica')
    .text(declarationText, START_X, y, { width: PAGE_WIDTH });
  doc.y = oldDocY; // Prevent cursor advancement
  y += declarationHeight;

  /* ---------------- FOOTER LINE ---------------- */
  const footerStartY = y + 20;
  doc.text("Guarantor's Signature", START_X, footerStartY);
  doc.text("Applicant's Signature", START_X + PAGE_WIDTH - 130, footerStartY);

  y = footerStartY + 15;

  /* ---------------- SIGNATURES ---------------- */
  // doc
  //   .moveTo(START_X, y)
  //   .lineTo(START_X + PAGE_WIDTH, y)
  //   .stroke(BORDER);

  y += 35;

  /* ---------------- OFFICE USE ONLY ---------------- */
  y += 25; // Extra space before office section
  
  const officeSectionStartY = y;
  
  // Draw border around entire office section
  const officeSectionHeight = 180; // Total height for office section
  doc.rect(START_X, officeSectionStartY, PAGE_WIDTH, officeSectionHeight).stroke(BORDER);
  
  // Center "OFFICE USE ONLY" title with underline
  y = officeSectionStartY + 12;
  doc.font('Helvetica-Bold').fontSize(FONT + 1);
  const officeTitle = 'OFFICE USE ONLY';
  const titleWidth = doc.widthOfString(officeTitle);
  doc.text(officeTitle, START_X + (PAGE_WIDTH - titleWidth) / 2, y);
  
  // Underline for title
  y += 12;
  doc.moveTo(START_X + (PAGE_WIDTH - titleWidth) / 2 - 5, y)
     .lineTo(START_X + (PAGE_WIDTH - titleWidth) / 2 + titleWidth + 5, y)
     .lineWidth(1)
     .stroke(BORDER);
  
  y += 20; // Space after title

  // Office information in a structured 2-column layout
  doc.font('Helvetica').fontSize(FONT);
  const infoLeftX = START_X + 20;
  const infoRightX = START_X + PAGE_WIDTH / 2 + 20;
  const infoLineHeight = 18;
  const infoStartY = y;
  
  // Left column - labels and values with no gap
  let infoY = infoStartY;
  
  // Date
  doc.font('Helvetica-Bold').text('Date: ', infoLeftX, infoY);
  const dateLabelWidth = doc.widthOfString('Date: ');
  doc.font('Helvetica').text(formatDate(loan.approvedAt), infoLeftX + dateLabelWidth, infoY);
  infoY += infoLineHeight;
  
  // Loan Account Number
  doc.font('Helvetica-Bold').text('Loan Account Number: ', infoLeftX, infoY);
  const accountLabelWidth = doc.widthOfString('Loan Account Number: ');
  doc.font('Helvetica').text(loan.loanAccountNumber, infoLeftX + accountLabelWidth, infoY);
  infoY += infoLineHeight;
  
  // Loan Amount
  doc.font('Helvetica-Bold').text('Loan Amount: ', infoLeftX, infoY);
  const amountLabelWidth = doc.widthOfString('Loan Amount: ');
  doc.font('Helvetica').text(formatCurrency(loan.loanAmount), infoLeftX + amountLabelWidth, infoY);
  
  // Right column - labels and values with no gap
  infoY = infoStartY;
  
  // Loan Repayment Period
  doc.font('Helvetica-Bold').text('Loan Repayment Period: ', infoRightX, infoY);
  const periodLabelWidth = doc.widthOfString('Loan Repayment Period: ');
  doc.font('Helvetica').text(`${loan.loanTenure} days`, infoRightX + periodLabelWidth, infoY);
  infoY += infoLineHeight;
  
  // Accepted by Loan Committee
  doc.font('Helvetica-Bold').text('Accepted by Loan Committee: ', infoRightX, infoY);
  const committeeLabelWidth = doc.widthOfString('Accepted by Loan Committee: ');
  doc.font('Helvetica').text('Yes', infoRightX + committeeLabelWidth, infoY);
  
  y = infoStartY + (infoLineHeight * 3) + 30; // Move past info section
  
  // Signature section - properly aligned
  const signatureSectionY = y + 20;
  const signatureLineLength = 180;
  const signatureLineY = signatureSectionY + 18;
  
  // Left signature area
  doc.font('Helvetica').fontSize(FONT);
  doc.text("Applicant's Signature", infoLeftX, signatureSectionY);
  // doc.moveTo(infoLeftX, signatureLineY)
  //    .lineTo(infoLeftX + signatureLineLength, signatureLineY)
  //    .lineWidth(0.8)
  //    .stroke(BORDER);
  
  // Right signature area
  doc.text("Chairman's Signature", infoRightX, signatureSectionY);
  // doc.moveTo(infoRightX, signatureLineY)
  //    .lineTo(infoRightX + signatureLineLength, signatureLineY)
  //    .lineWidth(0.8)
  //    .stroke(BORDER);

  
  y = officeSectionStartY + officeSectionHeight;
  
  // Note: Page numbers will be added after document is finalized
  // Store currentPage for later use
  doc._currentPage = currentPage;
  // add hardcoded page number at bottom of page 2
  doc.fontSize(8).font('Helvetica')
    .text('Page 2 of 2', START_X, PAGE_HEIGHT - 60, {
      width: PAGE_WIDTH,
      align: 'center'
    });
};
