function safe(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function parseBookingMeta(rawValue) {
  if (!rawValue) return {};
  if (typeof rawValue === "object") return rawValue;

  try {
    return JSON.parse(rawValue);
  } catch {
    return {};
  }
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatPaymentMethod(value) {
  if (value === "credit_card") return "Credit Card";
  if (value === "bank_transfer") return "Bank Transfer";
  if (value === "cash") return "Cash";
  return safe(value, "Payment");
}

function computeInvoiceRows(reservation) {
  const meta = parseBookingMeta(reservation?.special_requests);
  const bookingMeta = meta?.booking_meta || {};
  const totalDays = Math.max(1, Number(reservation?.total_days || 1));
  const baseDaily = Number(reservation?.car?.price_per_day || 0);
  const baseTotal = baseDaily * totalDays;
  const premiumTotal = bookingMeta?.insurance_premium ? totalDays * 25 : 0;
  const additionalDriverTotal = bookingMeta?.additional_driver ? totalDays * 10 : 0;
  const subtotal = baseTotal + premiumTotal + additionalDriverTotal;
  const totalAmount = Number(reservation?.paymentTotal || reservation?.total_price || 0);
  const taxesAndFees = Math.max(0, Number(totalAmount - subtotal));

  const rows = [
    {
      description: `Location ${safe(
        reservation?.vehicleLabel ||
          `${reservation?.car?.brand || ""} ${reservation?.car?.model || ""}`.trim(),
        "Vehicle"
      )} (${totalDays} jours)`,
      quantity: 1,
      unitPrice: baseTotal,
      total: baseTotal,
    },
  ];

  if (premiumTotal > 0) {
    rows.push({
      description: "Assurance Premium",
      quantity: 1,
      unitPrice: premiumTotal,
      total: premiumTotal,
    });
  }

  if (additionalDriverTotal > 0) {
    rows.push({
      description: "Conducteur additionnel",
      quantity: 1,
      unitPrice: additionalDriverTotal,
      total: additionalDriverTotal,
    });
  }

  if (taxesAndFees > 0) {
    rows.push({
      description: "Frais de service et taxes",
      quantity: 1,
      unitPrice: taxesAndFees,
      total: taxesAndFees,
    });
  }

  return rows;
}

function buildInvoiceData(reservation, company) {
  const meta = parseBookingMeta(reservation?.special_requests);
  const contact = meta?.booking_contact || {};
  const schedule = meta?.schedule || {};
  const approvalInfo = meta?.approval_info || {};

  return {
    companyName: safe(company?.name || reservation?.car?.company?.name, "Company"),
    companyEmail: safe(company?.email || reservation?.car?.company?.email),
    companyPhone: safe(company?.phone || reservation?.car?.company?.phone),
    companyAddress: safe(company?.address || reservation?.car?.company?.address),
    reservationId: safe(reservation?.id),
    reservationDate: formatDate(reservation?.created_at || reservation?.reservationDate || reservation?.start_date),
    customerName: safe(reservation?.customerName || contact?.full_name || reservation?.user?.name, "Client"),
    customerEmail: safe(reservation?.customerEmail || contact?.email || reservation?.user?.email),
    customerPhone: safe(reservation?.customerPhone || contact?.phone || reservation?.user?.phone),
    vehicleLabel: safe(
      reservation?.vehicleLabel ||
        `${reservation?.car?.brand || ""} ${reservation?.car?.model || ""}`.trim(),
      "Vehicle"
    ),
    pickupDate: formatDate(reservation?.start_date),
    returnDate: formatDate(reservation?.end_date),
    pickupLabel: safe(reservation?.pickupLabel || reservation?.pickup_location || reservation?.car?.company?.city),
    returnLabel: safe(reservation?.returnLabel || reservation?.dropoff_location || reservation?.car?.company?.city),
    pickupTime: safe(schedule?.pickup_time, ""),
    returnTime: safe(schedule?.return_time, ""),
    paymentMethod: formatPaymentMethod(
      reservation?.paymentRecord?.payment_method || reservation?.payment_method
    ),
    paymentStatus: safe(reservation?.payment_status, "pending"),
    paymentDueAt: approvalInfo?.payment_due_at ? formatDate(approvalInfo.payment_due_at) : "-",
    totalAmount: Number(reservation?.paymentTotal || reservation?.total_price || 0),
    rows: computeInvoiceRows(reservation),
  };
}

function escapePdfText(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function normalizePdfText(text) {
  return escapePdfText(
    String(text || "")
      .normalize("NFD")
      .replace(/[^\x00-\x7F]/g, "")
  );
}

function buildPdfBlob(data) {
  const pageWidth = 595;
  const pageHeight = 842;
  const commands = [];
  const purple = [0.486, 0.227, 0.918];
  const textDark = [0.176, 0.176, 0.176];
  const textMuted = [0.388, 0.388, 0.388];
  const border = [0.82, 0.82, 0.82];
  const lightFill = [0.95, 0.95, 0.97];
  const tableHeaderFill = [0.93, 0.93, 0.96];

  function toY(top, height = 0) {
    return pageHeight - top - height;
  }

  function drawText(text, x, top, size = 12, font = "F1", color = textDark) {
    commands.push(
      `BT /${font} ${size} Tf ${color.join(" ")} rg 1 0 0 1 ${x} ${toY(top, size)} Tm (${normalizePdfText(text)}) Tj ET`
    );
  }

  function drawLine(x1, top1, x2, top2, color = border, width = 1) {
    commands.push(`${color.join(" ")} RG ${width} w ${x1} ${toY(top1)} m ${x2} ${toY(top2)} l S`);
  }

  function drawRect(x, top, width, height, fillColor = null, strokeColor = null, lineWidth = 1) {
    if (fillColor) {
      commands.push(`${fillColor.join(" ")} rg ${x} ${toY(top, height)} ${width} ${height} re f`);
    }
    if (strokeColor) {
      commands.push(`${strokeColor.join(" ")} RG ${lineWidth} w ${x} ${toY(top, height)} ${width} ${height} re S`);
    }
  }

  function drawInfoBlock(x, top, label, valueLines) {
    drawText(label, x, top, 11, "F2");
    valueLines.forEach((line, index) => {
      drawText(line, x, top + 18 + index * 13, 10.5, "F1", textMuted);
    });
  }

  drawText("SPEEDRENT", 38, 38, 22, "F2");
  drawText("Facture de Reservation", 302, 38, 20, "F2", purple);
  drawLine(38, 74, pageWidth - 38, 74, purple, 2);

  drawRect(38, 92, pageWidth - 76, 68, lightFill, border);
  drawText("Entreprise", 52, 108, 11, "F2");
  drawText(data.companyName, 52, 126, 10.5, "F1", textMuted);
  drawText(`Email: ${data.companyEmail}`, 52, 140, 10.5, "F1", textMuted);
  drawText(`Telephone: ${data.companyPhone}`, 302, 126, 10.5, "F1", textMuted);
  drawText(`Adresse: ${data.companyAddress}`, 302, 140, 10.5, "F1", textMuted);

  drawText("Details de la Reservation", 38, 190, 18, "F2", purple);
  drawLine(38, 214, pageWidth - 38, 214, border, 1);

  const leftX = 38;
  const rightX = 302;
  drawInfoBlock(leftX, 232, "ID de Reservation:", [`#${data.reservationId}`]);
  drawInfoBlock(rightX, 232, "Date de Reservation:", [data.reservationDate]);
  drawInfoBlock(leftX, 288, "Client:", [data.customerName, data.customerEmail, data.customerPhone]);
  drawInfoBlock(rightX, 288, "Vehicule:", [data.vehicleLabel]);
  drawInfoBlock(leftX, 356, "Periode de Location:", [`${data.pickupDate} - ${data.returnDate}`]);
  drawInfoBlock(rightX, 356, "Lieu de Prise en Charge:", [data.pickupLabel, data.pickupTime || "-"]);
  drawInfoBlock(leftX, 424, "Lieu de Retour:", [data.returnLabel, data.returnTime || "-"]);
  drawInfoBlock(rightX, 424, "Paiement:", [
    data.paymentMethod,
    `Status: ${data.paymentStatus}`,
    `Echeance: ${data.paymentDueAt}`,
  ]);

  drawText("Details des Frais", 38, 500, 18, "F2", purple);
  drawLine(38, 524, pageWidth - 38, 524, border, 1);

  const tableLeft = 38;
  const tableTop = 542;
  const tableWidth = pageWidth - 76;
  const colWidths = [250, 64, 95, 110];
  const rowHeight = 30;
  const tableHeaders = ["Description", "Quantite", "Prix Unitaire", "Total"];
  const tableRows = data.rows.map((row) => [
    safe(row.description),
    safe(row.quantity),
    formatCurrency(row.unitPrice),
    formatCurrency(row.total),
  ]);

  drawRect(tableLeft, tableTop, tableWidth, rowHeight, tableHeaderFill, border);

  let runningX = tableLeft;
  tableHeaders.forEach((header, index) => {
    drawText(header, runningX + 10, tableTop + 10, 10.5, "F2");
    runningX += colWidths[index];
    if (index < colWidths.length - 1) {
      drawLine(runningX, tableTop, runningX, tableTop + rowHeight * (tableRows.length + 1), border, 1);
    }
  });

  tableRows.forEach((row, rowIndex) => {
    const rowTop = tableTop + rowHeight * (rowIndex + 1);
    drawRect(tableLeft, rowTop, tableWidth, rowHeight, null, border);
    let cellX = tableLeft;
    row.forEach((cell, cellIndex) => {
      drawText(cell, cellX + 10, rowTop + 10, 10, "F1", textMuted);
      cellX += colWidths[cellIndex];
    });
  });

  const totalTop = tableTop + rowHeight * (tableRows.length + 1) + 28;
  drawText(`Total: ${formatCurrency(data.totalAmount)}`, 408, totalTop, 18, "F2", purple);

  const signatureTop = totalTop + 72;
  drawLine(52, signatureTop + 38, 232, signatureTop + 38, border, 1.3);
  drawLine(362, signatureTop + 38, 542, signatureTop + 38, border, 1.3);
  drawText("Signature de l'Entreprise", 52, signatureTop + 46, 10.5, "F2", textMuted);
  drawText("Signature du Client", 362, signatureTop + 46, 10.5, "F2", textMuted);

  const stream = commands.join("\n");
  const objects = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  objects.push("2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj");
  objects.push("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj");
  objects.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj");
  objects.push(`6 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function buildDocumentMarkup({ reservation, company }) {
  const data = buildInvoiceData(reservation, company);
  const rowsMarkup = data.rows
    .map(
      (row) => `
        <tr>
          <td>${safe(row.description)}</td>
          <td>${safe(row.quantity)}</td>
          <td>${formatCurrency(row.unitPrice)}</td>
          <td>${formatCurrency(row.total)}</td>
        </tr>`
    )
    .join("");

  const pdfLinesJson = JSON.stringify([
    "SPEEDRENT - FACTURE DE RESERVATION",
    "",
    `Reservation ID: #${data.reservationId}`,
    `Reservation Date: ${data.reservationDate}`,
    `Client: ${data.customerName}`,
    `Client Email: ${data.customerEmail}`,
    `Client Phone: ${data.customerPhone}`,
    `Vehicle: ${data.vehicleLabel}`,
    `Pickup: ${data.pickupLabel} ${data.pickupTime}`.trim(),
    `Pickup Date: ${data.pickupDate}`,
    `Return: ${data.returnLabel} ${data.returnTime}`.trim(),
    `Return Date: ${data.returnDate}`,
    `Payment Method: ${data.paymentMethod}`,
    `Payment Status: ${data.paymentStatus}`,
    `Payment Due: ${data.paymentDueAt}`,
    "",
    "DETAILS DES FRAIS",
    ...data.rows.map(
      (row) =>
        `${row.description} | Qty ${row.quantity} | Unit ${formatCurrency(row.unitPrice)} | Total ${formatCurrency(row.total)}`
    ),
    "",
    `Total: ${formatCurrency(data.totalAmount)}`,
    "",
    `Entreprise: ${data.companyName}`,
    `Email: ${data.companyEmail}`,
    `Telephone: ${data.companyPhone}`,
    `Adresse: ${data.companyAddress}`,
    "",
    "Signature Entreprise: __________________________",
    "Signature Client: ______________________________",
  ]);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Facture de Reservation #${safe(data.reservationId)}</title>
  <style>
    body {
      margin: 0;
      padding: 28px;
      font-family: Arial, sans-serif;
      background: #ffffff;
      color: #2d2d2d;
    }
    .invoice-shell {
      max-width: 980px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #dddddd;
      padding: 32px 38px 38px;
      box-shadow: 0 18px 36px rgba(0, 0, 0, 0.08);
    }
    .invoice-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 18px;
    }
    .invoice-actions button {
      border: 0;
      border-radius: 10px;
      padding: 10px 16px;
      font-weight: 700;
      cursor: pointer;
    }
    .invoice-actions .primary { background: #7c3aed; color: #fff; }
    .invoice-actions .secondary { background: #ffffff; color: #2b1f56; border: 1px solid #d5cdf0; }
    .invoice-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      border-bottom: 3px solid #7c3aed;
      padding-bottom: 14px;
      margin-bottom: 26px;
    }
    .invoice-brand { font-size: 24px; font-weight: 800; }
    .invoice-title { color: #8f4dff; font-size: 24px; font-weight: 800; text-align: right; }
    .invoice-section-title {
      color: #8f4dff;
      font-size: 20px;
      font-weight: 800;
      margin: 0 0 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid #dddddd;
    }
    .invoice-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px 34px;
      margin-bottom: 28px;
    }
    .invoice-item strong { display: block; margin-bottom: 6px; font-size: 15px; }
    .invoice-item span { color: #555555; line-height: 1.55; }
    .invoice-company-box {
      margin: 0 0 28px;
      padding: 16px 18px;
      border: 1px solid #dddddd;
      background: #fafafa;
    }
    .invoice-company-box p { margin: 6px 0; color: #555555; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th, td { border: 1px solid #dddddd; padding: 14px 12px; text-align: left; }
    th { background: #f3f3f7; color: #2f2f2f; font-size: 15px; }
    td { color: #555555; }
    .invoice-total { margin-top: 24px; text-align: right; font-size: 18px; font-weight: 800; color: #8f4dff; }
    .invoice-signatures {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 28px;
      margin-top: 54px;
    }
    .invoice-signature-box {
      border-top: 2px solid #bdbdbd;
      padding-top: 10px;
      min-height: 92px;
      color: #555555;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .invoice-shell { box-shadow: none; border: 0; }
      .invoice-actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-shell">
    <div class="invoice-actions">
      <button class="secondary" onclick="window.print()">Open Print / PDF</button>
      <button class="primary" onclick="downloadDocument()">Download PDF</button>
    </div>
    <div class="invoice-topbar">
      <div class="invoice-brand">SPEEDRENT</div>
      <div class="invoice-title">Facture de Reservation</div>
    </div>
    <div class="invoice-company-box">
      <p><strong>Entreprise:</strong> ${data.companyName}</p>
      <p><strong>Email:</strong> ${data.companyEmail}</p>
      <p><strong>Telephone:</strong> ${data.companyPhone}</p>
      <p><strong>Adresse:</strong> ${data.companyAddress}</p>
    </div>
    <h2 class="invoice-section-title">Details de la Reservation</h2>
    <div class="invoice-grid">
      <div class="invoice-item"><strong>ID de Reservation:</strong><span>#${data.reservationId}</span></div>
      <div class="invoice-item"><strong>Date de Reservation:</strong><span>${data.reservationDate}</span></div>
      <div class="invoice-item"><strong>Client:</strong><span>${data.customerName}<br>${data.customerEmail}<br>${data.customerPhone}</span></div>
      <div class="invoice-item"><strong>Vehicule:</strong><span>${data.vehicleLabel}</span></div>
      <div class="invoice-item"><strong>Periode de Location:</strong><span>${data.pickupDate} - ${data.returnDate}</span></div>
      <div class="invoice-item"><strong>Lieu de Prise en Charge:</strong><span>${data.pickupLabel}${data.pickupTime ? `<br>${data.pickupTime}` : ""}</span></div>
      <div class="invoice-item"><strong>Lieu de Retour:</strong><span>${data.returnLabel}${data.returnTime ? `<br>${data.returnTime}` : ""}</span></div>
      <div class="invoice-item"><strong>Paiement:</strong><span>${data.paymentMethod}<br>Status: ${data.paymentStatus}<br>Echeance: ${data.paymentDueAt}</span></div>
    </div>
    <h2 class="invoice-section-title">Details des Frais</h2>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantite</th>
          <th>Prix Unitaire</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${rowsMarkup}</tbody>
    </table>
    <div class="invoice-total">Total: ${formatCurrency(data.totalAmount)}</div>
    <div class="invoice-signatures">
      <div class="invoice-signature-box"><strong>Signature de l'Entreprise</strong></div>
      <div class="invoice-signature-box"><strong>Signature du Client</strong></div>
    </div>
  </div>
  <script>
    const pdfLines = ${pdfLinesJson};
    function escapePdfText(text) {
      return String(text || "").replace(/\\\\/g, "\\\\\\\\").replace(/\\(/g, "\\\\(").replace(/\\)/g, "\\\\)");
    }
    function buildPdfBlob(lines) {
      let textCommands = "BT\\n/F1 12 Tf\\n40 800 Td\\n14 TL\\n";
      lines.forEach((line, index) => {
        if (index === 0) {
          textCommands += "(" + escapePdfText(line) + ") Tj\\n";
        } else {
          textCommands += "T*\\n(" + escapePdfText(line) + ") Tj\\n";
        }
      });
      textCommands += "ET";
      const objects = [];
      objects.push("1 0 obj\\n<< /Type /Catalog /Pages 2 0 R >>\\nendobj");
      objects.push("2 0 obj\\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\\nendobj");
      objects.push("3 0 obj\\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\\nendobj");
      objects.push("4 0 obj\\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\\nendobj");
      objects.push("5 0 obj\\n<< /Length " + textCommands.length + " >>\\nstream\\n" + textCommands + "\\nendstream\\nendobj");
      let pdf = "%PDF-1.4\\n";
      const offsets = [0];
      objects.forEach((object) => {
        offsets.push(pdf.length);
        pdf += object + "\\n";
      });
      const xrefOffset = pdf.length;
      pdf += "xref\\n0 " + (objects.length + 1) + "\\n";
      pdf += "0000000000 65535 f \\n";
      offsets.slice(1).forEach((offset) => {
        pdf += String(offset).padStart(10, "0") + " 00000 n \\n";
      });
      pdf += "trailer\\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\\nstartxref\\n" + xrefOffset + "\\n%%EOF";
      return new Blob([pdf], { type: "application/pdf" });
    }
    function downloadDocument() {
      const blob = buildPdfBlob(pdfLines);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "facture-reservation-${safe(data.reservationId)}.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  </script>
</body>
</html>`;
}

export function openReservationContractDocument({ reservation, company }) {
  if (!reservation) return;
  const data = buildInvoiceData(reservation, company);
  const blob = buildPdfBlob(data);
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, "_blank");
  if (!popup) {
    URL.revokeObjectURL(url);
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function downloadReservationContractDocument({ reservation, company }) {
  if (!reservation) return;
  const data = buildInvoiceData(reservation, company);
  const blob = buildPdfBlob(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `facture-reservation-${safe(data.reservationId)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
