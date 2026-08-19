import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AnimatedInput({
  icon,
  label = '',
  placeholder = '',
  value = '',
  onChange,
  type = 'text',
  name,
  id,
  required = true,
  isPassword = false,
  autoComplete = 'new-password'
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const displayPlaceholder = placeholder || label;
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const hasValue = value && value.length > 0;

  return (
    <div className={`animated-input-container ${isFocused ? 'is-focused' : ''} ${hasValue ? 'has-value' : ''}`}>
      {/* Icon Prefix */}
      {icon && (
        <div className="animated-input-icon-wrap">
          {icon}
        </div>
      )}

      {/* Input Field with Disappearing Placeholder & Autofill Prevention */}
      <div className="animated-input-field-wrap">
        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={displayPlaceholder}
          required={required}
          className="animated-input-control"
          autoComplete={autoComplete}
          aria-autocomplete="none"
        />
      </div>

      {/* Optional Password Visibility Toggle */}
      {isPassword && (
        <button
          type="button"
          className="animated-input-eye-btn"
          onClick={() => setShowPassword(!showPassword)}
          title="Toggle password visibility"
        >
          {showPassword ? (
            <EyeOff size={16} color="#E07A3C" />
          ) : (
            <Eye size={16} color="#718096" />
          )}
        </button>
      )}
    </div>
  );
}
