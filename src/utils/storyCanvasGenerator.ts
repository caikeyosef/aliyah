import { FeedPost } from '../types/feed';

export type StoryBackgroundStyle = 'dark' | 'matte' | 'amber' | 'transparent' | 'photo';

export interface StoryRenderOptions {
  backgroundStyle: StoryBackgroundStyle;
  customPhotoUrl?: string;
  accentColor?: string; // default amber: #f59e0b
  showRouteMap?: boolean;
  showExercises?: boolean;
}

export async function renderStoryToCanvas(
  canvas: HTMLCanvasElement,
  post: FeedPost,
  options: StoryRenderOptions
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 1080;
  const height = 1920;
  canvas.width = width;
  canvas.height = height;

  const isRunning = post.type === 'running_gpx';
  const isWorkout = post.type === 'workout';
  const accent = options.accentColor || (isRunning ? '#f97316' : '#f59e0b');

  // 1. DRAW BACKGROUND
  if (options.backgroundStyle === 'photo' && options.customPhotoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = options.customPhotoUrl!;
      });

      // Cover fill canvas maintaining aspect ratio
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > canvasRatio) {
        drawH = height;
        drawW = height * imgRatio;
        drawX = (width - drawW) / 2;
      } else {
        drawW = width;
        drawH = width / imgRatio;
        drawY = (height - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Dark gradient overlay for legibility
      const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
      overlayGrad.addColorStop(0, 'rgba(4, 8, 20, 0.55)');
      overlayGrad.addColorStop(0.5, 'rgba(4, 8, 20, 0.4)');
      overlayGrad.addColorStop(1, 'rgba(4, 8, 20, 0.85)');
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, width, height);
    } catch {
      // Fallback to dark gradient
      drawDarkBackground(ctx, width, height);
    }
  } else if (options.backgroundStyle === 'matte') {
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, width, height);

    // Subtle dark vignette
    const vignette = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, 900);
    vignette.addColorStop(0, 'rgba(25, 30, 42, 0.2)');
    vignette.addColorStop(1, 'rgba(5, 7, 10, 0.9)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  } else if (options.backgroundStyle === 'amber') {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#150a04');
    bgGrad.addColorStop(0.4, '#090508');
    bgGrad.addColorStop(1, '#050207');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Warm top amber orb
    const radial = ctx.createRadialGradient(width / 2, 350, 100, width / 2, 350, 600);
    radial.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
    radial.addColorStop(1, 'transparent');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  } else if (options.backgroundStyle === 'transparent') {
    // Transparent or translucent sticker card
    ctx.clearRect(0, 0, width, height);
    // Draw centered rounded frosted card
    const cardX = 60;
    const cardY = 180;
    const cardW = width - 120;
    const cardH = height - 360;

    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 56);
    ctx.fillStyle = 'rgba(7, 14, 30, 0.92)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.stroke();
  } else {
    // Default 'dark'
    drawDarkBackground(ctx, width, height);
  }

  // 2. BRANDING HEADER
  ctx.save();
  const headerY = options.backgroundStyle === 'transparent' ? 240 : 160;

  // Aliyah Logo Badge
  const logoX = width / 2;
  ctx.textAlign = 'center';

  // Flame Icon / Emblem Circle
  const emblemY = headerY + 40;
  ctx.beginPath();
  ctx.arc(logoX, emblemY, 38, 0, Math.PI * 2);
  const emblemGrad = ctx.createLinearGradient(logoX - 38, emblemY - 38, logoX + 38, emblemY + 38);
  emblemGrad.addColorStop(0, '#f59e0b');
  emblemGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = emblemGrad;
  ctx.fill();

  // White inner flame symbol
  ctx.fillStyle = '#060c19';
  ctx.font = '900 36px sans-serif';
  ctx.fillText('🔥', logoX, emblemY + 12);

  // Brand Name
  ctx.font = '900 48px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '2px';
  ctx.fillText('ALIYAH', logoX, emblemY + 70);

  // Subtitle / User Handle
  ctx.font = '600 24px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  const dateFormatted = post.date || new Date().toISOString().slice(0, 10);
  ctx.fillText(`@${(post.userName || 'atleta').toLowerCase().replace(/\s+/g, '_')} • ${dateFormatted}`, logoX, emblemY + 105);

  ctx.restore();

  // 3. ACTIVITY TITLE
  ctx.save();
  const titleY = headerY + 230;
  ctx.textAlign = 'center';

  // Sport Badge Pill
  const badgeText = isRunning ? '🏃 CORRIDA AO AR LIVRE' : '🏋️ TREINO DE MUSCULAÇÃO';
  ctx.font = 'bold 22px system-ui, sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 48;
  const badgeX = (width - badgeWidth) / 2;
  const badgeY = titleY - 32;

  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 42, 21);
  ctx.fillStyle = isRunning ? 'rgba(249, 115, 22, 0.2)' : 'rgba(245, 158, 11, 0.2)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = isRunning ? 'rgba(249, 115, 22, 0.45)' : 'rgba(245, 158, 11, 0.45)';
  ctx.stroke();

  ctx.fillStyle = isRunning ? '#fb923c' : '#fbbf24';
  ctx.fillText(badgeText, width / 2, badgeY + 28);

  // Main Activity Title (e.g. "Longão de Domingo" or "Ficha A - Peito & Tríceps")
  ctx.font = '900 52px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  let displayTitle = post.title;
  if (displayTitle.length > 28) {
    displayTitle = displayTitle.slice(0, 26) + '...';
  }
  ctx.fillText(displayTitle, width / 2, titleY + 55);

  ctx.restore();

  // 4. MAIN METRICS DISPLAY (STRAVA / HEVY INSPIRATION)
  if (isRunning && post.runningSummary) {
    renderRunningMetrics(ctx, post.runningSummary, titleY + 130, width, height, accent, options.showRouteMap !== false);
  } else if (isWorkout && post.workoutSummary) {
    renderWorkoutMetrics(ctx, post.workoutSummary, titleY + 130, width, height, accent, options.showExercises !== false);
  }

  // 5. FOOTER WATERMARK
  ctx.save();
  const footerY = options.backgroundStyle === 'transparent' ? height - 240 : height - 120;
  ctx.textAlign = 'center';
  ctx.font = '800 24px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('ALIYAH • TRANSFORMAÇÃO & EVOLUÇÃO', width / 2, footerY);
  ctx.restore();
}

function drawDarkBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#040814');
  bgGrad.addColorStop(0.5, '#070f26');
  bgGrad.addColorStop(1, '#03060f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle circular ambient glow in the center
  const glow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 700);
  glow.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// RENDER RUNNING METRICS (STRAVA STYLE)
function renderRunningMetrics(
  ctx: CanvasRenderingContext2D,
  summary: NonNullable<FeedPost['runningSummary']>,
  startY: number,
  width: number,
  height: number,
  accentColor: string,
  drawMap: boolean
) {
  ctx.save();

  // Big 3 Column or Centered Hero Metric (Distance)
  // Strava Style:
  // Distance: 6.09 km
  // Pace: 5:55 /km
  // Time: 36m 7s
  const metrics = [
    { label: 'DISTÂNCIA', value: `${summary.distanceKm.toFixed(2)}`, unit: 'km' },
    { label: 'RITMO MÉDIO', value: summary.avgPaceFormatted.replace(' /km', ''), unit: '/km' },
    { label: 'TEMPO TOTAL', value: summary.movingTimeFormatted, unit: '' },
  ];

  let curY = startY;

  metrics.forEach((m) => {
    // Label
    ctx.textAlign = 'center';
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(m.label, width / 2, curY);

    // Huge Value
    ctx.font = '900 86px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    const textVal = m.unit ? `${m.value} ${m.unit}` : m.value;
    ctx.fillText(textVal, width / 2, curY + 80);

    curY += 135;
  });

  // Secondary Strip: Elevation Gain & Calories
  const secondaryY = curY + 10;
  const secBoxW = 440;
  const secBoxH = 80;
  const secBoxX = (width - secBoxW) / 2;

  drawRoundedRect(ctx, secBoxX, secondaryY, secBoxW, secBoxH, 24);
  ctx.fillStyle = 'rgba(10, 20, 44, 0.7)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.stroke();

  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(
    `⛰️ +${summary.elevationGainM}m   •   🔥 ${summary.calories} kcal`,
    width / 2,
    secondaryY + 48
  );

  // GPS Route Vector Drawing (Strava glowing neon line!)
  if (drawMap && summary.routePolylinePoints && summary.routePolylinePoints.length > 2) {
    const mapY = secondaryY + 120;
    const mapH = 340;
    const mapW = 600;
    const mapX = (width - mapW) / 2;

    const points = summary.routePolylinePoints;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    points.forEach((p) => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const latSpan = maxLat - minLat || 0.001;
    const lngSpan = maxLng - minLng || 0.001;
    const pad = 36;
    const innerW = mapW - pad * 2;
    const innerH = mapH - pad * 2;

    const coords = points.map((p) => ({
      x: mapX + pad + ((p.lng - minLng) / lngSpan) * innerW,
      y: mapY + pad + innerH - ((p.lat - minLat) / latSpan) * innerH,
    }));

    // Glow line behind
    ctx.save();
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 24;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    coords.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Sharp bright top line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // Start Marker (Green Dot)
    const startPt = coords[0];
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#050a18';
    ctx.stroke();

    // Finish Marker (Amber Dot)
    const endPt = coords[coords.length - 1];
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#050a18';
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

// RENDER WORKOUT METRICS (HEVY STYLE)
function renderWorkoutMetrics(
  ctx: CanvasRenderingContext2D,
  summary: NonNullable<FeedPost['workoutSummary']>,
  startY: number,
  width: number,
  height: number,
  accentColor: string,
  drawExercises: boolean
) {
  ctx.save();

  // Hevy Style 3 Hero Columns: Duration | Volume | Sets
  const heroCardY = startY;
  const heroCardW = width - 160;
  const heroCardX = 80;
  const heroCardH = 210;

  drawRoundedRect(ctx, heroCardX, heroCardY, heroCardW, heroCardH, 36);
  ctx.fillStyle = 'rgba(9, 18, 38, 0.75)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
  ctx.stroke();

  const colWidth = heroCardW / 3;

  const cols = [
    { label: 'DURAÇÃO', value: `${summary.durationMinutes}`, unit: 'min' },
    { label: 'VOLUME TOTAL', value: `${summary.totalVolumeKg.toLocaleString('pt-BR')}`, unit: 'kg' },
    { label: 'SÉRIES', value: `${summary.totalSets}`, unit: 'sets' },
  ];

  cols.forEach((col, idx) => {
    const colCenterX = heroCardX + idx * colWidth + colWidth / 2;

    // Divider line between columns
    if (idx > 0) {
      ctx.beginPath();
      ctx.moveTo(heroCardX + idx * colWidth, heroCardY + 35);
      ctx.lineTo(heroCardX + idx * colWidth, heroCardY + heroCardH - 35);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Label
    ctx.textAlign = 'center';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(col.label, colCenterX, heroCardY + 65);

    // Value
    ctx.font = '900 52px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(col.value, colCenterX, heroCardY + 130);

    // Unit
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(col.unit, colCenterX, heroCardY + 165);
  });

  // PR Banner if any
  let nextY = heroCardY + heroCardH + 30;
  if (summary.prsAchieved && summary.prsAchieved.length > 0) {
    const prW = heroCardW;
    const prH = 80;
    const prX = heroCardX;

    drawRoundedRect(ctx, prX, nextY, prW, prH, 24);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '800 26px system-ui, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🏆 NOVO RECORDE PESSOAL: ${summary.prsAchieved[0]}`, width / 2, nextY + 48);

    nextY += prH + 25;
  }

  // Muscle Focus Pills
  if (summary.muscleGroups.length > 0) {
    ctx.textAlign = 'center';
    const tagText = summary.muscleGroups.map((m) => `#${m.toUpperCase()}`).join('   ');
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(tagText, width / 2, nextY + 25);
    nextY += 55;
  }

  // Exercises List Cards (up to 4 prominent exercises)
  if (drawExercises && summary.exercises.length > 0) {
    const exList = summary.exercises.slice(0, 4);
    exList.forEach((ex) => {
      const exCardW = heroCardW;
      const exCardH = 90;
      const exCardX = heroCardX;

      drawRoundedRect(ctx, exCardX, nextY, exCardW, exCardH, 22);
      ctx.fillStyle = 'rgba(7, 14, 30, 0.65)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      // Exercise Name
      ctx.textAlign = 'left';
      ctx.font = '800 28px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      let exName = ex.name;
      if (exName.length > 24) exName = exName.slice(0, 22) + '...';
      ctx.fillText(exName, exCardX + 32, nextY + 42);

      // Detail
      ctx.font = '600 22px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillText(ex.setsDetail || `${ex.setsCount} séries`, exCardX + 32, nextY + 72);

      // Max Weight on right
      ctx.textAlign = 'right';
      ctx.font = '900 32px system-ui, sans-serif';
      ctx.fillStyle = '#f59e0b';
      const weightLabel = ex.maxWeightKg > 0 ? `${ex.maxWeightKg} kg` : `${ex.totalReps} reps`;
      ctx.fillText(weightLabel, exCardX + exCardW - 32, nextY + 54);

      nextY += exCardH + 16;
    });
  }

  ctx.restore();
}
