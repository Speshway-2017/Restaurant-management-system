import React, { useState, useEffect } from 'react';
import { Mail, Calendar, User, Clock, ArrowRight, X, ChevronDown, CheckCircle2 } from 'lucide-react';

import { useRestaurantBranding } from '../context/RestaurantBrandingContext';

export default function BlogsPage({ setActivePage }) {
  const { branding, brandName, fetchBranding } = useRestaurantBranding();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetchBranding();
    const handleSync = () => {
      fetchBranding();
    };
    window.addEventListener('flavora_blogs_updated', handleSync);
    return () => window.removeEventListener('flavora_blogs_updated', handleSync);
  }, [fetchBranding]);

  const defaultBlogs = [
    {
      id: 1,
      title: 'The Secret of Traditional Dum Biryani',
      category: 'HERITAGE',
      categoryClass: 'badge-overlay-orange',
      author: 'Chef Ananya',
      date: 'October 12, 2024',
      readTime: '7 min read',
      image: '/carousel_1.png',
      status: 'Published',
      excerpt: "Mastering the 'dum' technique is more than just cooking; it's a slow-cooked philosophy of patience. We dive into the specific layering methods and spice blends that have defined authentic Indian biryani for centuries.",
      content: `
        ### The Ancient Art of Dum Pukht
        Dum Pukht translates literally to 'slow oven cooking'. Originating from the royal Mughal and Awadhi kitchens, this technique involves sealing food in a heavy brass or clay handi with a dough paste seal (atta dough). The trapped steam cooks meat and fragrant long-grain basmati rice in their own natural juices.

        ### Essential Spice Ratios & Layering:
        1. **Par-Boiled Basmati:** Rice cooked to precisely 70% in whole-spice infused water (star anise, cloves, green cardamom, black pepper).
        2. **The Marinated Protein Base:** Yoghurt, shahi jeera, Kashmiri red chili powder, ginger-garlic paste, and fried golden onions (birista).
        3. **Saffron & Ghee Infusion:** Pure saffron strands soaked in warm milk drizzled over top rice layers alongside fried mint leaves.

        At ${brandName}, we preserve this slow-cooking heritage while ensuring prompt dining service through our digital kitchen batch scheduling.
      `
    },
    {
      id: 2,
      title: 'Sourcing Seasonal Ingredients in India',
      category: 'SOURCING',
      categoryClass: 'badge-overlay-green',
      author: 'Chef Vikram',
      date: 'October 05, 2024',
      readTime: '5 min read',
      image: '/tandoor_oven.png',
      status: 'Published',
      excerpt: 'Navigating local markets to find the best seasonal produce for your restaurant menu, ensuring farm-fresh quality and vibrant natural flavors.',
      content: `
        ### Farm-to-Table in the Indian Context
        Seasonal sourcing in India requires deep relationships with regional mandis (wholesale markets). From monsoon mustard greens to winter Guntur chilies, aligning your menu with peak harvest cycles dramatically improves dish taste while lowering food costs.
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
      status: 'Published',
      excerpt: 'Transforming rustic, complex curries into visually stunning modern masterpieces without sacrificing traditional flavor profiles.',
      content: `
        ### Elevating Gravies & Tandoori Starters
        Indian cuisine is rich in vibrant colors—turmeric golds, coriander greens, and saffron oranges. Plating modern Indian dishes relies on contrast, height, and negative space on stoneware rimmed bowls.
      `
    }
  ];

  const allBlogs = (branding && Array.isArray(branding.blogs) && branding.blogs.length > 0)
    ? branding.blogs
    : (() => {
        try {
          const s = localStorage.getItem('flavora_blogs');
          if (s) {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch(e) {}
        return defaultBlogs;
      })();

  // Exclude Drafts from Customer view
  const publishedBlogs = allBlogs.filter(b => b.status !== 'Draft');

  const featuredStory = publishedBlogs[0] || defaultBlogs[0];
  const recentInsights = publishedBlogs.length > 1 ? publishedBlogs.slice(1) : defaultBlogs.slice(1);

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
            <div className="featured-img-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
              <span
                className="blog-category-badge-overlay"
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  backgroundColor: '#0F2A1D',
                  color: '#F2C14E',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(242, 193, 78, 0.4)'
                }}
              >
                {featuredStory.category}
              </span>
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
                <div className="insight-card-img-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
                  <span
                    className="blog-category-badge-overlay"
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#0F2A1D',
                      color: '#F2C14E',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(242, 193, 78, 0.4)'
                    }}
                  >
                    {item.category}
                  </span>
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

