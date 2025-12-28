import PDFDocument from 'pdfkit';

/**
 * Generate loan contract PDF template
 * @param {PDFDocument} doc - PDFDocument instance
 * @param {Object} loan - Loan data with populated fields
 * @param {string} logoPath - Path to the logo image file
 */
export const generateLoanContractPDF = (doc, loan, logoPath) => {
  // Helper function to format currency
  const formatCurrency = (amount) => {
    // Use direct rupee symbol - PDFKit should handle it with Helvetica font
    return `Rs ${Number(amount).toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Helper function to convert number to words (simplified)
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

  // Set smaller margins for single page
  const startX = 40;
  const startY = 25;
  let currentY = startY;
  const lineHeight = 9;
  const sectionSpacing = 15; // Increased gap between boxes for better visual separation
  const fieldSpacing = 5; // Spacing between fields/rows within boxes
  const boxPadding = 10; // Reduced padding inside boxes

  // Header Section - Organization Name
  doc.fontSize(13)
     .font('Helvetica-Bold')
     .text('ZARIYA THE THRIFT AND CREDIT CO-OPERATIVE SOCIETY LIMITED', startX, currentY, { align: 'center', width: 500 });
  
  currentY += lineHeight + 6; // Significantly increased spacing after main title
  doc.fontSize(9)
     .font('Helvetica')
     .text('Registered Under The Assam Co-operative Societies Act, 2007 (Act. IV of 2012)', startX, currentY, { align: 'center', width: 500 });
  
  currentY += lineHeight + 5; // Significantly increased spacing between registration lines
  doc.fontSize(9)
     .text('DEWRIKUCHI (SONKUCHI COLONY BAZAR), DIST. BARPETA (ASSAM), PIN-781314', startX, currentY, { align: 'center', width: 500 });
  
  currentY += lineHeight + 5; // Significantly increased spacing before Reg.No
  doc.fontSize(9)
     .text('Reg.No: B-03/2025-26', startX, currentY, { align: 'center', width: 500 });
  
  currentY += lineHeight + 7; // Significantly increased spacing before form title
  
  // Add logos on left and right edges of the page
  const logoSize = 70; // Logo size in points (2.5x of original 40)
  const titleText = 'LOAN APPLICATION FORM';
  const pageWidth = 500; // Content width
  const pageRightEdge = startX + pageWidth;
  
  // Position logos at left and right edges, shifted upward to avoid overlap
  const logoY = currentY - 40; // Shift logos 40 points upward
  const formTitleY = currentY;
  
  if (logoPath) {
    try {
      // Left logo - aligned to left edge
      const leftLogoX = startX;
      // Draw white background rectangle behind logo
      doc.rect(leftLogoX, logoY, logoSize, logoSize)
         .fillColor('#FFFFFF')
         .fill();
      doc.image(logoPath, leftLogoX, logoY, { 
        width: logoSize, 
        height: logoSize,
        fit: [logoSize, logoSize]
      });
      
      // Right logo - aligned to right edge, shifted further right
      const rightLogoX = pageRightEdge - logoSize + 15; // Shift 15px more to the right
      // Draw white background rectangle behind logo
      doc.rect(rightLogoX, logoY, logoSize, logoSize)
         .fillColor('#FFFFFF')
         .fill();
      doc.image(logoPath, rightLogoX, logoY, { 
        width: logoSize, 
        height: logoSize,
        fit: [logoSize, logoSize]
      });
      
      // Reset fill color to black for text
      doc.fillColor('#000000');
    } catch (error) {
      console.warn('Error loading logo, continuing without it:', error.message);
      // Continue without logo if there's an error
    }
  }
  
  // Form Title - centered between the logos
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text(titleText, startX, formTitleY, { align: 'center', width: pageWidth });
  
  currentY += lineHeight + 8; // Increased spacing after form title
  
  
  currentY += lineHeight + 4; // Additional spacing after separation line

  // Helper function to truncate text to fit within width
  const truncateText = (text, maxWidth, fontSize = 9.5) => {
    if (!text) return ''; // Return empty string instead of underline
    const charWidth = fontSize * 0.6; // Approximate character width
    const maxChars = Math.floor(maxWidth / charWidth);
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars - 3) + '...';
  };

  // Helper function to draw a field with label and value
  const drawField = (label, value, x, y, labelWidth = 100, valueWidth = 180) => {
    const labelText = label + ':';
    doc.fontSize(9.5)
       .font('Helvetica');
    
    // Calculate actual width of label text
    const actualLabelWidth = doc.widthOfString(labelText);
    
    // Draw label
    doc.text(labelText, x, y, { width: labelWidth });
    
    // Position value immediately after actual label width with minimal gap (1 pixel)
    const valueX = x + actualLabelWidth + 1;
    const truncatedValue = truncateText(value, valueWidth, 9.5);
    doc.fontSize(9.5)
       .font('Helvetica')
       .text(truncatedValue, valueX, y, { width: valueWidth });
  };

  // Helper function to draw a box around a section
  const drawBox = (x, y, width, height) => {
    doc.strokeColor('#CCCCCC') // Light gray color for reduced opacity
       .lineWidth(0.5) // Thinner line
       .roundedRect(x, y, width, height, 4) // 4px border radius
       .stroke()
       .strokeColor('#000000'); // Reset to black for other elements
  };

  // Section 1: Applicant Information (with border box)
  const applicantBoxY = currentY + 15; // Shift 15px down
  const applicantBoxX = startX;
  const applicantBoxWidth = 500;
  let applicantContentY = applicantBoxY + boxPadding;
  
  // Applicant's Name and Father's/Husband's Name in single row
  drawField('Applicant\'s Name', loan.membership?.fullName || '', applicantBoxX + boxPadding, applicantContentY, 85, 170);
  drawField('Father\'s/Husband\'s Name', loan.membership?.fatherOrHusbandName || '', applicantBoxX + boxPadding + 270, applicantContentY, 115, 200);
  
  applicantContentY += lineHeight + fieldSpacing + 3; // Match office section spacing
  // Address in single row - ensure it doesn't overflow
  const applicantAddr = loan.membership?.address;
  const addressLine = [
    applicantAddr?.village || '',
    applicantAddr?.postOffice || '',
    applicantAddr?.policeStation || '',
    applicantAddr?.district || 'Assam',
    applicantAddr?.pinCode ? `PIN-${applicantAddr.pinCode}` : ''
  ].filter(Boolean).join(', ');
  drawField('Address', addressLine, applicantBoxX + boxPadding, applicantContentY, 60, 420);
  
  applicantContentY += lineHeight + fieldSpacing + 3; // Match office section spacing
  const dob = loan.membership?.dateOfBirth ? formatDate(loan.membership.dateOfBirth) : '';
  drawField('Date of Birth', dob, applicantBoxX + boxPadding, applicantContentY, 85, 120);
  drawField('Occupation', loan.membership?.occupation || '', applicantBoxX + boxPadding + 150, applicantContentY, 80, 180);
  drawField('Mobile Number', loan.mobileNumber || '', applicantBoxX + boxPadding + 350, applicantContentY, 85, 120);
  
  const applicantBoxHeight = applicantContentY - applicantBoxY + boxPadding + fieldSpacing;
  drawBox(applicantBoxX, applicantBoxY, applicantBoxWidth, applicantBoxHeight);
  currentY = applicantBoxY + applicantBoxHeight + sectionSpacing; // Increased margin bottom

  // Section 2: Nominee Information (with border box)
  const nomineeBoxY = currentY;
  const nomineeBoxX = startX;
  const nomineeBoxWidth = 500;
  let nomineeContentY = currentY + boxPadding;
  
  drawField('Nominee\'s Name', loan.nominee?.name || '', nomineeBoxX + boxPadding, nomineeContentY, 85, 180);
  drawField('Relationship', loan.nominee?.relationship || '', nomineeBoxX + boxPadding + 275, nomineeContentY, 85, 200);
  
  nomineeContentY += lineHeight + fieldSpacing + 3; // Match office section spacing
  // Nominee Address in single row - ensure it doesn't overflow
  const nomineeAddr = loan.nominee?.address;
  const nomineeAddressLine = [
    nomineeAddr?.village || '',
    nomineeAddr?.postOffice || '',
    nomineeAddr?.policeStation || '',
    nomineeAddr?.district || 'Assam',
    nomineeAddr?.pinCode ? `PIN-${nomineeAddr.pinCode}` : ''
  ].filter(Boolean).join(', ');
  drawField('Address', nomineeAddressLine, nomineeBoxX + boxPadding, nomineeContentY, 60, 420);
  
  const nomineeBoxHeight = nomineeContentY - nomineeBoxY + boxPadding + fieldSpacing;
  drawBox(nomineeBoxX, nomineeBoxY, nomineeBoxWidth, nomineeBoxHeight);
  currentY = nomineeBoxY + nomineeBoxHeight + sectionSpacing; // Increased margin bottom

  // Section 3: Guarantor Information (with border box)
  const guarantorBoxY = currentY;
  const guarantorBoxX = startX;
  const guarantorBoxWidth = 500;
  let guarantorContentY = currentY + boxPadding;
  
  drawField('Guarantor\'s Name', loan.guarantor?.name || '', guarantorBoxX + boxPadding, guarantorContentY, 95, 170);
  drawField('Account No. (if any)', loan.guarantor?.bankAccountNumber || '', guarantorBoxX + boxPadding + 275, guarantorContentY, 115, 200);
  
  guarantorContentY += lineHeight + fieldSpacing + 3; // Match office section spacing
  drawField('Father\'s/Husband\'s Name', loan.guarantor?.fatherOrHusbandName || '', guarantorBoxX + boxPadding, guarantorContentY, 115, 365);
  
  guarantorContentY += lineHeight + fieldSpacing + 3; // Match office section spacing
  // Guarantor Address in single row - ensure it doesn't overflow
  const guarantorAddr = loan.guarantor?.address;
  const guarantorAddressLine = [
    guarantorAddr?.village || '',
    guarantorAddr?.postOffice || '',
    guarantorAddr?.policeStation || '',
    guarantorAddr?.district || 'Assam',
    guarantorAddr?.pinCode ? `PIN-${guarantorAddr.pinCode}` : ''
  ].filter(Boolean).join(', ');
  drawField('Address', guarantorAddressLine, guarantorBoxX + boxPadding, guarantorContentY, 60, 420);
  
  const guarantorBoxHeight = guarantorContentY - guarantorBoxY + boxPadding + fieldSpacing;
  drawBox(guarantorBoxX, guarantorBoxY, guarantorBoxWidth, guarantorBoxHeight);
  currentY = guarantorBoxY + guarantorBoxHeight + sectionSpacing; // Increased margin bottom

  // Section 4: Loan Details (with border box, no heading)
  const loanBoxY = currentY;
  const loanBoxX = startX;
  const loanBoxWidth = 500;
  let loanContentY = currentY + boxPadding;
  
  drawField('Account Number', loan.loanAccountNumber || '', loanBoxX + boxPadding, loanContentY, 90, 400);
  
  loanContentY += lineHeight + fieldSpacing + 3; // Match office section spacing
  drawField('Installment Amount', formatCurrency(loan.installmentAmount || 0), loanBoxX + boxPadding, loanContentY, 100, 380);
  
  loanContentY += lineHeight + fieldSpacing + 3; // Match office section spacing
  drawField('Amount Deposited', formatCurrency(100), loanBoxX + boxPadding, loanContentY, 100, 380); // This might need to be calculated from repayments
  
  loanContentY += lineHeight + fieldSpacing + 3; // Match office section spacing
  drawField('Loan Repayment Period', `${loan.loanTenure || 0} days`, loanBoxX + boxPadding, loanContentY, 115, 365);
  
  loanContentY += lineHeight + fieldSpacing + 3; // Match office section spacing
  drawField('Loan Amount Taken', formatCurrency(loan.loanAmount || 0), loanBoxX + boxPadding, loanContentY, 110, 370);
  
  loanContentY += lineHeight + fieldSpacing + 3; // Match office section spacing
  const amountInWords = numberToWords(Math.floor(loan.loanAmount || 0)) + ' Rupees Only';
  drawField('In Words', amountInWords, loanBoxX + boxPadding, loanContentY, 60, 420);
  
  const loanBoxHeight = loanContentY - loanBoxY + boxPadding + fieldSpacing;
  drawBox(loanBoxX, loanBoxY, loanBoxWidth, loanBoxHeight);
  currentY = loanBoxY + loanBoxHeight + sectionSpacing; // Increased margin bottom

  // Declaration
  doc.fontSize(9.5)
     .font('Helvetica')
     .text('I/We shall be bound to repay the loan regularly as per the decision of the cooperative.', startX, currentY, { width: 500 });
  
  currentY += lineHeight + sectionSpacing + 28; // Increased margin bottom for declaration (8 + 20)

  // Signatures Section (side by side)
  const signatureY = currentY;
  doc.fontSize(9)
     .font('Helvetica')
     .text('Guarantor\'s Signature', startX, signatureY);
  
  doc.fontSize(9)
     .font('Helvetica')
     .text('Applicant\'s Signature', startX + 416, signatureY);
  
  currentY = signatureY + lineHeight + sectionSpacing;

  // Office Use Only Section (at bottom)
  const officeBoxY = currentY;
  const officeBoxX = startX;
  const officeBoxWidth = 500;
  let officeContentY = currentY + boxPadding;
  
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('OFFICE USE ONLY', officeBoxX + boxPadding, officeContentY);

  officeContentY += lineHeight + fieldSpacing + 3; // Increased spacing after heading
  
  // Calculate right edge of box for rightmost positioning
  const rightEdge = officeBoxX + 500 - boxPadding;
  const valueWidth = 120; // Fixed width for both values to ensure alignment
  
  // Row 1: Serial No. and Date
  drawField('Serial No.', '', officeBoxX + boxPadding, officeContentY, 75, 100);
  
  // Draw Date label and value at rightmost side - aligned like Chairman's Signature
  const dateValue = formatDate(loan.approvedAt || loan.createdAt);
  doc.fontSize(9.5)
     .font('Helvetica');
  const dateLabelText = 'Date:';
  const dateLabelWidth = doc.widthOfString(dateLabelText);
  const dateValueText = truncateText(dateValue, valueWidth, 9.5);
  const dateValueWidth = doc.widthOfString(dateValueText);
  const dateTotalWidth = dateLabelWidth + 1 + dateValueWidth; // Label + 1px gap + value
  const dateStartX = rightEdge - dateTotalWidth; // Shift 10px to the left
  doc.text(dateLabelText, dateStartX, officeContentY);
  doc.text(dateValueText, dateStartX + dateLabelWidth + 1, officeContentY, { width: valueWidth });

  officeContentY += lineHeight + fieldSpacing + 3; // Increased spacing between rows
  
  // Row 2: Account Number and Loan Amount
  drawField('Account Number', loan.loanAccountNumber || '', officeBoxX + boxPadding, officeContentY, 85, 180);
  
  // Draw Loan Amount label and value at rightmost side - aligned like Chairman's Signature
  const loanAmountValue = formatCurrency(loan.loanAmount || 0);
  doc.fontSize(9.5)
     .font('Helvetica');
  const loanAmountLabelText = 'Loan Amount:';
  const loanAmountLabelWidth = doc.widthOfString(loanAmountLabelText);
  const loanAmountValueText = truncateText(loanAmountValue, valueWidth, 9.5);
  const loanAmountValueWidth = doc.widthOfString(loanAmountValueText);
  const loanAmountTotalWidth = loanAmountLabelWidth + 1 + loanAmountValueWidth; // Label + 1px gap + value
  const loanAmountStartX = rightEdge - loanAmountTotalWidth; // Entire field ends at right edge
  doc.text(loanAmountLabelText, loanAmountStartX, officeContentY);
  doc.text(loanAmountValueText, loanAmountStartX + loanAmountLabelWidth + 1, officeContentY, { width: valueWidth });

  officeContentY += lineHeight + fieldSpacing + 3; // Increased spacing between rows
  const endDate = loan.endDate ? formatDate(loan.endDate) : '';
  drawField('Loan Repayment Date', endDate, officeBoxX + boxPadding, officeContentY, 110, 360);

  officeContentY += lineHeight + fieldSpacing + 3; // Increased spacing between rows
  
  // Calculate actual width of label text
  doc.fontSize(9)
     .font('Helvetica');
  const labelText = 'Accepted by the Loan Committee:';
  const labelWidth = doc.widthOfString(labelText);
  const labelX = officeBoxX + boxPadding;
  
  // Draw label
  doc.text(labelText, labelX, officeContentY);
  
  // Position "Yes" right after label with minimal gap
  const yesX = labelX + labelWidth + 5; // 5px gap
  doc.text('Yes', yesX, officeContentY);

  officeContentY += lineHeight + fieldSpacing + 40; // Increased spacing between checkbox row and signature row (10 + 30)
  
  // Signatures Section (side by side)
  const officeSignatureY = officeContentY;
  doc.fontSize(9)
     .font('Helvetica')
     .text('Applicant\'s Signature', officeBoxX + boxPadding, officeSignatureY);
  
  // Position Chairman's Signature at rightmost edge
  doc.fontSize(9)
     .font('Helvetica');
  const chairmanLabelText = 'Chairman\'s Signature';
  const chairmanLabelWidth = doc.widthOfString(chairmanLabelText);
  const chairmanLabelX = rightEdge - chairmanLabelWidth; // Rightmost position
  doc.text(chairmanLabelText, chairmanLabelX, officeSignatureY);
  
  // Add space for manual signatures
  officeContentY = officeSignatureY + lineHeight + 15; // Extra space for manual signatures
  
  const officeBoxHeight = officeContentY - officeBoxY + boxPadding + fieldSpacing;
  drawBox(officeBoxX, officeBoxY, officeBoxWidth, officeBoxHeight);
};

