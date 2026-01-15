// Script para gerar ícones PNG a partir do SVG
const fs = require('fs');
const path = require('path');

// Verifica se o sharp está disponível
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp não está instalado. Instalando...');
  console.log('Execute: npm install --save-dev sharp');
  process.exit(1);
}

const svgPath = path.join(__dirname, '../assets/logo.svg');
const outputDir = path.join(__dirname, '../assets');

// Tamanhos necessários para Expo
const sizes = {
  'icon.png': 1024,           // Ícone principal
  'adaptive-icon.png': 1024,   // Adaptive icon (Android)
  'splash-icon.png': 1284,     // Splash screen (maior)
  'favicon.png': 48            // Favicon (web)
};

async function generateIcons() {
  if (!fs.existsSync(svgPath)) {
    console.error(`❌ Arquivo não encontrado: ${svgPath}`);
    process.exit(1);
  }

  console.log('🎨 Gerando ícones a partir do SVG...\n');

  for (const [filename, size] of Object.entries(sizes)) {
    const outputPath = path.join(outputDir, filename);
    
    try {
      await sharp(svgPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${filename} (${size}x${size}) gerado com sucesso!`);
    } catch (error) {
      console.error(`❌ Erro ao gerar ${filename}:`, error.message);
    }
  }

  console.log('\n✨ Todos os ícones foram gerados!');
}

generateIcons();


