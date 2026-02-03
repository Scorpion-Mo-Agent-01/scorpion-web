const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const baseUrl = process.env.BASE_URL || 'http://3.129.45.10:3000';
  const username = process.env.TEST_USER || 'MOYESH';
  const password = process.env.TEST_PASS || 'moyesh123';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, '..', 'artifacts');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  const shot = async (name) => {
    const filePath = path.join(screenshotDir, name);
    await page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  };

  const log = (msg) => console.log(`[e2e] ${msg}`);

  try {
    log(`goto ${baseUrl}`);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    await shot('01-home.png');

    log('fill credentials');
    await page.waitForSelector('input[placeholder="Username"]', { timeout: 20000 });
    await page.fill('input[placeholder="Username"]', username);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button:has-text("Authenticate")');
    await page.waitForTimeout(1200);
    await shot('02-after-login-click.png');

    log('wait dashboard or auth error');
    const navResult = await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 30000 }).then(() => 'dashboard'),
      page.waitForSelector('text=Invalid credentials', { timeout: 30000 }).then(() => 'invalid'),
    ]).catch(() => 'timeout');

    if (navResult !== 'dashboard') {
      log(`navigation failed: ${navResult}`);
      await shot('03-login-failed.png');
      throw new Error(`Login did not reach dashboard (${navResult})`);
    }

    await page.waitForSelector('text=Workflow Graph', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await shot('03-dashboard.png');

    log('create workflow');
    const wfName = `Browser Test ${Date.now()}`;
    const nameInput = page.locator('input[placeholder="New workflow name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 30000 });
    await nameInput.fill(wfName);
    const planInput = page.locator('textarea[placeholder="Plan instruction (seed context)"]');
    await planInput.waitFor({ state: 'visible', timeout: 30000 });
    await planInput.fill('UI improvement flow via browser test');
    await page.click('button:has-text("Create with chain")', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await shot('04-created.png');

    log('select plan node');
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.waitFor({ state: 'visible', timeout: 30000 });
    await firstNode.click();
    await page.waitForTimeout(800);
    await shot('05-plan-node.png');

    log('final capture');
    await shot('06-final.png');

    console.log(JSON.stringify({ success: true, shots: ['01-home.png','02-after-login-click.png','03-dashboard.png','04-created.png','05-plan-node.png','06-final.png'].map(f => path.join('artifacts', f)) }));
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify({ success: false, error: String(err) }));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
