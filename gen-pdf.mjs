import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const htmlFile = 'file:///' + path.resolve('EMAIL_INTAKE_IMPROVEMENTS_DASHBOARD.html').replaceAll('\\', '/');
    
    console.log('Abrindo:', htmlFile);
    await page.goto(htmlFile, { waitUntil: 'networkidle0' });
    
    console.log('Gerando PDF...');
    await page.pdf({
      path: 'EMAIL_INTAKE_IMPROVEMENTS_DASHBOARD.pdf',
      format: 'A4',
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      printBackground: true,
      scale: 0.8
    });
    
    await browser.close();
    console.log('✓ PDF gerado com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Erro:', err.message);
    process.exit(1);
  }
})();
