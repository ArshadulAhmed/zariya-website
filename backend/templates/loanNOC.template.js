import PDFDocument from 'pdfkit';

/**
 * Generate loan NOC (No Objection Certificate) PDF template
 * @param {PDFDocument} doc - PDFDocument instance
 * @param {Object} loan - Loan data with populated fields
 * @param {Number} totalPaid - Total amount paid
 * @param {string} logoPath - Path to the logo image file
 */
export const generateLoanNOCPDF = (doc, loan, totalPaid, logoPath) => {
  // Helper function to format currency
  const formatCurrency = (amount) => {
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
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  let currentY = 50;

  // Header with logo and title
  try {
    if (logoPath) {
      doc.image(logoPath, 50, currentY, { width: 60, height: 60 });
    }
  } catch (error) {
    console.log('Logo not found, continuing without logo');
  }

  // Title
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .text('NO OBJECTION CERTIFICATE', 50, currentY + 10, { align: 'center' });
  
  currentY += 80;

  // Certificate Number and Date
  doc.fontSize(10)
     .font('Helvetica')
     .text(`Certificate No: ${loan.loanAccountNumber || 'N/A'}`, 50, currentY, { align: 'left' });
  
  doc.text(`Date: ${formatDate(new Date())}`, 450, currentY, { align: 'right' });
  
  currentY += 30;

  // Main content
  doc.fontSize(12)
     .font('Helvetica')
     .text('This is to certify that:', 50, currentY, { align: 'left' });
  
  currentY += 25;

  // Member details
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .text('Member Details:', 50, currentY);
  
  currentY += 20;

  doc.font('Helvetica')
     .fontSize(10)
     .text(`Name: ${loan.membership?.fullName || 'N/A'}`, 70, currentY);
  currentY += 15;
  
  doc.text(`Membership ID: ${loan.membership?.userId || 'N/A'}`, 70, currentY);
  currentY += 15;
  
  doc.text(`Mobile Number: ${loan.mobileNumber || 'N/A'}`, 70, currentY);
  currentY += 15;
  
  if (loan.email) {
    doc.text(`Email: ${loan.email}`, 70, currentY);
    currentY += 15;
  }

  currentY += 10;

  // Loan details
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .text('Loan Details:', 50, currentY);
  
  currentY += 20;

  doc.font('Helvetica')
     .fontSize(10)
     .text(`Loan Account Number: ${loan.loanAccountNumber || 'N/A'}`, 70, currentY);
  currentY += 15;
  
  doc.text(`Loan Amount: ${formatCurrency(loan.loanAmount)}`, 70, currentY);
  currentY += 15;
  
  doc.text(`Total Amount Paid: ${formatCurrency(totalPaid)}`, 70, currentY);
  currentY += 15;
  
  if (loan.startDate) {
    doc.text(`Loan Start Date: ${formatDate(loan.startDate)}`, 70, currentY);
    currentY += 15;
  }
  
  if (loan.endDate) {
    doc.text(`Loan End Date: ${formatDate(loan.endDate)}`, 70, currentY);
    currentY += 15;
  }

  currentY += 20;

  // Certificate statement
  doc.fontSize(11)
     .font('Helvetica')
     .text('This certificate is issued to confirm that the above-mentioned loan account has been', 50, currentY, { align: 'left', width: 500 });
  currentY += 15;
  
  doc.text('fully closed and all dues have been cleared. There are no outstanding amounts or', 50, currentY, { align: 'left', width: 500 });
  currentY += 15;
  
  doc.text('objections against this loan account.', 50, currentY, { align: 'left', width: 500 });
  
  currentY += 30;

  // Signature section
  const signatureY = doc.page.height - 150;
  
  doc.fontSize(10)
     .font('Helvetica')
     .text('Authorized Signatory', 50, signatureY, { align: 'left' });
  
  doc.text('Zariya Credit Cooperative Society', 50, signatureY + 40, { align: 'left' });
  
  // Seal/Stamp area on right
  doc.rect(400, signatureY - 10, 150, 80)
     .stroke()
     .fontSize(9)
     .text('Official Seal', 400, signatureY + 30, { align: 'center', width: 150 });
};

