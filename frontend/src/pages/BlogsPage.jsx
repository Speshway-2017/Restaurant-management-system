import React, { useState } from 'react';
import { Mail, Calendar, User, Clock, ArrowRight, X, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function BlogsPage({ setActivePage }) {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const featuredStory = {
    id: 1,
    title: 'The Secret of Traditional Dum Biryani',
    category: 'HERITAGE',
    categoryClass: 'badge-overlay-orange',
    author: 'Chef Ananya',
    date: 'October 12, 2024',
    readTime: '7 min read',
    image: '/carousel_1.png',
    excerpt: "Mastering the 'dum' technique is more than just cooking; it's a slow-cooked philosophy of patience. We dive into the specific layering methods and spice blends that have defined authentic Indian biryani for centuries.",
    content: `
      ### The Ancient Art of Dum Pukht
      Dum Pukht translates literally to 'slow oven cooking'. Originating from the royal Mughal and Awadhi kitchens, this technique involves sealing food in a heavy brass or clay handi with a dough paste seal (atta dough). The trapped steam cooks meat and fragrant long-grain basmati rice in their own natural juices.

      ### Essential Spice Ratios & Layering:
      1. **Par-Boiled Basmati:** Rice cooked to precisely 70% in whole-spice infused water (star anise, cloves, green cardamom, black pepper).
      2. **The Marinated Protein Base:** Yoghurt, shahi jeera, Kashmiri red chili powder, ginger-garlic paste, and fried golden onions (birista).
      3. **Saffron & Ghee Infusion:** Pure saffron strands soaked in warm milk drizzled over top rice layers alongside fried mint leaves.

      At Flavora Kitchen, we preserve this slow-cooking heritage while ensuring prompt dining service through our digital kitchen batch scheduling.
    `
  };

  const recentInsights = [
    {
      id: 2,
      title: 'Sourcing Seasonal Ingredients in India',
      category: 'SOURCING',
      categoryClass: 'badge-overlay-green',
      author: 'Chef Vikram',
      date: 'October 05, 2024',
      readTime: '5 min read',
      image: '/tandoor_oven.png',
      excerpt: 'Navigating local markets to find the best seasonal produce for your restaurant menu, ensuring farm-fresh quality and vibrant natural flavors.',
      content: `
        ### Farm-to-Table in the Indian Context
        Seasonal sourcing in India requires deep relationships with regional mandis (wholesale markets). From monsoon mustard greens to winter Guntur chilies, aligning your menu with peak harvest cycles dramatically improves dish taste while lowering food costs.

        ### Key Guidelines:
        - **Daily Supplier Audits:** Checking produce crispness, moisture retention, and spice aroma.
        - **Cold-Chain Transport:** Ensuring perishables stay under 4°C during transit.
        - **Inventory Auto-Alerts:** Utilizing automated stock management to prevent ingredient wastage.
      `
    },
    {
      id: 3,
      title: 'The Art of Plating Traditional Indian Cuisine',
      category: 'TECHNIQUE',
      categoryClass: 'badge-overlay-teal',
      author: 'Priya Nair',
      date: 'September 28, 2024',
      readTime: '4 min read',
      image: '/chef_plating.png',
      excerpt: 'Transforming rustic, complex curries into visually stunning modern masterpieces without sacrificing traditional flavor profiles.',
      content: `
        ### Elevating Gravies & Tandoori Starters
        Indian cuisine is rich in vibrant colors—turmeric golds, coriander greens, and saffron oranges. Plating modern Indian dishes relies on contrast, height, and negative space on stoneware rimmed bowls.

        ### Micro-Garnishing Rules:
        - Use micro-herbs, edible silver leaf (Vark), and ghee quenelles.
        - Deconstruct classic desserts like Gulab Jamun with pistachios and rabri mousse.
      `
    },
    {
      id: 4,
      title: 'Restaurant Growth in the Digital Age',
      category: 'BUSINESS',
      categoryClass: 'badge-overlay-dark',
      author: 'CA Rajesh Sharma',
      date: 'September 15, 2024',
      readTime: '6 min read',
      image: '/carousel_3.png',
      excerpt: 'Leveraging data analytics, KDS tokens, and streamlined operations to scale your culinary business while maintaining top-notch hospitality.',
      content: `
        ### Scaling F&B Operations Efficiently
        Modern diners expect speed, transparency, and consistency. Integrating cloud-based Point of Sale (POS) with Kitchen Display Systems (KDS) reduces human communication bottlenecks by over 60%.

        ### Technology Pillars:
        - **Instant Table QR Ordering:** Eliminating wait times for menus.
        - **Automated CGST/SGST Billing:** Compliance without manual calculation.
        - **Real-Time Revenue Analytics:** Identifying high-margin dishes dynamically.
      `
    },
    {
      id: 5,
      title: 'How 5-Tap QR Ordering Increases Average Ticket Size by 18%',
      category: 'CUSTOMER EXPERIENCE',
      categoryClass: 'badge-overlay-orange',
      author: 'Priya Nair',
      date: 'August 02, 2024',
      readTime: '4 min read',
      image: '/carousel_2.png',
      excerpt: 'High-resolution dish photos, intelligent pairing recommendations, and zero waiter wait-time drive impulse appetizer and dessert add-ons.',
      content: `
        ### The Power of Visual Menu Ordering
        When guests view dishes in high-definition photographs, visual appetite triggers lead directly to higher average spending per table. Instant QR ordering empowers guests to add beverages and side breads seamlessly during their meal.
      `
    },
    {
      id: 6,
      title: 'Kitchen Display Systems (KDS) vs Paper Thermal Tickets',
      category: 'OPERATIONS',
      categoryClass: 'badge-overlay-green',
      author: 'Chef Vikram',
      date: 'July 28, 2024',
      readTime: '5 min read',
      image: '/chef_1.png',
      excerpt: 'Replacing lost paper tickets with high-contrast, distance-glanceable KDS screens in hot, fast-paced kitchen pass areas.',
      content: `
        ### Digital Kitchen Efficiency
        Paper tickets easily get misplaced or stained near hot tandoor ovens. Digital KDS tablets color-code order stages and notify waiters automatically when orders are ready at the pass.
      `
    }
  ];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const displayedInsights = recentInsights.slice(0, visibleCount);

  return (
    <div className="blogs-page-wrapper">
      {/* 1. HERO HEADER (Unified Page Hero System) */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <span>CULINARY CHRONICLES & INSIGHTS</span>
          </div>

          <h1 className="page-hero-title-unified">
            Culinary Chronicles
          </h1>

          <p className="page-hero-subtitle-unified">
            Sharing stories from the heart of the kitchen. From traditional recipes passed down through generations to modern insights on managing a bustling restaurant ecosystem.
          </p>
        </div>
      </section>

      <div className="section" style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        {/* 2. FEATURED STORY SECTION */}
        <div style={{ marginBottom: '4.5rem' }}>
          <div className="section-accent-title">
            <div className="section-accent-line"></div>
            <h2 className="section-heading-text">Featured Story</h2>
          </div>

          <div className="featured-story-grid">
            <div className="featured-img-wrapper">
              <span className={featuredStory.categoryClass}>{featuredStory.category}</span>
              <img src={featuredStory.image} alt={featuredStory.title} />
            </div>

            <div className="featured-card-content">
              <div className="meta-date-author">
                <Calendar size={14} />
                <span>{featuredStory.date}</span>
                <span>•</span>
                <span>By {featuredStory.author}</span>
              </div>

              <h3 className="featured-story-title">{featuredStory.title}</h3>

              <p className="featured-story-desc">{featuredStory.excerpt}</p>

              <div>
                <button
                  onClick={() => setSelectedArticle(featuredStory)}
                  className="read-full-link"
                >
                  <span>Read Full Article</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. RECENT INSIGHTS SECTION */}
        <div>
          <div className="section-accent-title">
            <div className="section-accent-line"></div>
            <h2 className="section-heading-text">Recent Insights</h2>
          </div>

          <div className="grid-3" style={{ marginBottom: '3rem' }}>
            {displayedInsights.map((item) => (
              <div
                key={item.id}
                className="insight-card"
                onClick={() => setSelectedArticle(item)}
              >
                <div className="insight-card-img-wrapper">
                  <span className={item.categoryClass}>{item.category}</span>
                  <img src={item.image} alt={item.title} />
                </div>

                <div className="insight-card-body">
                  <div className="insight-card-date">{item.date}</div>
                  <h3 className="insight-card-title">{item.title}</h3>
                  <p className="insight-card-excerpt">{item.excerpt}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {visibleCount < recentInsights.length && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <button
                onClick={() => setVisibleCount((prev) => Math.min(prev + 3, recentInsights.length))}
                className="btn-load-more"
              >
                <span>Load More Stories</span>
                <ChevronDown size={18} />
              </button>
            </div>
          )}
        </div>

        {/* 4. JOIN OUR KITCHEN COMMUNITY (NEWSLETTER CARD) */}
        <div className="community-newsletter-card">
          <div className="community-icon-wrapper">
            <Mail size={32} color="var(--color-secondary)" />
          </div>

          <h3 className="community-title">Join our Kitchen Community</h3>

          <p className="community-subtitle">
            Get the latest culinary insights, management tips, and seasonal recipes delivered straight to your inbox every month.
          </p>

          {subscribed ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#D1E7DD', color: '#0F5132', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600' }}>
              <CheckCircle2 size={20} />
              <span>Thank you! You are now subscribed to Culinary Chronicles.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="community-form">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="community-input"
              />
              <button type="submit" className="community-btn">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className={selectedArticle.categoryClass} style={{ position: 'static', display: 'inline-block', marginBottom: '0.75rem' }}>
                  {selectedArticle.category}
                </span>
                <h2 className="text-h2" style={{ color: '#1C2A22', fontSize: '1.6rem', marginTop: '0.25rem' }}>
                  {selectedArticle.title}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} />
                  <span>{selectedArticle.date}</span>
                  <span>•</span>
                  <User size={14} />
                  <span>By {selectedArticle.author}</span>
                  <span>•</span>
                  <Clock size={14} />
                  <span>{selectedArticle.readTime}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C5C5C', padding: '0.2rem' }}
                aria-label="Close Modal"
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ borderRadius: '10px', overflow: 'hidden', maxHeight: '280px', marginBottom: '1.5rem' }}>
              <img src={selectedArticle.image} alt={selectedArticle.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#2B2B2B', borderTop: '1px solid #E5DBC8', paddingTop: '1.25rem' }}>
              {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} style={{ marginBottom: '1rem' }}>{paragraph}</p>
              ))}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'right', borderTop: '1px solid #E5DBC8', paddingTop: '1rem' }}>
              <button onClick={() => setSelectedArticle(null)} className="btn btn-primary btn-sm">
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

