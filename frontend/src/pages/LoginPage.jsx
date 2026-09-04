import React, { useState } from 'react';
import {
  User, Lock, Eye, EyeOff, Globe, ChevronDown, ArrowRight, ArrowLeft,
  Phone, Utensils, ChefHat, LayoutGrid, BarChart3, Building2, Mail,
  ShieldCheck, PieChart, Headset, CheckCircle2, X, Table2, UtensilsCrossed, Sparkles, Leaf, AlertCircle
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
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [demoGeneratedOtp, setDemoGeneratedOtp] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  const handleOpenForgotPassword = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setDemoGeneratedOtp('');
    setForgotStep(1);
    setIsForgotPasswordModalOpen(true);
  };

  const handleCloseForgotPassword = () => {
    setIsForgotPasswordModalOpen(false);
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setDemoGeneratedOtp('');
    setForgotStep(1);
  };

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      setForgotSuccess(res.message || 'Password reset OTP sent to your registered email.');
      if (res.otp) {
        setDemoGeneratedOtp(res.otp);
      }
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Unable to process password reset. Please try again.');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotOtp || !forgotOtp.trim()) {
      setForgotError('Please enter the 6-digit OTP received in your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter matching passwords.');
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const res = await api.resetPassword(forgotEmail.trim(), forgotOtp.trim(), newPassword);
      setForgotSuccess(res.message || 'Password reset successful! You can now sign in with your new password.');
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password. Please check your OTP and try again.');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const nameParts = brandName.trim().split(' ');
  const firstNamePart = nameParts[0] || 'Flavora';
  const restNamePart = nameParts.slice(1).join(' ');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoggingIn(true);

    if (!emailOrPhone || !password) {
      setErrorMessage('Invalid email or password.');
      setIsLoggingIn(false);
      return;
    }

    api.login(emailOrPhone.trim(), password)
      .then((res) => {
        const userObj = res.user || res;
        const role = userObj.role || res.role;
        const token = res.token || userObj.token;

        if (!token || !role) {
          throw new Error('Invalid email or password.');
        }

        const normRole = String(role).toLowerCase().trim();

        // Clear any old/stale profile keys from previous logins to prevent account data leakage
        sessionStorage.removeItem('flavora_profile_manager');
        sessionStorage.removeItem('flavora_profile_chef');
        sessionStorage.removeItem('flavora_profile_receptionist');
        sessionStorage.removeItem('flavora_profile_admin');
        localStorage.removeItem('flavora_profile_manager');
        localStorage.removeItem('flavora_profile_chef');
        localStorage.removeItem('flavora_profile_receptionist');
        localStorage.removeItem('flavora_profile_admin');

        // Save session credentials for the exact newly authenticated user
        sessionStorage.setItem('flavora_auth_token', token);
        sessionStorage.setItem('flavora_logged_in', 'true');
        sessionStorage.setItem('flavora_user_role', normRole);
        sessionStorage.setItem('flavora_user_data', JSON.stringify(userObj));

        if (rememberMe) {
          localStorage.setItem('flavora_auth_token', token);
          localStorage.setItem('flavora_logged_in', 'true');
          localStorage.setItem('flavora_user_role', normRole);
          localStorage.setItem('flavora_user_data', JSON.stringify(userObj));
        }

        // Role-based routing strictly from backend user.role
        if (normRole === 'admin') {
          setActivePage('admin');
        } else if (normRole === 'manager' || normRole === 'resto manager') {
          setActivePage('manager');
        } else if (normRole === 'chef' || normRole === 'head chef') {
          setActivePage('chef');
        } else if (normRole === 'waiter') {
          setActivePage('waiter');
        } else if (normRole === 'receptionist' || normRole === 'host') {
          setActivePage('receptionist');
        } else {
          setActivePage('home');
        }
      })
      .catch((err) => {
        // ALWAYS REMAIN ON LOGIN PAGE & CLEAR ALL AUTH STORAGE ON FAILURE
        sessionStorage.removeItem('flavora_auth_token');
        sessionStorage.removeItem('flavora_logged_in');
        sessionStorage.removeItem('flavora_user_role');
        sessionStorage.removeItem('flavora_user_data');
        localStorage.removeItem('flavora_auth_token');
        localStorage.removeItem('flavora_logged_in');
        localStorage.removeItem('flavora_user_role');
        localStorage.removeItem('flavora_user_data');

        const rawMsg = (err && err.message) ? String(err.message) : '';
        if (rawMsg.includes('403') || rawMsg.toLowerCase().includes('permission')) {
          setErrorMessage('You do not have permission to access this dashboard.');
        } else if (rawMsg.toLowerCase().includes('failed to fetch') || rawMsg.toLowerCase().includes('network')) {
          setErrorMessage('Unable to connect to the server. Please try again.');
        } else {
          setErrorMessage('Invalid email or password.');
        }
      })
      .finally(() => {
        setIsLoggingIn(false);
      });
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

              
            </div>

          </div>

          {/* D. FOOTER SUBTEXT */}
          <div style={{ color: '#0F172A', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.02em', textShadow: '0 1px 4px rgba(255, 255, 255, 0.95)' }}>
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

          {/* Invalid Login Credentials Error Alert */}
          {errorMessage && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              color: '#991B1B',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)'
            }}>
              <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

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
              <span
                className="span"
                onClick={handleOpenForgotPassword}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
              >
                Forgot password?
              </span>
            </div>

            <button type="submit" disabled={isLoggingIn} className="button-submit">
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>

      {/* ==================== INDEPENDENT FORGOT PASSWORD MODAL ==================== */}
      {isForgotPasswordModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 42, 29, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25), 0 4px 20px rgba(180, 83, 9, 0.15)',
            border: '1.5px solid #FDE68A',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Modal Header Bar */}
            <div style={{
              backgroundColor: '#0F2A1D',
              padding: '1.25rem 1.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  {forgotStep === 1 ? 'Forgot Password?' : forgotStep === 2 ? 'Set New Password' : 'Password Reset Successful'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#A3C2B3' }}>
                  {forgotStep === 1 ? 'Verify registered account email' : forgotStep === 2 ? 'Enter OTP and set new password' : 'Password updated successfully'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseForgotPassword}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', border: 'none', color: '#FFFFFF', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div style={{ padding: '1.5rem' }}>

              {/* Error Notification Alert */}
              {forgotError && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  color: '#991B1B',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem'
                }}>
                  <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Success Notification Alert */}
              {forgotSuccess && forgotStep !== 3 && (
                <div style={{
                  backgroundColor: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  color: '#166534',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem'
                }}>
                  <CheckCircle2 size={18} color="#166534" style={{ flexShrink: 0 }} />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* Demo Helper Banner if OTP generated */}
              {demoGeneratedOtp && forgotStep === 2 && (
                <div style={{
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  color: '#B45309',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  marginBottom: '1.1rem',
                  textAlign: 'center'
                }}>
                  <span>🔑 Demo Reset OTP Code: </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '1rem', backgroundColor: '#FFFFFF', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #FCD34D' }}>{demoGeneratedOtp}</span>
                </div>
              )}

              {/* STEP 1: ENTER REGISTERED EMAIL */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendResetLink} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>
                    Enter your registered email address and we'll send you a password reset code.
                  </p>

                  <div>
                    <label htmlFor="forgot_email_input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.4rem' }}>
                      Registered Email Address <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={17} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="forgot_email_input"
                        type="email"
                        required
                        autoComplete="off"
                        placeholder="e.g. admin@flavorakitchen.in"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                          borderRadius: '10px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={isSubmittingForgot}
                      style={{
                        width: '100%',
                        backgroundColor: '#0F2A1D',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        cursor: isSubmittingForgot ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(15, 42, 29, 0.2)'
                      }}
                    >
                      {isSubmittingForgot ? 'Sending OTP...' : 'Send Reset Link / OTP'}
                      {!isSubmittingForgot && <ArrowRight size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseForgotPassword}
                      style={{
                        width: '100%',
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        borderRadius: '12px',
                        padding: '0.65rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: ENTER OTP & SET NEW PASSWORD */}
              {forgotStep === 2 && (
                <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>
                    Enter the 6-digit OTP sent to <strong style={{ color: '#0F2A1D' }}>{forgotEmail}</strong> and set your new password.
                  </p>

                  {/* OTP Code Input */}
                  <div>
                    <label htmlFor="forgot_otp_input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                      6-Digit Reset OTP <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      id="forgot_otp_input"
                      type="text"
                      required
                      maxLength={6}
                      autoComplete="one-time-code"
                      placeholder="e.g. 123456"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.95rem',
                        fontFamily: 'monospace',
                        letterSpacing: '0.2em',
                        textAlign: 'center',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#F8FAFC',
                        fontWeight: 800
                      }}
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="forgot_new_pass_input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                      New Password <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={17} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="forgot_new_pass_input"
                        type={showNewPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 2.4rem 0.65rem 2.4rem',
                          borderRadius: '10px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {showNewPass ? <EyeOff size={17} color="#64748B" /> : <Eye size={17} color="#64748B" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="forgot_confirm_pass_input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0F2A1D', marginBottom: '0.35rem' }}>
                      Confirm New Password <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={17} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="forgot_confirm_pass_input"
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 2.4rem 0.65rem 2.4rem',
                          borderRadius: '10px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {showConfirmPass ? <EyeOff size={17} color="#64748B" /> : <Eye size={17} color="#64748B" />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={isSubmittingForgot}
                      style={{
                        width: '100%',
                        backgroundColor: '#0F2A1D',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        cursor: isSubmittingForgot ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(15, 42, 29, 0.2)'
                      }}
                    >
                      {isSubmittingForgot ? 'Updating Password...' : 'Reset Password'}
                      {!isSubmittingForgot && <ShieldCheck size={17} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      style={{
                        width: '100%',
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        borderRadius: '12px',
                        padding: '0.65rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Change Email / Back
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SUCCESS CONFIRMATION */}
              {forgotStep === 3 && (
                <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={36} color="#166534" />
                  </div>

                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F2A1D' }}>Password Reset Successful!</h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, maxWidth: '360px' }}>
                    You can now sign in to your Flavora Kitchen account using your new password.
                  </p>

                  <button
                    type="button"
                    onClick={handleCloseForgotPassword}
                    style={{
                      width: '100%',
                      backgroundColor: '#0F2A1D',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      marginTop: '0.5rem',
                      boxShadow: '0 4px 14px rgba(15, 42, 29, 0.2)'
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
