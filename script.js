let currentMode = 'addition';
let selectedElement = null;
let offset = { x: 0, y: 0 };

const canvas = document.getElementById('canvas');
const paletteContainer = document.getElementById('palette');

const colorData = {
  addition: {
    primaries: [
      { name: 'Red', hex: '#FF0000' },
      { name: 'Green', hex: '#00FF00' },
      { name: 'Blue', hex: '#0000FF' }
    ],
    secondaries: [
      { name: 'Yellow', hex: '#FFFF00' },
      { name: 'Cyan', hex: '#00FFFF' },
      { name: 'Magenta', hex: '#FF00FF' },
      { name: 'White', hex: '#FFFFFF' }
    ]
  },
  subtraction: {
    primaries: [
      { name: 'Cyan', hex: '#00FFFF' },
      { name: 'Magenta', hex: '#FF00FF' },
      { name: 'Yellow', hex: '#FFFF00' }
    ],
    secondaries: [
      { name: 'Green', hex: '#00FF00' },
      { name: 'Blue', hex: '#0000FF' },
      { name: 'Red', hex: '#FF0000' },
      { name: 'Black', hex: '#000000' }
    ]
  }
};

function updatePalette() {
  const data = colorData[currentMode];
  paletteContainer.innerHTML = '';
  
  // Combine primaries and secondaries for the display
  const allColors = [...data.primaries, ...data.secondaries];
  
  allColors.forEach(color => {
    const item = document.createElement('div');
    item.className = 'palette-item';
    item.innerHTML = `
            <div class="color-swatch" style="background-color: ${color.hex}"></div>
            <div class="palette-label">${color.name}</div>
        `;
    paletteContainer.appendChild(item);
  });
}

function getMousePosition(evt) {
  const CTM = canvas.getScreenCTM();
  if (evt.touches) { evt = evt.touches[0]; }
  return {
    x: (evt.clientX - CTM.e) / CTM.a,
    y: (evt.clientY - CTM.f) / CTM.d
  };
}

function startDrag(evt) {
  if (evt.target.tagName === 'circle') {
    selectedElement = evt.target;
    selectedElement.classList.add('dragging');
    const pos = getMousePosition(evt);
    offset.x = pos.x - parseFloat(selectedElement.getAttribute("cx"));
    offset.y = pos.y - parseFloat(selectedElement.getAttribute("cy"));
    
    // Move to front
    canvas.appendChild(selectedElement);
  }
}

function drag(evt) {
  if (selectedElement) {
    evt.preventDefault();
    const pos = getMousePosition(evt);
    selectedElement.setAttribute("cx", pos.x - offset.x);
    selectedElement.setAttribute("cy", pos.y - offset.y);
    updateCenterColor();
  }
}

function endDrag(evt) {
  if (selectedElement) {
    selectedElement.classList.remove('dragging');
    selectedElement = null;
  }
}

window.addEventListener('mousemove', drag);
window.addEventListener('mouseup', endDrag);
window.addEventListener('touchmove', drag, { passive: false });
window.addEventListener('touchend', endDrag);

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("").toUpperCase();
}

function mixColors(rgbs, mode) {
  if (mode === 'addition') {
    return {
      r: Math.min(255, rgbs.reduce((acc, curr) => acc + curr.r, 0)),
      g: Math.min(255, rgbs.reduce((acc, curr) => acc + curr.g, 0)),
      b: Math.min(255, rgbs.reduce((acc, curr) => acc + curr.b, 0))
    };
  } else {
    const cmys = rgbs.map(c => ({
      c: 1 - c.r / 255,
      m: 1 - c.g / 255,
      y: 1 - c.b / 255
    }));
    const resCmy = {
      c: Math.min(1, cmys.reduce((acc, curr) => acc + curr.c, 0)),
      m: Math.min(1, cmys.reduce((acc, curr) => acc + curr.m, 0)),
      y: Math.min(1, cmys.reduce((acc, curr) => acc + curr.y, 0))
    };
    return {
      r: 255 * (1 - resCmy.c),
      g: 255 * (1 - resCmy.m),
      b: 255 * (1 - resCmy.y)
    };
  }
}

function switchMode(mode) {
  currentMode = mode;
  document.body.className = mode;
  document.getElementById('modeAdd').classList.toggle('active', mode === 'addition');
  document.getElementById('modeSub').classList.toggle('active', mode === 'subtraction');
  
  const data = colorData[mode];
  document.getElementById('fillA').setAttribute('fill', data.primaries[0].hex);
  document.getElementById('fillB').setAttribute('fill', data.primaries[1].hex);
  document.getElementById('fillC').setAttribute('fill', data.primaries[2].hex);
  
  if (mode === 'addition') {
    document.getElementById('modeTitle').innerText = "Additive Mixing";
    document.getElementById('modeDesc').innerText = "Simulates how colored light sources combine. The primary colors are Red, Green, and Blue. Combining all three results in White.";
  } else {
    document.getElementById('modeTitle').innerText = "Subtractive Mixing";
    document.getElementById('modeDesc').innerText = "Simulates how pigments or filters absorb light. The primary colors are Cyan, Magenta, and Yellow. Combining all three results in Black.";
  }
  updatePalette();
  updateCenterColor();
}

function updateCenterColor() {
  const data = colorData[currentMode];
  const rgbA = hexToRgb(data.primaries[0].hex);
  const rgbB = hexToRgb(data.primaries[1].hex);
  const rgbC = hexToRgb(data.primaries[2].hex);
  const rgbABC = mixColors([rgbA, rgbB, rgbC], currentMode);
  document.getElementById('centerHex').innerText = `Center: ${rgbToHex(rgbABC.r, rgbABC.g, rgbABC.b)}`;
}

//Initialize 
switchMode('addition');