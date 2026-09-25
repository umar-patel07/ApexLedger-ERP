import { jsPDF } from 'jspdf';
import { Invoice, CompanyProfile } from '../types';

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateInvoicePDF(invoice: Invoice, company: CompanyProfile): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Theme colors
  const primaryNavy = [15, 30, 60];
  const accentSlate = [70, 80, 95];
  const borderGray = [220, 225, 230];

  // Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('APEXLEDGER ERP', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('ENTERPRISE ACCOUNTING & BUSINESS MANAGEMENT SYSTEM', 14, 20);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMERCIAL INVOICE', 210 - 14, 18, { align: 'right' });

  // Company Details (Left)
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName, 14, 40);

  doc.setTextColor(accentSlate[0], accentSlate[1], accentSlate[2]);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text([
    company.address,
    `Tax ID / EIN: ${company.taxId}`,
    `Phone: ${company.phone} | Email: ${company.email}`
  ], 14, 46);

  // Invoice Details (Right)
  doc.setFillColor(245, 247, 250);
  doc.rect(125, 34, 71, 32, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(125, 34, 71, 32, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`Invoice No:`, 128, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, 160, 41);

  doc.setFont('helvetica', 'bold');
  doc.text(`Date Issued:`, 128, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceDate, 160, 48);

  doc.setFont('helvetica', 'bold');
  doc.text(`Due Date:`, 128, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.dueDate, 160, 55);

  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Status:`, 128, 62);
  doc.setFont('helvetica', 'bold');
  if (invoice.paymentStatus === 'PAID') {
    doc.setTextColor(22, 101, 52); // green
  } else if (invoice.paymentStatus === 'OVERDUE') {
    doc.setTextColor(153, 27, 27); // red
  } else {
    doc.setTextColor(180, 83, 9); // amber
  }
  doc.text(invoice.paymentStatus, 160, 62);

  // Bill To Section
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO:', 14, 74);

  doc.setFontSize(11);
  doc.text(invoice.customerName || 'Customer Client', 14, 80);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentSlate[0], accentSlate[1], accentSlate[2]);
  doc.text([
    'Registered Client Account',
    'Terms: Net 30 - Electronic Funds Transfer'
  ], 14, 85);

  // Table Headers
  const startY = 100;
  doc.setFillColor(235, 240, 245);
  doc.rect(14, startY, 182, 8, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(14, startY, 182, 8, 'D');

  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Item / Service Description', 18, startY + 5.5);
  doc.text('Qty', 125, startY + 5.5, { align: 'right' });
  doc.text('Unit Price', 155, startY + 5.5, { align: 'right' });
  doc.text('Amount', 190, startY + 5.5, { align: 'right' });

  // Items
  let currentY = startY + 8;
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    { productName: 'Standard Consulting / Professional Deliverables', quantity: 1, unitPrice: invoice.subtotal, totalPrice: invoice.subtotal }
  ];

  doc.setFont('helvetica', 'normal');
  items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 252, 254);
      doc.rect(14, currentY, 182, 9, 'F');
    }
    doc.rect(14, currentY, 182, 9, 'D');

    doc.setTextColor(30, 40, 55);
    doc.text(item.productName.length > 55 ? item.productName.slice(0, 52) + '...' : item.productName, 18, currentY + 6);
    doc.text(String(item.quantity), 125, currentY + 6, { align: 'right' });
    doc.text(`$${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 155, currentY + 6, { align: 'right' });
    doc.text(`$${item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 190, currentY + 6, { align: 'right' });

    currentY += 9;
  });

  // Summary Box (Subtotal, Tax, Total, Paid, Due)
  currentY += 8;
  const summaryX = 120;
  const summaryWidth = 76;

  doc.setFillColor(248, 250, 252);
  doc.rect(summaryX, currentY, summaryWidth, 42, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(summaryX, currentY, summaryWidth, 42, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(accentSlate[0], accentSlate[1], accentSlate[2]);
  doc.text('Subtotal:', summaryX + 4, currentY + 7);
  doc.text(`$${invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, currentY + 7, { align: 'right' });

  if (invoice.discount > 0) {
    doc.text('Discount Applied:', summaryX + 4, currentY + 13);
    doc.text(`-$${invoice.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, currentY + 13, { align: 'right' });
  }

  doc.text(`Sales Tax (${invoice.taxRate}%):`, summaryX + 4, currentY + 19);
  doc.text(`$${invoice.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, currentY + 19, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Total Invoiced:', summaryX + 4, currentY + 27);
  doc.text(`$${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, currentY + 27, { align: 'right' });

  doc.setFontSize(9);
  doc.text('Amount Paid:', summaryX + 4, currentY + 33);
  doc.text(`$${invoice.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, currentY + 33, { align: 'right' });

  doc.setFontSize(10.5);
  doc.setTextColor(180, 30, 30);
  doc.text('Balance Due:', summaryX + 4, currentY + 39);
  doc.text(`$${invoice.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, currentY + 39, { align: 'right' });

  // Notes & Banking Instructions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('TERMS & WIRE PAYMENT INSTRUCTIONS:', 14, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(accentSlate[0], accentSlate[1], accentSlate[2]);
  doc.text([
    `Bank: JPMorgan Chase NA - Corporate Treasury`,
    `Routing / ABA: 021000021 | SWIFT: CHASUS33`,
    `Account: 9482-1041-002 (Apex Global Technologies)`,
    `Notes: ${invoice.notes || 'Thank you for your valued business.'}`
  ], 14, currentY + 14);

  // Footer stamp
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(14, 275, 196, 275);

  doc.setFontSize(7.5);
  doc.text(`Generated by ApexLedger ERP System | Immutable Audit Trail Ref: INV-${invoice.id}-${invoice.invoiceNumber}`, 14, 280);
  doc.text(`Page 1 of 1`, 196, 280, { align: 'right' });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
