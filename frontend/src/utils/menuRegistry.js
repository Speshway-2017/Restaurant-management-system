// Shared master catalog of dishes, special combos, and offers for Flavora Restaurant

export const SPECIAL_COMBOS = [
  {
    id: 'Royal Biryani Feast Combo',
    title: 'Royal Biryani Feast Combo',
    name: 'Royal Biryani Feast Combo',
    desc: '1 Full Chicken Dum Biryani + 2 Butter Naan + 1 Paneer Tikka + Gulab Jamun + Soft Drinks.',
    price: 890,
    origPrice: '₹1,250',
    tag: 'BEST VALUE (30% OFF)',
    img: '/hero_dish_2.png',
    isVeg: false,
    items: [
      { id: 'item-1', name: 'Chicken Dum Biryani', price: 340, qty: 1 },
      { id: 'item-3', name: 'Butter Naan', price: 60, qty: 2 },
      { id: 'item-2', name: 'Paneer Tikka Angara', price: 260, qty: 1 },
      { id: 'item-5', name: 'Gulab Jamun', price: 120, qty: 1 }
    ]
  },
  {
    id: 'Tandoori Kebab Platter Special',
    title: 'Tandoori Kebab Platter Special',
    name: 'Tandoori Kebab Platter Special',
    desc: 'Assorted Murgh Malai Kabab, Tandoori Chicken, Paneer Angara & Mint Chutney.',
    price: 760,
    origPrice: '₹980',
    tag: 'CHEF SPECIAL',
    img: '/carousel_1.png',
    isVeg: false,
    items: [
      { id: 'item-2', name: 'Paneer Tikka Angara', price: 260, qty: 1 },
      { id: 'item-1', name: 'Chicken Dum Biryani', price: 340, qty: 1 },
      { id: 'item-3', name: 'Butter Naan', price: 60, qty: 2 }
    ]
  },
  {
    id: 'Dal Makhani & Shahi Thali',
    title: 'Dal Makhani & Shahi Thali',
    name: 'Dal Makhani & Shahi Thali',
    desc: 'Dal Makhani Gold + Paneer Butter Masala + Saffron Rice + 3 Butter Rotis + Lassi.',
    price: 640,
    origPrice: '₹820',
    tag: 'PURE VEG ROYAL',
    img: '/hero_dish_1.png',
    isVeg: true,
    items: [
      { id: 'item-4', name: 'Dal Makhani Gold', price: 240, qty: 1 },
      { id: 'item-3', name: 'Butter Naan', price: 60, qty: 3 },
      { id: 'item-5', name: 'Gulab Jamun', price: 120, qty: 1 }
    ]
  },
  {
    id: 'Family Royal Celebration Feast',
    title: 'Family Royal Celebration Feast',
    name: 'Family Royal Celebration Feast',
    desc: '2 Full Dum Biryanis + 4 Garlic Naans + Paneer Tikka + Gulab Jamun Platter + Beverages.',
    price: 1150,
    origPrice: '₹1,490',
    tag: 'FAMILY COMBO (25% OFF)',
    img: '/carousel_2.png',
    isVeg: false,
    items: [
      { id: 'item-1', name: 'Chicken Dum Biryani', price: 340, qty: 2 },
      { id: 'item-3', name: 'Butter Naan', price: 60, qty: 4 },
      { id: 'item-2', name: 'Paneer Tikka Angara', price: 260, qty: 1 },
      { id: 'item-5', name: 'Gulab Jamun', price: 120, qty: 2 }
    ]
  }
];

export const OFFER_DEALS = [
  {
    id: 'deal-1',
    title: 'Royal Tandoori Feast',
    name: 'Royal Tandoori Feast',
    price: 999,
    origPrice: '₹1,250',
    img: '/hero_dish_1.png',
    isVeg: false
  },
  {
    id: 'deal-2',
    title: 'Shahi Biryani Combo',
    name: 'Shahi Biryani Combo',
    price: 649,
    origPrice: '₹799',
    img: '/hero_dish_2.png',
    isVeg: false
  },
  {
    id: 'deal-3',
    title: 'Chef Special Thali',
    name: 'Chef Special Thali',
    price: 450,
    origPrice: '₹550',
    img: '/chef_plating.png',
    isVeg: true
  },
  {
    id: 'deal-4',
    title: 'Family Weekend Royal Feast',
    name: 'Family Weekend Royal Feast',
    price: 1899,
    origPrice: '₹2,400',
    img: '/carousel_2.png',
    isVeg: false
  },
  {
    id: 'deal-5',
    title: 'Monsoon Chai & Pakora Perk',
    name: 'Monsoon Chai & Pakora Perk',
    price: 249,
    origPrice: '₹320',
    img: '/tandoor_oven.png',
    isVeg: true
  },
  {
    id: 'deal-6',
    title: 'First QR Order Bonus',
    name: 'First QR Order Bonus',
    price: 399,
    origPrice: '₹499',
    img: '/carousel_3.png',
    isVeg: true
  }
];

export const STANDARD_MENU_ITEMS = [
  { id: 1, name: 'Paneer Tikka Angara', category: 'Starters', price: 340, isVeg: true, desc: 'Cottage cheese marinated in Kashmiri chili and tandoori spices.', img: '/hero_dish_1.png' },
  { id: 2, name: 'Murgh Malai Kabab', category: 'Starters', price: 420, isVeg: false, desc: 'Tender chicken breast infused with cream, cheese, and cardamom.', img: '/carousel_3.png' },
  { id: 3, name: 'Tandoori Murgh Full', category: 'Starters', price: 560, isVeg: false, desc: 'Whole chicken marinated in mustard oil & spices roasted in clay tandoori oven.', img: '/tandoor_oven.png' },
  { id: 4, name: 'Dal Makhani Gold', category: 'Main Course', price: 380, isVeg: true, desc: 'Slow-cooked black lentils simmered overnight with white butter and cream.', img: '/carousel_2.png' },
  { id: 5, name: 'Paneer Butter Masala', category: 'Main Course', price: 390, isVeg: true, desc: 'Soft cottage cheese cubes in rich tomato cashew gravy.', img: '/hero_dish_1.png' },
  { id: 6, name: 'Butter Chicken Special', category: 'Main Course', price: 480, isVeg: false, desc: 'Charcoal-grilled chicken simmered in rich buttery tomato gravy.', img: '/hero_dish_2.png' },
  { id: 7, name: 'Hyderabadi Dum Biryani (Chicken)', category: 'Biryani', price: 490, isVeg: false, desc: 'Aromatic basmati rice layered with spiced marinated chicken cooked on dum.', img: '/hero_dish_2.png' },
  { id: 8, name: 'Hyderabadi Veg Dum Biryani', category: 'Biryani', price: 420, isVeg: true, desc: 'Garden fresh vegetables layered with saffron rice and fragrant biryani spices.', img: '/carousel_2.png' },
  { id: 9, name: 'Garlic Butter Naan', category: 'Breads', price: 90, isVeg: true, desc: 'Fresh clay tandoori bread brushed with melted butter & chopped garlic.', img: '/carousel_1.png' },
  { id: 10, name: 'Butter Tandoori Roti', category: 'Breads', price: 50, isVeg: true, desc: 'Whole wheat flatbread baked fresh in clay tandoori oven.', img: '/tandoor_oven.png' },
  { id: 11, name: 'Saffron Shahi Tukda', category: 'Desserts', price: 260, isVeg: true, desc: 'Crispy fried bread soaked in saffron rabri topped with pistachios.', img: '/chef_plating.png' },
  { id: 12, name: 'Gulab Jamun with Ice Cream', category: 'Desserts', price: 220, isVeg: true, desc: 'Hot khoya dumplings served with cold vanilla bean ice cream.', img: '/carousel_3.png' },
  { id: 13, name: 'Mango Lassi Delight', category: 'Beverages', price: 180, isVeg: true, desc: 'Thick churned sweet yogurt blended with Alphonsa mango pulp.', img: '/hero_dish_1.png' },
  { id: 14, name: 'Masala Butter Milk', category: 'Beverages', price: 120, isVeg: true, desc: 'Refreshing churned buttermilk infused with roasted cumin, green chili & mint.', img: '/carousel_2.png' }
];

export const MASTER_ITEMS_CATALOG = [
  ...SPECIAL_COMBOS,
  ...OFFER_DEALS,
  ...STANDARD_MENU_ITEMS
];

// Single source of truth lookup for any dish ID or title
export function findItemInCatalog(idKey, dynamicList = []) {
  if (!idKey) return null;
  const key = String(idKey).trim().toLowerCase();

  // 1. Check passed dynamic list first
  if (Array.isArray(dynamicList) && dynamicList.length > 0) {
    const foundDynamic = dynamicList.find(item =>
      String(item._id || item.id || '').trim().toLowerCase() === key ||
      String(item.name || item.title || '').trim().toLowerCase() === key
    );
    if (foundDynamic && typeof foundDynamic.price === 'number') {
      return {
        id: foundDynamic._id || foundDynamic.id || foundDynamic.name || foundDynamic.title,
        name: foundDynamic.name || foundDynamic.title,
        price: foundDynamic.price,
        img: foundDynamic.img || foundDynamic.image || '/hero_dish_2.png',
        isVeg: foundDynamic.isVeg !== undefined ? foundDynamic.isVeg : true
      };
    }
  }

  // 2. Check master items catalog
  const foundMaster = MASTER_ITEMS_CATALOG.find(item =>
    String(item.id || '').trim().toLowerCase() === key ||
    String(item.name || item.title || '').trim().toLowerCase() === key
  );
  if (foundMaster) {
    return {
      id: foundMaster.id || foundMaster.name || foundMaster.title,
      name: foundMaster.name || foundMaster.title,
      price: foundMaster.price,
      img: foundMaster.img || foundMaster.image || '/hero_dish_2.png',
      isVeg: foundMaster.isVeg !== undefined ? foundMaster.isVeg : true
    };
  }

  // 3. Fallback check from localStorage saved combos
  try {
    const savedCombos = localStorage.getItem('flavora_combos');
    if (savedCombos) {
      const parsedCombos = JSON.parse(savedCombos);
      const foundCombo = parsedCombos.find(item =>
        String(item.id || '').trim().toLowerCase() === key ||
        String(item.name || item.title || '').trim().toLowerCase() === key
      );
      if (foundCombo && typeof foundCombo.price === 'number') {
        return {
          id: foundCombo.id || foundCombo.name || foundCombo.title,
          name: foundCombo.name || foundCombo.title,
          price: foundCombo.price,
          img: foundCombo.img || '/hero_dish_2.png',
          isVeg: foundCombo.isVeg !== undefined ? foundCombo.isVeg : true
        };
      }
    }
  } catch (e) { }

  // 4. Fallback check from localStorage saved dishes
  try {
    const saved = localStorage.getItem('flavora_dishes');
    if (saved) {
      const parsed = JSON.parse(saved);
      const foundLocal = parsed.find(item =>
        String(item._id || item.id || '').trim().toLowerCase() === key ||
        String(item.name || item.title || '').trim().toLowerCase() === key
      );
      if (foundLocal && typeof foundLocal.price === 'number') {
        return {
          id: foundLocal._id || foundLocal.id || foundLocal.name,
          name: foundLocal.name,
          price: foundLocal.price,
          img: foundLocal.img || '/hero_dish_2.png',
          isVeg: foundLocal.isVeg !== undefined ? foundLocal.isVeg : true
        };
      }
    }
  } catch (e) { }

  return null;
}

// Calculate exact cart total using single source of truth price for each item
export function calculateCartTotal(cartObject, dynamicList = []) {
  if (!cartObject || typeof cartObject !== 'object') return 0;
  return Object.entries(cartObject).reduce((total, [idKey, qty]) => {
    if (!qty || qty <= 0) return total;
    const item = findItemInCatalog(idKey, dynamicList);
    const unitPrice = item ? item.price : 0;
    return total + (unitPrice * qty);
  }, 0);
}

// Safely resolve valid HTTP/HTTPS/Cloudinary image URL or return food placeholder fallback
export function resolveDishImageUrl(item, fallback = '/hero_dish_2.png') {
  if (!item) return fallback;

  let raw = item.img || item.image || item.imageUrl || item.photo || item.picture || item.photoUrl;

  if (!raw) return fallback;

  // Extract from Cloudinary / Mongoose image object e.g. { url: "...", secure_url: "..." }
  if (typeof raw === 'object') {
    raw = raw.secure_url || raw.url || raw.src || raw.path || '';
  }

  if (typeof raw !== 'string') return fallback;

  const trimmed = raw.trim();

  if (!trimmed || trimmed === '[object Object]' || trimmed === 'undefined' || trimmed === 'null') {
    return fallback;
  }

  // Complete URL or Data URI or root-relative path
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/') || trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed}`;
}
