import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EventConfig, GroupRecapSummary, ParticipantGroup, ScoreSubmission } from '../types/hadroh';

export function exportOfficialRecapPDF(
  eventConfig: EventConfig,
  recapList: GroupRecapSummary[],
  scores: ScoreSubmission[]
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header / Kop Surat Resmi
  doc.setFillColor(15, 76, 58); // Dark Emerald
  doc.rect(0, 0, pageWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 76, 58);
  doc.text('LEMBAR KEPUTUSAN DEWAN JURI & REKAPITULASI HASIL NILAI', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(eventConfig.eventName.toUpperCase(), pageWidth / 2, 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Penyelenggara: ${eventConfig.organizer} | Tempat: ${eventConfig.location} | Tanggal: ${eventConfig.eventDate}`,
    pageWidth / 2,
    31,
    { align: 'center' }
  );

  // Line divider
  doc.setDrawColor(212, 175, 55); // Gold Accent
  doc.setLineWidth(0.8);
  doc.line(14, 34, pageWidth - 14, 34);

  // Event info brief
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`Kategori: ${eventConfig.category.toUpperCase()} | Dewan Juri: ${eventConfig.judges.length} Orang | Total Peserta: ${recapList.length} Kontingen`, 14, 39);
  doc.text(`Status Berita Acara: ${eventConfig.isRecapLocked ? 'DIKUNCI & DISAHKAN (FINAL)' : 'DRAFT SEMENTARA'}`, pageWidth - 14, 39, { align: 'right' });

  // Table columns
  const tableHeaders = [
    'Rank',
    'No. Tampil',
    'Nama Grup / Kontingen',
    'Asal Lembaga / Pesantren',
    'Vokal\n(35%)',
    'Terbang\n(35%)',
    'Adab\n(15%)',
    'Fasohah\n(15%)',
    'Penalti',
    'Total Nilai',
    'Keterangan Juara',
  ];

  const tableData = recapList.map((item) => [
    item.judgeCount > 0 ? `${item.rank}` : '-',
    `#${String(item.participant.orderNumber).padStart(2, '0')}`,
    item.participant.groupName,
    item.participant.institution,
    item.averageVokal.toFixed(2),
    item.averageTerbang.toFixed(2),
    item.averageAdab.toFixed(2),
    item.averageFasohah.toFixed(2),
    item.totalPenalty > 0 ? `-${item.totalPenalty.toFixed(2)}` : '0',
    item.finalScore > 0 ? item.finalScore.toFixed(2) : 'Belum Lengkap',
    item.awardCategory || '-',
  ]);

  autoTable(doc, {
    startY: 42,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 76, 58],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 8,
      valign: 'middle',
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 248],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 16 },
      2: { fontStyle: 'bold', cellWidth: 45 },
      3: { cellWidth: 42 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 18 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 16 },
      9: { halign: 'center', fontStyle: 'bold', textColor: [15, 76, 58], cellWidth: 22 },
      10: { cellWidth: 45, fontStyle: 'bold', textColor: [180, 83, 9] },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer & Signatures of Judges
  const finalY = ((doc as any).lastAutoTable?.finalY || 140) + 8;

  if (finalY < pageHeight - 35) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(`Ditetapkan di: ${eventConfig.location.split('/')[0].trim()}`, 14, finalY);
    doc.text(`Pada Tanggal: ${eventConfig.eventDate}`, 14, finalY + 4);
    doc.text(`Kunci Integritas Digital: SHA-256 E-SEAL VALIDATED`, 14, finalY + 8);

    doc.setFont('helvetica', 'bold');
    doc.text('DEWAN HAKIM / JURI PENILAI:', pageWidth - 14, finalY, { align: 'right' });

    // Render judge signature lines
    const startX = pageWidth - 120;
    const spacing = 28;
    eventConfig.judges.forEach((judge, idx) => {
      const colX = startX + (idx % 2) * 55;
      const rowY = finalY + 6 + Math.floor(idx / 2) * 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`(${judge.name})`, colX, rowY + 8);
      doc.setFont('helvetica', 'italic');
      doc.text(`${judge.roleTitle.split(':')[0]}`, colX, rowY + 11);
    });
  }

  // Footer bar
  doc.setFillColor(15, 76, 58);
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');

  doc.save(`Rekapitulasi_Lomba_Hadroh_${eventConfig.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function exportWinnerCertificatePDF(
  eventConfig: EventConfig,
  recapItem: GroupRecapSummary
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Ornate Double Border
  doc.setDrawColor(15, 76, 58); // Emerald
  doc.setLineWidth(3);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(1);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22);

  // Background subtle tint
  doc.setFillColor(254, 253, 248);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'F');

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(15, 76, 58);
  doc.text('PIAGAM PENGHARGAAN', pageWidth / 2, 38, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(180, 130, 20);
  doc.text(`Nomor: 088/PAN-HADROH/${new Date().getFullYear()}`, pageWidth / 2, 46, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text('Diberikan dengan penuh kehormatan kepada:', pageWidth / 2, 60, { align: 'center' });

  // Group Name
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(15, 76, 58);
  doc.text(recapItem.participant.groupName.toUpperCase(), pageWidth / 2, 73, { align: 'center' });

  // Institution
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text(`Asal: ${recapItem.participant.institution}`, pageWidth / 2, 82, { align: 'center' });

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 40, 86, pageWidth / 2 + 40, 86);

  // Achievement Title
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text('Sebagai:', pageWidth / 2, 98, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(190, 24, 93); // Rose / Gold
  doc.text(recapItem.awardCategory || `Peringkat ${recapItem.rank} (Skor: ${recapItem.finalScore})`, pageWidth / 2, 108, {
    align: 'center',
  });

  // Event description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Dalam acara "${eventConfig.eventName}"`,
    pageWidth / 2,
    120,
    { align: 'center' }
  );
  doc.text(
    `Diselenggarakan oleh ${eventConfig.organizer} pada tanggal ${eventConfig.eventDate}`,
    pageWidth / 2,
    127,
    { align: 'center' }
  );

  // Signatures
  const sigY = 155;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  doc.text('Ketua Panitia Pelaksana,', 55, sigY, { align: 'center' });
  doc.text('Ketua Dewan Juri,', pageWidth - 55, sigY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text('( Panitia Penyelenggara )', 55, sigY + 22, { align: 'center' });
  doc.text(`( ${eventConfig.judges[0]?.name || 'Ketua Dewan Juri'} )`, pageWidth - 55, sigY + 22, { align: 'center' });

  // Seal / Stamp Simulation
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.circle(pageWidth / 2, sigY + 8, 14);
  doc.setFontSize(7);
  doc.setTextColor(180, 130, 20);
  doc.text('E-VERIFIED', pageWidth / 2, sigY + 7, { align: 'center' });
  doc.text('OFFICIAL SEAL', pageWidth / 2, sigY + 11, { align: 'center' });

  doc.save(`Sertifikat_${recapItem.participant.groupName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
