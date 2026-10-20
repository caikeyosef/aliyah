export interface GPXTrackPoint {
  index: number;
  lat: number;
  lon: number;
  ele: number;
  time: string;
  timestampMs: number;
  distanceFromStartM: number;
  speedKmh: number;
  paceSecondsPerKm: number;
  heartRate?: number;
  cadence?: number;
  power?: number;
  temperature?: number;
  gradePercent?: number; // Incline %
}

export interface KmSplit {
  km: number;
  distanceM: number;
  timeSeconds: number;
  paceSeconds: number;
  paceFormatted: string;
  elevationDiffM: number;
  elevationGainM: number;
  elevationLossM: number;
  avgHr?: number;
  avgCadence?: number;
  avgSpeedKmh: number;
  isFastest?: boolean;
  isSlowest?: boolean;
}

export interface HeartRateZone {
  zone: number;
  name: string;
  minBpm: number;
  maxBpm: number;
  timeSeconds: number;
  percent: number;
  color: string;
  description: string;
}

export interface BestEffort {
  distanceLabel: string;
  targetDistanceM: number;
  timeFormatted: string;
  timeSeconds: number;
  paceFormatted: string;
  achieved: boolean;
  startIndex?: number;
  endIndex?: number;
}

export interface GPXActivity {
  id: string;
  title: string;
  filename: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTimeFormatted: string;
  creator?: string;

  // Summary Metrics
  totalDistanceKm: number;
  totalDistanceM: number;
  totalTimeSeconds: number;
  movingTimeSeconds: number;
  elapsedPaceFormatted: string;
  movingPaceFormatted: string;
  movingPaceSeconds: number;
  bestPaceFormatted: string;
  bestPaceSeconds: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;

  // Elevation
  elevationGainM: number;
  elevationLossM: number;
  minElevationM: number;
  maxElevationM: number;

  // Energy & GAP
  estimatedCalories: number;
  gapPaceFormatted: string; // Grade Adjusted Pace
  gapPaceSeconds: number;

  // Heart Rate
  hasHeartRate: boolean;
  avgHeartRate?: number;
  maxHeartRate?: number;
  minHeartRate?: number;
  heartRateZones?: HeartRateZone[];

  // Cadence
  hasCadence: boolean;
  avgCadence?: number;
  maxCadence?: number;
  avgStrideLengthM?: number;

  // Power & Temp
  hasPower: boolean;
  avgPowerWatts?: number;
  maxPowerWatts?: number;
  hasTemperature: boolean;
  avgTemperature?: number;

  // Splits & Best Efforts
  splits: KmSplit[];
  bestEfforts: BestEffort[];

  // Raw Points & Bounds
  pointsCount: number;
  points: GPXTrackPoint[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };

  savedAt: string;
}
