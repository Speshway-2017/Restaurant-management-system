import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const RestaurantBrandingContext = createContext();

export function RestaurantBrandingProvider({ children }) {
  const [branding, setBranding] = useState(() => {
    try {
      const saved = localStorage.getItem('flavora_restaurant_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const nameVal = parsed.restaurantName || parsed.brandName || parsed.name || 'Flavora Kitchen';
        const logoVal = parsed.logoUrl || parsed.logo || parsed.brandLogo || '/logo.png';
        return {
          ...parsed,
          restaurantName: nameVal,
          brandName: nameVal,
          name: nameVal,
          logoUrl: logoVal,
          logo: logoVal,
          brandLogo: logoVal,
          tagline: parsed.tagline || 'Good food. Great moments.',
          contactEmail: parsed.contactEmail || parsed.email || 'admin@flavorakitchen.in',
          contactPhone: parsed.contactPhone || parsed.phone || '+91 98765 43210',
          address: parsed.address || 'Plot No. 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033'
        };
      }
    } catch (e) {}
    return {
      restaurantName: 'Flavora Kitchen',
      brandName: 'Flavora Kitchen',
      name: 'Flavora Kitchen',
      logoUrl: '/logo.png',
      logo: '/logo.png',
      brandLogo: '/logo.png',
      tagline: 'Good food. Great moments.',
      contactEmail: 'admin@flavorakitchen.in',
      contactPhone: '+91 98765 43210',
      address: 'Plot No. 42, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033'
    };
  });

  const [loading, setLoading] = useState(false);

  const fetchBranding = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      if (data && typeof data === 'object') {
        const nameVal = data.restaurantName || data.brandName || data.name || 'Flavora Kitchen';
        const logoVal = data.logoUrl || data.logo || data.brandLogo || '/logo.png';

        const merged = {
          ...data,
          restaurantName: nameVal,
          brandName: nameVal,
          name: nameVal,
          logoUrl: logoVal,
          logo: logoVal,
          brandLogo: logoVal
        };

        setBranding(merged);
        try {
          localStorage.setItem('flavora_restaurant_settings', JSON.stringify(merged));
        } catch (e) {}
        return merged;
      }
    } catch (err) {
      console.warn('Could not fetch server settings in RestaurantBrandingContext:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBranding = useCallback(async (newSettings) => {
    try {
      setLoading(true);
      const nameVal = newSettings.restaurantName || newSettings.brandName || newSettings.name || branding.brandName;
      const logoVal = newSettings.logoUrl || newSettings.logo || newSettings.brandLogo || branding.brandLogo;

      const payload = {
        ...branding,
        ...newSettings,
        restaurantName: nameVal,
        brandName: nameVal,
        name: nameVal,
        logoUrl: logoVal,
        logo: logoVal,
        brandLogo: logoVal
      };

      // 1. Optimistic local update & cache
      setBranding(payload);
      try {
        localStorage.setItem('flavora_restaurant_settings', JSON.stringify(payload));
      } catch (e) {}

      // Broadcast events across components
      window.dispatchEvent(new Event('flavora_settings_updated'));
      window.dispatchEvent(new Event('flavora_brand_updated'));

      // 2. Persist to MongoDB database
      const response = await api.updateSettings(payload);
      if (response && typeof response === 'object') {
        const finalName = response.restaurantName || response.brandName || response.name || nameVal;
        const finalLogo = response.logoUrl || response.logo || response.brandLogo || logoVal;

        const finalMerged = {
          ...payload,
          ...response,
          restaurantName: finalName,
          brandName: finalName,
          name: finalName,
          logoUrl: finalLogo,
          logo: finalLogo,
          brandLogo: finalLogo
        };

        setBranding(finalMerged);
        try {
          localStorage.setItem('flavora_restaurant_settings', JSON.stringify(finalMerged));
        } catch (e) {}
        window.dispatchEvent(new Event('flavora_settings_updated'));
        window.dispatchEvent(new Event('flavora_brand_updated'));
        return finalMerged;
      }
      return payload;
    } catch (err) {
      console.error('Failed to update restaurant branding:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [branding]);

  useEffect(() => {
    fetchBranding();

    const handleSync = () => {
      try {
        const saved = localStorage.getItem('flavora_restaurant_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setBranding(prev => ({
            ...prev,
            ...parsed,
            restaurantName: parsed.restaurantName || parsed.brandName || prev.brandName,
            brandName: parsed.restaurantName || parsed.brandName || prev.brandName,
            logoUrl: parsed.logoUrl || parsed.logo || prev.brandLogo,
            brandLogo: parsed.logoUrl || parsed.logo || prev.brandLogo
          }));
        }
      } catch (e) {}
    };

    window.addEventListener('flavora_settings_updated', handleSync);
    window.addEventListener('flavora_brand_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('flavora_settings_updated', handleSync);
      window.removeEventListener('flavora_brand_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchBranding]);

  const brandName = branding.brandName || branding.restaurantName || 'Flavora Kitchen';
  const brandLogo = branding.brandLogo || branding.logoUrl || branding.logo || '/logo.png';
  const tagline = branding.tagline || 'Good food. Great moments.';

  return (
    <RestaurantBrandingContext.Provider
      value={{
        branding,
        brandName,
        restaurantName: brandName,
        brandLogo,
        logoUrl: brandLogo,
        logo: brandLogo,
        tagline,
        loading,
        fetchBranding,
        refreshBranding: fetchBranding,
        updateBranding
      }}
    >
      {children}
    </RestaurantBrandingContext.Provider>
  );
}

export function useRestaurantBranding() {
  const context = useContext(RestaurantBrandingContext);
  if (!context) {
    const saved = (() => {
      try {
        const s = localStorage.getItem('flavora_restaurant_settings');
        return s ? JSON.parse(s) : {};
      } catch (e) {
        return {};
      }
    })();
    const brandName = saved.restaurantName || saved.brandName || 'Flavora Kitchen';
    const brandLogo = saved.logoUrl || saved.logo || '/logo.png';
    return {
      branding: saved,
      brandName,
      restaurantName: brandName,
      brandLogo,
      logoUrl: brandLogo,
      logo: brandLogo,
      tagline: saved.tagline || '',
      loading: false,
      fetchBranding: () => {},
      refreshBranding: () => {},
      updateBranding: () => {}
    };
  }
  return context;
}
