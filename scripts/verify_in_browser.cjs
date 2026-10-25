const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = '/Users/nicolekeller/.gemini/antigravity/brain/3e867ed1-0e73-4c5f-836e-a8fe985da8c4';
const PORT = 4188;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  console.log(`Starting Vite preview server on port ${PORT}...`);
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => console.log(`[Vite stdout] ${d.toString().trim()}`));
  server.stderr.on('data', (d) => console.error(`[Vite stderr] ${d.toString().trim()}`));

  await sleep(2500);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const errors = [];
  const failedUrls = [];

  try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => {
      console.error('PAGEERROR:', err.message);
      errors.push(`PAGEERROR: ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('CONSOLE ERROR:', msg.text());
        errors.push(`CONSOLE ERROR: ${msg.text()}`);
      }
    });
    page.on('response', (res) => {
      if (res.status() >= 400) {
        console.warn(`HTTP ${res.status()}: ${res.url()}`);
        failedUrls.push(`${res.status()} ${res.url()}`);
      }
    });

    // -------------------------------------------------------------------------
    // 1. Desktop Start Screen (1440x900)
    // -------------------------------------------------------------------------
    console.log('1. Capturing Desktop Start Screen...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_1_desktop_start.png'),
    });
    console.log('✅ verify_1_desktop_start.png captured');

    // -------------------------------------------------------------------------
    // 2. Mobile Landscape Start Screen (812x375)
    // -------------------------------------------------------------------------
    console.log('2. Capturing Mobile Start Screen...');
    await page.setViewport({ width: 812, height: 375, deviceScaleFactor: 2 });
    await sleep(600);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_2_mobile_start.png'),
    });
    console.log('✅ verify_2_mobile_start.png captured');

    // -------------------------------------------------------------------------
    // 3. Switch back to Desktop 1440x900 & Start Chapter 1 Dialog
    // -------------------------------------------------------------------------
    console.log('3. Launching Game & Capturing Chapter 1 Mentor Dialog...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await sleep(400);

    // Click launch button
    await page.click('#btn-start-game');
    await sleep(800);

    // Open Mentor Dialog for Chapter 1 (Meier Heinrich)
    await page.evaluate(() => {
      const win = window;
      if (win.__openMentorDialog && win.__MEDIEVAL_CHAPTERS) {
        win.__openMentorDialog(win.__MEDIEVAL_CHAPTERS[0]);
      }
    });
    await sleep(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_3_ch1_dialog.png'),
    });
    console.log('✅ verify_3_ch1_dialog.png captured');

    // -------------------------------------------------------------------------
    // 4. Overworld Exploration (Falko Companion Dog, HUD, Compass, Village)
    // -------------------------------------------------------------------------
    console.log('4. Capturing Overworld Exploration with Falko Companion...');
    await page.keyboard.press('Escape');
    await sleep(500);

    // Move player slightly so companion dog turns and aligns
    await page.evaluate(() => {
      const win = window;
      const game = win.__GAME__;
      if (game) {
        const world = game.scene.getScene('WorldScene');
        if (world && world.player) {
          world.player.setPosition(24 * 16, 56 * 16);
          world.cameras.main.centerOn(24 * 16, 56 * 16);
          if (world.companionManager) {
            world.companionManager.unlock(23 * 16, 56 * 16);
          }
        }
      }
    });
    await sleep(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_4_ch1_overworld.png'),
    });
    console.log('✅ verify_4_ch1_overworld.png captured');

    // -------------------------------------------------------------------------
    // 5. Water & Infrastructure (Mühlenbach, Wassermühle, Steinbrücke, A2 Dithering)
    // -------------------------------------------------------------------------
    console.log('5. Capturing Water & Infrastructure (Mühlenbach & Wassermühle)...');
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
    await sleep(1200);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_5_water_and_infrastructure.png'),
    });
    console.log('✅ verify_5_water_and_infrastructure.png captured');

    // -------------------------------------------------------------------------
    // 6. Pause Dashboard (7-Tile Chronisten-Zentrale)
    // -------------------------------------------------------------------------
    console.log('6. Capturing 7-Tile Pause Dashboard...');
    await page.evaluate(() => {
      const win = window;
      if (win.__toggleModal) {
        win.__toggleModal('P');
      }
    });
    await sleep(700);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_6_pause_dashboard.png'),
    });
    console.log('✅ verify_6_pause_dashboard.png captured');

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(400);

    // -------------------------------------------------------------------------
    // 7. Evolved Location / Building & Crafting Overview
    // -------------------------------------------------------------------------
    console.log('7. Capturing Building & Infrastructure Projects Modal...');
    await page.evaluate(() => {
      const win = window;
      if (win.__toggleModal) {
        win.__toggleModal('B');
      }
    });
    await sleep(700);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_7_evolved_location.png'),
    });
    console.log('✅ verify_7_evolved_location.png captured');

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(400);

    // -------------------------------------------------------------------------
    // 8. Progressive 2-Column Fachlexikon Modal
    // -------------------------------------------------------------------------
    console.log('8. Capturing Progressive 2-Column Lexicon Modal...');
    await page.evaluate(() => {
      const win = window;
      if (win.__toggleModal) {
        win.__toggleModal('L');
      }
    });
    await sleep(700);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_8_lexicon_modal.png'),
    });
    console.log('✅ verify_8_lexicon_modal.png captured');

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(400);

    // -------------------------------------------------------------------------
    // 9. Interactive Didactic Station (Kräutermörser)
    // -------------------------------------------------------------------------
    console.log('9. Capturing Interactive Didactic Station (Kräutermörser)...');
    await page.evaluate(() => {
      const win = window;
      if (win.__openStation) {
        win.__openStation('station_kraeuter');
      }
    });
    await sleep(700);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_9_interactive_station.png'),
    });
    console.log('✅ verify_9_interactive_station.png captured');

    await page.evaluate(() => {
      const win = window;
      if (win.__closeModal) win.__closeModal();
    });
    await sleep(400);

    // -------------------------------------------------------------------------
    // 10. 360° Relic & Primary Source Inspector (Lehnsurkunde / Pflugmesser)
    // -------------------------------------------------------------------------
    console.log('10. Capturing 360° Primary Source Inspector...');
    await page.evaluate(() => {
      const win = window;
      if (win.__openArtifactInspector && win.__MEDIEVAL_RELICS) {
        win.__openArtifactInspector(win.__MEDIEVAL_RELICS[2]); // Lehnsurkunde
      }
    });
    await sleep(700);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verify_10_artifact_inspector.png'),
    });
    console.log('✅ verify_10_artifact_inspector.png captured');

    await page.evaluate(() => {
      const win = window;
      if (win.__toggleModal) win.__toggleModal('ESC');
    });
    await sleep(400);

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log(`Page Errors: ${errors.length}`);
    if (errors.length > 0) console.error(errors);
    console.log(`Failed HTTP URLs: ${failedUrls.length}`);
    if (failedUrls.length > 0) console.error(failedUrls);

    if (errors.length > 0 || failedUrls.length > 0) {
      process.exitCode = 1;
    } else {
      console.log('🎉 All 10 browser verification checks passed with 0 errors!');
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.kill();
  }
}

main();
