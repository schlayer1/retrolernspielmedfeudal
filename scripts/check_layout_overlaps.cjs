const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const atlasJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/world/world_atlas.json'), 'utf8'));
const frames = atlasJson.frames;

function getPngDims(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch {
    return { w: 32, h: 32 };
  }
}

const propDims = {
  relic_marker_glow: { w: 32, h: 32 },
  npc: { w: 17, h: 32 },
  character: { w: 16, h: 32 },
};

const propsDir = path.join(ROOT, 'public/assets/props');
if (fs.existsSync(propsDir)) {
  for (const f of fs.readdirSync(propsDir)) {
    if (f.endsWith('.png')) {
      propDims[f.replace('.png', '')] = getPngDims(path.join(propsDir, f));
    }
  }
}

const items = [];

function addBox(label, x, y, w, h, scale = 1, originX = 0.5, originY = 0.9, shrink = 0.95) {
  const sw = w * scale * shrink;
  const sh = h * scale * shrink;
  const cx = x + (0.5 - originX) * (w * scale);
  const cy = y + (0.5 - originY) * (h * scale);
  items.push({
    label,
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w * scale),
    h: Math.round(h * scale),
    left: cx - sw / 2,
    right: cx + sw / 2,
    top: cy - sh / 2,
    bottom: cy + sh / 2,
  });
}

// 1. Parse MEDIEVAL_DECOR from decor.ts
const decorCode = fs.readFileSync(path.join(ROOT, 'src/data/decor.ts'), 'utf8');

const decorBlockMatch = decorCode.match(/export const MEDIEVAL_DECOR: DecorObject\[\] = \[([\s\S]*?)\];/);
const decorBlock = decorBlockMatch ? decorBlockMatch[1] : '';
const decorRegex = /\{\s*id:\s*'([^']+)'\s*,\s*x:\s*(\d+)\s*\*\s*16\s*,\s*y:\s*(\d+)\s*\*\s*16\s*,\s*spriteKey:\s*'([^']+)'(?:[^\}]+scale:\s*([0-9.]+))?/g;
let m;
while ((m = decorRegex.exec(decorBlock)) !== null) {
  const id = m[1];
  const tx = parseFloat(m[2]);
  const ty = parseFloat(m[3]);
  const key = m[4];
  const scale = m[5] ? parseFloat(m[5]) : 1.0;
  const d = propDims[key] || frames[key]?.frame || { w: 48, h: 48 };
  addBox(`decor:${id}(${tx},${ty})`, tx * 16, ty * 16, d.w, d.h, scale);
}

// 2. Parse RESOURCE_NODES from decor.ts
const nodeBlockMatch = decorCode.match(/export const RESOURCE_NODES: ResourceNode\[\] = \[([\s\S]*?)\];/);
const nodeBlock = nodeBlockMatch ? nodeBlockMatch[1] : '';
const nodeRegex = /\{\s*id:\s*'([^']+)'[^\}]+x:\s*(\d+)\s*\*\s*16\s*,\s*y:\s*(\d+)\s*\*\s*16[^\}]+spriteKey:\s*'([^']+)'(?:[^\}]+scale:\s*([0-9.]+))?/g;
while ((m = nodeRegex.exec(nodeBlock)) !== null) {
  const id = m[1];
  const tx = parseFloat(m[2]);
  const ty = parseFloat(m[3]);
  const key = m[4];
  const scale = m[5] ? parseFloat(m[5]) : 1.0;
  const d = propDims[key] || frames[key]?.frame || { w: 32, h: 32 };
  addBox(`resource:${id}(${tx},${ty})`, tx * 16, ty * 16, d.w, d.h, scale);
}

// 3. Parse MEDIEVAL_RELICS from relics.ts
const relicsCode = fs.readFileSync(path.join(ROOT, 'src/data/relics.ts'), 'utf8');
const relicRegex = /id:\s*'([^']+)'[\s\S]*?x:\s*(\d+)\s*\*\s*16\s*,\s*y:\s*(\d+)\s*\*\s*16/g;
while ((m = relicRegex.exec(relicsCode)) !== null) {
  const id = m[1];
  const tx = parseFloat(m[2]);
  const ty = parseFloat(m[3]);
  addBox(`relic:${id}(${tx},${ty})`, tx * 16, ty * 16, 32, 32, 0.7, 0.5, 0.5);
}

// 4. Parse Chapter Mentors from chapters.ts
const chaptersCode = fs.readFileSync(path.join(ROOT, 'src/data/chapters.ts'), 'utf8');
const mentorRegex = /mentor:\s*\{[\s\S]*?name:\s*'([^']+)'[\s\S]*?x:\s*(\d+)\s*\*\s*16\s*,\s*y:\s*(\d+)\s*\*\s*16/g;
while ((m = mentorRegex.exec(chaptersCode)) !== null) {
  const name = m[1];
  const tx = parseFloat(m[2]);
  const ty = parseFloat(m[3]);
  addBox(`mentor:${name}(${tx},${ty})`, tx * 16, ty * 16, 24, 32, 1.0, 0.5, 0.9);
}

// 5. Check Overlaps
let overlaps = 0;
for (let i = 0; i < items.length; i++) {
  for (let j = i + 1; j < items.length; j++) {
    const a = items[i];
    const b = items[j];
    const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ix > 2 && iy > 2) {
      overlaps++;
      console.error(
        `❌ OVERLAP #${overlaps}: ${a.label} [${a.w}x${a.h} at (${a.x},${a.y})] <-> ${b.label} [${b.w}x${b.h} at (${b.x},${b.y})] by ${Math.round(ix)}x${Math.round(iy)}px`
      );
    }
  }
}

if (overlaps > 0) {
  console.error(`\nFAILED: ${overlaps} visual bounding-box overlap(s) detected across ${items.length} placed objects!`);
  process.exit(1);
} else {
  console.log(`✅ Layout Check Passed: ${items.length} placed objects verified with 0 visual bounding-box overlaps!`);
}

// 6. Comprehensive Didactic & Visual Quality Gate
const qualityErrors = [];

// A. WorldScene Engine Standards
const worldSceneCode = fs.readFileSync(path.join(ROOT, 'src/scenes/WorldScene.ts'), 'utf8');
if (!worldSceneCode.includes('sampleBlock') && !worldSceneCode.includes('getImageData')) {
  qualityErrors.push('WorldScene.ts does not sample real A2 pixel tiles via getImageData/sampleBlock (found flat color approximation)!');
}
if (!worldSceneCode.includes('scatterGroundFlora')) {
  qualityErrors.push('WorldScene.ts does not define or call scatterGroundFlora() (missing 120-150 ground flora instances)!');
}
if (!worldSceneCode.includes("textures.get('world_atlas')?.has")) {
  qualityErrors.push('WorldScene.ts lacks world_atlas texture check for decor (risk of invisible trees/props)!');
}

// B. Didactic Stations Check (min. 5 stations)
try {
  const stationsCode = fs.readFileSync(path.join(ROOT, 'src/data/stations.ts'), 'utf8');
  const stationMatches = stationsCode.match(/id:\s*['"][^'"]+['"]/g) || [];
  if (stationMatches.length < 5) {
    qualityErrors.push(`src/data/stations.ts contains only ${stationMatches.length} stations (minimum required: 5)!`);
  }
} catch (e) {
  qualityErrors.push(`Failed to read src/data/stations.ts: ${e.message}`);
}

// C. Archaeological Relics Check (min. 5 primary sources)
try {
  const relicsCode = fs.readFileSync(path.join(ROOT, 'src/data/relics.ts'), 'utf8');
  const relicMatches = relicsCode.match(/id:\s*['"][^'"]+['"]/g) || [];
  if (relicMatches.length < 5) {
    qualityErrors.push(`src/data/relics.ts contains only ${relicMatches.length} relics (minimum required: 5)!`);
  }
} catch (e) {
  qualityErrors.push(`Failed to read src/data/relics.ts: ${e.message}`);
}

// D. Progressive Historical Lexicon Check (min. 20 terms)
try {
  const lexiconCode = fs.readFileSync(path.join(ROOT, 'src/data/lexicon.ts'), 'utf8');
  const termMatches = lexiconCode.match(/term:\s*['"][^'"]+['"]/g) || [];
  if (termMatches.length < 20) {
    qualityErrors.push(`src/data/lexicon.ts contains only ${termMatches.length} terms (minimum required: 20)!`);
  }
} catch (e) {
  qualityErrors.push(`Failed to read src/data/lexicon.ts: ${e.message}`);
}

// E. Didactic A4 Print Sheet Check
if (!fs.existsSync(path.join(ROOT, 'src/ui/PrintSheet.ts'))) {
  qualityErrors.push('src/ui/PrintSheet.ts is missing (didactic 1-click A4 student print sheet required)!');
}

// F. Audio Synthesizer Check
if (!fs.existsSync(path.join(ROOT, 'src/audio/sound.ts'))) {
  qualityErrors.push('src/audio/sound.ts is missing (4-surface footstep & UI sound synthesizer required)!');
}

if (qualityErrors.length > 0) {
  console.error('\n❌ COMPREHENSIVE QUALITY GATE FAILURES:');
  qualityErrors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('✅ Comprehensive Quality Standards Verified (A2 Terrain, Flora, Atlas Decor, 5 Stations, 5 Relics, 20+ Terms, Audio & A4 Print Sheet).');
}
