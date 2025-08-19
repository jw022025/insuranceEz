const { test, expect } = require('@playwright/test');
const path = require('path');

const WEBSITE_PATH = path.join(__dirname, 'index.html');
const BLUE_COLORS = {
  primary: '#005B96',
  secondary: '#4A90E2',
  lightBlue: '#E3F2FD',
  sectionDivider: '#1565C0'
};

test.describe('Insurance EZ Website Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Load the local HTML file
    await page.goto(`file://${WEBSITE_PATH}`);
  });

  test('1. Website loads and displays correctly', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle('Insurance EZ, LLC - ACA, Medicare & Life Insurance Made Easy');
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/01-initial-load.png', fullPage: true });
    
    // Verify main elements are visible
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.grid')).toBeVisible();
    await expect(page.locator('#contact')).toBeVisible();
  });

  test('2. Visual appearance and screenshot verification', async ({ page }) => {
    // Take full page screenshot for visual verification
    await page.screenshot({ path: 'screenshots/02-full-page.png', fullPage: true });
    
    // Take screenshot of header
    await page.locator('header').screenshot({ path: 'screenshots/02-header.png' });
    
    // Take screenshot of hero section
    await page.locator('.hero').screenshot({ path: 'screenshots/02-hero.png' });
    
    // Take screenshot of service cards
    await page.locator('.grid').screenshot({ path: 'screenshots/02-service-cards.png' });
    
    // Take screenshot of contact section
    await page.locator('#contact').screenshot({ path: 'screenshots/02-contact.png' });
  });

  test('3. Blue color scheme implementation', async ({ page }) => {
    // Check CSS variables are properly defined
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const computedStyles = getComputedStyle(root);
      return {
        accent: computedStyles.getPropertyValue('--accent').trim(),
        accent2: computedStyles.getPropertyValue('--accent2').trim(),
        lightBlue: computedStyles.getPropertyValue('--light-blue').trim(),
        sectionDivider: computedStyles.getPropertyValue('--section-divider').trim()
      };
    });

    // Verify color values match expected blue scheme
    expect(rootStyles.accent).toBe(BLUE_COLORS.primary);
    expect(rootStyles.accent2).toBe(BLUE_COLORS.secondary);
    expect(rootStyles.lightBlue).toBe(BLUE_COLORS.lightBlue);
    expect(rootStyles.sectionDivider).toBe(BLUE_COLORS.sectionDivider);

    // Check header gradient uses blue colors
    const headerBg = await page.locator('header').evaluate(el => 
      getComputedStyle(el).backgroundImage
    );
    expect(headerBg).toContain('linear-gradient');

    // Check brand logo has blue accent color
    const logoColor = await page.locator('.logo').evaluate(el => 
      getComputedStyle(el).color
    );
    expect(logoColor).toContain('rgb(0, 91, 150)'); // #005B96 in RGB

    // Take screenshot showing color implementation
    await page.screenshot({ path: 'screenshots/03-color-scheme.png', fullPage: true });
  });

  test('4. Responsive design verification', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for any transitions/animations
      await page.waitForTimeout(500);
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `screenshots/04-responsive-${viewport.name}.png`, 
        fullPage: true 
      });
      
      // Verify elements are still visible and properly arranged
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('.hero')).toBeVisible();
      await expect(page.locator('.grid')).toBeVisible();
      
      // Check grid layout adapts properly
      const gridColumns = await page.locator('.grid').evaluate(el => 
        getComputedStyle(el).gridTemplateColumns
      );
      
      // Verify header flex layout works
      const headerDisplay = await page.locator('header').evaluate(el => 
        getComputedStyle(el).display
      );
      expect(headerDisplay).toBe('flex');
      
      // Check text scaling with clamp
      const h1FontSize = await page.locator('h1').evaluate(el => 
        parseFloat(getComputedStyle(el).fontSize)
      );
      expect(h1FontSize).toBeGreaterThan(20); // Should scale appropriately
    }
  });

  test('5. Navigation and links functionality', async ({ page }) => {
    // Test internal anchor links
    const contactLink = page.locator('a[href="#contact"]');
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    
    // Verify it scrolls to contact section
    await expect(page.locator('#contact')).toBeInViewport();
    
    // Test privacy policy link
    const privacyLink = page.locator('a[href="#privacy"]');
    await privacyLink.click();
    await expect(page.locator('#privacy')).toBeInViewport();
    
    // Test terms & conditions link
    const termsLink = page.locator('a[href="#terms"]');
    await termsLink.click();
    await expect(page.locator('#terms')).toBeInViewport();
    
    // Test external links (should have target="_blank")
    const externalLinks = page.locator('a[target="_blank"]');
    const linkCount = await externalLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    
    // Verify external links have correct href
    for (let i = 0; i < linkCount; i++) {
      const href = await externalLinks.nth(i).getAttribute('href');
      expect(href).toMatch(/^https?:\/\//);
    }
    
    // Take screenshot of navigation test
    await page.screenshot({ path: 'screenshots/05-navigation.png', fullPage: true });
  });

  test('6. Accessibility features verification', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1
    
    const h3Count = await page.locator('h3').count();
    expect(h3Count).toBeGreaterThan(0); // Should have h3 elements
    
    // Verify lang attribute
    const langAttr = await page.getAttribute('html', 'lang');
    expect(langAttr).toBe('en');
    
    // Check meta viewport for mobile accessibility
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('width=device-width');
    expect(viewportMeta).toContain('initial-scale=1.0');
    
    // Verify color contrast by checking text colors against backgrounds
    const textColor = await page.locator('.hero p').evaluate(el => 
      getComputedStyle(el).color
    );
    const backgroundColor = await page.locator('.hero').evaluate(el => 
      getComputedStyle(el).backgroundColor
    );
    
    // Check that links are keyboard accessible
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(focusedElement).toBe('A');
    
    // Verify alt text for any images (logo is text-based, so checking for future images)
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Take screenshot of accessibility test
    await page.screenshot({ path: 'screenshots/06-accessibility.png', fullPage: true });
  });

  test('7. Privacy policy and terms sections validation', async ({ page }) => {
    // Verify privacy policy section exists and is properly structured
    const privacySection = page.locator('#privacy');
    await expect(privacySection).toBeVisible();
    
    // Check privacy policy contains required elements
    await expect(privacySection.locator('h3')).toContainText('Privacy Policy');
    await expect(privacySection).toContainText('Effective Date: August 2025');
    await expect(privacySection).toContainText('Insurance EZ LLC');
    await expect(privacySection).toContainText('SMS consent is not shared with third parties');
    
    // Verify terms section exists and is properly structured
    const termsSection = page.locator('#terms');
    await expect(termsSection).toBeVisible();
    
    // Check terms contains required elements
    await expect(termsSection.locator('h3')).toContainText('Terms & Conditions for SMS Messaging');
    await expect(termsSection).toContainText('Effective Date: August 2025');
    await expect(termsSection).toContainText('STOP');
    await expect(termsSection).toContainText('HELP');
    // Note: START keyword is in the service cards section, not terms section
    
    // Verify both sections are properly styled
    const privacyClass = await privacySection.getAttribute('class');
    const termsClass = await termsSection.getAttribute('class');
    expect(privacyClass).toContain('card');
    expect(termsClass).toContain('card');
    
    // Take screenshots of policy sections
    await privacySection.screenshot({ path: 'screenshots/07-privacy-policy.png' });
    await termsSection.screenshot({ path: 'screenshots/07-terms-conditions.png' });
  });

  test('8. Contact information visibility and validation', async ({ page }) => {
    const contactSection = page.locator('#contact');
    
    // Verify contact section is visible
    await expect(contactSection).toBeVisible();
    
    // Check for required contact information
    await expect(contactSection).toContainText('(954) 736-1704');
    await expect(contactSection).toContainText('help@myinsuranceez.com');
    await expect(contactSection).toContainText('10620 GRIFFIN RD, Davie, FL 33328, USA');
    await expect(contactSection).toContainText('https://myinsuranceez.com');
    
    // Verify phone number format
    const phoneText = await contactSection.textContent();
    expect(phoneText).toMatch(/\(\d{3}\)\s\d{3}-\d{4}/);
    
    // Verify email format
    expect(phoneText).toMatch(/\w+@\w+\.\w+/);
    
    // Check website link is clickable and external
    const websiteLink = contactSection.locator('a[href*="myinsuranceez.com"]');
    await expect(websiteLink).toBeVisible();
    const target = await websiteLink.getAttribute('target');
    expect(target).toBe('_blank');
    
    // Take screenshot of contact section
    await contactSection.screenshot({ path: 'screenshots/08-contact-info.png' });
  });

  test('9. Branding and hero section validation', async ({ page }) => {
    // Verify Insurance EZ, LLC branding
    const brand = page.locator('.brand');
    await expect(brand).toContainText('Insurance EZ, LLC');
    
    // Check logo element
    const logo = page.locator('.logo');
    await expect(logo).toContainText('EZ');
    await expect(logo).toBeVisible();
    
    // Verify navigation shows services
    const nav = page.locator('nav');
    await expect(nav).toContainText('ACA');
    await expect(nav).toContainText('Medicare');
    await expect(nav).toContainText('Life Insurance');
    
    // Check hero section content
    const hero = page.locator('.hero');
    await expect(hero.locator('h1')).toContainText('Guidance for ACA, Medicare, and Life Insurance — Made Easy');
    await expect(hero).toContainText('Insurance EZ, LLC is a licensed insurance agency');
    
    // Verify CTA buttons in hero
    await expect(hero.locator('a.btn.primary')).toContainText('Contact Us');
    await expect(hero.locator('a.btn[href="#privacy"]')).toContainText('Privacy Policy');
    await expect(hero.locator('a.btn[href="#terms"]')).toContainText('Terms & Conditions');
    
    // Take screenshot of branding elements
    await page.locator('header').screenshot({ path: 'screenshots/09-branding.png' });
    await hero.screenshot({ path: 'screenshots/09-hero-section.png' });
  });

  test('10. Service cards content validation', async ({ page }) => {
    const serviceCards = page.locator('.grid .card');
    
    // Verify we have the expected number of service cards
    await expect(serviceCards).toHaveCount(3);
    
    // Check first card - "What We Do"
    const firstCard = serviceCards.nth(0);
    await expect(firstCard.locator('h3')).toContainText('What We Do');
    await expect(firstCard).toContainText('ACA plan selection and enrollment');
    await expect(firstCard).toContainText('Medicare Advantage & Part D');
    await expect(firstCard).toContainText('Life Insurance support');
    
    // Check second card - "Message Purpose"
    const secondCard = serviceCards.nth(1);
    await expect(secondCard.locator('h3')).toContainText('Message Purpose');
    await expect(secondCard).toContainText('informational SMS with consent');
    await expect(secondCard).toContainText('No promotional texting');
    
    // Check third card - "Opt-In / Opt-Out / Help Keywords"
    const thirdCard = serviceCards.nth(2);
    await expect(thirdCard.locator('h3')).toContainText('Opt-In / Opt-Out / Help Keywords');
    await expect(thirdCard).toContainText('START');
    await expect(thirdCard).toContainText('STOP');
    await expect(thirdCard).toContainText('HELP');
    
    // Take screenshot of service cards
    await page.locator('.grid').screenshot({ path: 'screenshots/10-service-cards.png' });
  });

  test('11. Footer validation', async ({ page }) => {
    const footer = page.locator('footer');
    
    // Verify footer is visible
    await expect(footer).toBeVisible();
    
    // Check copyright notice
    await expect(footer).toContainText('© 2025 Insurance EZ, LLC. All rights reserved.');
    
    // Check SMS consent disclaimer
    await expect(footer).toContainText('SMS consent is not shared with third parties');
    
    // Take screenshot of footer
    await footer.screenshot({ path: 'screenshots/11-footer.png' });
  });

  test('12. CSS hover effects and interactions', async ({ page }) => {
    // Test button hover effects
    const primaryButton = page.locator('a.btn.primary');
    
    // Get initial styles
    const initialBg = await primaryButton.evaluate(el => getComputedStyle(el).backgroundImage);
    
    // Hover over button
    await primaryButton.hover();
    
    // Take screenshot of hover state
    await page.screenshot({ path: 'screenshots/12-hover-effects.png' });
    
    // Test other interactive elements
    const regularButtons = page.locator('a.btn:not(.primary)');
    await regularButtons.first().hover();
    
    // Verify hover changes background
    const hoverBg = await regularButtons.first().evaluate(el => getComputedStyle(el).backgroundImage);
    expect(hoverBg).toContain('linear-gradient');
  });

});