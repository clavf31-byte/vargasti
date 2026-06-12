#!/usr/bin/env node

// Gerador de PDF simples - sem dependências externas
const fs = require('fs');
const path = require('path');

// Simulação de PDF - criar arquivo estruturado
const htmlFile = path.join(__dirname, 'EMAIL_INTAKE_IMPROVEMENTS_DASHBOARD.html');
const pdfFile = path.join(__dirname, 'EMAIL_INTAKE_IMPROVEMENTS_DASHBOARD.pdf');

if (fs.existsSync(htmlFile)) {
  try {
    // Ler o HTML
    const html = fs.readFileSync(htmlFile, 'utf-8');

    // Extrair texto do HTML (simples)
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('✓ HTML extraído com sucesso');
    console.log(`✓ Conteúdo: ${text.substring(0, 100)}...`);
    console.log(`\n⚠️  Para gerar PDF com melhor qualidade:`);
    console.log(`   npm install puppeteer`);
    console.log(`   npx puppeteer-to-pdf EMAIL_INTAKE_IMPROVEMENTS_DASHBOARD.html`);

  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
} else {
  console.error('✗ Arquivo HTML não encontrado:', htmlFile);
  process.exit(1);
}
