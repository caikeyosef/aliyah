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

  // 1. RENDER BACKGROUND
  if (options.backgroundStyle === 'photo' && options.customPhotoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = options.customPhotoUrl!;
      });

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

      // Clean cinematic dark gradient overlay
      const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
      overlayGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      overlayGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
      overlayGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, width, height);
    } catch {
      drawMatteBackground(ctx, width, height);
    }
  } else if (options.backgroundStyle === 'matte') {
    drawMatteBackground(ctx, width, height);
  } else if (options.backgroundStyle === 'amber') {
    drawAmberBackground(ctx, width, height);
  } else if (options.backgroundStyle === 'transparent') {
    drawTransparentStickerCard(ctx, width, height);
  } else {
    // Default 'dark' (Deep Obsidian)
    drawDarkBackground(ctx, width, height);
  }

  // Common horizontal grid:
  const centerX = width / 2; // 540
  const marginX = 90;
  const contentWidth = width - marginX * 2; // 900

  // 2. TOP BRANDING (MINIMALIST WORDMARK)
  const topY = 180;
  ctx.save();
  ctx.textAlign = 'center';

  // Minimal brand wordmark: ALIYAH
  ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  // Emulate letter spacing
  drawLetterSpacedText(ctx, 'A L I Y A H', centerX, topY);

  // Subtle date / category
  const dateFormatted = formatDateStr(post.date);
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  const topCategory = isRunning ? `CORRIDA • ${dateFormatted}` : `TREINO • ${dateFormatted}`;
  drawLetterSpacedText(ctx, topCategory, centerX, topY + 45);

  ctx.restore();

  // 3. RENDER CONTENT
  if (isRunning && post.runningSummary) {
    renderMinimalistRunning(ctx, post.runningSummary, centerX, marginX, contentWidth, accent, options.showRouteMap !== false);
  } else if (isWorkout && post.workoutSummary) {
    renderMinimalistWorkout(ctx, post, centerX, marginX, contentWidth, accent, options.showExercises !== false);
  }

  // 4. BOTTOM MINIMALIST FOOTER
  const footerY = height - 140;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  drawLetterSpacedText(ctx, 'A L I Y A H', centerX, footerY);
  ctx.restore();
}

// ==========================================
// RUNNING: PURE STRAVA MINIMALIST LAYOUT
// ==========================================
function renderMinimalistRunning(
  ctx: CanvasRenderingContext2D,
  summary: NonNullable<FeedPost['runningSummary']>,
  centerX: number,
  marginX: number,
  contentWidth: number,
  accentColor: string,
  drawMap: boolean
) {
  ctx.save();

  // 3 Vertically Stacked Hero Metrics (Centered, Identical to Strava Story Image 2)
  const metrics = [
    { label: 'DISTÂNCIA', value: `${summary.distanceKm.toFixed(2)} km`, size: 96 },
    { label: 'RITMO MÉDIO', value: `${summary.avgPaceFormatted.replace(' /km', '')} /km`, size: 80 },
    { label: 'TEMPO', value: summary.movingTimeFormatted, size: 80 },
  ];

  let currentY = 400;

  metrics.forEach((m) => {
    // Label (Small, uppercase, generous letter spacing)
    ctx.textAlign = 'center';
    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    drawLetterSpacedText(ctx, m.label, centerX, currentY);

    // Value (Large, bold, pure white)
    ctx.font = `900 ${m.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(m.value, centerX, currentY + m.size - 6);

    currentY += m.size + 70; // Harmonious proportional step
  });

  // GPS Route Vector Drawing (Strava glowing neon stroke, perfectly centered)
  const hasRoute = drawMap && summary.routePolylinePoints && summary.routePolylinePoints.length > 2;

  if (hasRoute) {
    const mapY = currentY + 30;
    const mapH = 420;
    const mapW = 640;
    const mapX = (1080 - mapW) / 2;

    const points = summary.routePolylinePoints!;
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
    const pad = 24;
    const innerW = mapW - pad * 2;
    const innerH = mapH - pad * 2;

    const coords = points.map((p) => ({
      x: mapX + pad + ((p.lng - minLng) / lngSpan) * innerW,
      y: mapY + pad + innerH - ((p.lat - minLat) / latSpan) * innerH,
    }));

    // Soft neon glow underlay
    ctx.save();
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 24;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 8;
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
    ctx.lineWidth = 4;
    ctx.stroke();

    // Start Marker (Minimal Green Dot)
    const startPt = coords[0];
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#050a18';
    ctx.stroke();

    // Finish Marker (Minimal Amber Dot)
    const endPt = coords[coords.length - 1];
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#050a18';
    ctx.stroke();

    ctx.restore();

    // Subtitle under map: Elevation & Calories
    const metaY = mapY + mapH + 50;
    ctx.textAlign = 'center';
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`+${summary.elevationGainM}m elevação   •   ${summary.calories} kcal`, centerX, metaY);
  } else {
    // If no map: Clean single secondary strip
    const metaY = currentY + 60;
    ctx.textAlign = 'center';
    ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`+${summary.elevationGainM}m ELEVAÇÃO   •   ${summary.calories} KCAL`, centerX, metaY);
  }

  ctx.restore();
}

// ==========================================
// WORKOUT: PURE HEVY MINIMALIST LAYOUT
// ==========================================
function renderMinimalistWorkout(
  ctx: CanvasRenderingContext2D,
  post: FeedPost,
  centerX: number,
  marginX: number,
  contentWidth: number,
  accentColor: string,
  drawExercises: boolean
) {
  const summary = post.workoutSummary;
  if (!summary) return;

  ctx.save();

  const totalEx = summary.exercises.length;
  // Use spacious single-column width for up to 10 exercises so full names have 660+ px of space
  const isTwoColumns = totalEx > 10;
  const isLargeList = totalEx >= 7;
  const isMediumList = totalEx >= 5;

  // 1. Activity Title (Centered, Clean, Uppercase - Never truncated)
  const titleY = isLargeList ? 285 : isMediumList ? 320 : 350;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';

  const cleanTitle = post.title.toUpperCase();
  drawCompleteFittedText(ctx, cleanTitle, centerX, titleY, contentWidth - 40, 42, 22, '900');

  // Subtitle / Muscle Focus (Clean tags)
  let headerBottomY = titleY;
  if (summary.muscleGroups.length > 0) {
    ctx.font = '700 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = accentColor;
    const focusText = summary.muscleGroups.map((m) => `#${m.toUpperCase()}`).join('   ');
    drawLetterSpacedText(ctx, focusText, centerX, titleY + 40);
    headerBottomY = titleY + 40;
  }

  // 2. The Hevy 3-Stat Card (Unified width: 900px, centered)
  const cardY = headerBottomY + 50;
  const cardH = isLargeList ? 165 : 185;
  const cardX = marginX;
  const cardW = contentWidth;

  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.stroke();

  // 3 Columns inside Card
  const colWidth = cardW / 3;
  const cols = [
    { label: 'DURAÇÃO', value: `${summary.durationMinutes}`, unit: 'min' },
    { label: 'VOLUME', value: `${summary.totalVolumeKg.toLocaleString('pt-BR')}`, unit: 'kg' },
    { label: 'SÉRIES', value: `${summary.totalSets}`, unit: 'sets' },
  ];

  cols.forEach((col, idx) => {
    const colCenterX = cardX + idx * colWidth + colWidth / 2;

    // Vertical Divider
    if (idx > 0) {
      ctx.beginPath();
      ctx.moveTo(cardX + idx * colWidth, cardY + 28);
      ctx.lineTo(cardX + idx * colWidth, cardY + cardH - 28);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Label
    ctx.textAlign = 'center';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    drawLetterSpacedText(ctx, col.label, colCenterX, cardY + (isLargeList ? 48 : 55));

    // Value
    ctx.font = `900 ${isLargeList ? 46 : 50}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(col.value, colCenterX, cardY + (isLargeList ? 104 : 115));

    // Unit
    ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = accentColor;
    drawLetterSpacedText(ctx, col.unit.toUpperCase(), colCenterX, cardY + (isLargeList ? 138 : 152));
  });

  // 3. PR Banner (if achieved)
  let currentY = cardY + cardH + (isLargeList ? 24 : 32);
  if (summary.prsAchieved && summary.prsAchieved.length > 0) {
    const prH = isLargeList ? 56 : 66;
    drawRoundedRect(ctx, cardX, currentY, cardW, prH, 18);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    const prText = `🏆 NOVO RECORDE: ${summary.prsAchieved[0].toUpperCase()}`;
    drawCompleteFittedText(ctx, prText, centerX, currentY + (isLargeList ? 36 : 42), cardW - 30, isLargeList ? 19 : 21, 13, '800');

    currentY += prH + (isLargeList ? 20 : 26);
  }

  // 4. Exercises List (ALL exercises rendered with COMPLETE names)
  if (drawExercises && totalEx > 0) {
    const exList = summary.exercises; // ALL exercises included, none left out!
    const footerMaxY = 1750; // Keep safe distance before ALIYAH footer
    const availableH = Math.max(200, footerMaxY - currentY);

    if (!isTwoColumns) {
      // Single Column layout (1 to 10 exercises, card width = 900px, 660+ px of space for full name)
      const gap = totalEx <= 4 ? 14 : totalEx <= 6 ? 11 : totalEx <= 8 ? 9 : 7;
      const rawRowH = Math.floor((availableH - (totalEx - 1) * gap) / totalEx);
      const rowH = Math.min(totalEx <= 4 ? 98 : totalEx <= 6 ? 84 : totalEx <= 8 ? 74 : 66, Math.max(56, rawRowH));

      exList.forEach((ex, idx) => {
        const rowY = currentY + idx * (rowH + gap);

        // Clean card row
        drawRoundedRect(ctx, cardX, rowY, cardW, rowH, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        // Exercise number pill
        const numStr = String(idx + 1).padStart(2, '0');
        ctx.textAlign = 'left';
        ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(numStr, cardX + 22, rowY + rowH * 0.44);

        // Exercise Name - ALWAYS COMPLETE WITHOUT ANY SLICE OR CUTOFF
        const nameX = cardX + 56;
        const rightAreaWidth = 175;
        const maxNameWidth = cardW - 56 - rightAreaWidth - 10; // ~659px of space

        ctx.fillStyle = '#ffffff';
        const measuredNameWidth = drawCompleteFittedText(
          ctx,
          ex.name,
          nameX,
          rowY + rowH * (rowH > 70 ? 0.44 : 0.46),
          ex.isPr ? maxNameWidth - 44 : maxNameWidth,
          rowH > 80 ? 25 : rowH > 68 ? 22 : 19,
          13,
          '800'
        );

        // PR Pill if record (placed right after the complete name)
        if (ex.isPr) {
          const prBadgeX = nameX + measuredNameWidth + 10;
          const prBadgeY = rowY + rowH * (rowH > 70 ? 0.44 : 0.46) - 17;
          drawRoundedRect(ctx, prBadgeX, prBadgeY, 36, 20, 6);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.stroke();

          ctx.font = '900 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'center';
          ctx.fillText('PR', prBadgeX + 18, prBadgeY + 14);
          ctx.textAlign = 'left';
        }

        // Subtitle: sets detail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const setsSubtitle = ex.setsDetail || `${ex.setsCount} séries completas`;
        drawCompleteFittedText(
          ctx,
          setsSubtitle,
          nameX,
          rowY + rowH * (rowH > 70 ? 0.78 : 0.8),
          maxNameWidth,
          rowH > 80 ? 17 : rowH > 68 ? 15 : 13,
          11,
          '600'
        );

        // Right: Max load or reps
        ctx.textAlign = 'right';
        ctx.font = `900 ${rowH > 80 ? 30 : rowH > 68 ? 26 : 22}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = accentColor;
        const rightText = ex.maxWeightKg > 0 ? `${ex.maxWeightKg} kg` : `${ex.totalReps} reps`;
        ctx.fillText(rightText, cardX + cardW - 24, rowY + rowH * 0.44);

        ctx.font = `600 ${rowH > 80 ? 16 : 13}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(`${ex.setsCount} séries`, cardX + cardW - 24, rowY + rowH * 0.78);
      });
    } else {
      // Two-Column Split Grid layout (for workouts with 11 or more exercises)
      const colGap = 16;
      const colW = (cardW - colGap) / 2; // 442px
      const numRows = Math.ceil(totalEx / 2);

      const gap = numRows >= 9 ? 6 : 8;
      const rawRowH = Math.floor((availableH - (numRows - 1) * gap) / numRows);
      const rowH = Math.min(76, Math.max(50, rawRowH));

      exList.forEach((ex, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);

        // If it's the single last item of an odd count, span both columns
        const isLastOdd = idx === totalEx - 1 && totalEx % 2 === 1;
        const thisColW = isLastOdd ? cardW : colW;
        const exX = isLastOdd ? cardX : cardX + col * (colW + colGap);
        const rowY = currentY + row * (rowH + gap);

        // Clean compact card
        drawRoundedRect(ctx, exX, rowY, thisColW, rowH, 16);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        // Exercise number
        const numStr = String(idx + 1).padStart(2, '0');
        ctx.textAlign = 'left';
        ctx.font = `800 ${rowH > 64 ? 14 : 12}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = accentColor;
        ctx.fillText(numStr, exX + 14, rowY + rowH * 0.45);

        // Exercise Name - Complete auto-fitted text (NEVER sliced)
        const nameX = exX + (rowH > 64 ? 38 : 34);
        const rightStatWidth = 85;
        const maxColNameWidth = thisColW - (nameX - exX) - rightStatWidth;

        ctx.fillStyle = '#ffffff';
        drawCompleteFittedText(
          ctx,
          ex.name,
          nameX,
          rowY + rowH * 0.45,
          maxColNameWidth,
          rowH > 64 ? 18 : 16,
          11,
          '800'
        );

        // Subtitle: sets count
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        const setsSubtitle = `${ex.setsCount} séries • ${ex.totalReps} reps`;
        drawCompleteFittedText(
          ctx,
          setsSubtitle,
          nameX,
          rowY + rowH * 0.8,
          maxColNameWidth,
          rowH > 64 ? 13 : 11,
          10,
          '600'
        );

        // Right side: Max Weight
        ctx.textAlign = 'right';
        ctx.font = `900 ${rowH > 64 ? 20 : 17}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = accentColor;
        const rightText = ex.maxWeightKg > 0 ? `${ex.maxWeightKg} kg` : `${ex.totalReps}r`;
        ctx.fillText(rightText, exX + thisColW - 14, rowY + rowH * 0.45);

        // PR tag or sets count
        ctx.font = `600 ${rowH > 64 ? 13 : 11}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        if (ex.isPr) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('★ PR', exX + thisColW - 14, rowY + rowH * 0.8);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.fillText(`${ex.setsCount} sets`, exX + thisColW - 14, rowY + rowH * 0.8);
        }
      });
    }
  }

  ctx.restore();
}

// ==========================================
// BACKGROUND STYLES
// ==========================================
function drawDarkBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Deep Obsidian with subtle radial vignette
  const grad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 950);
  grad.addColorStop(0, '#090e1a');
  grad.addColorStop(1, '#020408');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawMatteBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Pure Strava Matte Black
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, width, height);
}

function drawAmberBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const grad = ctx.createRadialGradient(width / 2, 400, 80, width / 2, height / 2, 900);
  grad.addColorStop(0, '#1a0e05');
  grad.addColorStop(0.6, '#080504');
  grad.addColorStop(1, '#020202');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawTransparentStickerCard(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  // Centered unified sticker card
  const pad = 70;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;

  drawRoundedRect(ctx, pad, pad, cardW, cardH, 48);
  ctx.fillStyle = 'rgba(6, 10, 20, 0.94)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();
}

// ==========================================
// UTILITIES
// ==========================================

/**
 * Renders complete text within maxWidth by automatically scaling font size down.
 * NEVER cuts off or truncates with ellipsis (...).
 */
function drawCompleteFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  baseFontSize: number = 24,
  minFontSize: number = 11,
  fontWeight: string = '800',
  fontFamily: string = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
): number {
  let fontSize = baseFontSize;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  let textWidth = ctx.measureText(text).width;

  while (textWidth > maxWidth && fontSize > minFontSize) {
    fontSize -= 0.5;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    textWidth = ctx.measureText(text).width;
  }

  ctx.fillText(text, x, y);
  return textWidth;
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

function drawLetterSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number = 3
) {
  const contextAny = ctx as any;
  if (typeof contextAny.letterSpacing === 'string') {
    contextAny.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x, y);
    contextAny.letterSpacing = '0px';
    return;
  }

  // Fallback: manual calculation
  const chars = text.split('');
  let totalWidth = 0;
  chars.forEach((c) => {
    totalWidth += ctx.measureText(c).width + spacing;
  });
  totalWidth -= spacing;

  let startX = x;
  if (ctx.textAlign === 'center') {
    startX = x - totalWidth / 2;
  } else if (ctx.textAlign === 'right') {
    startX = x - totalWidth;
  }

  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((c) => {
    ctx.fillText(c, startX, y);
    startX += ctx.measureText(c).width + spacing;
  });
  ctx.textAlign = prevAlign;
}

function formatDateStr(dateStr?: string): string {
  if (!dateStr) return 'HOJE';
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr === today) return 'HOJE';

    const [y, m, d] = dateStr.split('-');
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const month = months[parseInt(m, 10) - 1] || m;
    return `${d} ${month}`;
  } catch {
    return dateStr;
  }
}
