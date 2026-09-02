import React, { useState } from 'react';
import { X, Flame, ShieldAlert, Plus, Minus, Check, Clock, Sparkles } from 'lucide-react';

export default function CustomerDishDetailModal({ dish, onClose, onAddToCart, language = 'en' }) {
  if (!dish) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedSpice, setSelectedSpice] = useState(dish.spiceLevel || 'Medium');
  const [selectedCustomizations, setSelectedCustomizations] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const availableCustomizations = dish.customizations || [
    { name: 'Extra Cheese', price: 35 },
    { name: 'Extra Sauce / Gravy', price: 25 },
    { name: 'Less Oil / Low Sodium', price: 0 }
  ];

  const allergensList = dish.allergens || (dish.category === 'Desserts' ? ['Dairy', 'Nuts'] : ['Gluten', 'Dairy']);

  const toggleCustomization = (cust) => {
    if (selectedCustomizations.some(c => c.name === cust.name)) {
      setSelectedCustomizations(selectedCustomizations.filter(c => c.name !== cust.name));
    } else {
      setSelectedCustomizations([...selectedCustomizations, cust]);
    }
  };

  const extraCost = selectedCustomizations.reduce((sum, c) => sum + (c.price || 0), 0);
  const unitPrice = (dish.price || 0) + extraCost;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    onAddToCart(dish, quantity, {
      spiceLevel: selectedSpice,
      customizations: selectedCustomizations,
      instructions: specialInstructions,
      finalUnitPrice: unitPrice
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '520px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <X size={20} color="#0F2A1D" />
        </button>

        {/* Dish Hero Image */}
        <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#F1F5F9', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', overflow: 'hidden' }}>
          <img
            src={dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop'}
            alt={dish.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <span style={{
              backgroundColor: dish.isVeg ? '#166534' : '#991B1B',
              color: '#FFFFFF',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              textTransform: 'uppercase'
            }}>
              {dish.isVeg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
            </span>
            {dish.prepTime && (
              <span style={{
                backgroundColor: 'rgba(15, 42, 29, 0.85)',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Clock size={12} /> {dish.prepTime} mins
              </span>
            )}
          </div>
        </div>

        {/* Dish Content Body */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F2A1D', margin: 0, lineHeight: 1.25 }}>
              {dish.name}
            </h2>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#166534', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
              ₹{dish.price}
            </span>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, marginTop: '0.25rem', marginBottom: '1.25rem' }}>
            {dish.description || 'Prepared fresh using authentic spices, quality ingredients, and culinary mastery.'}
          </p>

          {/* Spice Level Preference */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
              <Flame size={14} color="#EA580C" /> Select Spice Level
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['Mild', 'Medium', 'Spicy', 'Extra Hot'].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedSpice(lvl)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.25rem',
                    borderRadius: '10px',
                    border: selectedSpice === lvl ? '2px solid #EA580C' : '1px solid #E2E8F0',
                    backgroundColor: selectedSpice === lvl ? '#FFF7ED' : '#FAFAFA',
                    color: selectedSpice === lvl ? '#C2410C' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Customization Options */}
          {availableCustomizations.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                Add Customizations
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {availableCustomizations.map((cust, i) => {
                  const isChecked = selectedCustomizations.some(c => c.name === cust.name);
                  return (
                    <div
                      key={i}
                      onClick={() => toggleCustomization(cust)}
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '12px',
                        backgroundColor: isChecked ? '#F0FDF4' : '#F8FAFC',
                        border: isChecked ? '1.5px solid #166534' : '1px solid #E2E8F0',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: isChecked ? 'none' : '2px solid #94A3B8',
                          backgroundColor: isChecked ? '#166534' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isChecked && <Check size={13} color="#FFFFFF" />}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>{cust.name}</span>
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: cust.price > 0 ? '#166534' : '#64748B' }}>
                        {cust.price > 0 ? `+₹${cust.price}` : 'Free'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Allergens & Dietary Tags */}
          {allergensList.length > 0 && (
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem 0.9rem', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FCA5A5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#991B1B', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                <ShieldAlert size={14} /> Allergen Information
              </div>
              <p style={{ fontSize: '0.78rem', color: '#7F1D1D', margin: 0 }}>
                Contains: {allergensList.join(', ')}. Please inform staff if you have severe allergies.
              </p>
            </div>
          )}

          {/* Special Instructions Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
              Special Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Make it extra crispy, serve sauce on the side..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '12px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action Footer Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
            {/* Quantity Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F1F5F9',
              borderRadius: '12px',
              padding: '0.25rem'
            }}>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#0F2A1D',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >
                <Minus size={14} />
              </button>
              <span style={{ width: '32px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: '#0F2A1D' }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#0F2A1D',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAdd}
              style={{
                flex: 1,
                padding: '0.9rem',
                borderRadius: '14px',
                backgroundColor: '#166534',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 10px 15px -3px rgba(22, 101, 52, 0.3)'
              }}
            >
              <span>Add item to Cart</span>
              <span>₹{totalPrice}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
