const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = path.resolve(__dirname, '..', 'artifacts');
const CONV_DIR = '/Users/nicolekeller/.gemini/antigravity/brain/542f4dee-9fc3-49c1-acc1-35bdcda5b5b1';
const PORT = 4186;

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}
if (!fs.existsSync(CONV_DIR)) {
  fs.mkdirSync(CONV_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function saveScreenshot(page, filename) {
  const p1 = path.join(ARTIFACT_DIR, filename);
  const p2 = path.join(CONV_DIR, filename);
  await page.screenshot({ path: p1 });
  try {
    fs.copyFileSync(p1, p2);
  } catch (e) {}
  console.log(`✅ Captured: ${filename}`);
}

async function main() {
  console.log(`🚀 Starting Vite preview server on port ${PORT}...`);
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => console.log(`[Vite] ${d.toString().trim()}`));
  server.stderr.on('data', (d) => console.error(`[Vite Err] ${d.toString().trim()}`));

  await sleep(2500);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const errors = [];
  const failedUrls = [];

  try {
    const page = await browser.newPage();

    page.on('pageerror', (err) => {
      console.error('PAGE ERROR:', err.message);
      errors.push(`PAGEERROR: ${err.message}`);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('CONSOLE ERROR:', msg.text());
        errors.push(`CONSOLE: ${msg.text()}`);
      }
    });

    page.on('response', (res) => {
      if (res.status() >= 400) {
        console.warn(`FAILED RESOURCE [${res.status()}]: ${res.url()}`);
        failedUrls.push(`${res.status()} ${res.url()}`);
      }
    });

    // 1. Desktop Start Screen (1440x900)
    console.log(`Navigating to http://localhost:${PORT}/ ...`);
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await saveScreenshot(page, 'verify_1_desktop_start.png');

    // 2. Mobile Landscape Start Screen (844x390, iPhone Querformat)
    await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2 });
    await sleep(600);
    await saveScreenshot(page, 'verify_2_mobile_start.png');

    // 3. Switch back to Desktop 1440x900 & Launch Chapter 1 Dialog
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await sleep(400);
    const startBtn = await page.$('#btn-start-game, #start-game-btn');
    if (startBtn) {
      await startBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await sleep(800);

    // Open mentor dialog if not already open
    await page.evaluate(() => {
      const win = window;
      if (win.__openMentorDialog && win.__MEDIEVAL_CHAPTERS) {
        win.__openMentorDialog(win.__MEDIEVAL_CHAPTERS[0]);
      }
    });
    await sleep(600);
    await saveScreenshot(page, 'verify_3_ch1_dialog.png');

    // 4. Close dialog -> Chapter 1 Overworld + Steinzeit Top-HUD + Hotbar
    await page.keyboard.press('Escape');
    await sleep(800);
    await saveScreenshot(page, 'verify_4_ch1_overworld.png');

    // 5. River & Flora exploration
    await page.evaluate(() => {
      const win = window;
      const game = win.__GAME__;
      if (game) {
        const world = game.scene.getScene('WorldScene');
        if (world && world.player) {
          world.player.setPosition(44 * 16, 64 * 16);
          world.cameras.main.centerOn(44 * 16, 64 * 16);
          if (world.companionManager) {
            world.companionManager.unlock(42 * 16, 64 * 16);
          }
        }
      }
    });
    await sleep(1000);
    await saveScreenshot(page, 'verify_5_river_and_flora.png');

    // 6. Crafting Modal ([C])
    await page.keyboard.press('KeyC');
    await sleep(600);
    await saveScreenshot(page, 'verify_6_crafting_modal.png');
    await page.keyboard.press('Escape');
    await sleep(400);

    // 7. Progressive 2-Column Lexicon Modal ([L] - 27 entries)
    await page.keyboard.press('KeyL');
    await sleep(600);
    await saveScreenshot(page, 'verify_7_lexicon_modal.png');
    await page.keyboard.press('Escape');
    await sleep(400);

    // 8. Interactive Didactic Station (Kräutermörser)
    await page.evaluate(() => {
      if (typeof window.__openStation === 'function') {
        window.__openStation('station_kraeuter');
      }
    });
    await sleep(650);
    await saveScreenshot(page, 'verify_8_interactive_station.png');
    await page.evaluate(() => {
      const el = document.getElementById('station-modal');
      if (el) el.remove();
    });
    await sleep(400);

    // 9. 360° Artifact Inspector Modal (Lehnsurkunde)
    await page.evaluate(() => {
      if (typeof window.__openArtifactInspector === 'function') {
        window.__openArtifactInspector('relic_lehnsurkunde');
      }
    });
    await sleep(650);
    await saveScreenshot(page, 'verify_9_artifact_inspector.png');
    await page.evaluate(() => {
      const el = document.getElementById('artifact-inspector-modal');
      if (el) el.remove();
    });
    await sleep(400);

    // 10. 7-Tile Pause Dashboard ([P])
    await page.keyboard.press('KeyP');
    await sleep(600);
    await saveScreenshot(page, 'verify_10_pause_dashboard.png');
    await page.keyboard.press('Escape');
    await sleep(400);

    // 11. Walkable Medieval Interior Scene (Burgsaal / Palas)
    await page.evaluate(() => {
      if (typeof window.__enterSampleInterior === 'function') {
        window.__enterSampleInterior();
      }
    });
    await sleep(900);
    await saveScreenshot(page, 'verify_11_interior_scene.png');

    console.log('Errors:', errors.length);
    if (errors.length > 0) console.error(errors);
    console.log('Failed URLs:', failedUrls.length);
    if (failedUrls.length > 0) console.error(failedUrls);

    if (errors.length > 0 || failedUrls.length > 0) {
      process.exitCode = 1;
    } else {
      console.log('🏆 ALL 11 BROWSER VERIFICATION SCREENSHOTS CAPTURED WITH 0 ERRORS!');
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
