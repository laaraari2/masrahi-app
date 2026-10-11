const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Design high-resolution vector SVG (512x512)
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient (Velvet Theatre Burgundy) -->
    <radialGradient id="bgGrad" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#5a1010"/>
      <stop offset="60%" stop-color="#2d0606"/>
      <stop offset="100%" stop-color="#140202"/>
    </radialGradient>

    <!-- Golden Frame Gradient -->
    <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFEAA7"/>
      <stop offset="25%" stop-color="#D4AF37"/>
      <stop offset="50%" stop-color="#FFF2B2"/>
      <stop offset="75%" stop-color="#AA771C"/>
      <stop offset="100%" stop-color="#FFDF73"/>
    </linearGradient>

    <!-- Mask 1 Golden Gradient (Tragedy/Left) -->
    <linearGradient id="maskGold1" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFF6D1"/>
      <stop offset="30%" stop-color="#F3C649"/>
      <stop offset="70%" stop-color="#B8860B"/>
      <stop offset="100%" stop-color="#7A5200"/>
    </linearGradient>

    <!-- Mask 2 Golden Gradient (Comedy/Right) -->
    <linearGradient id="maskGold2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFBE0"/>
      <stop offset="25%" stop-color="#FCD34D"/>
      <stop offset="65%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#92400E"/>
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.8"/>
    </filter>

    <filter id="innerGlow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#FFD700" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background Base with subtle border -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)"/>
  
  <!-- Outer Decorative Golden Ring -->
  <circle cx="256" cy="256" r="236" fill="none" stroke="url(#goldRing)" stroke-width="12" filter="url(#shadow)"/>
  <circle cx="256" cy="256" r="222" fill="none" stroke="url(#goldRing)" stroke-width="2" stroke-opacity="0.6" stroke-dasharray="6,6"/>

  <!-- Spotlight Flare Behind Masks -->
  <circle cx="256" cy="240" r="140" fill="#FFD700" fill-opacity="0.12"/>

  <!-- Masks Group with 3D Shadow -->
  <g filter="url(#shadow)">
    <!-- ================= Left Mask (Tragedy / Drama) ================= -->
    <g transform="translate(140, 220) rotate(-14) scale(0.85)">
      <!-- Mask Base Silhouette -->
      <path d="M 0,-100 C 65,-100 110,-55 110,20 C 110,95 65,145 0,150 C -65,145 -110,95 -110,20 C -110,-55 -65,-100 0,-100 Z" 
            fill="url(#maskGold1)" stroke="#5A3A00" stroke-width="3"/>
      
      <!-- Eyebrows (Sad / Slanted upwards) -->
      <path d="M -65,-45 Q -35,-25 -12,-35" fill="none" stroke="#3D1A00" stroke-width="7" stroke-linecap="round"/>
      <path d="M 65,-45 Q 35,-25 12,-35" fill="none" stroke="#3D1A00" stroke-width="7" stroke-linecap="round"/>

      <!-- Eyes (Cutouts / Hollow Dark) -->
      <ellipse cx="-40" cy="-15" rx="16" ry="20" fill="#1A0303" stroke="#4A1E00" stroke-width="3"/>
      <ellipse cx="40" cy="-15" rx="16" ry="20" fill="#1A0303" stroke="#4A1E00" stroke-width="3"/>

      <!-- Nose Bridge -->
      <path d="M 0,-15 L -6,30 L 10,32" fill="none" stroke="#683900" stroke-width="5" stroke-linecap="round"/>

      <!-- Sad Mouth (Curved Downwards) -->
      <path d="M -45,95 Q 0,45 45,95 Q 0,65 -45,95 Z" fill="#1A0303" stroke="#4A1E00" stroke-width="3"/>

      <!-- Subtle Teardrop Emblem -->
      <path d="M -38,15 C -38,28 -48,34 -48,42 C -48,48 -43,53 -38,53 C -33,53 -28,48 -28,42 C -28,34 -38,28 -38,15 Z" fill="#FFE58F" fill-opacity="0.8"/>
    </g>

    <!-- ================= Right Mask (Comedy / Joy) ================= -->
    <g transform="translate(320, 245) rotate(12) scale(0.92)">
      <!-- Mask Base Silhouette -->
      <path d="M 0,-105 C 70,-105 115,-55 115,25 C 115,100 70,150 0,155 C -70,150 -115,100 -115,25 C -115,-55 -70,-105 0,-105 Z" 
            fill="url(#maskGold2)" stroke="#5A3A00" stroke-width="3"/>

      <!-- Eyebrows (Arched / Joyful) -->
      <path d="M -65,-40 Q -40,-65 -15,-45" fill="none" stroke="#3D1A00" stroke-width="7" stroke-linecap="round"/>
      <path d="M 65,-40 Q 40,-65 15,-45" fill="none" stroke="#3D1A00" stroke-width="7" stroke-linecap="round"/>

      <!-- Eyes (Crescent Laughing Eyes) -->
      <path d="M -56,-10 Q -38,-35 -20,-10" fill="none" stroke="#1A0303" stroke-width="9" stroke-linecap="round"/>
      <path d="M 56,-10 Q 38,-35 20,-10" fill="none" stroke="#1A0303" stroke-width="9" stroke-linecap="round"/>

      <!-- Nose Bridge -->
      <path d="M 0,-10 L -6,30 L 10,32" fill="none" stroke="#7A3F00" stroke-width="5" stroke-linecap="round"/>

      <!-- Smiling Open Mouth (Joyous Theatre Grin) -->
      <path d="M -55,60 Q 0,140 55,60 Q 0,85 -55,60 Z" fill="#1A0303" stroke="#4A1E00" stroke-width="3"/>
      <!-- Tongue / Inner Smile -->
      <path d="M -25,95 Q 0,80 25,95 Q 0,125 -25,95 Z" fill="#8A1C1C"/>

      <!-- Cheek Accents (Joy dimples) -->
      <circle cx="-62" cy="30" r="7" fill="#C46000" fill-opacity="0.4"/>
      <circle cx="62" cy="30" r="7" fill="#C46000" fill-opacity="0.4"/>
    </g>
  </g>

  <!-- Crown / Star Accent at the top -->
  <g transform="translate(256, 75)" filter="url(#innerGlow)">
    <polygon points="0,-22 7,-7 22,-5 11,6 14,21 0,13 -14,21 -11,6 -22,-5 -7,-7" fill="url(#goldRing)"/>
  </g>
</svg>
`;

async function generateAll() {
  const svgBuffer = Buffer.from(svgIcon);

  // 1. Android Mipmaps
  const androidTargets = [
    { dir: 'android/app/src/main/res/mipmap-mdpi', size: 48 },
    { dir: 'android/app/src/main/res/mipmap-hdpi', size: 72 },
    { dir: 'android/app/src/main/res/mipmap-xhdpi', size: 96 },
    { dir: 'android/app/src/main/res/mipmap-xxhdpi', size: 144 },
    { dir: 'android/app/src/main/res/mipmap-xxxhdpi', size: 192 },
  ];

  for (const t of androidTargets) {
    if (!fs.existsSync(t.dir)) fs.mkdirSync(t.dir, { recursive: true });
    
    // Square icon
    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .png()
      .toFile(path.join(t.dir, 'ic_launcher.png'));

    // Round icon (using circle clip)
    const radius = Math.floor(t.size / 2);
    const circleMask = Buffer.from(
      `<svg width="${t.size}" height="${t.size}"><circle cx="${radius}" cy="${radius}" r="${radius}" fill="#fff"/></svg>`
    );

    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(t.dir, 'ic_launcher_round.png'));

    // Foreground icon
    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .png()
      .toFile(path.join(t.dir, 'ic_launcher_foreground.png'));

    console.log(`Generated Android ${t.dir} (${t.size}x${t.size})`);
  }

  // 2. Web & PWA Icons
  if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/pwa-512x512.png');
  await sharp(svgBuffer).resize(192, 192).png().toFile('public/pwa-192x192.png');
  await sharp(svgBuffer).resize(64, 64).png().toFile('public/favicon.ico');
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/theatre-icon.png');
  console.log('Generated Web & PWA icons in public/');
}

generateAll().catch(console.error);
