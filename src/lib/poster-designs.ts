// poster-designs.ts
// Utility module for drawing festival posters on an HTML Canvas.
// Each poster design deeply matches its festival vibe, inspired by
// real music festival poster aesthetics (Coachella, Tomorrowland, Burning Man, Ultra).

interface PosterData {
  vibe: string; // "Desert Oasis" | "Urban Jungle" | "Forest Wonderland" | "Beach Paradise"
  festivalName: string;
  headliners: string[];
  subHeadliners: string[];
  openers: string[];
  venueName: string;
  venueDescription: string;
  stageSnapshot: string | null; // data URL
  customNote: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setTextStyle(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: string,
  family: string,
  color: string,
  align: CanvasTextAlign = "center",
  baseline: CanvasTextBaseline = "middle"
) {
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  count: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  color: string,
  maxRadius: number = 1.8
) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = xMin + Math.random() * (xMax - xMin);
    const y = yMin + Math.random() * (yMax - yMin);
    const r = 0.3 + Math.random() * maxRadius;
    const alpha = 0.3 + Math.random() * 0.7;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDecoratorLine(
  ctx: CanvasRenderingContext2D,
  y: number,
  color: string,
  width: number = 300,
  centerX: number = 400
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(centerX - width / 2, y);
  ctx.lineTo(centerX + width / 2, y);
  ctx.stroke();

  // Small diamond in the center
  const d = 5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(centerX, y - d);
  ctx.lineTo(centerX + d, y);
  ctx.lineTo(centerX, y + d);
  ctx.lineTo(centerX - d, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function wrapTextOnLine(
  ctx: CanvasRenderingContext2D,
  items: string[],
  separator: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let current = "";
  for (let i = 0; i < items.length; i++) {
    const test = current ? current + separator + items[i] : items[i];
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = items[i];
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ---------------------------------------------------------------------------
// Shared layout helpers (artist lineup, venue, snapshot, watermark)
// ---------------------------------------------------------------------------

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  y: number,
  color: string,
  fontFamily: string
): number {
  ctx.save();
  setTextStyle(ctx, 18, "600", fontFamily, color);
  ctx.letterSpacing = "6px";
  ctx.fillText("SUMMER 2026", 400, y);
  ctx.letterSpacing = "0px";
  ctx.restore();
  return y + 30;
}

function drawHeadliners(
  ctx: CanvasRenderingContext2D,
  headliners: string[],
  startY: number,
  color: string,
  glowColor: string,
  fontFamily: string,
  fontSize: number = 42
): number {
  let y = startY;
  ctx.save();
  for (const artist of headliners) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    setTextStyle(ctx, fontSize, "900", fontFamily, color);
    ctx.fillText(artist.toUpperCase(), 400, y, 720);
    y += fontSize + 14;
  }
  ctx.restore();
  return y + 4;
}

function drawSubHeadliners(
  ctx: CanvasRenderingContext2D,
  subHeadliners: string[],
  startY: number,
  color: string,
  fontFamily: string,
  fontSize: number = 24
): number {
  let y = startY;
  ctx.save();
  setTextStyle(ctx, fontSize, "700", fontFamily, color);
  // 2 per line with bullet separator
  for (let i = 0; i < subHeadliners.length; i += 2) {
    const pair = subHeadliners.slice(i, i + 2).map((s) => s.toUpperCase());
    const line = pair.join("  \u2022  ");
    ctx.fillText(line, 400, y, 720);
    y += fontSize + 10;
  }
  ctx.restore();
  return y + 4;
}

function drawOpeners(
  ctx: CanvasRenderingContext2D,
  openers: string[],
  startY: number,
  color: string,
  fontFamily: string
): number {
  if (openers.length === 0) return startY;
  ctx.save();
  setTextStyle(ctx, 16, "500", fontFamily, color);
  const line = openers.map((o) => o.toUpperCase()).join("  \u00B7  ");
  const lines = wrapTextOnLine(ctx, openers.map((o) => o.toUpperCase()), "  \u00B7  ", 700);
  let y = startY;
  for (const l of lines) {
    ctx.fillText(l, 400, y, 720);
    y += 24;
  }
  ctx.restore();
  return y + 8;
}

function drawStageSnapshot(
  ctx: CanvasRenderingContext2D,
  stageSnapshot: string,
  y: number,
  borderColor: string,
  shadowColor: string
): number {
  const img = new Image();
  img.src = stageSnapshot;
  const imgW = 400;
  const imgH = 225;
  const imgX = 200;
  const imgY = y;

  ctx.save();
  // Shadow
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;
  // Border
  ctx.fillStyle = borderColor;
  ctx.fillRect(imgX - 4, imgY - 4, imgW + 8, imgH + 8);
  ctx.restore();

  ctx.save();
  // Clip rounded rect for image
  const radius = 6;
  ctx.beginPath();
  ctx.moveTo(imgX + radius, imgY);
  ctx.lineTo(imgX + imgW - radius, imgY);
  ctx.arcTo(imgX + imgW, imgY, imgX + imgW, imgY + radius, radius);
  ctx.lineTo(imgX + imgW, imgY + imgH - radius);
  ctx.arcTo(imgX + imgW, imgY + imgH, imgX + imgW - radius, imgY + imgH, radius);
  ctx.lineTo(imgX + radius, imgY + imgH);
  ctx.arcTo(imgX, imgY + imgH, imgX, imgY + imgH - radius, radius);
  ctx.lineTo(imgX, imgY + radius);
  ctx.arcTo(imgX, imgY, imgX + radius, imgY, radius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, imgX, imgY, imgW, imgH);
  ctx.restore();

  // Border outline
  ctx.save();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(imgX + radius, imgY);
  ctx.lineTo(imgX + imgW - radius, imgY);
  ctx.arcTo(imgX + imgW, imgY, imgX + imgW, imgY + radius, radius);
  ctx.lineTo(imgX + imgW, imgY + imgH - radius);
  ctx.arcTo(imgX + imgW, imgY + imgH, imgX + imgW - radius, imgY + imgH, radius);
  ctx.lineTo(imgX + radius, imgY + imgH);
  ctx.arcTo(imgX, imgY + imgH, imgX, imgY + imgH - radius, radius);
  ctx.lineTo(imgX, imgY + radius);
  ctx.arcTo(imgX, imgY, imgX + radius, imgY, radius);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  return imgY + imgH + 20;
}

function drawVenue(
  ctx: CanvasRenderingContext2D,
  venueName: string,
  venueDescription: string,
  y: number,
  color: string,
  subColor: string,
  fontFamily: string
): number {
  ctx.save();
  setTextStyle(ctx, 18, "700", fontFamily, color);
  ctx.fillText(`\uD83D\uDCCD ${venueName.toUpperCase()}`, 400, y);
  y += 24;
  if (venueDescription) {
    setTextStyle(ctx, 13, "400", fontFamily, subColor);
    ctx.fillText(venueDescription, 400, y, 700);
    y += 20;
  }
  ctx.restore();
  return y + 8;
}

function drawCustomNote(
  ctx: CanvasRenderingContext2D,
  note: string,
  y: number,
  color: string,
  fontFamily: string
): number {
  if (!note) return y;
  ctx.save();
  ctx.font = `italic 400 14px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.globalAlpha = 0.85;
  ctx.fillText(note, 400, y, 700);
  ctx.restore();
  return y + 22;
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  y: number,
  color: string,
  fontFamily: string
) {
  ctx.save();
  setTextStyle(ctx, 10, "400", fontFamily, color);
  ctx.globalAlpha = 0.45;
  ctx.letterSpacing = "3px";
  ctx.fillText("BUILT WITH MAINSTAGE BUILDER", 400, y);
  ctx.letterSpacing = "0px";
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Desert Oasis
// ---------------------------------------------------------------------------

function drawDesertOasis(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: PosterData
) {
  const W = canvas.width;
  const H = canvas.height;
  const fontFamily = "'Arial Narrow', 'Impact', 'Helvetica Neue', sans-serif";

  // --- Background gradient: warm sunset ---
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#2d1b69"); // dark purple sky
  bg.addColorStop(0.3, "#6b2fa0");
  bg.addColorStop(0.55, "#c0392b");
  bg.addColorStop(0.75, "#e2725b");
  bg.addColorStop(0.9, "#f5a623");
  bg.addColorStop(1, "#ffd700");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // --- Stars in upper sky ---
  drawStars(ctx, 120, 0, W, 0, H * 0.35, "#ffffff", 2);

  // --- Large sun/moon circle ---
  ctx.save();
  const sunX = W * 0.5;
  const sunY = H * 0.38;
  const sunR = 100;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 1.6);
  sunGrad.addColorStop(0, "rgba(255, 215, 0, 0.9)");
  sunGrad.addColorStop(0.5, "rgba(245, 166, 35, 0.4)");
  sunGrad.addColorStop(1, "rgba(245, 166, 35, 0)");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Inner solid disc
  ctx.fillStyle = "#ffd700";
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- Sand dune silhouettes ---
  ctx.save();
  ctx.fillStyle = "#1a0a05";
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.quadraticCurveTo(W * 0.15, H * 0.78, W * 0.3, H * 0.85);
  ctx.quadraticCurveTo(W * 0.5, H * 0.75, W * 0.7, H * 0.82);
  ctx.quadraticCurveTo(W * 0.85, H * 0.77, W, H * 0.83);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Second dune layer
  ctx.save();
  ctx.fillStyle = "#2a1508";
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.quadraticCurveTo(W * 0.25, H * 0.82, W * 0.45, H * 0.88);
  ctx.quadraticCurveTo(W * 0.65, H * 0.80, W * 0.85, H * 0.87);
  ctx.quadraticCurveTo(W * 0.95, H * 0.84, W, H * 0.86);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // --- Cacti silhouettes ---
  ctx.save();
  ctx.fillStyle = "#0d0505";
  ctx.globalAlpha = 0.65;

  // Cactus 1 (left)
  const drawCactus = (cx: number, cy: number, scale: number) => {
    ctx.beginPath();
    // Main trunk
    ctx.rect(cx - 6 * scale, cy - 60 * scale, 12 * scale, 60 * scale);
    ctx.fill();
    // Left arm
    ctx.beginPath();
    ctx.rect(cx - 22 * scale, cy - 40 * scale, 16 * scale, 8 * scale);
    ctx.fill();
    ctx.rect(cx - 22 * scale, cy - 55 * scale, 8 * scale, 23 * scale);
    ctx.fill();
    // Right arm
    ctx.beginPath();
    ctx.rect(cx + 6 * scale, cy - 30 * scale, 18 * scale, 8 * scale);
    ctx.fill();
    ctx.rect(cx + 16 * scale, cy - 48 * scale, 8 * scale, 26 * scale);
    ctx.fill();
    // Top rounded
    ctx.beginPath();
    ctx.arc(cx, cy - 60 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();
  };

  drawCactus(90, H * 0.83, 1.4);
  drawCactus(700, H * 0.81, 1.1);
  drawCactus(750, H * 0.84, 0.8);
  ctx.restore();

  // --- Typography ---
  let cursorY = 70;

  // Festival name with gold glow
  ctx.save();
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 30;
  setTextStyle(ctx, 54, "900", fontFamily, "#ffd700");
  ctx.fillText(data.festivalName.toUpperCase(), 400, cursorY, 720);
  // Second pass for extra glow
  ctx.shadowBlur = 60;
  ctx.globalAlpha = 0.4;
  ctx.fillText(data.festivalName.toUpperCase(), 400, cursorY, 720);
  ctx.restore();
  cursorY += 50;

  // Subtitle
  cursorY = drawSubtitle(ctx, cursorY, "#f5a623", fontFamily);

  // Decorator line
  drawDecoratorLine(ctx, cursorY, "#ffd700");
  cursorY += 30;

  // Headliners
  cursorY = drawHeadliners(ctx, data.headliners, cursorY, "#ffffff", "#ffd700", fontFamily, 42);

  // Sub-headliners
  cursorY = drawSubHeadliners(ctx, data.subHeadliners, cursorY, "#f5a623", fontFamily, 24);

  // Decorative line
  drawDecoratorLine(ctx, cursorY, "rgba(255,215,0,0.5)", 200);
  cursorY += 24;

  // Openers
  cursorY = drawOpeners(ctx, data.openers, cursorY, "rgba(255,255,255,0.8)", fontFamily);

  // Stage snapshot
  if (data.stageSnapshot) {
    cursorY = drawStageSnapshot(ctx, data.stageSnapshot, cursorY, "#ffd700", "rgba(45,27,105,0.6)");
  }

  // Venue
  cursorY = drawVenue(ctx, data.venueName, data.venueDescription, cursorY, "#ffd700", "rgba(255,255,255,0.65)", fontFamily);

  // Custom note
  cursorY = drawCustomNote(ctx, data.customNote, cursorY, "#f5a623", fontFamily);

  // Watermark
  drawWatermark(ctx, Math.max(cursorY + 10, H - 20), "rgba(255,255,255,0.5)", fontFamily);
}

// ---------------------------------------------------------------------------
// Urban Jungle
// ---------------------------------------------------------------------------

function drawUrbanJungle(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: PosterData
) {
  const W = canvas.width;
  const H = canvas.height;
  const fontFamily = "'Helvetica Neue', 'Arial', sans-serif";

  // --- Background gradient: dark neon cityscape ---
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#000000");
  bg.addColorStop(0.4, "#1a0033");
  bg.addColorStop(0.7, "#2a004a");
  bg.addColorStop(0.85, "#4a0060");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // --- Neon grid (synthwave floor) ---
  ctx.save();
  const gridY = H * 0.72;
  // Horizontal lines
  ctx.strokeStyle = "rgba(124, 77, 255, 0.3)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const y = gridY + i * ((H - gridY) / 20);
    const alpha = 0.1 + (i / 20) * 0.4;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // Vertical perspective lines
  ctx.strokeStyle = "rgba(0, 229, 255, 0.25)";
  const vanishX = W / 2;
  const vanishY = gridY;
  for (let i = -10; i <= 10; i++) {
    const bottomX = vanishX + i * 80;
    ctx.globalAlpha = 0.15 + Math.abs(i) * 0.02;
    ctx.beginPath();
    ctx.moveTo(vanishX, vanishY);
    ctx.lineTo(bottomX, H);
    ctx.stroke();
  }
  ctx.restore();

  // --- City skyline silhouettes ---
  ctx.save();
  ctx.fillStyle = "#0a0015";
  const buildings = [
    { x: 0, w: 60, h: 250 },
    { x: 50, w: 45, h: 180 },
    { x: 90, w: 70, h: 310 },
    { x: 155, w: 50, h: 200 },
    { x: 195, w: 40, h: 160 },
    { x: 230, w: 80, h: 280 },
    { x: 300, w: 55, h: 350 },
    { x: 348, w: 65, h: 220 },
    { x: 405, w: 50, h: 300 },
    { x: 445, w: 75, h: 240 },
    { x: 510, w: 45, h: 190 },
    { x: 548, w: 60, h: 330 },
    { x: 600, w: 70, h: 260 },
    { x: 665, w: 50, h: 200 },
    { x: 705, w: 55, h: 290 },
    { x: 755, w: 60, h: 220 },
  ];
  for (const b of buildings) {
    ctx.fillRect(b.x, H - b.h, b.w, b.h);
    // Window lights
    ctx.save();
    ctx.fillStyle = "rgba(0, 229, 255, 0.15)";
    for (let wy = H - b.h + 15; wy < H - 20; wy += 18) {
      for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 14) {
        if (Math.random() > 0.5) {
          ctx.fillRect(wx, wy, 6, 8);
        }
      }
    }
    ctx.restore();
  }
  // Neon edge glow on top of buildings
  ctx.save();
  ctx.strokeStyle = "#7c4dff";
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  for (const b of buildings) {
    ctx.strokeRect(b.x, H - b.h, b.w, b.h);
  }
  ctx.restore();
  ctx.restore();

  // --- Scanline overlay ---
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#000000";
  for (let y = 0; y < H; y += 3) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.restore();

  // --- Typography with glitch effect ---
  let cursorY = 80;

  // Festival name with neon glow + glitch offset
  ctx.save();
  const nameText = data.festivalName.toUpperCase();
  const nameSize = 52;

  // Glitch: cyan offset
  ctx.globalAlpha = 0.5;
  setTextStyle(ctx, nameSize, "900", fontFamily, "#00e5ff");
  ctx.fillText(nameText, 400 - 3, cursorY + 2, 720);

  // Glitch: pink offset
  setTextStyle(ctx, nameSize, "900", fontFamily, "#ff4081");
  ctx.fillText(nameText, 400 + 3, cursorY - 2, 720);

  // Main text with neon glow
  ctx.globalAlpha = 1;
  ctx.shadowColor = "#00e5ff";
  ctx.shadowBlur = 40;
  setTextStyle(ctx, nameSize, "900", fontFamily, "#ffffff");
  ctx.fillText(nameText, 400, cursorY, 720);
  ctx.shadowBlur = 80;
  ctx.globalAlpha = 0.5;
  ctx.fillText(nameText, 400, cursorY, 720);
  ctx.restore();
  cursorY += 50;

  // Subtitle
  cursorY = drawSubtitle(ctx, cursorY, "#7c4dff", fontFamily);

  // Decorator line (neon)
  ctx.save();
  const lineGrad = ctx.createLinearGradient(200, cursorY, 600, cursorY);
  lineGrad.addColorStop(0, "rgba(0,229,255,0)");
  lineGrad.addColorStop(0.3, "rgba(0,229,255,0.8)");
  lineGrad.addColorStop(0.5, "rgba(255,64,129,0.8)");
  lineGrad.addColorStop(0.7, "rgba(124,77,255,0.8)");
  lineGrad.addColorStop(1, "rgba(124,77,255,0)");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.shadowColor = "#00e5ff";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(150, cursorY);
  ctx.lineTo(650, cursorY);
  ctx.stroke();
  ctx.restore();
  cursorY += 30;

  // Headliners with glitch
  ctx.save();
  let y = cursorY;
  for (const artist of data.headliners) {
    const text = artist.toUpperCase();
    const sz = 40;
    // Glitch layers
    ctx.globalAlpha = 0.35;
    setTextStyle(ctx, sz, "900", fontFamily, "#ff4081");
    ctx.fillText(text, 400 + 2, y + 1, 720);
    setTextStyle(ctx, sz, "900", fontFamily, "#00e5ff");
    ctx.fillText(text, 400 - 2, y - 1, 720);
    // Main
    ctx.globalAlpha = 1;
    ctx.shadowColor = "#7c4dff";
    ctx.shadowBlur = 25;
    setTextStyle(ctx, sz, "900", fontFamily, "#ffffff");
    ctx.fillText(text, 400, y, 720);
    y += sz + 14;
  }
  ctx.restore();
  cursorY = y + 4;

  // Sub-headliners
  cursorY = drawSubHeadliners(ctx, data.subHeadliners, cursorY, "#00e5ff", fontFamily, 24);

  // Neon divider
  ctx.save();
  ctx.strokeStyle = "rgba(124, 77, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.shadowColor = "#7c4dff";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(250, cursorY);
  ctx.lineTo(550, cursorY);
  ctx.stroke();
  ctx.restore();
  cursorY += 24;

  // Openers
  cursorY = drawOpeners(ctx, data.openers, cursorY, "rgba(0,229,255,0.75)", fontFamily);

  // Stage snapshot
  if (data.stageSnapshot) {
    cursorY = drawStageSnapshot(ctx, data.stageSnapshot, cursorY, "#7c4dff", "rgba(0,0,0,0.8)");
  }

  // Venue
  cursorY = drawVenue(ctx, data.venueName, data.venueDescription, cursorY, "#ff4081", "rgba(0,229,255,0.6)", fontFamily);

  // Custom note
  cursorY = drawCustomNote(ctx, data.customNote, cursorY, "#7c4dff", fontFamily);

  // Watermark
  drawWatermark(ctx, Math.max(cursorY + 10, H - 20), "rgba(255,255,255,0.3)", fontFamily);
}

// ---------------------------------------------------------------------------
// Forest Wonderland
// ---------------------------------------------------------------------------

function drawForestWonderland(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: PosterData
) {
  const W = canvas.width;
  const H = canvas.height;
  const fontFamily = "'Georgia', 'Garamond', 'Times New Roman', serif";

  // --- Background gradient: deep forest ---
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#001a0e");
  bg.addColorStop(0.3, "#002e1a");
  bg.addColorStop(0.6, "#004d40");
  bg.addColorStop(0.85, "#00352c");
  bg.addColorStop(1, "#001510");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // --- Moon glow ---
  ctx.save();
  const moonX = W * 0.5;
  const moonY = H * 0.12;
  const moonGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 200);
  moonGrad.addColorStop(0, "rgba(29, 233, 182, 0.3)");
  moonGrad.addColorStop(0.3, "rgba(29, 233, 182, 0.15)");
  moonGrad.addColorStop(0.6, "rgba(0, 230, 118, 0.05)");
  moonGrad.addColorStop(1, "rgba(0, 230, 118, 0)");
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 200, 0, Math.PI * 2);
  ctx.fill();
  // Moon disc
  ctx.fillStyle = "rgba(29, 233, 182, 0.15)";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- Pine tree silhouettes along edges ---
  ctx.save();
  ctx.fillStyle = "#001208";
  const drawPine = (cx: number, baseY: number, h: number, w: number) => {
    ctx.beginPath();
    // Trunk
    ctx.rect(cx - 4, baseY - h * 0.15, 8, h * 0.15);
    ctx.fill();
    // Tree layers (triangles)
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const layerW = w * (0.3 + (i * 0.25));
      const layerH = h / layers;
      const layerY = baseY - h + i * layerH * 0.7;
      ctx.beginPath();
      ctx.moveTo(cx, layerY);
      ctx.lineTo(cx - layerW / 2, layerY + layerH);
      ctx.lineTo(cx + layerW / 2, layerY + layerH);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Left side trees
  drawPine(15, H, 400, 80);
  drawPine(55, H, 340, 70);
  drawPine(30, H, 300, 60);
  drawPine(80, H, 260, 55);
  // Right side trees
  drawPine(W - 15, H, 380, 80);
  drawPine(W - 55, H, 350, 75);
  drawPine(W - 35, H, 280, 60);
  drawPine(W - 85, H, 240, 50);
  // Background trees (shorter, more alpha)
  ctx.globalAlpha = 0.5;
  drawPine(120, H, 200, 50);
  drawPine(W - 120, H, 220, 55);
  drawPine(160, H, 170, 40);
  drawPine(W - 160, H, 180, 45);
  ctx.restore();

  // --- Vine / branch decorative borders ---
  ctx.save();
  ctx.strokeStyle = "#1de9b6";
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.3;
  // Left vine
  ctx.beginPath();
  ctx.moveTo(40, 0);
  ctx.bezierCurveTo(50, 200, 30, 400, 55, 600);
  ctx.bezierCurveTo(35, 800, 60, 1000, 40, H);
  ctx.stroke();
  // Leaf nubs on left vine
  for (let vy = 80; vy < H; vy += 120) {
    ctx.beginPath();
    ctx.ellipse(48, vy, 10, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Right vine
  ctx.beginPath();
  ctx.moveTo(W - 40, 0);
  ctx.bezierCurveTo(W - 50, 250, W - 30, 450, W - 55, 650);
  ctx.bezierCurveTo(W - 35, 850, W - 60, 1050, W - 40, H);
  ctx.stroke();
  for (let vy = 120; vy < H; vy += 130) {
    ctx.beginPath();
    ctx.ellipse(W - 48, vy, 10, 5, -Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // --- Fireflies / particles ---
  drawStars(ctx, 80, 60, W - 60, 50, H - 100, "#69f0ae", 2.5);
  // Extra bright ones
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const fx = 80 + Math.random() * (W - 160);
    const fy = 80 + Math.random() * (H - 200);
    const fr = 2 + Math.random() * 3;
    const fireGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr * 3);
    fireGrad.addColorStop(0, "rgba(105, 240, 174, 0.8)");
    fireGrad.addColorStop(0.5, "rgba(105, 240, 174, 0.2)");
    fireGrad.addColorStop(1, "rgba(105, 240, 174, 0)");
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, fr * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- Typography (mystical/ethereal) ---
  let cursorY = 75;

  // Festival name with moon glow
  ctx.save();
  ctx.shadowColor = "#1de9b6";
  ctx.shadowBlur = 35;
  setTextStyle(ctx, 50, "700", fontFamily, "#69f0ae");
  ctx.fillText(data.festivalName.toUpperCase(), 400, cursorY, 720);
  ctx.shadowBlur = 70;
  ctx.globalAlpha = 0.35;
  ctx.fillText(data.festivalName.toUpperCase(), 400, cursorY, 720);
  ctx.restore();
  cursorY += 48;

  // Subtitle
  cursorY = drawSubtitle(ctx, cursorY, "#1de9b6", fontFamily);

  // Decorative line
  ctx.save();
  ctx.strokeStyle = "#1de9b6";
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.shadowColor = "#00e676";
  ctx.shadowBlur = 8;
  // Ornamental line with curves
  ctx.beginPath();
  ctx.moveTo(200, cursorY);
  ctx.quadraticCurveTo(300, cursorY - 8, 400, cursorY);
  ctx.quadraticCurveTo(500, cursorY + 8, 600, cursorY);
  ctx.stroke();
  ctx.restore();
  cursorY += 28;

  // Headliners
  cursorY = drawHeadliners(ctx, data.headliners, cursorY, "#ffffff", "#1de9b6", fontFamily, 40);

  // Sub-headliners
  cursorY = drawSubHeadliners(ctx, data.subHeadliners, cursorY, "#69f0ae", fontFamily, 23);

  // Decorative line
  ctx.save();
  ctx.strokeStyle = "rgba(29, 233, 182, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(250, cursorY);
  ctx.lineTo(550, cursorY);
  ctx.stroke();
  ctx.restore();
  cursorY += 22;

  // Openers
  cursorY = drawOpeners(ctx, data.openers, cursorY, "rgba(105,240,174,0.75)", fontFamily);

  // Stage snapshot
  if (data.stageSnapshot) {
    cursorY = drawStageSnapshot(ctx, data.stageSnapshot, cursorY, "#1de9b6", "rgba(0,30,20,0.7)");
  }

  // Venue
  cursorY = drawVenue(ctx, data.venueName, data.venueDescription, cursorY, "#1de9b6", "rgba(105,240,174,0.6)", fontFamily);

  // Custom note
  cursorY = drawCustomNote(ctx, data.customNote, cursorY, "#69f0ae", fontFamily);

  // Watermark
  drawWatermark(ctx, Math.max(cursorY + 10, H - 20), "rgba(105,240,174,0.4)", fontFamily);
}

// ---------------------------------------------------------------------------
// Beach Paradise
// ---------------------------------------------------------------------------

function drawBeachParadise(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: PosterData
) {
  const W = canvas.width;
  const H = canvas.height;
  const fontFamily = "'Trebuchet MS', 'Gill Sans', 'Helvetica Neue', sans-serif";

  // --- Background gradient: tropical sunset → ocean ---
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1a237e"); // deep navy
  bg.addColorStop(0.2, "#283593");
  bg.addColorStop(0.4, "#0097a7");
  bg.addColorStop(0.6, "#00b0ff");
  bg.addColorStop(0.78, "#40c4ff");
  bg.addColorStop(0.88, "#ff8f00");
  bg.addColorStop(0.95, "#ff6f00");
  bg.addColorStop(1, "#e65100");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // --- Sunset disc behind text area ---
  ctx.save();
  const sunCX = W / 2;
  const sunCY = H * 0.22;
  const sunGrad = ctx.createRadialGradient(sunCX, sunCY, 20, sunCX, sunCY, 180);
  sunGrad.addColorStop(0, "rgba(255, 111, 0, 0.7)");
  sunGrad.addColorStop(0.4, "rgba(255, 143, 0, 0.3)");
  sunGrad.addColorStop(0.7, "rgba(255, 193, 7, 0.1)");
  sunGrad.addColorStop(1, "rgba(255, 193, 7, 0)");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunCX, sunCY, 180, 0, Math.PI * 2);
  ctx.fill();
  // Inner sun
  ctx.fillStyle = "rgba(255, 111, 0, 0.5)";
  ctx.beginPath();
  ctx.arc(sunCX, sunCY, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- Wave silhouettes at bottom ---
  ctx.save();
  // Wave 1 (back)
  ctx.fillStyle = "rgba(0, 96, 100, 0.5)";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.moveTo(0, H * 0.88);
  for (let x = 0; x <= W; x += 5) {
    const y = H * 0.88 + Math.sin((x / W) * Math.PI * 4) * 15 + Math.sin((x / W) * Math.PI * 2.5) * 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Wave 2 (mid)
  ctx.fillStyle = "rgba(0, 77, 100, 0.6)";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.91);
  for (let x = 0; x <= W; x += 5) {
    const y = H * 0.91 + Math.sin((x / W) * Math.PI * 3 + 1) * 12 + Math.cos((x / W) * Math.PI * 5) * 6;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Wave 3 (front)
  ctx.fillStyle = "rgba(0, 55, 80, 0.7)";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.94);
  for (let x = 0; x <= W; x += 5) {
    const y = H * 0.94 + Math.sin((x / W) * Math.PI * 5 + 2) * 10 + Math.sin((x / W) * Math.PI * 1.5) * 8;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // --- Palm tree silhouettes ---
  ctx.save();
  ctx.fillStyle = "rgba(0, 20, 40, 0.6)";
  const drawPalmTree = (baseX: number, baseY: number, trunkH: number, lean: number) => {
    // Trunk (curved)
    ctx.beginPath();
    ctx.moveTo(baseX - 6, baseY);
    ctx.quadraticCurveTo(baseX + lean * 0.5 - 6, baseY - trunkH * 0.5, baseX + lean - 5, baseY - trunkH);
    ctx.quadraticCurveTo(baseX + lean * 0.5 + 6, baseY - trunkH * 0.5, baseX + 6, baseY);
    ctx.closePath();
    ctx.fill();

    // Fronds
    const topX = baseX + lean;
    const topY = baseY - trunkH;
    const frondAngles = [-2.5, -1.8, -1.0, -0.3, 0.3, 1.0, 1.8, 2.5];
    for (const angle of frondAngles) {
      const frondLen = 60 + Math.random() * 30;
      const endX = topX + Math.cos(angle) * frondLen;
      const endY = topY + Math.sin(angle) * frondLen * 0.4 - 10;
      const cpX = topX + Math.cos(angle) * frondLen * 0.6;
      const cpY = topY - 20 + Math.sin(angle) * frondLen * 0.15;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 20, 40, 0.6)";
      ctx.stroke();
    }
  };

  drawPalmTree(60, H * 0.9, 350, -25);
  drawPalmTree(130, H * 0.92, 280, 15);
  drawPalmTree(W - 60, H * 0.9, 330, 30);
  drawPalmTree(W - 140, H * 0.91, 260, -10);
  ctx.restore();

  // --- Typography (relaxed, flowing) ---
  let cursorY = 80;

  // Festival name with warm glow
  ctx.save();
  ctx.shadowColor = "#ff6f00";
  ctx.shadowBlur = 30;
  setTextStyle(ctx, 52, "800", fontFamily, "#ffffff");
  ctx.fillText(data.festivalName.toUpperCase(), 400, cursorY, 720);
  // Second glow pass
  ctx.shadowColor = "#40c4ff";
  ctx.shadowBlur = 50;
  ctx.globalAlpha = 0.3;
  ctx.fillText(data.festivalName.toUpperCase(), 400, cursorY, 720);
  ctx.restore();
  cursorY += 50;

  // Water reflection effect below festival name
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.scale(1, -0.4);
  setTextStyle(ctx, 52, "800", fontFamily, "#40c4ff");
  ctx.fillText(data.festivalName.toUpperCase(), 400, -(cursorY + 10), 720);
  ctx.restore();

  // Subtitle
  cursorY = drawSubtitle(ctx, cursorY, "#40c4ff", fontFamily);

  // Tropical decorative line
  ctx.save();
  const tropGrad = ctx.createLinearGradient(200, cursorY, 600, cursorY);
  tropGrad.addColorStop(0, "rgba(255, 111, 0, 0)");
  tropGrad.addColorStop(0.3, "rgba(255, 111, 0, 0.6)");
  tropGrad.addColorStop(0.5, "rgba(64, 196, 255, 0.8)");
  tropGrad.addColorStop(0.7, "rgba(255, 111, 0, 0.6)");
  tropGrad.addColorStop(1, "rgba(255, 111, 0, 0)");
  ctx.strokeStyle = tropGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, cursorY);
  ctx.lineTo(650, cursorY);
  ctx.stroke();
  ctx.restore();
  cursorY += 30;

  // Headliners
  cursorY = drawHeadliners(ctx, data.headliners, cursorY, "#ffffff", "#ff6f00", fontFamily, 42);

  // Sub-headliners
  cursorY = drawSubHeadliners(ctx, data.subHeadliners, cursorY, "#40c4ff", fontFamily, 24);

  // Divider
  ctx.save();
  ctx.strokeStyle = "rgba(64, 196, 255, 0.35)";
  ctx.lineWidth = 1;
  // Wavy line
  ctx.beginPath();
  for (let x = 250; x <= 550; x += 2) {
    const wy = cursorY + Math.sin(((x - 250) / 300) * Math.PI * 4) * 3;
    if (x === 250) ctx.moveTo(x, wy);
    else ctx.lineTo(x, wy);
  }
  ctx.stroke();
  ctx.restore();
  cursorY += 24;

  // Openers
  cursorY = drawOpeners(ctx, data.openers, cursorY, "rgba(255,255,255,0.7)", fontFamily);

  // Stage snapshot
  if (data.stageSnapshot) {
    cursorY = drawStageSnapshot(ctx, data.stageSnapshot, cursorY, "#40c4ff", "rgba(26,35,126,0.6)");
  }

  // Venue
  cursorY = drawVenue(ctx, data.venueName, data.venueDescription, cursorY, "#ff6f00", "rgba(64,196,255,0.65)", fontFamily);

  // Custom note
  cursorY = drawCustomNote(ctx, data.customNote, cursorY, "#40c4ff", fontFamily);

  // Watermark
  drawWatermark(ctx, Math.max(cursorY + 10, H - 20), "rgba(255,255,255,0.35)", fontFamily);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function drawFestivalPoster(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: {
    vibe: string;
    festivalName: string;
    headliners: string[];
    subHeadliners: string[];
    openers: string[];
    venueName: string;
    venueDescription: string;
    stageSnapshot: string | null;
    customNote: string;
  }
): void {
  // Ensure canvas dimensions
  canvas.width = 800;
  canvas.height = 1200;

  // Clear canvas
  ctx.clearRect(0, 0, 800, 1200);

  // Reset transforms
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Dispatch to the appropriate vibe-specific renderer
  switch (data.vibe) {
    case "Desert Oasis":
      drawDesertOasis(ctx, canvas, data);
      break;
    case "Urban Jungle":
      drawUrbanJungle(ctx, canvas, data);
      break;
    case "Forest Wonderland":
      drawForestWonderland(ctx, canvas, data);
      break;
    case "Beach Paradise":
      drawBeachParadise(ctx, canvas, data);
      break;
    default:
      // Fallback: use Desert Oasis as the default design
      drawDesertOasis(ctx, canvas, data);
      break;
  }
}
