import React from 'react';
import { 
  Building, Calendar, Rocket, Award, ShieldCheck, 
  CheckCircle2, ArrowRight, Utensils, Flame, Sparkles, MapPin, Layers, Heart
} from 'lucide-react';
import MagneticButton from '../components/MagneticButton';

export default function AboutUsPage({ setActivePage, onOpenDemoModal }) {
  const evolutionTimeline = [
    {
      year: '2017',
      title: 'Our First Kitchen in Jubilee Hills',
      subtitle: 'Hyderabad Heritage',
      badge: 'THE BEGINNING',
      desc: 'Opened our doors in Jubilee Hills, Hyderabad with a passion for authentic tandoori delicacies, hand-milled spices, and warm Indian hospitality.',
      icon: Utensils
    },
    {
      year: '2019',
      title: 'Artisanal Tandoori & Royal Thalis',
      subtitle: 'Signature Dum Delicacies',
      badge: 'CULINARY EXCELLENCE',
      desc: 'Introduced our signature Hyderabadi Dum Biryani pots and slow-cooked clay tandoori kebabs, crafted by master chefs to bring authentic royal flavors to every table.',
      icon: Flame
    },
    {
      year: '2021',
      title: 'Contactless Table Ordering',
      subtitle: 'Instant Digital Menu',
      badge: 'GUEST COMFORT',
      desc: 'Introduced table-side QR digital menus, making it simple for guests to explore dishes, check ingredients, and order effortlessly from their smartphones.',
      icon: Sparkles
    },
    {
      year: '2023',
      title: 'Serving More Cities & Guests',
      subtitle: '500,000+ Happy Diners',
      badge: 'EXPANSION',
      desc: 'Expanded our dining experiences and partner kitchens across Hyderabad, Bengaluru, Mumbai, and Delhi, sharing our love for food with over 500,000 guests.',
      icon: Award
    },
    {
      year: '2026',
      title: 'The Complete Dining Experience',
      subtitle: 'Modern & Seamless',
      badge: 'TODAY',
      desc: 'Combining seamless UPI payments, instant table reservations, and royal multi-cuisine dining to give every guest an unforgettable culinary visit.',
      icon: Heart
    }
  ];

  return (
    <div className="about-us-page-wrapper">
      {/* 1. HERO HEADER BANNER */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <Building size={14} />
            <span>ESTABLISHED 2017 • HYDERABAD, INDIA</span>
          </div>

          <h1 className="page-hero-title-unified">
            About Flavora Kitchen
          </h1>

          <p className="page-hero-subtitle-unified">
            From our founding roots in Jubilee Hills to powering 500+ restaurants across India, discover how Flavora Kitchen evolved into an industry-leading restaurant management ecosystem.
          </p>
        </div>
      </section>

      {/* 2. FOUNDING STORY & MISSION */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '5.5rem 1.5rem' }}>
        <div className="section" style={{ padding: 0 }}>
          <div className="grid-2" style={{ alignItems: 'center' }}>
            
            <div>
              <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-secondary)', marginBottom: '1.25rem' }}></div>

              <h2 className="text-h1" style={{ fontSize: '2.4rem', color: 'var(--color-primary-dark)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
                Our Founding & Vision
              </h2>

              <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1.25rem' }}>
                Flavora Kitchen was founded in <strong>2017 in Jubilee Hills, Hyderabad</strong> by a team of passionate restaurateurs and software engineers who recognized a crucial challenge in the F&B industry: the disconnect between authentic culinary heritage and modern restaurant technology.
              </p>

              <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1.75rem' }}>
                What began as a flagship dining hall serving clay-tandoori delicacies quickly evolved into a high-speed digital engine. Today, our technology enables restaurants to manage orders, inventory, billing, and staff roles with zero friction.
              </p>

              <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2rem', borderTop: '1px solid var(--color-neutral-200)', paddingTop: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>2017</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-neutral-600)', textTransform: 'uppercase', fontWeight: '700' }}>Year Founded</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-secondary)' }}>500K+</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-neutral-600)', textTransform: 'uppercase', fontWeight: '700' }}>Happy Diners</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-success)' }}>50+</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-neutral-600)', textTransform: 'uppercase', fontWeight: '700' }}>Authentic Dishes</div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <img 
                src="/tandoor_oven.png" 
                alt="Flavora Kitchen Foundation" 
                style={{ 
                  width: '100%', 
                  maxHeight: '440px', 
                  objectFit: 'cover', 
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }} 
              />
            </div>

          </div>
        </div>
      </section>

      {/* 3. EVOLUTION TIMELINE SECTION (LINE IMPLEMENTATION) */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '5.5rem 1.5rem', borderTop: '1px solid var(--color-neutral-200)' }}>
        <div className="section" style={{ padding: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              COMPANY ROADMAP
            </div>
            <h2 className="text-h1" style={{ fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: '0.75rem' }}>
              How We Evolved (2017 – Present)
            </h2>
            <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
              A step-by-step milestone timeline of our journey from a single Hyderabad kitchen to a pan-India restaurant technology ecosystem.
            </p>
          </div>

          {/* Timeline Vertical Connected Line Container */}
          <div style={{ maxWidth: '850px', margin: '0 auto', position: 'relative' }}>
            {/* Center Vertical Connecting Line */}
            <div style={{
              position: 'absolute',
              left: '28px',
              top: '20px',
              bottom: '20px',
              width: '3px',
              backgroundColor: 'var(--color-secondary)',
              opacity: 0.3,
              zIndex: 1
            }}></div>

            {/* Timeline Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'relative', zIndex: 2 }}>
              {evolutionTimeline.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                    {/* Node Dot Icon */}
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(30, 70, 54, 0.25)',
                      border: '3px solid #FFFFFF'
                    }}>
                      <IconComponent size={24} />
                    </div>

                    {/* Timeline Content Card */}
                    <div className="card" style={{ flexGrow: 1, padding: '1.75rem', borderLeft: '4px solid var(--color-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--color-primary)' }}>{item.year}</span>
                        <span className="badge-tag" style={{ margin: 0, fontSize: '0.75rem' }}>{item.badge}</span>
                      </div>

                      <h3 className="text-h2" style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', marginBottom: '0.25rem' }}>
                        {item.title}
                      </h3>

                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-secondary)', marginBottom: '0.75rem' }}>
                        {item.subtitle}
                      </div>

                      <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 4. THREE CORE PILLARS */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '5.5rem 1.5rem', borderTop: '1px solid var(--color-neutral-200)' }}>
        <div className="section" style={{ padding: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="text-h1" style={{ fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: '0.75rem' }}>
              The Pillars Driving Our Evolution
            </h2>
            <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
              Three core principles that steer our product innovation and guest satisfaction
            </p>
          </div>

          <div className="grid-3">
            {/* Pillar 1 */}
            <div className="card" style={{ padding: '2.25rem', textAlign: 'left', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(224, 122, 60, 0.12)', 
                color: 'var(--color-secondary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.5rem' 
              }}>
                <Utensils size={24} />
              </div>

              <h3 className="text-h2" style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: '0.75rem' }}>
                Culinary Authenticity
              </h3>

              <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '0.95rem', lineHeight: '1.7' }}>
                Sourcing raw spices directly from regional Indian farms to preserve true heritage taste, untouched by artificial shortcuts.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="card" style={{ padding: '2.25rem', textAlign: 'left', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(224, 122, 60, 0.12)', 
                color: 'var(--color-secondary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.5rem' 
              }}>
                <Flame size={24} />
              </div>

              <h3 className="text-h2" style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: '0.75rem' }}>
                Tech Ingenuity
              </h3>

              <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '0.95rem', lineHeight: '1.7' }}>
                Engineering sub-50ms order synchronization across waiters, kitchen display terminals, thermal printers, and billing counters.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="card" style={{ padding: '2.25rem', textAlign: 'left', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(63, 143, 91, 0.12)', 
                color: 'var(--color-success)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.5rem' 
              }}>
                <Sparkles size={24} />
              </div>

              <h3 className="text-h2" style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: '0.75rem' }}>
                Guest First Hospitality
              </h3>

              <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '0.95rem', lineHeight: '1.7' }}>
                Treating every guest like royalty with warm Indian hospitality, instant digital payment options, and attentive service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MASTER CHEFS & LEADERSHIP */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '5.5rem 1.5rem', borderTop: '1px solid var(--color-neutral-200)' }}>
        <div className="section" style={{ padding: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="text-h1" style={{ fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: '0.75rem' }}>
              The Hands Behind the Craft
            </h2>
            <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '1.05rem' }}>
              Meet our master chefs and operators guiding our culinary and technology evolution
            </p>
          </div>

          <div className="grid-2">
            {/* Chef Card 1 */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', border: '1px solid var(--color-neutral-200)' }}>
              <img 
                src="/chef_1.png" 
                alt="Chef Vikram Roy" 
                style={{ width: '45%', objectFit: 'cover', minHeight: '260px' }} 
              />
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 className="text-h2" style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: '0.25rem' }}>
                  Chef Vikram Roy
                </h3>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Executive Culinary Director
                </div>
                <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Over 18 years of culinary leadership across Hyderabad & North Indian dining, mastering slow-cooked dum curries and kitchen workflow optimization.
                </p>
              </div>
            </div>

            {/* Chef Card 2 */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', border: '1px solid var(--color-neutral-200)' }}>
              <img 
                src="/chef_2.png" 
                alt="Chef Ananya Sharma" 
                style={{ width: '45%', objectFit: 'cover', minHeight: '260px' }} 
              />
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 className="text-h2" style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: '0.25rem' }}>
                  Chef Ananya Sharma
                </h3>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Master Tandoori Specialist
                </div>
                <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Master of traditional clay tandoori ovens and saffron dessert artistry, pioneering modern digital order processing at kitchen pass stations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MAGNETIC CTA ACTIONS SECTION */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '4.5rem 1.5rem', textAlign: 'center', borderTop: '1px solid var(--color-neutral-200)' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h2 className="text-h1" style={{ color: 'var(--color-primary-dark)', marginBottom: '0.75rem' }}>
            Experience Flavora RestoOS
          </h2>
          <p className="text-body" style={{ color: 'var(--color-neutral-700)', marginBottom: '2rem' }}>
            Transform your dining experience or partner with our pan-India technology network.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <MagneticButton variant="default" onClick={() => setActivePage('menu')}>
              Get Started
            </MagneticButton>

            <MagneticButton variant="outline" onClick={() => setActivePage('features')}>
              Learn More
            </MagneticButton>

            <MagneticButton variant="secondary" onClick={() => setActivePage('contact')}>
              Contact Us
            </MagneticButton>
          </div>
        </div>
      </section>

    </div>
  );
}
