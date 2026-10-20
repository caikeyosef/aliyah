import {
  GPXActivity,
  GPXTrackPoint,
  KmSplit,
  HeartRateZone,
  BestEffort,
} from '../types/running';

/**
 * Haversine distance in meters between two lat/lon coordinates
 */
export function haversineDistanceM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format pace from seconds per kilometer into "M:SS /km"
 */
export function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || !isFinite(secondsPerKm) || secondsPerKm <= 0 || secondsPerKm > 1800) {
    return '--:-- /km';
  }
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

/**
 * Format total duration in seconds into "HH:MM:SS" or "MM:SS"
 */
export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Minetti Grade Adjusted Pace factor
 */
function calculateGradeFactor(grade: number): number {
  // grade is fraction, e.g. 0.05 for 5% slope
  // Flat ground = 1.0
  if (grade > 0) {
    return 1 + 3.2 * grade + 10 * Math.pow(grade, 2);
  } else {
    // Downhill gives speed bonus up to -10%, then braking cost
    return Math.max(0.65, 1 + 1.8 * grade - 4 * Math.pow(grade, 2));
  }
}

/**
 * Find child node text content case-insensitively and namespace-insensitively
 */
function findTagText(parent: Element, tagNames: string[]): string | null {
  for (const name of tagNames) {
    // 1. Try direct getElementsByTagName
    const el = parent.getElementsByTagName(name)[0];
    if (el && el.textContent) return el.textContent.trim();

    // 2. Try with wildcard namespace or querySelector
    try {
      const q = parent.querySelector(`*|${name}, ${name}`);
      if (q && q.textContent) return q.textContent.trim();
    } catch {
      // Ignore querySelector namespace errors
    }
  }

  // 3. Fallback scan all child elements by localName
  const all = parent.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    const local = all[i].localName.toLowerCase();
    for (const name of tagNames) {
      if (local === name.toLowerCase() && all[i].textContent) {
        return all[i].textContent!.trim();
      }
    }
  }

  return null;
}

/**
 * Parse a raw GPX string and extract complete running metrics
 */
export function parseGPX(
  xmlString: string,
  filename: string = 'corrida.gpx',
  userWeightKg: number = 72,
  userAge: number = 28
): GPXActivity {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Arquivo GPX corrompido ou formato XML inválido.');
  }

  // Extract metadata
  const gpxEl = doc.documentElement;
  const creator = gpxEl.getAttribute('creator') || 'Dispositivo GPS';

  const metadataEl = doc.getElementsByTagName('metadata')[0];
  const trkEl = doc.getElementsByTagName('trk')[0];
  const rteEl = doc.getElementsByTagName('rte')[0];

  const title =
    (trkEl && findTagText(trkEl, ['name'])) ||
    (metadataEl && findTagText(metadataEl, ['name'])) ||
    (rteEl && findTagText(rteEl, ['name'])) ||
    filename.replace(/\.gpx$/i, '').replace(/[-_]/g, ' ') ||
    'Corrida de Rua';

  const description =
    (trkEl && findTagText(trkEl, ['desc'])) ||
    (metadataEl && findTagText(metadataEl, ['desc'])) ||
    undefined;

  // Extract all track points
  const trkpts = doc.querySelectorAll('trkpt, rtept');
  if (trkpts.length === 0) {
    throw new Error('Nenhum ponto de GPS (<trkpt>) encontrado no arquivo GPX.');
  }

  const rawPoints: Array<{
    lat: number;
    lon: number;
    ele: number;
    timeStr: string;
    timestampMs: number;
    hr?: number;
    cad?: number;
    power?: number;
    temp?: number;
  }> = [];

  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  let minEle = 99999;
  let maxEle = -99999;

  for (let i = 0; i < trkpts.length; i++) {
    const el = trkpts[i];
    const lat = parseFloat(el.getAttribute('lat') || '0');
    const lon = parseFloat(el.getAttribute('lon') || '0');

    if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) continue;

    const eleText = findTagText(el, ['ele', 'altitude']);
    const ele = eleText ? parseFloat(eleText) : 0;

    const timeText = findTagText(el, ['time']);
    const timeStr = timeText || '';
    let timestampMs = timeStr ? new Date(timeStr).getTime() : 0;
    if (isNaN(timestampMs) || timestampMs === 0) {
      // Synthesize 1-second interval if timestamps are missing
      timestampMs = (rawPoints.length > 0 ? rawPoints[rawPoints.length - 1].timestampMs : Date.now()) + 1000;
    }

    // HR
    const hrText = findTagText(el, ['hr', 'gpxtpx:hr', 'heartrate', 'ns3:hr']);
    const hr = hrText ? parseInt(hrText, 10) : undefined;

    // Cadence
    const cadText = findTagText(el, ['cad', 'gpxtpx:cad', 'cadence', 'ns3:cad']);
    let cad = cadText ? parseInt(cadText, 10) : undefined;
    // Some devices record single-leg cadence (e.g. 85 rpm instead of 170 spm)
    if (cad && cad < 110 && cad > 60) {
      cad = cad * 2;
    }

    // Power & Temperature
    const powerText = findTagText(el, ['power', 'watts']);
    const power = powerText ? parseFloat(powerText) : undefined;

    const tempText = findTagText(el, ['atemp', 'gpxtpx:atemp', 'temp']);
    const temp = tempText ? parseFloat(tempText) : undefined;

    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    if (!isNaN(ele)) {
      minEle = Math.min(minEle, ele);
      maxEle = Math.max(maxEle, ele);
    }

    rawPoints.push({
      lat,
      lon,
      ele: isNaN(ele) ? 0 : ele,
      timeStr,
      timestampMs,
      hr: hr && !isNaN(hr) && hr > 35 && hr < 240 ? hr : undefined,
      cad: cad && !isNaN(cad) && cad > 40 && cad < 260 ? cad : undefined,
      power: power && !isNaN(power) && power >= 0 ? power : undefined,
      temp: temp && !isNaN(temp) ? temp : undefined,
    });
  }

  if (rawPoints.length === 0) {
    throw new Error('Pontos de coordenadas válidos não puderam ser extraídos.');
  }

  // Calculate cumulative distance, elevation gain/loss, speeds, moving time
  const points: GPXTrackPoint[] = [];
  let cumulativeDistM = 0;
  let totalElevationGainM = 0;
  let totalElevationLossM = 0;
  let movingTimeSeconds = 0;
  let lastEleSmooth = rawPoints[0].ele;

  let sumHr = 0;
  let countHr = 0;
  let maxHr = 0;
  let minHr = 999;

  let sumCad = 0;
  let countCad = 0;
  let maxCad = 0;

  let sumPower = 0;
  let countPower = 0;
  let maxPower = 0;

  let sumTemp = 0;
  let countTemp = 0;

  let maxSpeedKmh = 0;

  for (let i = 0; i < rawPoints.length; i++) {
    const curr = rawPoints[i];
    let stepDistM = 0;
    let stepTimeSec = 0;
    let speedKmh = 0;
    let paceSeconds = 0;
    let gradePercent = 0;

    if (i > 0) {
      const prev = rawPoints[i - 1];
      stepDistM = haversineDistanceM(prev.lat, prev.lon, curr.lat, curr.lon);
      stepTimeSec = Math.max(0, (curr.timestampMs - prev.timestampMs) / 1000);

      // Filter abnormal GPS jumps (> 60km/h)
      const instantSpeed = stepTimeSec > 0 ? (stepDistM / stepTimeSec) * 3.6 : 0;
      if (instantSpeed > 60) {
        stepDistM = 0;
      } else {
        cumulativeDistM += stepDistM;

        // Elevation filter (0.6m threshold to prevent noise)
        const eleDiff = curr.ele - lastEleSmooth;
        if (Math.abs(eleDiff) >= 0.6) {
          if (eleDiff > 0) {
            totalElevationGainM += eleDiff;
          } else {
            totalElevationLossM += Math.abs(eleDiff);
          }
          lastEleSmooth = curr.ele;
        }

        // Grade %
        if (stepDistM > 3) {
          gradePercent = ((curr.ele - prev.ele) / stepDistM) * 100;
          gradePercent = Math.max(-30, Math.min(30, gradePercent));
        }

        // Moving time: runner moving >= 0.8 km/h and time gap under 25s
        if (instantSpeed >= 0.8 && stepTimeSec < 25) {
          movingTimeSeconds += stepTimeSec;
        }

        speedKmh = instantSpeed;
        if (speedKmh > 1.2 && speedKmh < 45) {
          paceSeconds = 3600 / speedKmh;
          if (speedKmh > maxSpeedKmh) {
            maxSpeedKmh = speedKmh;
          }
        }
      }
    }

    if (curr.hr) {
      sumHr += curr.hr;
      countHr++;
      maxHr = Math.max(maxHr, curr.hr);
      minHr = Math.min(minHr, curr.hr);
    }

    if (curr.cad) {
      sumCad += curr.cad;
      countCad++;
      maxCad = Math.max(maxCad, curr.cad);
    }

    if (curr.power) {
      sumPower += curr.power;
      countPower++;
      maxPower = Math.max(maxPower, curr.power);
    }

    if (curr.temp !== undefined) {
      sumTemp += curr.temp;
      countTemp++;
    }

    points.push({
      index: i,
      lat: curr.lat,
      lon: curr.lon,
      ele: Math.round(curr.ele * 10) / 10,
      time: curr.timeStr,
      timestampMs: curr.timestampMs,
      distanceFromStartM: Math.round(cumulativeDistM),
      speedKmh: Math.round(speedKmh * 10) / 10,
      paceSecondsPerKm: Math.round(paceSeconds),
      heartRate: curr.hr,
      cadence: curr.cad,
      power: curr.power,
      temperature: curr.temp,
      gradePercent: Math.round(gradePercent * 10) / 10,
    });
  }

  const totalTimeSeconds = Math.max(
    1,
    Math.round((rawPoints[rawPoints.length - 1].timestampMs - rawPoints[0].timestampMs) / 1000)
  );

  // If moving time is 0 or unrecorded, fallback to total elapsed time
  if (movingTimeSeconds <= 0 || movingTimeSeconds > totalTimeSeconds) {
    movingTimeSeconds = totalTimeSeconds;
  }

  const totalDistanceKm = Math.round((cumulativeDistM / 1000) * 100) / 100;

  // Average paces
  const movingPaceSeconds = totalDistanceKm > 0 ? movingTimeSeconds / totalDistanceKm : 0;
  const elapsedPaceSeconds = totalDistanceKm > 0 ? totalTimeSeconds / totalDistanceKm : 0;
  const averageSpeedKmh =
    movingTimeSeconds > 0 ? Math.round(((cumulativeDistM / 1000) / (movingTimeSeconds / 3600)) * 10) / 10 : 0;

  // Best smoothed pace (search over 500m sliding window)
  let bestPaceSeconds = 9999;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const windowDist = points[j].distanceFromStartM - points[i].distanceFromStartM;
      if (windowDist >= 500) {
        const windowTime = (points[j].timestampMs - points[i].timestampMs) / 1000;
        if (windowTime > 30) {
          const pace = (windowTime / windowDist) * 1000;
          if (pace > 120 && pace < bestPaceSeconds) {
            bestPaceSeconds = pace;
          }
        }
        break;
      }
    }
  }
  if (bestPaceSeconds === 9999 || bestPaceSeconds < 120) {
    bestPaceSeconds = movingPaceSeconds > 0 ? movingPaceSeconds * 0.85 : 300;
  }

  // Grade Adjusted Pace (GAP)
  let gapSumPaceSeconds = 0;
  let gapPointsCount = 0;
  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    if (pt.paceSecondsPerKm > 120 && pt.paceSecondsPerKm < 900) {
      const factor = calculateGradeFactor((pt.gradePercent || 0) / 100);
      gapSumPaceSeconds += pt.paceSecondsPerKm / factor;
      gapPointsCount++;
    }
  }
  const gapPaceSeconds = gapPointsCount > 0 ? gapSumPaceSeconds / gapPointsCount : movingPaceSeconds;

  // Calculate 1km splits
  const splits: KmSplit[] = [];
  let currentKmTarget = 1000;
  let splitStartIndex = 0;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const isLastPoint = i === points.length - 1;

    if (pt.distanceFromStartM >= currentKmTarget || (isLastPoint && pt.distanceFromStartM > currentKmTarget - 1000)) {
      const startPt = points[splitStartIndex];
      const endPt = pt;
      const splitDistM = endPt.distanceFromStartM - startPt.distanceFromStartM;
      const splitTimeSec = Math.max(1, (endPt.timestampMs - startPt.timestampMs) / 1000);

      if (splitDistM > 100) {
        const splitPaceSec = (splitTimeSec / splitDistM) * 1000;
        const eleDiff = endPt.ele - startPt.ele;

        // Calc split HR & Cadence
        let splitHrSum = 0;
        let splitHrCount = 0;
        let splitCadSum = 0;
        let splitCadCount = 0;
        let splitAscent = 0;
        let splitDescent = 0;

        for (let k = splitStartIndex + 1; k <= i; k++) {
          if (points[k].heartRate) {
            splitHrSum += points[k].heartRate!;
            splitHrCount++;
          }
          if (points[k].cadence) {
            splitCadSum += points[k].cadence!;
            splitCadCount++;
          }
          const diff = points[k].ele - points[k - 1].ele;
          if (diff > 0) splitAscent += diff;
          else splitDescent += Math.abs(diff);
        }

        splits.push({
          km: splits.length + 1,
          distanceM: Math.round(splitDistM),
          timeSeconds: Math.round(splitTimeSec),
          paceSeconds: Math.round(splitPaceSec),
          paceFormatted: formatPace(splitPaceSec),
          elevationDiffM: Math.round(eleDiff),
          elevationGainM: Math.round(splitAscent),
          elevationLossM: Math.round(splitDescent),
          avgHr: splitHrCount > 0 ? Math.round(splitHrSum / splitHrCount) : undefined,
          avgCadence: splitCadCount > 0 ? Math.round(splitCadSum / splitCadCount) : undefined,
          avgSpeedKmh: Math.round(((splitDistM / 1000) / (splitTimeSec / 3600)) * 10) / 10,
        });
      }

      splitStartIndex = i;
      currentKmTarget += 1000;
    }
  }

  // Mark fastest and slowest splits (excluding partial splits under 600m)
  const fullSplits = splits.filter((s) => s.distanceM >= 700);
  if (fullSplits.length > 1) {
    let fastestPace = Infinity;
    let slowestPace = -Infinity;
    fullSplits.forEach((s) => {
      if (s.paceSeconds < fastestPace) fastestPace = s.paceSeconds;
      if (s.paceSeconds > slowestPace) slowestPace = s.paceSeconds;
    });
    splits.forEach((s) => {
      if (s.distanceM >= 700 && s.paceSeconds === fastestPace) s.isFastest = true;
      if (s.distanceM >= 700 && s.paceSeconds === slowestPace) s.isSlowest = true;
    });
  }

  // Best Efforts search (Strava style)
  const targetEfforts = [
    { label: '400m', meters: 400 },
    { label: '1 km', meters: 1000 },
    { label: '1 Milha (1.6k)', meters: 1609.34 },
    { label: '5 km', meters: 5000 },
    { label: '10 km', meters: 10000 },
    { label: '15 km', meters: 15000 },
    { label: 'Meia Maratona (21.1k)', meters: 21097 },
  ];

  const bestEfforts: BestEffort[] = [];
  for (const effort of targetEfforts) {
    if (cumulativeDistM < effort.meters) {
      bestEfforts.push({
        distanceLabel: effort.label,
        targetDistanceM: effort.meters,
        timeFormatted: '--:--',
        timeSeconds: 0,
        paceFormatted: '--:--',
        achieved: false,
      });
      continue;
    }

    let minTime = Infinity;
    let bestStart = 0;
    let bestEnd = 0;

    let right = 0;
    for (let left = 0; left < points.length; left++) {
      while (
        right < points.length &&
        points[right].distanceFromStartM - points[left].distanceFromStartM < effort.meters
      ) {
        right++;
      }
      if (right >= points.length) break;

      const coveredDist = points[right].distanceFromStartM - points[left].distanceFromStartM;
      const intervalTimeSec = (points[right].timestampMs - points[left].timestampMs) / 1000;

      // Normalize strictly to target distance
      const normalizedTimeSec = (intervalTimeSec / coveredDist) * effort.meters;
      if (normalizedTimeSec < minTime && normalizedTimeSec > effort.meters / 15) {
        minTime = normalizedTimeSec;
        bestStart = left;
        bestEnd = right;
      }
    }

    if (minTime < Infinity) {
      const paceSec = (minTime / effort.meters) * 1000;
      bestEfforts.push({
        distanceLabel: effort.label,
        targetDistanceM: effort.meters,
        timeFormatted: formatDuration(minTime),
        timeSeconds: Math.round(minTime),
        paceFormatted: formatPace(paceSec),
        achieved: true,
        startIndex: bestStart,
        endIndex: bestEnd,
      });
    } else {
      bestEfforts.push({
        distanceLabel: effort.label,
        targetDistanceM: effort.meters,
        timeFormatted: '--:--',
        timeSeconds: 0,
        paceFormatted: '--:--',
        achieved: false,
      });
    }
  }

  // Heart Rate Zones (5 zones based on max HR or age estimation)
  let hrZones: HeartRateZone[] | undefined = undefined;
  const userMaxHr = countHr > 0 && maxHr > 160 ? Math.max(maxHr, 220 - userAge) : 220 - userAge;

  if (countHr > 0) {
    const zoneDefinitions = [
      {
        zone: 1,
        name: 'Z1 • Recuperação Ativa',
        description: 'Ritmo regenerativo e aquecimento leve',
        minPct: 0.5,
        maxPct: 0.6,
        color: '#60a5fa', // Blue
      },
      {
        zone: 2,
        name: 'Z2 • Resistência Aeróbica',
        description: 'Queima de gordura e capacidade aeróbica base',
        minPct: 0.6,
        maxPct: 0.7,
        color: '#34d399', // Emerald
      },
      {
        zone: 3,
        name: 'Z3 • Ritmo & Tempo',
        description: 'Capacidade cardiovascular sustentada',
        minPct: 0.7,
        maxPct: 0.8,
        color: '#fbbf24', // Amber
      },
      {
        zone: 4,
        name: 'Z4 • Limiar de Lactato',
        description: 'Ritmo de prova forte, tolerância ao lactato',
        minPct: 0.8,
        maxPct: 0.9,
        color: '#fb923c', // Orange
      },
      {
        zone: 5,
        name: 'Z5 • Anaeróbico & Pico',
        description: 'Potência máxima e esforço extremo (tiros)',
        minPct: 0.9,
        maxPct: 1.05,
        color: '#f87171', // Red
      },
    ];

    const zoneTimes = [0, 0, 0, 0, 0];

    for (let i = 1; i < points.length; i++) {
      const hr = points[i].heartRate;
      if (hr) {
        const timeDelta = Math.min(10, Math.max(1, (points[i].timestampMs - points[i - 1].timestampMs) / 1000));
        const pct = hr / userMaxHr;

        if (pct < 0.6) zoneTimes[0] += timeDelta;
        else if (pct < 0.7) zoneTimes[1] += timeDelta;
        else if (pct < 0.8) zoneTimes[2] += timeDelta;
        else if (pct < 0.9) zoneTimes[3] += timeDelta;
        else zoneTimes[4] += timeDelta;
      }
    }

    const totalHrTime = zoneTimes.reduce((a, b) => a + b, 0) || 1;

    hrZones = zoneDefinitions.map((z, idx) => ({
      zone: z.zone,
      name: z.name,
      minBpm: Math.round(z.minPct * userMaxHr),
      maxBpm: Math.round(z.maxPct * userMaxHr),
      timeSeconds: Math.round(zoneTimes[idx]),
      percent: Math.round((zoneTimes[idx] / totalHrTime) * 100),
      color: z.color,
      description: z.description,
    }));
  }

  // Estimated calories: standard running formula ~1.036 kcal / kg / km + elevation cost
  const calorieBase = totalDistanceKm * userWeightKg * 1.036;
  const calorieAscent = (totalElevationGainM / 100) * (userWeightKg * 0.12);
  const estimatedCalories = Math.round(calorieBase + calorieAscent);

  // Stride length estimate if cadence present
  let avgStrideLengthM: number | undefined = undefined;
  if (countCad > 0 && cumulativeDistM > 0 && movingTimeSeconds > 0) {
    const avgCadence = sumCad / countCad;
    const totalSteps = (avgCadence * (movingTimeSeconds / 60));
    if (totalSteps > 0) {
      avgStrideLengthM = Math.round((cumulativeDistM / totalSteps) * 100) / 100;
    }
  }

  const startDate = rawPoints[0].timeStr
    ? new Date(rawPoints[0].timeStr)
    : new Date();

  const formattedDate = startDate.toISOString().split('T')[0];
  const startTimeFormatted = startDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    filename,
    description,
    date: formattedDate,
    startTimeFormatted,
    creator,

    totalDistanceKm,
    totalDistanceM: Math.round(cumulativeDistM),
    totalTimeSeconds,
    movingTimeSeconds: Math.round(movingTimeSeconds),
    elapsedPaceFormatted: formatPace(elapsedPaceSeconds),
    movingPaceFormatted: formatPace(movingPaceSeconds),
    movingPaceSeconds: Math.round(movingPaceSeconds),
    bestPaceFormatted: formatPace(bestPaceSeconds),
    bestPaceSeconds: Math.round(bestPaceSeconds),
    averageSpeedKmh,
    maxSpeedKmh: Math.round(maxSpeedKmh * 10) / 10,

    elevationGainM: Math.round(totalElevationGainM),
    elevationLossM: Math.round(totalElevationLossM),
    minElevationM: Math.round(minEle === 99999 ? 0 : minEle),
    maxElevationM: Math.round(maxEle === -99999 ? 0 : maxEle),

    estimatedCalories,
    gapPaceFormatted: formatPace(gapPaceSeconds),
    gapPaceSeconds: Math.round(gapPaceSeconds),

    hasHeartRate: countHr > 0,
    avgHeartRate: countHr > 0 ? Math.round(sumHr / countHr) : undefined,
    maxHeartRate: countHr > 0 ? maxHr : undefined,
    minHeartRate: countHr > 0 && minHr < 999 ? minHr : undefined,
    heartRateZones: hrZones,

    hasCadence: countCad > 0,
    avgCadence: countCad > 0 ? Math.round(sumCad / countCad) : undefined,
    maxCadence: countCad > 0 ? maxCad : undefined,
    avgStrideLengthM,

    hasPower: countPower > 0,
    avgPowerWatts: countPower > 0 ? Math.round(sumPower / countPower) : undefined,
    maxPowerWatts: countPower > 0 ? maxPower : undefined,

    hasTemperature: countTemp > 0,
    avgTemperature: countTemp > 0 ? Math.round((sumTemp / countTemp) * 10) / 10 : undefined,

    splits,
    bestEfforts,

    pointsCount: points.length,
    points,
    bounds: {
      minLat,
      maxLat,
      minLon,
      maxLon,
    },

    savedAt: new Date().toISOString(),
  };
}
