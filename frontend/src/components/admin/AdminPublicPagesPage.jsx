import React, { useState, useEffect } from 'react';
import {
  Globe, ExternalLink, Eye, FileText, Camera, UtensilsCrossed,
  Tag, Info, PhoneCall, Sparkles, CheckCircle2, Search,
  Share2, ArrowRight, RefreshCw, LayoutTemplate, Layers,
  Compass, ShieldCheck, Flame, Bell, Save, Monitor,
  Smartphone, Tablet, X, Check, Copy, Palette, Link2,
  TrendingUp, BarChart3, HelpCircle, Instagram, Facebook,
  Linkedin, Twitter, Youtube, MapPin, Mail, Phone,
  UploadCloud, Image as ImageIcon, RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import AdminBlogsPage from './AdminBlogsPage';
import AdminGalleryPage from './AdminGalleryPage';
import { useRestaurantBranding } from '../../context/RestaurantBrandingContext';

export default function AdminPublicPagesPage({ setActivePage, setActiveTab }) {
  const { branding, updateBranding } = useRestaurantBranding();
  const [currentTab, setCurrentTab] = useState('directory'); // 'directory', 'branding', 'blogs', 'gallery', 'announcements', 'socials'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);
  
  // Interactive Live Device Preview Modal State
  const [previewModalPage, setPreviewModalPage] = useState(null);
  const [deviceViewport, setDeviceViewport] = useState('desktop'); // 'desktop', 'tablet', 'mobile'

  // Brand & Logo Configuration State
  const [brandSettings, setBrandSettings] = useState(() => {
    return {
      restaurantName: branding.restaurantName || branding.brandName || 'Flavora Kitchen',
      brandName: branding.brandName || branding.restaurantName || 'Flavora Kitchen',
      tagline: branding.tagline || 'Good food. Great moments.',
      logoUrl: branding.logoUrl || branding.brandLogo || '/logo.png',
      brandLogo: branding.brandLogo || branding.logoUrl || '/logo.png',
      faviconUrl: '/favicon.ico',
      primaryColor: '#1E4636',
      secondaryColor: '#E07A3C'
    };
  });

  useEffect(() => {
    if (branding && typeof branding === 'object') {
      setBrandSettings(prev => ({
        ...prev,
        ...branding,
        restaurantName: branding.restaurantName || branding.brandName || prev.restaurantName,
        brandName: branding.brandName || branding.restaurantName || prev.brandName,
        logoUrl: branding.logoUrl || branding.brandLogo || prev.logoUrl,
        brandLogo: branding.brandLogo || branding.logoUrl || prev.brandLogo
      }));
    }
  }, [branding]);

  // Social Media Links & SEO Configuration State
  const [socialLinks, setSocialLinks] = useState(() => {
    return {
      instagram: branding.instagram || 'https://instagram.com/flavorakitchen',
      facebook: branding.facebook || 'https://facebook.com/flavorakitchen',
      linkedin: branding.linkedin || 'https://linkedin.com/company/flavorakitchen',
      twitter: branding.twitter || 'https://twitter.com/flavorakitchen',
      youtube: branding.youtube || 'https://youtube.com/@flavorakitchen',
      googleMapsUrl: branding.googleMapsUrl || 'https://maps.google.com/?q=Jubilee+Hills',
      seoTitle: branding.seoTitle || `${branding.brandName || 'Flavora Kitchen'} - Fine Dining & Culinary Experience`,
      seoDescription: branding.seoDescription || branding.tagline || 'Experience authentic culinary craftsmanship and luxury dining at Flavora Kitchen.',
      supportEmail: branding.supportEmail || branding.contactEmail || branding.email || 'admin@flavorakitchen.in',
      supportPhone: branding.supportPhone || branding.contactPhone || branding.phone || '+91 98765 43210',
      whatsappPhone: branding.whatsappPhone || '+91 98490 12345'
    };
  });

  useEffect(() => {
    if (branding && typeof branding === 'object') {
      setSocialLinks(prev => ({
        ...prev,
        ...branding,
        instagram: branding.instagram || prev.instagram,
        facebook: branding.facebook || prev.facebook,
        linkedin: branding.linkedin || prev.linkedin,
        twitter: branding.twitter || prev.twitter,
        youtube: branding.youtube || prev.youtube,
        googleMapsUrl: branding.googleMapsUrl || prev.googleMapsUrl,
        seoTitle: branding.seoTitle || prev.seoTitle,
        seoDescription: branding.seoDescription || prev.seoDescription,
        supportEmail: branding.supportEmail || branding.contactEmail || branding.email || prev.supportEmail,
        supportPhone: branding.supportPhone || branding.contactPhone || branding.phone || prev.supportPhone,
        whatsappPhone: branding.whatsappPhone || prev.whatsappPhone
      }));
    }
  }, [branding]);

  const handleSaveSocials = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...branding,
        ...socialLinks,
        contactEmail: socialLinks.supportEmail,
        email: socialLinks.supportEmail,
        contactPhone: socialLinks.supportPhone,
        phone: socialLinks.supportPhone
      };
      await updateBranding(payload);
      showToast('✓ Social media profiles, SEO metadata & support contacts updated!');
    } catch (err) {
      console.error('Error saving social links:', err);
      showToast(`⚠️ Failed to save social media settings: ${err.message || 'Server error'}`);
    }
  };

  // Announcement Banner Configuration State
  const [announcementConfig, setAnnouncementConfig] = useState(() => {
    const bg = branding.announcementBg || branding.bannerBg || branding.backgroundColor || '#1E4636';
    const text = branding.announcementTextColor || branding.bannerTextColor || branding.textColor || '#FFFFFF';
    return {
      enabled: branding.announcementEnabled !== undefined ? branding.announcementEnabled : true,
      badgeText: branding.announcementBadge || branding.badgeText || 'ANNIVERSARY OFFER',
      messageText: branding.announcementMessage || branding.messageText || branding.message || 'Get 20% off on all royal thali pre-orders with coupon code ROYAL20!',
      ctaText: branding.announcementButtonText || branding.ctaText || branding.buttonLabel || 'View Offers',
      buttonTargetTab: branding.announcementTarget || branding.buttonTargetTab || 'offer',
      bannerBg: bg,
      backgroundColor: bg,
      bannerTextColor: text,
      textColor: text
    };
  });

  useEffect(() => {
    if (branding && typeof branding === 'object') {
      const bg = branding.announcementBg || branding.bannerBg || branding.backgroundColor || '#1E4636';
      const text = branding.announcementTextColor || branding.bannerTextColor || branding.textColor || '#FFFFFF';
      setAnnouncementConfig(prev => ({
        ...prev,
        ...branding,
        enabled: branding.announcementEnabled !== undefined ? branding.announcementEnabled : prev.enabled,
        badgeText: branding.announcementBadge || branding.badgeText || prev.badgeText,
        messageText: branding.announcementMessage || branding.messageText || branding.message || prev.messageText,
        ctaText: branding.announcementButtonText || branding.ctaText || branding.buttonLabel || prev.ctaText,
        buttonTargetTab: branding.announcementTarget || branding.buttonTargetTab || prev.buttonTargetTab,
        bannerBg: bg,
        backgroundColor: bg,
        bannerTextColor: text,
        textColor: text
      }));
    }
  }, [branding]);

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const bg = announcementConfig.bannerBg || announcementConfig.backgroundColor || '#1E4636';
      const text = announcementConfig.bannerTextColor || announcementConfig.textColor || '#FFFFFF';
      const badge = announcementConfig.badgeText || 'PROMO OFFER';
      const msg = announcementConfig.messageText || announcementConfig.message || '';
      const cta = announcementConfig.ctaText || announcementConfig.buttonLabel || '';
      const target = announcementConfig.buttonTargetTab || 'offer';

      const payload = {
        ...branding,
        ...announcementConfig,
        announcementEnabled: announcementConfig.enabled,
        announcementBadge: badge,
        badgeText: badge,
        announcementMessage: msg,
        messageText: msg,
        message: msg,
        announcementButtonText: cta,
        ctaText: cta,
        buttonLabel: cta,
        announcementTarget: target,
        buttonTargetTab: target,
        announcementBg: bg,
        bannerBg: bg,
        backgroundColor: bg,
        announcementTextColor: text,
        bannerTextColor: text,
        textColor: text
      };

      await updateBranding(payload);
      window.dispatchEvent(new Event('flavora_announcement_updated'));
      showToast('✓ Public announcement banner updated & live across all pages!');
    } catch (err) {
      console.error('Error saving announcement config:', err);
      showToast(`⚠️ Failed to save announcement: ${err.message || 'Server error'}`);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    try {
      const nameVal = brandSettings.restaurantName.trim() || 'Flavora Kitchen';
      const logoUrlToSave = brandSettings.logoUrl || brandSettings.brandLogo || '/logo.png';

      const updatedSettings = {
        ...brandSettings,
        restaurantName: nameVal,
        brandName: nameVal,
        name: nameVal,
        logoUrl: logoUrlToSave,
        logo: logoUrlToSave,
        brandLogo: logoUrlToSave
      };

      const result = await updateBranding(updatedSettings);
      if (result) {
        setBrandSettings(prev => ({
          ...prev,
          ...result,
          restaurantName: result.restaurantName || result.brandName || nameVal,
          brandName: result.brandName || result.restaurantName || nameVal,
          logoUrl: result.logoUrl || result.brandLogo || logoUrlToSave,
          brandLogo: result.brandLogo || result.logoUrl || logoUrlToSave
        }));
      }

      showToast('✓ Restaurant name & logo updated & persisted across entire website!');
    } catch (err) {
      console.error('Error in handleSaveBrand:', err);
      showToast(`⚠️ Could not save branding to database: ${err.message || 'Server error'}`);
    }
  };

  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  const processLogoFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('⚠️ Please choose a valid image file.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showToast('⚠️ Image size exceeds 4MB. Please choose a smaller logo.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (reader.result) {
        const base64 = reader.result;
        setBrandSettings(prev => ({ ...prev, logoUrl: base64, brandLogo: base64 }));
        showToast('✓ New logo loaded! Uploading to server...');
        
        try {
          const res = await api.uploadImage(base64, 'flavora_resto');
          const uploadedUrl = (res && res.url) ? res.url : ((res && res.data && res.data.url) ? res.data.url : null);
          if (uploadedUrl) {
            setBrandSettings(prev => ({ ...prev, logoUrl: uploadedUrl, brandLogo: uploadedUrl }));
            showToast('✓ Logo uploaded to server storage! Click Save & Broadcast to persist.');
          } else {
            showToast('✓ Logo preview updated. Click Save & Broadcast to persist.');
          }
        } catch (uploadErr) {
          console.warn('Upload endpoint error, fallback to base64:', uploadErr);
          showToast('✓ Logo preview updated. Click Save & Broadcast to persist.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleLogoDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processLogoFile(files[0]);
    }
  };

  const publicPagesList = [
    {
      id: 'home',
      title: 'Home / Main Entrance',
      path: '/',
      icon: Compass,
      category: 'Marketing',
      description: 'Primary customer entrance featuring high-impact visual carousels, chef signature dishes, dynamic reservation booking prompt, and verified customer testimonials.',
      badge: 'Main Gateway',
      badgeColor: '#166534',
      badgeBg: '#DCFCE7',
      stats: '100% Responsive • SEO Optimized',
      actionLabel: 'Preview Home',
      targetPage: 'home',
      manageTab: null,
      features: ['Hero Showcase', 'Signature Highlights', 'Table Booking CTA', 'Customer Reviews']
    },
    {
      id: 'menu',
      title: 'Menu & Table QR Ordering',
      path: '/menu',
      icon: UtensilsCrossed,
      category: 'Ordering',
      description: 'Interactive digital dining menu with categorized courses (Starters, Mains, Biryani, Desserts, Drinks), Veg/Non-Veg filters, table QR session lock, and live order pass dispatch.',
      badge: 'Table QR Ordering',
      badgeColor: '#9A3412',
      badgeBg: '#FFEDD5',
      stats: 'Synced with Kitchen KDS & POS',
      actionLabel: 'Preview Menu',
      targetPage: 'menu',
      manageTab: 'menu-mgmt',
      features: ['Category Strips', 'Veg/Non-Veg Filter', 'Session Locked Tables', 'Live Cart Sync']
    },
    {
      id: 'offer',
      title: 'Promotions & Special Deals',
      path: '/offer',
      icon: Tag,
      category: 'Promotions',
      description: 'Public dining promo showcase displaying active discount vouchers, holiday feasts, weekend specials, combo platters, and corporate dining offers.',
      badge: 'Active Discounts',
      badgeColor: '#854D0E',
      badgeBg: '#FEF9C3',
      stats: 'Synced with Loyalty & Coupons Engine',
      actionLabel: 'Preview Offers',
      targetPage: 'offer',
      manageTab: 'coupons',
      features: ['Coupon Codes', 'Family Feast Deals', 'Weekend Specials', 'Student Discounts']
    },
    {
      id: 'gallery',
      title: 'Media & Ambience Gallery',
      path: '/gallery',
      icon: Camera,
      category: 'Visual Media',
      description: 'High-definition photography showcase highlighting luxury restaurant ambience, clay tandoor oven action, master culinary plating, and guest dining moments.',
      badge: 'Photo Portfolio',
      badgeColor: '#1E40AF',
      badgeBg: '#DBEAFE',
      stats: 'Filterable by Ambience & Dishes',
      actionLabel: 'Preview Gallery',
      targetPage: 'gallery',
      subTabAction: 'gallery',
      features: ['Ambience Shots', 'Kitchen Action', 'Chefs in Spotlight', 'Plating Artistry']
    },
    {
      id: 'blogs',
      title: 'Culinary Magazine & Stories',
      path: '/blogs',
      icon: FileText,
      category: 'Content',
      description: 'Rich editorial articles covering authentic Mughal & Awadhi cooking traditions, sustainable farm spice sourcing, master chef techniques, and culinary insights.',
      badge: 'Editorial CMS',
      badgeColor: '#6B21A8',
      badgeBg: '#F3E8FF',
      stats: 'Rich Read Times • Category Tags',
      actionLabel: 'Preview Blogs',
      targetPage: 'blogs',
      subTabAction: 'blogs',
      features: ['Dum Cooking Secrets', 'Seasonal Sourcing', 'Kitchen Workflows', 'Recipe Stories']
    },
    {
      id: 'about',
      title: 'About Restaurant Brand',
      path: '/about',
      icon: Info,
      category: 'Brand Story',
      description: 'Restaurant origin story, culinary craftsmanship philosophy, executive chefs roster, hygiene standards, and hospitality milestone awards.',
      badge: 'Brand Profile',
      badgeColor: '#0F766E',
      badgeBg: '#CCFBF1',
      stats: 'Brand Identity & Heritage',
      actionLabel: 'Preview About',
      targetPage: 'about',
      manageTab: 'settings',
      features: ['Founding Story', 'Master Chefs Roster', 'Hygiene Certifications', 'Culinary Ethos']
    },
    {
      id: 'features',
      title: 'RestoOS Platform & Innovation',
      path: '/features',
      icon: Sparkles,
      category: 'Technology',
      description: 'Interactive interactive demonstration of contactless QR dining, live chef kitchen display system (KDS), automated bill generation, and floor turnovers.',
      badge: 'Tech Showcase',
      badgeColor: '#374151',
      badgeBg: '#F3F4F6',
      stats: 'Interactive Feature Demos',
      actionLabel: 'Preview Features',
      targetPage: 'features',
      manageTab: null,
      features: ['QR Contactless Order', 'Live KDS Pass', 'Smart Bill Settlement', 'Table Floor Turnovers']
    },
    {
      id: 'contact',
      title: 'Contact, Directions & Inquiries',
      path: '/contact',
      icon: PhoneCall,
      category: 'Support',
      description: 'Helpline telephone numbers, Google Maps GPS directions, weekday/weekend shift operating hours, and instant dining inquiry routing.',
      badge: 'Helpline & Maps',
      badgeColor: '#15803D',
      badgeBg: '#DCFCE7',
      stats: 'Live Timings & Inquiry Routing',
      actionLabel: 'Preview Contact',
      targetPage: 'contact',
      manageTab: 'settings',
      features: ['Google Maps Pin', 'Operating Shift Hours', 'Reservation Inquiries', 'Direct WhatsApp']
    }
  ];

  const categories = [
    { id: 'all', label: 'All Pages (8)' },
    { id: 'Marketing', label: 'Marketing' },
    { id: 'Ordering', label: 'Ordering' },
    { id: 'Promotions', label: 'Promotions' },
    { id: 'Visual Media', label: 'Visual Media' },
    { id: 'Content', label: 'Content & Editorial' },
    { id: 'Brand Story', label: 'Brand & Support' }
  ];

  const filteredPages = publicPagesList.filter(page => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (categoryFilter === 'all') return matchesSearch;
    if (categoryFilter === 'Brand Story') {
      return matchesSearch && (page.category === 'Brand Story' || page.category === 'Technology' || page.category === 'Support');
    }
    return matchesSearch && page.category === categoryFilter;
  });

  const handleOpenLiveSite = (path = '/') => {
    window.open(path, '_blank');
  };

  const bannerColorThemes = [
    { name: 'Royal Emerald', bg: '#1E4636', text: '#FFFFFF', accent: '#F2C14E' },
    { name: 'Spicy Amber', bg: '#C2410C', text: '#FFFFFF', accent: '#FEF08A' },
    { name: 'Midnight Charcoal', bg: '#0F172A', text: '#FFFFFF', accent: '#38BDF8' },
    { name: 'Regal Purple', bg: '#581C87', text: '#FFFFFF', accent: '#F472B6' },
    { name: 'Deep Crimson', bg: '#881337', text: '#FFFFFF', accent: '#FDE047' }
  ];

  return (
    <div className="admin-subpage-container" style={{ paddingBottom: '4rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: '#0F2A1D',
          color: '#FFFFFF',
          padding: '0.9rem 1.4rem',
          borderRadius: '14px',
          boxShadow: '0 12px 35px rgba(0,0,0,0.25)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.92rem',
          fontWeight: 800,
          borderLeft: '4px solid #4ADE80'
        }}>
          <CheckCircle2 size={20} color="#4ADE80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= 1. HEADER HERO ================= */}
      <div style={{
        background: 'linear-gradient(135deg, #0F2A1D 0%, #1E4636 50%, #285A46 100%)',
        borderRadius: '20px',
        padding: '2rem 2.25rem',
        color: '#FFFFFF',
        marginBottom: '1.75rem',
        boxShadow: '0 10px 30px rgba(15, 42, 29, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle geometric backdrop */}
        <div style={{
          position: 'absolute',
          right: '-40px',
          top: '-40px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(242, 193, 78, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#A7F3D0',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Globe size={13} />
                Public Customer Web Engine
              </span>
              <span style={{
                backgroundColor: '#DCFCE7',
                color: '#166534',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                ● 8 Live Endpoints
              </span>
            </div>

            <h1 style={{ margin: '0 0 0.4rem 0', fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              {brandSettings.restaurantName || 'Flavora Kitchen'} • Public Experience Hub
            </h1>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#CBD5E1', maxWidth: '720px', lineHeight: '1.5' }}>
              Change restaurant name & logo, control all visitor pages, publish culinary blog articles, update your photography gallery, and configure live announcement banners.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleOpenLiveSite('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#F2C14E',
                color: '#0F2A1D',
                border: 'none',
                padding: '0.75rem 1.35rem',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(242, 193, 78, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <ExternalLink size={16} />
              <span>Launch Live Website</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. FOUR KEY METRICS CARDS ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.1rem 1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          minWidth: 0
        }}>
          <div style={{ backgroundColor: '#FAF6EE', border: '1px solid #E5DBC8', padding: '0.75rem', borderRadius: '14px', color: '#1E4636', flexShrink: 0 }}>
            <LayoutTemplate size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Public Web Pages</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F2A1D', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>8 Live Routes</div>
            <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, marginTop: '0.1rem', whiteSpace: 'nowrap' }}>✓ 100% Mobile Ready</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.1rem 1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          minWidth: 0
        }}>
          <div style={{ backgroundColor: '#F3E8FF', border: '1px solid #E9D5FF', padding: '0.75rem', borderRadius: '14px', color: '#7E22CE', flexShrink: 0 }}>
            <FileText size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Editorial Stories</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#7E22CE', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>3 Articles</div>
            <div style={{ fontSize: '0.74rem', color: '#6B21A8', fontWeight: 700, marginTop: '0.1rem', whiteSpace: 'nowrap' }}>✓ SEO Rich CMS</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.1rem 1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          minWidth: 0
        }}>
          <div style={{ backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE', padding: '0.75rem', borderRadius: '14px', color: '#1D4ED8', flexShrink: 0 }}>
            <Camera size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Gallery Portfolio</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1D4ED8', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>7 Showcases</div>
            <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 700, marginTop: '0.1rem', whiteSpace: 'nowrap' }}>✓ Food & Ambience</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.1rem 1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          minWidth: 0
        }}>
          <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', padding: '0.75rem', borderRadius: '14px', color: '#15803D', flexShrink: 0 }}>
            <ShieldCheck size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>System Health</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#15803D', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>🟢 Operational</div>
            <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, marginTop: '0.1rem', whiteSpace: 'nowrap' }}>Instant QR Routing</div>
          </div>
        </div>
      </div>

      {/* ================= 3. NAVIGATION TAB STRIP ================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '0.85rem 1.25rem',
        border: '1px solid #E2E8F0',
        marginBottom: '1.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          flexWrap: 'nowrap',
          overflowX: 'auto'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap', width: '100%' }}>
            {[
              { id: 'directory', label: 'Pages Directory', icon: LayoutTemplate },
              { id: 'branding', label: 'Brand & Logo Identity', icon: Sparkles },
              { id: 'blogs', label: 'Blogs', icon: FileText },
              { id: 'gallery', label: 'Gallery', icon: Camera },
              { id: 'announcements', label: 'Promo Top Banner', icon: Bell },
              { id: 'socials', label: 'Social Media Links', icon: Share2 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCurrentTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: isActive ? '#0F2A1D' : '#F8FAFC',
                    color: isActive ? '#FFFFFF' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flex: '1 1 0px',
                    boxShadow: isActive ? '0 4px 12px rgba(15, 42, 29, 0.2)' : 'none'
                  }}
                >
                  <Icon size={14} color={isActive ? '#F2C14E' : '#64748B'} style={{ flexShrink: 0 }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box on Directory tab */}
          {currentTab === 'directory' && (
            <div style={{
              position: 'relative',
              width: '260px',
              minWidth: '220px'
            }}>
              <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filter pages & routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.55rem 0.85rem 0.55rem 2.2rem',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '0.84rem',
                  outline: 'none',
                  backgroundColor: '#F8FAFC'
                }}
              />
            </div>
          )}
        </div>

        {/* Category Pills (Sub-filter for Directory) */}
        {currentTab === 'directory' && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #F1F5F9',
            flexWrap: 'wrap'
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: categoryFilter === cat.id ? '#1E4636' : '#E2E8F0',
                  backgroundColor: categoryFilter === cat.id ? '#FAF6EE' : '#FFFFFF',
                  color: categoryFilter === cat.id ? '#1E4636' : '#64748B',
                  fontSize: '0.78rem',
                  fontWeight: categoryFilter === cat.id ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ================= 4. TAB CONTENT SECTIONS ================= */}

      {/* TAB 1: PAGES DIRECTORY OVERVIEW */}
      {currentTab === 'directory' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredPages.map((page) => {
            const Icon = page.icon;
            return (
              <div
                key={page.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1.5px solid #E2E8F0',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div>
                  {/* Top Bar: Icon + Title + Route + Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        backgroundColor: '#FAF6EE',
                        border: '1.5px solid #E5DBC8',
                        padding: '0.75rem',
                        borderRadius: '14px',
                        color: '#1E4636',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={22} />
                      </div>

                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F2A1D' }}>
                          {page.title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>Route:</span>
                          <code style={{
                            backgroundColor: '#F1F5F9',
                            color: '#0F2A1D',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '5px',
                            fontSize: '0.78rem',
                            fontWeight: 800
                          }}>
                            {page.path}
                          </code>
                        </div>
                      </div>
                    </div>

                    <span style={{
                      backgroundColor: page.badgeBg,
                      color: page.badgeColor,
                      padding: '0.3rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap'
                    }}>
                      {page.badge}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: '0.86rem',
                    color: '#475569',
                    lineHeight: '1.55',
                    margin: '0 0 1.15rem 0'
                  }}>
                    {page.description}
                  </p>

                  {/* Feature Tags Strip */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    {page.features.map((feat, fIdx) => (
                      <span
                        key={fIdx}
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          color: '#334155',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px'
                        }}
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    fontSize: '0.76rem',
                    color: '#166534',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <CheckCircle2 size={15} color="#166534" />
                    <span>{page.stats}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {page.subTabAction && (
                      <button
                        type="button"
                        onClick={() => setCurrentTab(page.subTabAction)}
                        style={{
                          backgroundColor: '#FAF6EE',
                          border: '1.5px solid #1E4636',
                          color: '#1E4636',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Manage CMS
                      </button>
                    )}

                    {page.manageTab && (
                      <button
                        type="button"
                        onClick={() => setActiveTab && setActiveTab(page.manageTab)}
                        style={{
                          backgroundColor: '#FAF6EE',
                          border: '1.5px solid #1E4636',
                          color: '#1E4636',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Configure
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPreviewModalPage(page)}
                      style={{
                        backgroundColor: '#0F2A1D',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '0.45rem 0.95rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(15, 42, 29, 0.25)'
                      }}
                    >
                      <Eye size={14} />
                      <span>Live Preview</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: BRAND & LOGO IDENTITY MANAGER */}
      {currentTab === 'branding' && (
        <form onSubmit={handleSaveBrand} style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid #E2E8F0',
          padding: '2rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
        }}>
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F2A1D', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={22} color="#1E4636" />
              <span>Restaurant Brand Name & Logo Management</span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
              Update the restaurant name and upload a new brand logo. Changes immediately synchronize across the main header navigation, footer, mobile drawer, and digital table QR menu.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            
            {/* Left Column: Brand Name & Tagline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#1E4636', marginBottom: '0.45rem' }}>
                  Restaurant Brand Name *
                </label>
                <input
                  type="text"
                  value={brandSettings.restaurantName}
                  onChange={(e) => setBrandSettings({ ...brandSettings, restaurantName: e.target.value })}
                  placeholder="e.g. Flavora Kitchen, Royal Biryani Express"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#0F2A1D'
                  }}
                />
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem' }}>
                  Displays in header navbar, bills, invoices, and browser tab titles.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#1E4636', marginBottom: '0.45rem' }}>
                  Brand Tagline & Slogan
                </label>
                <input
                  type="text"
                  value={brandSettings.tagline}
                  onChange={(e) => setBrandSettings({ ...brandSettings, tagline: e.target.value })}
                  placeholder="e.g. Good food. Great moments."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.92rem',
                    fontWeight: 600
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#1E4636', marginBottom: '0.45rem' }}>
                  Custom Logo URL (or upload from computer below)
                </label>
                <input
                  type="text"
                  value={brandSettings.logoUrl}
                  onChange={(e) => setBrandSettings({ ...brandSettings, logoUrl: e.target.value })}
                  placeholder="/logo.png or https://example.com/logo.png"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              {/* Direct File Upload Box (Drag and Drop Supported) */}
              <div
                onDragOver={handleLogoDragOver}
                onDragLeave={handleLogoDragLeave}
                onDrop={handleLogoDrop}
                style={{
                  border: `2px dashed ${isDraggingLogo ? '#1E4636' : '#CBD5E1'}`,
                  borderRadius: '14px',
                  padding: '1.25rem',
                  backgroundColor: isDraggingLogo ? '#F0FDF4' : '#F8FAFC',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('public-brand-logo-file-input')?.click()}
              >
                <UploadCloud size={30} color={isDraggingLogo ? '#1E4636' : '#64748B'} style={{ margin: '0 auto 0.5rem auto' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1E4636' }}>
                  {isDraggingLogo ? 'Drop Brand Logo Here!' : 'Drag & Drop New Brand Logo Here'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.25rem 0 0.85rem 0' }}>
                  or click to choose image file from device (PNG, JPG, WEBP, SVG)
                </div>

                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.25rem',
                  backgroundColor: '#1E4636',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }} onClick={(e) => e.stopPropagation()}>
                  <ImageIcon size={15} />
                  <span>Browse Image File</span>
                  <input
                    id="public-brand-logo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Right Column: Live Visual Logo Preview Emulator */}
            <div>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 900, color: '#0F2A1D', marginBottom: '0.65rem' }}>
                Live Brand Header & Logo Preview:
              </label>

              {/* Light Background Header Preview */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '14px',
                padding: '1.25rem',
                marginBottom: '1rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  Preview: Light Background (Website Navbar)
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #EAE3D2',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <img
                      src={brandSettings.logoUrl || '/logo.png'}
                      alt="Brand Logo"
                      onError={(e) => { e.target.src = '/logo.png'; }}
                      style={{ height: '34px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }}
                    />
                    <div style={{ display: 'flex', gap: '0.25rem', fontSize: '1.2rem', fontWeight: 900 }}>
                      <span style={{ color: '#1E4636' }}>{brandSettings.restaurantName ? brandSettings.restaurantName.split(' ')[0] : 'Flavora'}</span>
                      <span style={{ color: '#E07A3C' }}>{brandSettings.restaurantName && brandSettings.restaurantName.split(' ').length > 1 ? brandSettings.restaurantName.split(' ').slice(1).join(' ') : ''}</span>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.74rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>
                    Navbar Mode
                  </span>
                </div>
              </div>

              {/* Dark Background Header Preview */}
              <div style={{
                backgroundColor: '#0F2A1D',
                border: '1.5px solid #1E4636',
                borderRadius: '14px',
                padding: '1.25rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#A7F3D0', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  Preview: Dark Background (Footer & Splash Screen)
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#1E4636',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #285A46'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <img
                      src={brandSettings.logoUrl || '/logo.png'}
                      alt="Brand Logo"
                      onError={(e) => { e.target.src = '/logo.png'; }}
                      style={{ height: '34px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }}
                    />
                    <div style={{ display: 'flex', gap: '0.25rem', fontSize: '1.2rem', fontWeight: 900 }}>
                      <span style={{ color: '#F2C14E' }}>{brandSettings.restaurantName ? brandSettings.restaurantName.split(' ')[0] : 'Flavora'}</span>
                      <span style={{ color: '#FFFFFF' }}>{brandSettings.restaurantName && brandSettings.restaurantName.split(' ').length > 1 ? brandSettings.restaurantName.split(' ').slice(1).join(' ') : ''}</span>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.74rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#A7F3D0', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>
                    Dark Mode
                  </span>
                </div>
              </div>

              {/* Reset to Default Action */}
              <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => {
                    setBrandSettings(prev => ({
                      ...prev,
                      restaurantName: 'Flavora Kitchen',
                      logoUrl: '/logo.png'
                    }));
                    showToast('Reset to default Flavora Kitchen branding.');
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Restore Default Logo & Name</span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.25rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.85rem',
                backgroundColor: '#0F2A1D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(15, 42, 29, 0.25)'
              }}
            >
              <Save size={17} />
              <span>Save & Broadcast Brand Identity</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: EMBEDDED BLOG MANAGEMENT */}
      {currentTab === 'blogs' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
          <AdminBlogsPage isEmbedded={true} />
        </div>
      )}

      {/* TAB 4: EMBEDDED GALLERY MANAGEMENT */}
      {currentTab === 'gallery' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '1.5rem', border: '1px solid #E2E8F0' }}>
          <AdminGalleryPage isEmbedded={true} />
        </div>
      )}

      {/* TAB 5: PUBLIC ANNOUNCEMENT & BANNER DESIGNER */}
      {currentTab === 'announcements' && (
        <form onSubmit={handleSaveAnnouncement} style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid #E2E8F0',
          padding: '2rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
        }}>
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F2A1D', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bell size={22} color="#1E4636" />
              <span>Visitor Top Notice & Promo Banner Designer</span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
              Customize the prominent top notification bar displayed across all visitor pages with holiday specials, promo discount coupons, or urgent notices.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Enable Toggle Box */}
            <div style={{
              gridColumn: '1 / -1',
              backgroundColor: '#FAF6EE',
              border: '1.5px solid #E5DBC8',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 900, color: '#1E4636', fontSize: '1rem' }}>
                  📢 Publish Top Notification Banner
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.2rem' }}>
                  When enabled, this banner sits above the main navigation on every public page with a call-to-action button.
                </div>
              </div>

              <input
                type="checkbox"
                checked={announcementConfig.enabled}
                onChange={(e) => setAnnouncementConfig({ ...announcementConfig, enabled: e.target.checked })}
                style={{ width: '24px', height: '24px', accentColor: '#1E4636', cursor: 'pointer' }}
              />
            </div>

            {/* Form Fields */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                Badge Highlight Text *
              </label>
              <input
                type="text"
                value={announcementConfig.badgeText}
                onChange={(e) => setAnnouncementConfig({ ...announcementConfig, badgeText: e.target.value })}
                placeholder="e.g. SPECIAL OFFER, DIWALI FEAST"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                Action Button Label (Optional)
              </label>
              <input
                type="text"
                value={announcementConfig.ctaText}
                onChange={(e) => setAnnouncementConfig({ ...announcementConfig, ctaText: e.target.value })}
                placeholder="e.g. View Offers, Order Now"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                Banner Announcement Message *
              </label>
              <textarea
                rows={2}
                value={announcementConfig.messageText}
                onChange={(e) => setAnnouncementConfig({ ...announcementConfig, messageText: e.target.value })}
                placeholder="e.g. Flat 20% OFF on all Dine-In Orders above ₹999 with code FLAVORA20!"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Color Preset Palette Selection */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>
                🎨 Quick Color Theme Presets
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {bannerColorThemes.map((theme, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => setAnnouncementConfig({
                      ...announcementConfig,
                      bannerBg: theme.bg,
                      bannerTextColor: theme.text
                    })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      border: announcementConfig.bannerBg === theme.bg ? '2px solid #0F2A1D' : '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 800
                    }}
                  >
                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: theme.bg }} />
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE BANNER PREVIEW BOX */}
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 900, color: '#0F2A1D', marginBottom: '0.5rem' }}>
                Live Visitor Banner Emulator Preview:
              </label>
              <div style={{
                backgroundColor: announcementConfig.bannerBg || '#1E4636',
                color: announcementConfig.bannerTextColor || '#FFFFFF',
                padding: '0.9rem 1.5rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    backgroundColor: '#F2C14E',
                    color: '#0F2A1D',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 900
                  }}>
                    {announcementConfig.badgeText || 'SPECIAL'}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                    {announcementConfig.messageText || 'Your announcement message preview appears here'}
                  </span>
                </div>

                {announcementConfig.ctaText && (
                  <span style={{
                    backgroundColor: '#FFFFFF',
                    color: announcementConfig.bannerBg || '#1E4636',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    {announcementConfig.ctaText} →
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.75rem',
                backgroundColor: '#0F2A1D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(15, 42, 29, 0.25)'
              }}
            >
              <Save size={17} />
              <span>Save & Publish Top Banner</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: PUBLIC SOCIALS & SEO META */}
      {currentTab === 'socials' && (
        <form onSubmit={handleSaveSocials} style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid #E2E8F0',
          padding: '2rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
        }}>
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F2A1D', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Share2 size={22} color="#1E4636" />
              <span>Social Media Channels, SEO Meta & Visitor Contacts</span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
              Manage official social profile links appearing in the website footer, global SEO search engine metadata, and public customer helplines.
            </p>
          </div>

          {/* SECTION 1: SOCIAL LINKS */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#1E4636', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} />
              <span>Official Social Media Profiles</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  <Instagram size={15} color="#E1306C" />
                  <span>Instagram Profile URL</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  placeholder="https://instagram.com/flavorakitchen"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  <Facebook size={15} color="#1877F2" />
                  <span>Facebook Page URL</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.facebook}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                  placeholder="https://facebook.com/flavorakitchen"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  <Linkedin size={15} color="#0A66C2" />
                  <span>LinkedIn Page URL</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/flavorakitchen"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  <Twitter size={15} color="#1DA1F2" />
                  <span>Twitter / X Profile URL</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  placeholder="https://twitter.com/flavorakitchen"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  <Youtube size={15} color="#FF0000" />
                  <span>YouTube Channel URL</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.youtube}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  placeholder="https://youtube.com/@flavorakitchen"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  <MapPin size={15} color="#166534" />
                  <span>Google Maps Directions URL</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.googleMapsUrl}
                  onChange={(e) => setSocialLinks({ ...socialLinks, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/?q=Jubilee+Hills"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: SEO META INFORMATION */}
          <div style={{ marginBottom: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#1E4636', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} />
              <span>Global Search Engine Optimization (SEO) Metadata</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Global Page Title & Meta Header
                </label>
                <input
                  type="text"
                  value={socialLinks.seoTitle}
                  onChange={(e) => setSocialLinks({ ...socialLinks, seoTitle: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  Meta Search Description (Shown on Google Results)
                </label>
                <textarea
                  rows={2}
                  value={socialLinks.seoDescription}
                  onChange={(e) => setSocialLinks({ ...socialLinks, seoDescription: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: PUBLIC HELPLINE CONTACTS */}
          <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#1E4636', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PhoneCall size={18} />
              <span>Public Customer Helpline & Support Channels</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  <Mail size={15} color="#1E4636" />
                  <span>Public Inquiries Email *</span>
                </label>
                <input
                  type="email"
                  value={socialLinks.supportEmail}
                  onChange={(e) => setSocialLinks({ ...socialLinks, supportEmail: e.target.value })}
                  required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  <Phone size={15} color="#1E4636" />
                  <span>Customer Helpline Phone *</span>
                </label>
                <input
                  type="text"
                  value={socialLinks.supportPhone}
                  onChange={(e) => setSocialLinks({ ...socialLinks, supportPhone: e.target.value })}
                  required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                  <PhoneCall size={15} color="#166534" />
                  <span>WhatsApp Booking Assistant</span>
                </label>
                <input
                  type="text"
                  value={socialLinks.whatsappPhone}
                  onChange={(e) => setSocialLinks({ ...socialLinks, whatsappPhone: e.target.value })}
                  placeholder="+91 98490 12345"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.75rem',
                backgroundColor: '#0F2A1D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(15, 42, 29, 0.25)'
              }}
            >
              <Save size={17} />
              <span>Save Socials & SEO Channels</span>
            </button>
          </div>
        </form>
      )}

      {/* ================= 5. INTERACTIVE IN-APP DEVICE PREVIEW MODAL ================= */}
      {previewModalPage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '1200px',
            width: '100%',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
          }}>
            {/* Modal Header & Device Switcher */}
            <div style={{
              backgroundColor: '#0F2A1D',
              color: '#FFFFFF',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  backgroundColor: '#F2C14E',
                  color: '#0F2A1D',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 900
                }}>
                  {previewModalPage.title}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#A7F3D0', fontWeight: 600 }}>
                  Route: {previewModalPage.path}
                </span>
              </div>

              {/* Viewport Width Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#1E4636',
                borderRadius: '10px',
                padding: '0.25rem'
              }}>
                <button
                  type="button"
                  onClick={() => setDeviceViewport('desktop')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: deviceViewport === 'desktop' ? '#0F2A1D' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Monitor size={14} />
                  <span>Desktop</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeviceViewport('tablet')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: deviceViewport === 'tablet' ? '#0F2A1D' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Tablet size={14} />
                  <span>Tablet (768px)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeviceViewport('mobile')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: deviceViewport === 'mobile' ? '#0F2A1D' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Smartphone size={14} />
                  <span>Mobile (390px)</span>
                </button>
              </div>

              {/* Close & Open New Tab Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleOpenLiveSite(previewModalPage.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: '#F2C14E',
                    color: '#0F2A1D',
                    border: 'none',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Open in Tab</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewModalPage(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    padding: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Embedded Live Webpage Frame Area */}
            <div style={{
              flex: 1,
              backgroundColor: '#F1F5F9',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              padding: deviceViewport === 'desktop' ? '0' : '1.5rem'
            }}>
              <iframe
                src={previewModalPage.path}
                title={previewModalPage.title}
                style={{
                  width: deviceViewport === 'desktop' ? '100%' : (deviceViewport === 'tablet' ? '768px' : '390px'),
                  height: '100%',
                  border: deviceViewport === 'desktop' ? 'none' : '4px solid #334155',
                  borderRadius: deviceViewport === 'desktop' ? '0' : '24px',
                  boxShadow: deviceViewport === 'desktop' ? 'none' : '0 20px 50px rgba(0,0,0,0.25)',
                  backgroundColor: '#FFFFFF'
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
