export const fixColor = (hex: string): string => {
    const toLin = (c: number) => (c /= 255) <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t++; if (t > 1) t--;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);

    const rN = r / 255, gN = g / 255, bN = b / 255, max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
    let h: number = 0, s: number = 0;
    const l = (max + min) / 2, d = max - min;

    if (d === 0) h = s = 0;
    else {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        h = max === rN ? (gN - bN) / d + (gN < bN ? 6 : 0) : max === gN ? (bN - rN) / d + 2 : (rN - gN) / d + 4;
        h /= 6;
    }

    let low = l, high = 1, mid;
    for (let i = 0; i < 14; i++) {
        mid = (low + high) / 2;
        const q = mid < 0.5 ? mid * (1 + s) : mid + s - mid * s, p = 2 * mid - q;
        const lum = 0.2126 * toLin(hue2rgb(p, q, h + 1 / 3) * 255) +
            0.7152 * toLin(hue2rgb(p, q, h) * 255) +
            0.0722 * toLin(hue2rgb(p, q, h - 1 / 3) * 255);

        if (lum < 0.175) low = mid; else high = mid;
    }

    const fL = high, q = fL < 0.5 ? fL * (1 + s) : fL + s - fL * s, p = 2 * fL - q;
    const hexOut = (v: number) => Math.round(Math.max(0, Math.min(255, hue2rgb(p, q, v) * 255))).toString(16).padStart(2, '0');

    return `#${hexOut(h + 1 / 3)}${hexOut(h)}${hexOut(h - 1 / 3)}`.toUpperCase();
};
