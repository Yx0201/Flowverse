/**
 * 颜色结果对象
 */
export interface ColorResult {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

// --- 颜色辅助函数 (RGB <-> HSL) ---

// 辅助函数: 将 0-255 范围的 RGB 转换为 0-1 范围
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // 灰色
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6; // H 范围是 0 到 1
  }

  return [h, s, l]; // 返回 H, S, L (范围 0-1)
}

// 辅助函数: 将 0-1 范围的 HSL 转换为 0-255 范围的 RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // 灰色
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// 十六进制 <-> RGB 辅助函数 (沿用上一个实现)
function hexToRgb(hex: string): [number, number, number] {
  const color = hex.startsWith("#") ? hex.slice(1) : hex;
  const fullColor =
    color.length === 3
      ? color
          .split("")
          .map((c) => c + c)
          .join("")
      : color;
  const r = parseInt(fullColor.slice(0, 2), 16);
  const g = parseInt(fullColor.slice(2, 4), 16);
  const b = parseInt(fullColor.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.min(255, Math.max(0, val));
  const toHex = (c: number) => {
    const hex = clamp(c).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 优化后的颜色方案生成器 (基于 HSL 调整边框颜色)
 * @param hexColor 输入的十六进制颜色
 * @returns 包含背景、文字、边框颜色的对象
 */
export function generateColorScheme(hexColor: string): ColorResult {
  const cleanHex = hexColor.startsWith("#") ? hexColor : `#${hexColor}`;
  const [r, g, b] = hexToRgb(cleanHex);
  const [h, s, l] = rgbToHsl(r, g, b);

  const backgroundColor = cleanHex;

  // --- 1. 计算文字颜色 (与上一个版本逻辑相同) ---

  // 使用 ITU BT.709 亮度公式计算相对亮度 (Luminance)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const LUMINANCE_THRESHOLD = 0.55;

  const textColor = luminance > LUMINANCE_THRESHOLD ? "#000000" : "#FFFFFF";

  // --- 2. 计算边框颜色 (优化: 降低 L, 增加 S) ---

  // 调整参数: 这些值决定了边框颜色与背景的对比度
  const LIGHTNESS_DECREASE = 0.35; // 亮度降低 35%，确保比背景深
  const SATURATION_INCREASE = 0.2; // 饱和度增加 20%，使颜色更鲜亮

  // 计算新的 L 和 S
  let newL = Math.max(0, l - LIGHTNESS_DECREASE); // 亮度不能低于 0
  let newS = Math.min(1, s + SATURATION_INCREASE); // 饱和度不能超过 1

  // 如果原始颜色已经是极暗（如黑色），强制给一个可见的边框
  if (l < 0.1) {
    // 针对深色背景的特殊处理：稍微增加亮度，并确保有饱和度
    newL = Math.min(0.2, l + 0.15); // 稍微提亮一点点
    newS = Math.max(0.2, s); // 确保有一定的饱和度
  }

  // 将新的 HSL 转换回十六进制
  const [darkR, darkG, darkB] = hslToRgb(h, newS, newL);

  const borderColor = rgbToHex(darkR, darkG, darkB);

  return {
    backgroundColor,
    textColor,
    borderColor,
  };
}
