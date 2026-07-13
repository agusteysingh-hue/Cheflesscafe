// Course data — all 19 SOP videos organized by category
const courses = [
  // ─── STARTER ───
  { id: 1, category: 'Starter', name: 'Butter Corn Masala', youtubeId: 'ggJsJJQYJeE', icon: '🌽' },

  // ─── TEA & COFFEE ───
  { id: 2, category: 'Tea & Coffee', name: 'Rose Tea', youtubeId: 'NZp7wHi8A0g', icon: '🌹' },
  { id: 3, category: 'Tea & Coffee', name: 'Lemon Tea', youtubeId: 'zEfAPbJufu0', icon: '🍋' },
  { id: 4, category: 'Tea & Coffee', name: 'Hot Coffee', youtubeId: '5E5IxdcnMMA', icon: '☕' },
  { id: 5, category: 'Tea & Coffee', name: 'Cold Coffee', youtubeId: 'PICzFJhY2EI', icon: '🧊' },

  // ─── THIRST QUENCHERS ───
  { id: 6, category: 'Thirst Quenchers', name: 'Virgin Mojito', youtubeId: 'E0FWU9UIDlM', icon: '🍹' },
  { id: 7, category: 'Thirst Quenchers', name: 'Fruit Mojito', youtubeId: '56VJqtZ5-Dc', icon: '🍉' },

  // ─── MAGGI ───
  { id: 8, category: 'Maggi Course', name: 'Plain Masala Maggi', youtubeId: 'CIkI87Mf6WE', icon: '🍜' },
  { id: 9, category: 'Maggi Course', name: 'Veg Spicy Maggi', youtubeId: 'r9xKSSrbNEw', icon: '🌶️' },
  { id: 10, category: 'Maggi Course', name: 'Cheese & Corn Maggi', youtubeId: '-J4XIEnIgjI', icon: '🧀' },
  { id: 11, category: 'Maggi Course', name: 'Chilli Garlic Maggi', youtubeId: '90y5_GqHhEQ', icon: '🧄' },

  // ─── SANDWICH ───
  { id: 12, category: 'Sandwich', name: 'Veg & Cheese Sandwich', youtubeId: 'qdbOXVPULZw', icon: '🥪' },
  { id: 13, category: 'Sandwich', name: 'Cheese & Corn Sandwich', youtubeId: 'lNnY6jCihMI', icon: '🌽' },
  { id: 14, category: 'Sandwich', name: 'Paneer Grilled Sandwich', youtubeId: 'YynQQDvxmX4', icon: '🫕' },
  { id: 15, category: 'Sandwich', name: 'Palak & Corn Sandwich', youtubeId: 'ieSqibsa7RE', icon: '🥬' },

  // ─── PASTA ───
  { id: 16, category: 'Pasta Course', name: 'White Sauce Pasta', youtubeId: 'jGLoOsD6T6E', icon: '🍝' },
  { id: 17, category: 'Pasta Course', name: 'Red Sauce Pasta', youtubeId: 'eBsS59P8RPg', icon: '🍅' },

  // ─── BUN ───
  { id: 18, category: 'Bun Course', name: 'Bun Maska & Masala Bun', youtubeId: 'Qt2JkL7E7X0', icon: '🍞' },
  { id: 19, category: 'Bun Course', name: 'Bun Samosa', youtubeId: 'HqmReRJrqyM', icon: '🥟' },
];

function getCourseById(id) {
  return courses.find(c => c.id === parseInt(id));
}

function getCoursesByCategory() {
  const cats = {};
  courses.forEach(c => {
    if (!cats[c.category]) cats[c.category] = [];
    cats[c.category].push(c);
  });
  return cats;
}

function getCategoryOrder() {
  return ['Starter', 'Tea & Coffee', 'Thirst Quenchers', 'Maggi Course', 'Sandwich', 'Pasta Course', 'Bun Course'];
}

module.exports = { courses, getCourseById, getCoursesByCategory, getCategoryOrder };
