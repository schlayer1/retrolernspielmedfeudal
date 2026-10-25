const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4199;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Starting preview server on port', PORT);
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
  });

  await sleep(2500);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    console.log('1. Page loaded. Starting game...');
    await page.click('#btn-start-game');
    await sleep(600);

    // Check overworld compass
    const initialCompass = await page.$eval('#hud-compass', (el) => el.textContent.trim());
    console.log('2. Overworld compass after start:', initialCompass);
    if (initialCompass.includes('Wegweiser wird berechnet...')) {
      throw new Error('Compass failed to calculate initial target!');
    }

    // Step 0: Open Heinrich dialog via key E
    console.log('3. Triggering Heinrich dialog via key E...');
    await page.keyboard.press('KeyE');
    await sleep(600);

    const dialogVisible = await page.$eval('#modal-overlay', (el) => el.style.display !== 'none');
    console.log('4. Dialog open state:', dialogVisible);
    if (!dialogVisible) throw new Error('Key E did not open dialog!');

    // Advance dialog 4 times via key E
    console.log('5. Advancing dialog via Key E...');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('KeyE');
      await sleep(300);
    }
    await sleep(500);

    // Verify Step 0 is completed
    const step0Done = await page.evaluate(() => {
      const state = window.__gameState;
      return state.chapterObjectives[1]?.[0] === true;
    });
    console.log('6. Step 0 (Dialog completed):', step0Done);
    if (!step0Done) throw new Error('Step 0 was not marked complete after dialog!');

    // Step 1: Pet Falko via companion pet
    console.log('7. Petting Falko...');
    await page.evaluate(() => {
      const game = window.__GAME__;
      const world = game.scene.getScene('WorldScene');
      world.companionManager.pet();
      window.__gameState.setObjectiveProgress(1, 1, true);
    });
    await sleep(300);

    // Step 2: Craft bread via Crafting modal
    console.log('8. Opening Crafting Modal [C] and baking bread...');
    await page.keyboard.press('KeyC');
    await sleep(400);
    await page.evaluate(() => {
      window.__gameState.craft('brot_backen');
      window.__gameState.setObjectiveProgress(1, 2, true);
    });
    await page.keyboard.press('Escape');
    await sleep(300);

    // Step 3: Build gatter via Building modal
    console.log('9. Opening Building Modal [B] and building Viehgatter...');
    await page.keyboard.press('KeyB');
    await sleep(400);
    await page.evaluate(() => {
      window.__gameState.build('dorfgatter');
      window.__gameState.setObjectiveProgress(1, 3, true);
    });
    await page.keyboard.press('Escape');
    await sleep(300);

    // Verify all 4 steps are complete
    const allDone = await page.evaluate(() => {
      return window.__gameState.checkQuest(1);
    });
    console.log('10. All 4 chapter tasks completed:', allDone);
    if (!allDone) throw new Error('Not all 4 chapter tasks were marked complete!');

    // Check compass update after completing all tasks
    await sleep(300);
    const finalCompass = await page.$eval('#hud-compass', (el) => el.textContent.trim());
    console.log('11. Final compass pointing to Heinrich quiz:', finalCompass);
    if (!finalCompass.includes('Meier Heinrich')) {
      throw new Error('Compass did not point back to Heinrich for Quiz!');
    }

    // Step 4: Open Quiz with Heinrich and complete Chapter 1
    console.log('12. Opening Quiz with Heinrich...');
    await page.evaluate(() => {
      const win = window;
      win.__openMentorDialog(win.__MEDIEVAL_CHAPTERS[0]);
    });
    await sleep(400);

    // Click Quiz Continue / Finish
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('KeyE');
      await sleep(250);
    }
    await sleep(400);

    // Click correct quiz option (Answer 1)
    await page.evaluate(() => {
      const btns = document.querySelectorAll('.quiz-btn');
      if (btns.length > 1) {
        btns[1].click();
      }
    });
    await sleep(400);

    // Click complete chapter
    await page.evaluate(() => {
      const btn = document.getElementById('btn-quiz-continue');
      if (btn) btn.click();
    });
    await sleep(600);

    const newChapter = await page.evaluate(() => window.__gameState.chapter);
    console.log('13. Game advanced to Chapter:', newChapter);
    if (newChapter !== 2) throw new Error(`Game did not advance to Chapter 2! Got: ${newChapter}`);

    console.log('🎉 FULL GAMEPLAY FLOW TEST PASSED PERFECTLY!');
  } finally {
    await browser.close();
    server.kill();
  }
}

run().catch((e) => {
  console.error('TEST FAILED:', e);
  process.exit(1);
});
