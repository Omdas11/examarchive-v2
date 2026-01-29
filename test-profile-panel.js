// Test script to verify profile panel click handler works
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

(async () => {
  console.log('🚀 Starting profile panel test...');

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    console.log('[BROWSER]', msg.text());
  });

  try {
    console.log('📄 Loading page...');
    await page.goto('http://localhost:8080/index.html', {
      waitUntil: 'networkidle0',
      timeout: 10000
    });

    console.log('⏳ Waiting for header and profile panel to load...');
    
    // Wait for both events to fire
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let headerLoaded = false;
        let panelLoaded = false;
        
        const checkBoth = () => {
          if (headerLoaded && panelLoaded) {
            resolve();
          }
        };
        
        document.addEventListener('header:loaded', () => {
          headerLoaded = true;
          checkBoth();
        });
        
        document.addEventListener('profile-panel:loaded', () => {
          panelLoaded = true;
          checkBoth();
        });
      });
    });

    console.log('✅ Both header and profile panel loaded');

    // Wait a bit for JS to attach handlers
    await page.waitForTimeout(1000);

    // Check if avatar trigger exists
    const avatarExists = await page.$('.avatar-trigger');
    if (!avatarExists) {
      console.error('❌ Avatar trigger not found!');
      process.exit(1);
    }
    console.log('✅ Avatar trigger found');

    // Check if profile panel exists
    const panelExists = await page.$('.profile-panel');
    if (!panelExists) {
      console.error('❌ Profile panel not found!');
      process.exit(1);
    }
    console.log('✅ Profile panel found');

    // Check initial state (should be closed)
    const initialOpen = await page.$('.profile-panel.open');
    if (initialOpen) {
      console.error('❌ Profile panel should be closed initially!');
      process.exit(1);
    }
    console.log('✅ Profile panel is initially closed');

    // Click the avatar trigger
    console.log('👆 Clicking avatar trigger...');
    await page.click('.avatar-trigger');

    // Wait a bit for animation
    await page.waitForTimeout(500);

    // Check if panel is now open
    const nowOpen = await page.$('.profile-panel.open');
    if (!nowOpen) {
      console.error('❌ Profile panel did NOT open after clicking avatar!');
      process.exit(1);
    }
    console.log('✅ Profile panel opened successfully!');

    // Verify panel content
    const panelName = await page.$eval('.profile-panel .profile-name', el => el.textContent);
    console.log(`📝 Panel shows name: "${panelName}"`);

    // Test closing via backdrop
    console.log('👆 Clicking backdrop to close...');
    await page.click('.profile-panel-backdrop');
    await page.waitForTimeout(500);

    const closedViaBackdrop = await page.$('.profile-panel.open');
    if (closedViaBackdrop) {
      console.error('❌ Profile panel did NOT close via backdrop!');
      process.exit(1);
    }
    console.log('✅ Profile panel closed via backdrop');

    // Test opening again and closing via close button
    await page.click('.avatar-trigger');
    await page.waitForTimeout(500);
    
    console.log('👆 Clicking close button...');
    await page.click('.profile-panel-close');
    await page.waitForTimeout(500);

    const closedViaButton = await page.$('.profile-panel.open');
    if (closedViaButton) {
      console.error('❌ Profile panel did NOT close via close button!');
      process.exit(1);
    }
    console.log('✅ Profile panel closed via close button');

    console.log('\n🎉 All tests passed!');
    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await browser.close();
    process.exit(1);
  }
})();
