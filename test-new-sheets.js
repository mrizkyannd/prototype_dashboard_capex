import fs from 'fs';

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  
  function parseLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined && values[idx] !== null && values[idx].trim() !== '' ? values[idx].trim() : null;
    });
    rows.push(rowObj);
  }
  return { headers, rows };
}

function parseNum(val) {
  if (val === null || val === undefined) return null;
  const clean = String(val).replace(/,/g, '').trim();
  if (clean === '') return null;
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

async function run() {
  const id = '1uQPLJU2a3Zx8QKiGFoj14yN3DyeAoUV7Gw93GqpzAd4';

  // 1. DASH_PROJECT (for orphan checking)
  console.log('Fetching DASH_PROJECT...');
  const resProj = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=DASH_PROJECT`);
  const textProj = await resProj.text();
  const projData = parseCSV(textProj);
  const projKeySet = new Set(projData.rows.map(r => r['Project Key']));
  console.log('DASH_PROJECT rows:', projData.rows.length, 'Unique Project Key set size:', projKeySet.size);

  // 2. DASH_FINANCIAL
  console.log('\n--- DASH_FINANCIAL ---');
  const resFin = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=DASH_FINANCIAL`);
  const textFin = await resFin.text();
  const finData = parseCSV(textFin);
  console.log('Headers:', finData.headers);
  console.log('Row count:', finData.rows.length);
  
  const finKeys = finData.rows.map(r => r['Project Key']);
  const finKeySet = new Set(finKeys);
  const finOrphans = finKeys.filter(k => !projKeySet.has(k));
  
  const noFinDataRows = finData.rows.filter(r => r['Has Financial Data?'] === 'NO' || r['Has Financial Data?'] === 'False' || r['Has Financial Data?'] === 'false' || (parseNum(r['CAPEX Base']) === null && parseNum(r['CAPEX Inflated']) === null));
  
  let sumCapexBase = 0, sumCapexInflated = 0, sumRAB = 0, sumRKAP = 0, sumOB = 0, sumRNA = 0;
  finData.rows.forEach(r => {
    sumCapexBase += parseNum(r['CAPEX Base']) || 0;
    sumCapexInflated += parseNum(r['CAPEX Inflated']) || 0;
    sumRAB += parseNum(r['RAB']) || 0;
    sumRKAP += parseNum(r['RKAP']) || 0;
    sumOB += parseNum(r['OB']) || 0;
    sumRNA += parseNum(r['RNA']) || 0;
  });

  console.log('Unique Project Keys:', finKeySet.size);
  console.log('Orphan Project Keys:', finOrphans.length);
  console.log('Has Financial Data = NO / false count:', noFinDataRows.length);
  console.log('CAPEX Base sum:', sumCapexBase);
  console.log('CAPEX Inflated sum:', sumCapexInflated);
  console.log('RAB sum:', sumRAB);
  console.log('RKAP sum:', sumRKAP);
  console.log('OB sum:', sumOB);
  console.log('RNA sum:', sumRNA);

  // 3. DASH_PROCUREMENT
  console.log('\n--- DASH_PROCUREMENT ---');
  const resProc = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=DASH_PROCUREMENT`);
  const textProc = await resProc.text();
  const procData = parseCSV(textProc);
  console.log('Headers:', procData.headers);
  console.log('Row count:', procData.rows.length);

  const procKeys = procData.rows.map(r => r['Project Key']);
  const procUniqueProjects = new Set(procKeys.filter(Boolean));
  const procOrphans = procKeys.filter(k => k && !projKeySet.has(k));

  const prNumbers = new Set(procData.rows.map(r => r['PR Number']).filter(Boolean));
  const poNumbers = new Set(procData.rows.map(r => r['PO Number']).filter(Boolean));

  let totalPR = 0, totalPO = 0;
  procData.rows.forEach(r => {
    totalPR += parseNum(r['PR Line Value']) || 0;
    totalPO += parseNum(r['PO Line Value']) || 0;
  });

  console.log('Unique Projects:', procUniqueProjects.size);
  console.log('Orphan Project Keys:', procOrphans.length);
  console.log('Unique PR Numbers:', prNumbers.size);
  console.log('Unique PO Numbers:', poNumbers.size);
  console.log('Total PR Line Value:', totalPR);
  console.log('Total PO Line Value:', totalPO);

  // 4. DASH_VOWD
  console.log('\n--- DASH_VOWD ---');
  const resVowd = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=DASH_VOWD`);
  const textVowd = await resVowd.text();
  const vowdData = parseCSV(textVowd);
  console.log('Headers:', vowdData.headers);
  console.log('Row count:', vowdData.rows.length);

  const vowdKeys = vowdData.rows.map(r => r['Project Key']);
  const vowdUniqueProjects = new Set(vowdKeys.filter(Boolean));
  const vowdOrphans = vowdKeys.filter(k => k && !projKeySet.has(k));

  let vowd2023 = 0, vowd2024 = 0, vowd2025 = 0, vowd2026 = 0, vowdTotal = 0;
  vowdData.rows.forEach(r => {
    const yr = String(r['Year']).trim();
    const val = parseNum(r['VOWD']) || 0;
    vowdTotal += val;
    if (yr === '2023') vowd2023 += val;
    else if (yr === '2024') vowd2024 += val;
    else if (yr === '2025') vowd2025 += val;
    else if (yr === '2026') vowd2026 += val;
  });

  console.log('Unique Projects:', vowdUniqueProjects.size);
  console.log('Orphan Project Keys:', vowdOrphans.length);
  console.log('2023 VOWD:', vowd2023);
  console.log('2024 VOWD:', vowd2024);
  console.log('2025 VOWD:', vowd2025);
  console.log('2026 YTD VOWD:', vowd2026);
  console.log('Total VOWD:', vowdTotal);
}

run().catch(console.error);
