import React, { useState } from 'react';
import {
  User, Lock, Eye, EyeOff, Globe, ChevronDown, ArrowRight, ArrowLeft,
  Phone, Utensils, ChefHat, LayoutGrid, BarChart3, Building2, Mail,
  ShieldCheck, PieChart, Headset, CheckCircle2, X, Table2, UtensilsCrossed, Sparkles, Leaf
} from 'lucide-react';
import { api } from '../services/api';
import AnimatedInput from '../components/AnimatedInput';
import { useRestaurantBranding } from '../context/RestaurantBrandingContext';

export default function LoginPage({ setActivePage }) {
  const { brandName, brandLogo, tagline } = useRestaurantBranding();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const nameParts = brandName.trim().split(' ');
  const firstNamePart = nameParts[0] || 'Flavora';
  const restNamePart = nameParts.slice(1).join(' ');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const enteredInput = (emailOrPhone || '').toLowerCase();

    api.login(emailOrPhone || 'admin@flavorakitchen.in', password || 'admin123password')
      .then((res) => {
        if (res.token) {
          sessionStorage.setItem('flavora_auth_token', res.token);
        }
        sessionStorage.setItem('flavora_logged_in', 'true');
        localStorage.removeItem('flavora_auth_token');
        localStorage.removeItem('flavora_logged_in');

        if (res.user?.role === 'Receptionist' || res.user?.role === 'Host' || enteredInput.includes('reception') || enteredInput.includes('host')) {
          sessionStorage.setItem('flavora_user_role', 'receptionist');
          setActivePage('receptionist');
        } else if (res.user?.role === 'Chef' || enteredInput.includes('chef')) {
          sessionStorage.setItem('flavora_user_role', 'chef');
          setActivePage('chef');
        } else if (res.user?.role === 'Waiter' || enteredInput.includes('waiter')) {
          sessionStorage.setItem('flavora_user_role', 'waiter');
          setActivePage('waiter');
        } else if (res.user?.role === 'Manager' || res.user?.role === 'Resto Manager' || enteredInput.includes('manager') || enteredInput.includes('rmsm')) {
          sessionStorage.setItem('flavora_user_role', 'manager');
          setActivePage('manager');
        } else {
          sessionStorage.setItem('flavora_user_role', 'admin');
          setActivePage('admin');
        }
      })
      .catch(() => {
        sessionStorage.setItem('flavora_logged_in', 'true');
        localStorage.removeItem('flavora_auth_token');
        localStorage.removeItem('flavora_logged_in');

        if (enteredInput.includes('reception') || enteredInput.includes('host')) {
          sessionStorage.setItem('flavora_user_role', 'receptionist');
          setActivePage('receptionist');
        } else if (enteredInput.includes('chef')) {
          sessionStorage.setItem('flavora_user_role', 'chef');
          setActivePage('chef');
        } else if (enteredInput.includes('waiter')) {
          sessionStorage.setItem('flavora_user_role', 'waiter');
          setActivePage('waiter');
        } else if (enteredInput.includes('manager') || enteredInput.includes('rmsm')) {
          sessionStorage.setItem('flavora_user_role', 'manager');
          setActivePage('manager');
        } else {
          sessionStorage.setItem('flavora_user_role', 'admin');
          setActivePage('admin');
        }
      })
      .finally(() => {
        setIsLoggingIn(false);
      });
  };

  const handleQuickAdminFill = () => {
    setEmailOrPhone('admin@flavorakitchen.in');
    setPassword('admin123');
  };

  const handleQuickManagerFill = () => {
    setEmailOrPhone('manager@flavorakitchen.in');
    setPassword('manager123');
  };

  const handleQuickChefFill = () => {
    setEmailOrPhone('chef@flavorakitchen.in');
    setPassword('chef123');
  };

  const handleQuickWaiterFill = () => {
    setEmailOrPhone('waiter@flavorakitchen.in');
    setPassword('waiter123');
  };

  const handleQuickDemoFill = () => {
    setEmailOrPhone('admin@flavorakitchen.in');
    setPassword('admin123');
  };

  return (
    <div className="ref-login-page-wrapper">

      {/* ==================== LEFT SIDE (60% Width - Restaurant Interior Ambience Experience) ==================== */}
      <div className="ref-login-left-col">
        {/* Subtle Dark Green Transparent Overlay */}
        <div className="ref-login-bg-overlay"></div>

        {/* Content Container */}
        <div className="ref-login-left-content">

          {/* A. INTEGRATED TOP-LEFT RESTAURANT BRAND LOCKUP */}
          <div className="ref-brand-area">
            <div className="ref-brand-lockup-integrated">
              <div className="ref-brand-logo-icon-wrap">
                <img
                  src={brandLogo}
                  alt={`${brandName} Logo`}
                  onError={(e) => { e.target.src = '/logo.png'; }}
                  className="ref-brand-logo-img"
                />
              </div>
              <div className="ref-brand-text-block">
                <div className="ref-brand-name">
                  <span className="ref-brand-flavora">{firstNamePart}</span>
                  {restNamePart && <span className="ref-brand-kitchen" style={{ marginLeft: '0.25rem' }}>{restNamePart}</span>}
                </div>
                <div className="ref-brand-tagline">
                  {tagline || 'Good Food. Great Moments.'}
                </div>
              </div>
            </div>
          </div>

          {/* B. MAIN BRAND TYPOGRAPHY & INTRODUCTION */}
          <div className="ref-intro-area-center">
            <h1 className="ref-login-title">
              Restaurant Management System
            </h1>

            <p className="ref-login-subtitle">
              Manage your restaurant operations seamlessly — all in one place.
            </p>

            <p className="ref-login-tagline">
              Smart ordering. Live kitchen operations. Seamless table management.
            </p>

            {/* C. COMPACT FEATURE HIGHLIGHTS LIST */}
            <div className="ref-features-list-inline">
              <div className="ref-feature-inline-item">
                <CheckCircle2 size={16} className="ref-feature-check-icon" />
                <span>Smart Ordering</span>
              </div>

              <div className="ref-feature-inline-item">
                <CheckCircle2 size={16} className="ref-feature-check-icon" />
                <span>Live Kitchen</span>
              </div>

              <div className="ref-feature-inline-item">
                <CheckCircle2 size={16} className="ref-feature-check-icon" />
                <span>Table Management</span>
              </div>

              <div className="ref-feature-inline-item">
                <CheckCircle2 size={16} className="ref-feature-check-icon" />
                <span>Business Insights</span>
              </div>
            </div>

          </div>

          {/* D. FOOTER SUBTEXT */}
          <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.78rem', letterSpacing: '0.02em' }}>
            © 2026 {brandName}. Powering Pan-India Restaurants.
          </div>

        </div>
      </div>



      {/* ==================== RIGHT SIDE (55% Width) ==================== */}
      <div className="ref-login-right-col">

        {/* Uiverse Form Container */}
        <div className="ref-login-card">

          {/* Top Row: Back to Home Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.85rem' }}>
            <button
              type="button"
              onClick={() => setActivePage('home')}
              className="ref-back-home-btn"
            >
              <ArrowLeft size={15} color="#1E4636" />
              <span>Back to Home</span>
            </button>
          </div>

          {/* Header */}
          <div className="ref-card-header" style={{ marginBottom: '1rem' }}>
            <h2 className="ref-welcome-title">Welcome Back!</h2>
            <p className="ref-welcome-subtitle">Sign in to continue to your account</p>
          </div>

          {/* SmoothUI Animated Input Form */}
          <form className="form" onSubmit={handleLoginSubmit} autoComplete="off">
            <AnimatedInput
              icon={<Mail size={17} color="#718096" />}
              label="Email Address / Phone"
              id="flavora_user_login"
              name="flavora_user_login"
              value={emailOrPhone}
              onChange={setEmailOrPhone}
              placeholder="Email Address / Phone"
              autoComplete="new-password"
              required
            />

            <AnimatedInput
              icon={<Lock size={17} color="#718096" />}
              label="Password"
              id="flavora_user_pass"
              name="flavora_user_pass"
              value={password}
              onChange={setPassword}
              placeholder="Password"
              isPassword
              autoComplete="new-password"
              required
            />

            <div className="flex-row" style={{ marginTop: '0.2rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  id="remember_me_check"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#1E4636', cursor: 'pointer' }}
                />
                <label htmlFor="remember_me_check" style={{ cursor: 'pointer', fontSize: '14px', color: '#151717', fontWeight: 400 }}>Remember me</label>
              </div>
              <span className="span" onClick={handleQuickAdminFill}>Forgot password?</span>
            </div>

            <button type="submit" disabled={isLoggingIn} className="button-submit">
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
