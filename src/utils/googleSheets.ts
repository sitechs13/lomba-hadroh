import { EventConfig, GroupRecapSummary } from '../types/hadroh';

export interface GoogleSheetsSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  createdTime: string;
}

/**
 * Creates and populates a new Google Spreadsheet with live Hadroh competition data
 */
export async function syncToGoogleSheets(
  accessToken: string,
  eventConfig: EventConfig,
  recapList: GroupRecapSummary[]
): Promise<GoogleSheetsSyncResult> {
  const sheetTitle = `[REKAP] ${eventConfig.eventName} - ${new Date().toLocaleDateString('id-ID')}`;

  // 1. Create new spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle,
      },
      sheets: [
        {
          properties: {
            title: 'Rekapitulasi Nilai',
            gridProperties: {
              frozenRowCount: 4,
            },
          },
        },
      ],
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    throw new Error(errorData?.error?.message || 'Gagal membuat Google Spreadsheet. Periksa otorisasi akun Google.');
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare tabular data
  const values: any[][] = [
    ['LEMBAR KEPUTUSAN DEWAN JURI & REKAPITULASI HASIL NILAI LOMBA HADROH'],
    [eventConfig.eventName.toUpperCase()],
    [`Penyelenggara: ${eventConfig.organizer} | Tanggal: ${eventConfig.eventDate} | Lokasi: ${eventConfig.location}`],
    [
      'Peringkat',
      'No. Undian',
      'Nama Grup',
      'Asal Lembaga / Ponpes',
      'Kategori',
      'Rata-rata Vokal (35%)',
      'Rata-rata Terbang (35%)',
      'Rata-rata Adab (15%)',
      'Rata-rata Fasohah (15%)',
      'Penalti',
      'Total Nilai',
      'Keterangan Juara',
      'Status Integritas',
    ],
  ];

  recapList.forEach((item) => {
    values.push([
      item.judgeCount > 0 ? item.rank : '-',
      `#${String(item.participant.orderNumber).padStart(2, '0')}`,
      item.participant.groupName,
      item.participant.institution,
      item.participant.category.toUpperCase(),
      item.averageVokal,
      item.averageTerbang,
      item.averageAdab,
      item.averageFasohah,
      item.totalPenalty > 0 ? `-${item.totalPenalty}` : 0,
      item.finalScore,
      item.awardCategory || '-',
      item.integrityVerified ? 'SHA-256 VALID' : 'UNVERIFIED',
    ]);
  });

  // 3. Write values to the sheet
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Rekapitulasi Nilai'!A1:M${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json();
    throw new Error(errorData?.error?.message || 'Gagal mengisi data Google Spreadsheet.');
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    createdTime: new Date().toISOString(),
  };
}
