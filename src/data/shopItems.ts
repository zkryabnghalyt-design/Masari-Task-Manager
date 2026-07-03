export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'theme' | 'feature';
  gradient?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Themes
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk Theme',
    description: 'A vibrant retro-futuristic dark mode with glowing pink, turquoise, and neon purple accents.',
    cost: 50,
    type: 'theme',
    gradient: 'from-[#0B0D17] to-[#121829] border-fuchsia-500/40 text-fuchsia-400',
  },
  {
    id: 'emerald',
    name: 'Emerald Garden Theme',
    description: 'A soothing organic theme with a beautiful sage canvas, warm wood-like trims, and rich forest green accents.',
    cost: 100,
    type: 'theme',
    gradient: 'from-[#EBF2EE] to-[#DCE6E1] border-emerald-400/40 text-emerald-800',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Space Theme',
    description: 'An immersive deep space theme featuring stellar galaxy blues and majestic purple aurora glows.',
    cost: 150,
    type: 'theme',
    gradient: 'from-[#030712] to-[#0F172A] border-violet-500/40 text-violet-300',
  },
  {
    id: 'sunset',
    name: 'Sunset Coral Theme',
    description: 'A cozy orange-gold design that resembles warm evening beaches and golden sunsets.',
    cost: 200,
    type: 'theme',
    gradient: 'from-[#FFF8F5] to-[#FFF0E6] border-amber-400/40 text-amber-800',
  },

  // Features
  {
    id: 'music',
    name: 'Focus Soundscapes Loop Player',
    description: 'Unlocks a built-in lo-fi audio player with focus loops (Rain, Lofi Beats, Cafe Ambience) to maximize productivity.',
    cost: 80,
    type: 'feature',
    gradient: 'from-blue-50 to-indigo-50 border-blue-200/50 text-blue-700',
  },
  {
    id: 'motivation',
    name: 'AI Gemini Cheerleader Coach',
    description: 'Unlocks an interactive AI companion coach widget that gives personalized cheerleader summaries of your tasks.',
    cost: 120,
    type: 'feature',
    gradient: 'from-fuchsia-50 to-pink-50 border-pink-200/50 text-pink-700',
  },
];
