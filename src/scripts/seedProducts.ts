import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category';
import Product from '../models/Product';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const categories = [
  { name: 'Bouquets', slug: 'bouquets', description: 'Beautiful flower bouquets for all occasions.' },
  { name: 'Gift Hampers', slug: 'gift-hampers', description: 'Curated gift hampers for your loved ones.' },
  { name: 'Scrapbook', slug: 'scrapbook', description: 'Handcrafted scrapbooks to preserve your memories.' },
  { name: 'Handmade Cards', slug: 'handmade-cards', description: 'Custom handmade greeting cards.' },
  { name: 'Thali Decoration', slug: 'thali-decoration', description: 'Elegant thali decorations for festivals and ceremonies.' }
];

const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

const productsInput = [
  // Bouquets
  { categorySlug: 'bouquets', name: 'Simple Rose Elegance Bouquet', price: 299, description: 'A beautiful and simple rose bouquet.' },
  { categorySlug: 'bouquets', name: 'Happy Yellow Daisies Bunch', price: 299, description: 'Bright yellow daisies to bring joy.' },
  { categorySlug: 'bouquets', name: 'Pastel Pink Carnation Delight', price: 299, description: 'Soft pastel pink carnations for a delicate touch.' },
  { categorySlug: 'bouquets', name: 'Minimalist Tulip Wrap', price: 299, description: 'Elegant minimalist tulip arrangement.' },
  { categorySlug: 'bouquets', name: 'Mixed Floral Sunrise Bouquet', price: 450, description: 'A mix of bright and vibrant morning flowers.' },
  { categorySlug: 'bouquets', name: 'Orchids & Red Roses Dream', price: 550, description: 'Premium orchids paired with classic red roses.' },
  { categorySlug: 'bouquets', name: 'Sunflower Sunshine Wrapped Bunch', price: 499, description: 'Large sunflowers bringing instant sunshine.' },
  { categorySlug: 'bouquets', name: 'Elegant Lavender & White Lily Wrap', price: 599, description: 'A calming mix of lavender and white lilies.' },
  { categorySlug: 'bouquets', name: 'Exotic Blue Orchids & Ferrero Rocher Bouquet', price: 850, description: 'Stunning blue orchids paired with fine chocolate.' },
  { categorySlug: 'bouquets', name: '100 Red Roses Grand Heart Bouquet', price: 999, description: 'A massive romantic gesture with 100 red roses.' },
  { categorySlug: 'bouquets', name: 'Custom Polaroid Photos & Flowers Mega Bouquet', price: 899, description: 'Personalized bouquet with your polaroid photos included.' },
  { categorySlug: 'bouquets', name: 'Golden Anniversary Grand Mix Bouquet', price: 799, description: 'A grand floral mix perfect for celebrations.' },

  // Gift Hampers
  { categorySlug: 'gift-hampers', name: 'Mini Self-Care Essentials Kit', price: 499, description: 'Basic self-care mini hamper for relaxation.' },
  { categorySlug: 'gift-hampers', name: 'Midnight Chocolate Joy Box', price: 499, description: 'A mini hamper full of delicious chocolate treats.' },
  { categorySlug: 'gift-hampers', name: 'Stationery Lovers Mini Desk Hamper', price: 499, description: 'Cute stationery items in a mini package.' },
  { categorySlug: 'gift-hampers', name: 'Sweet Treats & Candles Basket', price: 499, description: 'Cookies, sweets, and scented candles mini basket.' },
  { categorySlug: 'gift-hampers', name: 'Bath Aromatherapy & Body Care Hamper', price: 799, description: 'Medium spa hamper for a relaxing bath experience.' },
  { categorySlug: 'gift-hampers', name: 'Gourmet Snacks & Mocktail Box', price: 899, description: 'A premium medium hamper with gourmet snacks and mocktail mix.' },
  { categorySlug: 'gift-hampers', name: 'Classic Men\'s Grooming Kit', price: 750, description: 'Grooming essentials organized in a medium box for him.' },
  { categorySlug: 'gift-hampers', name: 'Cozy Evening Coffee & Ceramic Mug Set', price: 950, description: 'Perfect coffee lover\'s medium gift basket.' },
  { categorySlug: 'gift-hampers', name: 'Luxury Spa Retreat Hamper', price: 1499, description: 'Ultimate premium spa experience hamper.' },
  { categorySlug: 'gift-hampers', name: 'Ultimate Romantic Anniversary Gift Basket', price: 1599, description: 'A luxurious romantic basket with premium items.' },
  { categorySlug: 'gift-hampers', name: 'Premium Assorted Imported Chocolates Collection', price: 1299, description: 'A premium heavy box of imported chocolates.' },
  { categorySlug: 'gift-hampers', name: 'Bride-to-Be Pamper & Glow Box', price: 1350, description: 'A luxury pre-wedding glow kit hamper.' },

  // Scrapbook
  { categorySlug: 'scrapbook', name: '"Our First Trip" Mini Accordion Scrapbook', price: 349, description: 'Small sized accordion fold travel scrapbook.' },
  { categorySlug: 'scrapbook', name: 'Best Friends Pocket Memory Book', price: 349, description: 'A cute mini book for your best memories.' },
  { categorySlug: 'scrapbook', name: 'Baby\'s First Milestones Mini Scrapbook', price: 349, description: 'Mini baby milestones photo book.' },
  { categorySlug: 'scrapbook', name: 'Aesthetic Polaroids & Notes Little Book', price: 349, description: 'Small scrapbook perfect for polaroids.' },
  { categorySlug: 'scrapbook', name: 'Romantic Couple\'s Love Story Scrapbook', price: 499, description: 'Medium scrapbook for couples.' },
  { categorySlug: 'scrapbook', name: 'Birthday Blast Spiral Memory Book', price: 499, description: 'Medium birthday memories scrapbook.' },
  { categorySlug: 'scrapbook', name: 'Family Christmas Vacation Keepsake', price: 499, description: 'Medium family vacation memory book.' },
  { categorySlug: 'scrapbook', name: 'College Graduation Memories Medium Book', price: 499, description: 'Graduation themed medium scrapbook.' },
  { categorySlug: 'scrapbook', name: '25th Anniversary Grand Leather-bound Album', price: 1199, description: 'Large A4 sheet size premium anniversary scrapbook.' },
  { categorySlug: 'scrapbook', name: 'The Complete Wedding Journey A4 Scrapbook', price: 1199, description: 'Massive A4 size scrapbook for wedding memories.' },
  { categorySlug: 'scrapbook', name: 'Growing Up Years - Baby to Teen Mega Folio', price: 1199, description: 'Large A4 timeline scrapbook.' },
  { categorySlug: 'scrapbook', name: 'Ultimate Backpacking Travel Diary A4', price: 1199, description: 'Travelers large A4 memory diary and scrapbook.' },

  // Handmade Cards
  { categorySlug: 'handmade-cards', name: '"Thank You" Pastel Mini Note Cards (Pack of 10)', price: 49, description: 'Pack of 10 total beautiful pastel thank you cards.' },
  { categorySlug: 'handmade-cards', name: '"Happy Birthday" Assorted Tag Cards (Pack of 10)', price: 49, description: 'Pack of 10 assorted birthday tag cards.' },
  { categorySlug: 'handmade-cards', name: 'Minimalist Watercolor Florals Mini Cards (Pack of 10)', price: 49, description: 'Pack of 10 watercolor aesthetic cards.' },
  { categorySlug: 'handmade-cards', name: '"Just a Note" Aesthetic Grid Cards (Pack of 10)', price: 49, description: 'Pack of 10 grid notebook style aesthetic mini cards.' },
  { categorySlug: 'handmade-cards', name: '3D Pop-Up Heart Anniversary Card', price: 150, description: 'Normal size 3D pop up romantic card.' },
  { categorySlug: 'handmade-cards', name: 'Shaker Window Confetti Birthday Card', price: 200, description: 'Normal size card with moving confetti shaker.' },
  { categorySlug: 'handmade-cards', name: 'Cascading Waterfall Multi-Photo Card', price: 250, description: 'Normal size card with waterfall photo effect.' },
  { categorySlug: 'handmade-cards', name: 'Hand-Painted Botanical Watercolor Greeting', price: 180, description: 'Normal size hand painted floral greeting card.' },
  { categorySlug: 'handmade-cards', name: '3-Layer Mega Exploding Box Card', price: 1599, description: 'Big special explosion box card.' },
  { categorySlug: 'handmade-cards', name: 'Giant 2-Feet Interactive Storyboard Greeting', price: 1599, description: 'Giant sized 2 feet specialized card.' },
  { categorySlug: 'handmade-cards', name: 'Endless Folding Infinity Masterpiece Card', price: 1599, description: 'Big special endless folding interactive card.' },
  { categorySlug: 'handmade-cards', name: 'LED Light-up Musical Jumbo Story Card', price: 1599, description: 'Big special musical led card.' },

  // Thali Decoration
  { categorySlug: 'thali-decoration', name: 'Red Velvet Base Minimalist Engagement Thali', price: 450, description: 'Basic engagement thali decoration.' },
  { categorySlug: 'thali-decoration', name: 'Simple Pearl Border Aarti Thali', price: 399, description: 'Basic aarti thali with pearls.' },
  { categorySlug: 'thali-decoration', name: 'Kumkum & Rice Haldi Ceremony Plate', price: 420, description: 'Basic haldi ceremonial plate.' },
  { categorySlug: 'thali-decoration', name: 'Gota Patti Minimalist Festive Pooja Thali', price: 499, description: 'Basic gota patti pooja thali.' },
  { categorySlug: 'thali-decoration', name: 'Mirror Work Festive Diwali Thali Set', price: 650, description: 'Standard mirror work diwali thali.' },
  { categorySlug: 'thali-decoration', name: 'Zardosi Embroidered Karwa Chauth Thali', price: 699, description: 'Standard zardosi work karwa chauth thali.' },
  { categorySlug: 'thali-decoration', name: 'Crystal Bordered Rakhi Platter with Diya', price: 620, description: 'Standard crystal border rakhi thali.' },
  { categorySlug: 'thali-decoration', name: 'Faux Floral Ring Presentation Platter', price: 599, description: 'Standard standard presentation ring platter.' },
  { categorySlug: 'thali-decoration', name: 'Real Fresh Flower Grand Engagement Platter', price: 1899, description: 'Premium fresh flower engagement thali.' },
  { categorySlug: 'thali-decoration', name: 'Heavy Kundan & Meenakari Swastik Thali', price: 1599, description: 'Premium kundan minakari heavy thali.' },
  { categorySlug: 'thali-decoration', name: 'LED Illuminated Rotating Ring Ceremony Tray', price: 1999, description: 'Premium LED rotating ring ceremony tray.' },
  { categorySlug: 'thali-decoration', name: 'Golden Peacock Themed Bridal Entry Gokha Thali', price: 1799, description: 'Premium gokha bridal thali with golden peacock.' }
];

const seedProducts = async () => {
  try {
    if(!process.env.MONGO_URI) {
      console.error('No MONGO_URI provided in .env');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully!');

    console.log('Seeding categories...');
    const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const cat of categories) {
      let doc = await Category.findOne({ slug: cat.slug });
      if (!doc) {
        doc = await Category.create(cat);
      }
      categoryMap[cat.slug] = doc._id as mongoose.Types.ObjectId;
    }
    console.log('Categories seeded successfully.');

    console.log('Seeding products...');
    for (const prodInput of productsInput) {
      const categoryId = categoryMap[prodInput.categorySlug];
      if (!categoryId) continue;

      const newProduct = {
        name: prodInput.name,
        slug: generateSlug(prodInput.name),
        description: prodInput.description,
        price: prodInput.price,
        category: categoryId,
        images: [],
        stock: 50,
        tags: [prodInput.categorySlug.replace('-', ' ')],
        isFeatured: Math.random() > 0.8 // Randomly feature some
      };

      await Product.create(newProduct);
    }
    console.log(`Seeded ${productsInput.length} products successfully.`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedProducts();
