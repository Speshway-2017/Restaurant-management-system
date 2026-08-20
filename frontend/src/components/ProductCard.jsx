import React, { useState } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, Star } from 'lucide-react';

export default function ProductCard({
  id,
  title,
  name,
  image,
  img,
  price,
  originalPrice,
  origPrice,
  badge,
  tag,
  bestseller,
  isBestseller,
  isVeg = true,
  available,
  isAvailable = true,
  desc,
  category,
  quantity = 0,
  onAddToCart,
  onDecreaseQty,
  onDeleteItem
}) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovered: false });

  const itemTitle = title || name || 'Delicious Dish';
  const itemImage = image || img || '/hero_dish_2.png';
  const displayPrice = typeof price === 'number' ? `₹${price}` : price;
  
  let displayOriginalPrice = null;
  if (originalPrice) {
    displayOriginalPrice = typeof originalPrice === 'number' ? `₹${originalPrice}` : originalPrice;
  } else if (origPrice) {
    displayOriginalPrice = origPrice;
  }

  const isBestsellerItem = bestseller || isBestseller || (badge && badge.toLowerCase().includes('bestseller')) || (tag && tag.toLowerCase().includes('bestseller'));
  const badgeText = isBestsellerItem ? 'Bestseller' : (badge || tag || (isVeg ? 'Veg Special' : 'Chef Choice'));
  const isItemAvailable = (available !== undefined ? available : isAvailable) !== false;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = (x / (rect.width / 2)) * 14;
    const rotateX = -(y / (rect.height / 2)) * 14;
    setTilt({ rotateX, rotateY, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, isHovered: false });
  };

  return (
    <div
      className="smooth-product-card 3d-card-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: tilt.isHovered
          ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(-6px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: tilt.isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        opacity: isItemAvailable ? 1 : 0.85
      }}
    >
      {/* 1. IMAGE & BADGES CONTAINER */}
      <div className="smooth-product-image-wrap" style={{ position: 'relative' }}>
        <img
          src={itemImage}
          alt={itemTitle}
          className="smooth-product-img"
          loading="lazy"
          style={{
            transform: tilt.isHovered ? 'scale(1.12) translateZ(15px)' : 'scale(1) translateZ(0px)',
            transition: 'transform 0.3s ease',
            filter: isItemAvailable ? 'none' : 'grayscale(0.3)'
          }}
        />

        {!isItemAvailable && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}>
            <span style={{
              background: '#DC2626',
              color: '#FFFFFF',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '0.78rem',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
            }}>
              Out of Stock
            </span>
          </div>
        )}

        {/* Top-Left Badge (Bestseller / Chef Special / Veg indicator) */}
        <div className="smooth-product-badge-group" style={{ transform: 'translateZ(25px)' }}>
          <span className={`smooth-badge ${isBestsellerItem ? 'is-bestseller' : badgeText.toLowerCase().includes('sale') ? 'is-sale' : ''}`}>
            {isBestsellerItem ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star size={12} color="#F2C14E" fill="#F2C14E" />
                <span>Bestseller</span>
              </span>
            ) : (
              <>
                <span className={isVeg ? 'veg-dot-sm' : 'nonveg-dot-sm'}></span>
                <span>{badgeText}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 2. CARD CONTENT */}
      <div className="smooth-product-content" style={{ transform: 'translateZ(20px)' }}>
        <div className="smooth-product-header">
          {category && (
            <span className="smooth-product-category">{category}</span>
          )}
          <h3 className="smooth-product-title">{itemTitle}</h3>
        </div>

        {desc && (
          <p className="smooth-product-desc">{desc}</p>
        )}

        {/* 3. PRICE ROW & ACTION BUTTON */}
        <div className="smooth-product-footer">
          <div className="smooth-product-price-block">
            <span className="smooth-price-current">{displayPrice}</span>
            {displayOriginalPrice && (
              <span className="smooth-price-original">{displayOriginalPrice}</span>
            )}
          </div>

          {/* Interactive Cart Button */}
          {!isItemAvailable ? (
            <button
              type="button"
              className="smooth-add-cart-btn"
              disabled
              style={{
                backgroundColor: '#CBD5E1',
                color: '#64748B',
                cursor: 'not-allowed',
                opacity: 0.85,
                border: '1px solid #94A3B8',
                boxShadow: 'none',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}
            >
              <span>Out of Stock</span>
            </button>
          ) : quantity > 0 ? (
            <div className="smooth-qty-counter">
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onDeleteItem ? onDeleteItem(id) : onDecreaseQty && onDecreaseQty(id); }}
                className="smooth-qty-btn is-delete"
                title="Remove item"
              >
                {quantity === 1 ? <Trash2 size={13} color="#C0392B" /> : <Minus size={13} color="#1E4636" />}
              </button>
              <span className="smooth-qty-num">{quantity}</span>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(id); }}
                className="smooth-qty-btn"
                title="Add one more"
              >
                <Plus size={13} color="#1E4636" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="smooth-add-cart-btn"
              onClick={() => onAddToCart && onAddToCart(id || itemTitle)}
            >
              <ShoppingBag size={14} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
