import PDFDocument from 'pdfkit';

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

export const generateLoanContractPDF = (doc, loan, logoPath) => {
  const PAGE_WIDTH = 515;
  const START_X = 40;
  const BORDER = '#333';
  const FONT = 9;
  const PAD_X = 6;
  const PAD_Y = 6;

  let y = 30;

  /* ---------------- LOGOS ---------------- */
  if (logoPath) {
    try {
      doc.image(logoPath, START_X, y, { width: 45 });
      doc.image(logoPath, START_X + PAGE_WIDTH - 45, y, { width: 45 });
    } catch {}
  }

  /* ---------------- HEADER ---------------- */
  doc.font('Helvetica-Bold').fontSize(13).text(
    'ZARIYA THE THRIFT AND CREDIT CO-OPERATIVE SOCIETY LIMITED',
    START_X,
    y,
    { width: PAGE_WIDTH, align: 'center' }
  );

  y += 18;

  doc.font('Helvetica').fontSize(9).text(
    'Registered Under The Assam Co-operative Societies Act, 2007',
    START_X,
    y,
    { width: PAGE_WIDTH, align: 'center' }
  );

  y += 12;

  doc.text(
    'DEWRIKUCHI (SONKUCHI COLONY BAZAR), DIST. BARPETA, ASSAM, PIN-781314',
    START_X,
    y,
    { width: PAGE_WIDTH, align: 'center' }
  );

  y += 22;

  /* ---------------- HEADING WITH LINES ---------------- */
  const heading = 'LOAN APPLICATION FORM';
  doc.font('Helvetica-Bold').fontSize(14);
  const headingWidth = doc.widthOfString(heading);
  const centerX = START_X + PAGE_WIDTH / 2;

  doc.text(heading, centerX - headingWidth / 2, y);

  const lineY = y + 7;
  doc
    .moveTo(START_X, lineY)
    .lineTo(centerX - headingWidth / 2 - 10, lineY)
    .stroke(BORDER);

  doc
    .moveTo(centerX + headingWidth / 2 + 10, lineY)
    .lineTo(START_X + PAGE_WIDTH, lineY)
    .stroke(BORDER);

  y += 28;

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
      doc.rect(x, y, c.w, h).stroke(BORDER);

      doc.fontSize(FONT).font('Helvetica-Bold')
        .text(c.label, x + PAD_X, y + PAD_Y, {
          width: c.w - PAD_X * 2
        });

      doc.font('Helvetica')
        .text(c.value || '', {
          width: c.w - PAD_X * 2,
        });

      x += c.w;
    });

    y += h;
  };

  const drawFullRow = (label, value) => {
    const h = cellHeight(label, value, PAGE_WIDTH - PAD_X * 2);
    doc.rect(START_X, y, PAGE_WIDTH, h).stroke(BORDER);

    doc.fontSize(FONT).font('Helvetica-Bold')
      .text(label, START_X + PAD_X, y + PAD_Y, {
        width: PAGE_WIDTH - PAD_X * 2
      });

    doc.font('Helvetica')
      .text(value || '', {
        width: PAGE_WIDTH - PAD_X * 2,
      });

    y += h;
  };

  /* ---------------- APPLICANT ---------------- */
  drawRow([
    { w: PAGE_WIDTH / 2, label: "Applicant's Name", value: loan.membership?.fullName },
    { w: PAGE_WIDTH / 2, label: "Father's/Husband's Name", value: loan.membership?.fatherOrHusbandName },
  ]);

  drawFullRow(
    'Address',
    loan.membership?.address
      ? `Vill/Ward ${loan.membership.address.village}, PO ${loan.membership.address.postOffice}, PS ${loan.membership.address.policeStation}, Dist ${loan.membership.address.district}, PIN-${loan.membership.address.pinCode}`
      : ''
  );

  drawRow([
    { w: PAGE_WIDTH / 4, label: 'Date of Birth', value: formatDate(loan.membership?.dateOfBirth) },
    { w: PAGE_WIDTH / 4, label: 'Occupation', value: loan.membership?.occupation },
    { w: PAGE_WIDTH / 4, label: 'Mobile Number', value: loan.mobileNumber },
    { w: PAGE_WIDTH / 4, label: 'Account Number', value: loan.membership?.bankAccountNumber },
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
    { w: PAGE_WIDTH, label: 'Mobile No', value: loan.nominee?.mobileNumber },
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
    { w: PAGE_WIDTH / 2, label: 'Account No', value: loan.guarantor?.bankAccountNumber },
    { w: PAGE_WIDTH / 2, label: 'Mobile Number', value: loan.guarantor?.mobileNumber },
  ]);

  y += 12;

  /* ---------------- LOAN DETAILS ---------------- */
  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Membership No', value: loan.membership?.userId },
    { w: PAGE_WIDTH / 2, label: 'Loan Account Number', value: loan.loanAccountNumber },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Installment Amount', value: formatCurrency(loan.installmentAmount) },
    { w: PAGE_WIDTH / 2, label: 'Membership Fees Deposited', value: formatCurrency(loan.membershipFees) },
  ]);

  drawRow([
    { w: PAGE_WIDTH / 2, label: 'Loan Repayment Period', value: `${loan.loanTenure} days` },
    { w: PAGE_WIDTH / 2, label: 'Loan Taken Amount', value: formatCurrency(loan.loanAmount) },
  ]);
  const amountInWords = numberToWords(Math.floor(loan.loanAmount || 0)) + ' Rupees Only';
  drawFullRow('In Words: ', amountInWords);

  /* ---------------- EXTRA GAP BEFORE FOOTER ---------------- */
  y += 30;

  /* ---------------- DECLARATION ---------------- */
  doc.fontSize(9.5).font('Helvetica')
    .text(
      'I/We shall be bound to repay the loan regularly as per the decision of the cooperative.',
      START_X,
      y,
      { width: PAGE_WIDTH }
    );

  y += 30;

  /* ---------------- FOOTER LINE ---------------- */
  doc
    .moveTo(START_X, y)
    .lineTo(START_X + PAGE_WIDTH, y)
    .stroke(BORDER);

  y += 15;

  /* ---------------- SIGNATURES ---------------- */
  doc.text("Guarantor's Signature", START_X, y);
  doc.text("Applicant's Signature", START_X + PAGE_WIDTH - 130, y);

  y += 35;

  /* ---------------- OFFICE USE ONLY ---------------- */
  doc.font('Helvetica-Bold').text('OFFICE USE ONLY', START_X, y);

  y += 14;
  doc.font('Helvetica').text('Serial No: 45', START_X, y);
  doc.text('Date: 25/01/2026', START_X + PAGE_WIDTH - 160, y);

  y += 14;
  doc.text(`Loan Account Number: ${loan.loanAccountNumber}`, START_X, y);
  doc.text(`Loan Amount: Rs ${loan.loanAmount}`, START_X + PAGE_WIDTH - 200, y);

  y += 14;
  doc.text('Loan Repayment Date: 25/05/2026', START_X, y);

  y += 14;
  doc.text('Accepted by the Loan Committee: Yes', START_X, y);

  y += 40;
  doc.text("Applicant's Signature", START_X, y);
  doc.text("Chairman's Signature", START_X + PAGE_WIDTH - 150, y);
};
