// Course data — all 19 SOP videos organized by category
const courses = [
  // ─── STARTER ───
  { id: 1, category: 'Starter', name: 'Butter Corn Masala', vimeoId: '1172924480', icon: '🌽' },

  // ─── TEA & COFFEE ───
  { id: 2, category: 'Tea & Coffee', name: 'Rose Tea', vimeoId: '1172964126', icon: '🌹' },
  { id: 3, category: 'Tea & Coffee', name: 'Lemon Tea', vimeoId: '1172963960', icon: '🍋' },
  { id: 4, category: 'Tea & Coffee', name: 'Hot Coffee', vimeoId: '1172963561', icon: '☕' },
  { id: 5, category: 'Tea & Coffee', name: 'Cold Coffee', vimeoId: '1172963785', icon: '🧊' },

  // ─── THIRST QUENCHERS ───
  { id: 6, category: 'Thirst Quenchers', name: 'Virgin Mojito', vimeoId: '1172988578', icon: '🍹' },
  { id: 7, category: 'Thirst Quenchers', name: 'Fruit Mojito', vimeoId: '1172988394', icon: '🍉' },

  // ─── MAGGI ───
  { id: 8, category: 'Maggi Course', name: 'Plain Masala Maggi', vimeoId: '1172958510', icon: '🍜' },
  { id: 9, category: 'Maggi Course', name: 'Veg Spicy Maggi', vimeoId: '1172958804', icon: '🌶️' },
  { id: 10, category: 'Maggi Course', name: 'Cheese & Corn Maggi', vimeoId: '1172957886', icon: '🧀' },
  { id: 11, category: 'Maggi Course', name: 'Chilli Garlic Maggi', vimeoId: '1172958247', icon: '🧄' },

  // ─── SANDWICH ───
  { id: 12, category: 'Sandwich', name: 'Veg & Cheese Sandwich', vimeoId: '1172972425', icon: '🥪' },
  { id: 13, category: 'Sandwich', name: 'Cheese & Corn Sandwich', vimeoId: '1172971879', icon: '🌽' },
  { id: 14, category: 'Sandwich', name: 'Paneer Grilled Sandwich', vimeoId: '1172972276', icon: '🫕' },
  { id: 15, category: 'Sandwich', name: 'Palak & Corn Sandwich', vimeoId: '1172972048', icon: '🥬' },

  // ─── PASTA ───
  { id: 16, category: 'Pasta Course', name: 'White Sauce Pasta', vimeoId: '1173004608', icon: '🍝' },
  { id: 17, category: 'Pasta Course', name: 'Red Sauce Pasta', vimeoId: '1173006948', icon: '🍅' },

  // ─── BUN ───
  { id: 18, category: 'Bun Course', name: 'Bun Maska & Masala Bun', vimeoId: '1172990752', icon: '🍞' },
  { id: 19, category: 'Bun Course', name: 'Bun Samosa', vimeoId: '1173168223', icon: '🥟' },
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
