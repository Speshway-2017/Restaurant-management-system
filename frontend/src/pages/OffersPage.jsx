import React from 'react';
import { Tag, Sparkles, Flame, Clock, Gift, CheckCircle2, ArrowRight } from 'lucide-react';

export default function OffersPage({ onOpenDemoModal }) {
  const deals = [
    {
      id: 1,
      title: 'Royal Tandoori Feast',
      tag: '20% OFF TODAY',
      price: '₹999',
      origPrice: '₹1250',
      badgeColor: '#FF8A00',
      desc: 'Paneer Tikka Angara, Murgh Malai Kabab, Butter Naan x2, Dal Makhani & Gulab Jamun',
      validity: 'Valid on Dine-In & Takeaway',
      img: '/hero_dish_1.png',
      isVeg: false
    },
    {
      id: 2,
      title: 'Shahi Biryani Combo',
      tag: 'WEEKEND SPECIAL',
      price: '₹649',
      origPrice: '₹799',
      badgeColor: '#E07A3C',
      desc: 'Hyderabadi Dum Biryani + Mirchi Ka Salan + Double Ka Meetha + Mango Lassi',
      validity: 'Valid Fri – Sun',
      img: '/hero_dish_2.png',
      isVeg: false
    },
    {
      id: 3,
      title: 'Chef Special Thali',
      tag: 'BESTSELLER',
      price: '₹450',
      origPrice: '₹550',
      badgeColor: '#3F8F5B',
      desc: 'Paneer Butter Masala, Dal Tadka, Jeera Rice, Tandoori Rotis x3, Phirni & Salad',
      validity: 'Available Lunch Hours (12 PM – 3:30 PM)',
      img: '/chef_plating.png',
      isVeg: true
    },
    {
      id: 4,
      title: 'Family Feast Platter (Serves 4)',
      tag: 'FAMILY SAVER',
      price: '₹1,799',
      origPrice: '₹2,200',
      badgeColor: '#FF8A00',
      desc: 'Full Tandoori Murgh, 2x Biryani Pots, Assorted Naan Basket, Dal Makhani & Dessert Platter',
      validity: 'Valid Daily All Hours',
      img: '/carousel_2.png',
      isVeg: false
    },
    {
      id: 5,
      title: 'Monsoon Chai & Pakora Perk',
      tag: 'AFTERNOON DEAL',
      price: '₹249',
      origPrice: '₹320',
      badgeColor: '#E07A3C',
      desc: 'Hot Masala Chai x2 with Paneer & Onion Pakora Platter + Mint Chutney',
      validity: 'Valid 4 PM – 6:30 PM',
      img: '/tandoor_oven.png',
      isVeg: true
    },
    {
      id: 6,
      title: 'First QR Order Bonus',
      tag: '15% FLAT DISCOUNT',
      price: 'FLAT 15% OFF',
      origPrice: 'Code: FLAVORA15',
      badgeColor: '#3F8F5B',
      desc: 'Scan table QR code and pay via UPI to unlock instant 15% discount on total bill.',
      validity: 'Valid for New Guests',
      img: '/carousel_3.png',
      isVeg: true
    }
  ];

  return (
    <div className="offers-page">
      {/* Hero Banner (Unified Page Hero System) */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <Tag size={14} />
            <span>EXCLUSIVES & CHEF COMBOS</span>
          </div>

          <h1 className="page-hero-title-unified">
            Special Offers & Deals
          </h1>

          <p className="page-hero-subtitle-unified">
            Enjoy handcrafted chef combo feasts, weekend thali specials, and exclusive discounts at Flavora Kitchen.
          </p>
        </div>
      </section>

      {/* Offers Grid */}
      <section style={{ backgroundColor: '#FAF3E6', padding: '3.5rem 1.5rem 5rem 1.5rem' }}>
        <div className="section" style={{ padding: 0 }}>
          <div className="grid-3">
            {deals.map(deal => (
              <div key={deal.id} className="menu-card-enhanced" style={{ borderTop: `3.5px solid ${deal.badgeColor}` }}>
                <div>
                  {/* Compact Header Row: Thumbnail Dish Icon + Tag + Title */}
                  <div className="menu-card-header-compact">
                    <img 
                      src={deal.img} 
                      alt={deal.title} 
                      className="menu-card-thumb-icon"
                    />

                    <div className="menu-card-header-info">
                      <div className="menu-card-tag-row">
                        <span className={deal.isVeg ? 'veg-dot' : 'nonveg-dot'}></span>
                        <span style={{ fontSize: '0.72rem', color: deal.badgeColor, fontWeight: '800', background: 'rgba(255, 138, 0, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {deal.tag}
                        </span>
                      </div>

                      <div className="menu-card-title-row">
                        <h3 className="menu-card-title">{deal.title}</h3>
                      </div>
                    </div>
                  </div>

                  <p className="menu-card-desc">{deal.desc}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#64748B', marginBottom: '1rem', fontWeight: '600' }}>
                    <Clock size={14} color="#FF8A00" />
                    <span>{deal.validity}</span>
                  </div>
                </div>

                <div className="menu-card-action-bar">
                  <div>
                    <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FF8A00' }}>{deal.price}</span>
                    <span style={{ fontSize: '0.85rem', color: '#94A3B8', textDecoration: 'line-through', marginLeft: '0.4rem', fontWeight: '600' }}>{deal.origPrice}</span>
                  </div>
                  <button onClick={onOpenDemoModal} className="btn-add-cart" style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem' }}>
                    <span>Claim Deal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
