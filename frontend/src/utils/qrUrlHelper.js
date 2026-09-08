/**
 * QR Code URL Generator & Compositing Utility
 * 
 * Accurately determines the customer-facing frontend URL for table QR codes.
 * Ensures production deployments (e.g. https://restaurant.speshway.site) never append development port :5173.
 * Composites the restaurant logo into the center of the QR code with High Error Correction.
 */

export const getFrontendBaseUrl = () => {
  // 1. Check for explicit environment variables (VITE_FRONTEND_URL or VITE_APP_URL)
  const envUrl = import.meta.env.VITE_FRONTEND_URL || import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 2. Resolve based on the current window location in browser
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // Local development only: allow mobile scanning on local Wi-Fi IP
    if (isLocalhost) {
      const port = window.location.port ? `:${window.location.port}` : ':5173';
      return `${window.location.protocol}//192.168.1.4${port}`;
    }

    // Production / Deployed environment (e.g. restaurant.speshway.site)
    // window.location.origin returns standard "https://restaurant.speshway.site" without any port
    return window.location.origin;
  }

  return 'https://restaurant.speshway.site';
};

/**
 * Returns the customer menu URL for the specified table identifier.
 * Preserves the exact table code format (e.g. 'T-02').
 * 
 * @param {string} tableNum - The table identifier, e.g. 'T-02'
 * @returns {string} Fully-qualified URL, e.g. 'https://restaurant.speshway.site/menu?table=T-02'
 */
export const getTableMenuUrl = (tableNum) => {
  const cleanTableNum = String(tableNum || 'T-01').trim();
  const baseUrl = getFrontendBaseUrl();
  return `${baseUrl}/?table=${encodeURIComponent(cleanTableNum)}`;
};

/**
 * Composites the restaurant brand logo into the exact center of a QR code image using HTML5 canvas.
 * Returns a PNG data URL containing the QR code with the brand logo embedded.
 * 
 * @param {string} qrDataUrlOrSrc - The base QR image source or data URL
 * @param {string} logoSrc - The logo image path or URL (defaults to '/logo.png')
 * @returns {Promise<string>} Promise resolving to composited PNG Data URL
 */
export const compositeQrWithLogo = (qrDataUrlOrSrc, logoSrc = '/qr-logo.png') => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.document || !qrDataUrlOrSrc) {
      resolve(qrDataUrlOrSrc);
      return;
    }

    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';

    qrImg.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = Math.max(qrImg.width, 400);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(qrDataUrlOrSrc);
          return;
        }

        // 1. Draw the QR code
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(qrImg, 0, 0, size, size);

        // 2. Load the circular brand emblem logo
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';

        logoImg.onload = () => {
          try {
            // Circular badge occupies ~23% of the QR size
            const badgeRadius = Math.round(size * 0.115);
            const centerX = size / 2;
            const centerY = size / 2;

            // Draw white circular badge with subtle drop shadow
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'rgba(15, 42, 29, 0.22)';
            ctx.shadowBlur = Math.round(size * 0.02);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = Math.round(size * 0.005);
            ctx.fill();

            // Subtle circular ring border in brand dark green
            ctx.lineWidth = Math.max(1.5, Math.round(size * 0.006));
            ctx.strokeStyle = '#0F2A1D';
            ctx.stroke();
            ctx.restore();

            // Draw emblem image inside the circular badge
            const logoDrawSize = Math.round(badgeRadius * 1.68);
            const logoX = centerX - (logoDrawSize / 2);
            const logoY = centerY - (logoDrawSize / 2);

            ctx.drawImage(logoImg, logoX, logoY, logoDrawSize, logoDrawSize);

            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            console.warn('Canvas logo composite error:', e);
            resolve(qrDataUrlOrSrc);
          }
        };

        logoImg.onerror = () => {
          resolve(qrDataUrlOrSrc);
        };

        logoImg.src = logoSrc || '/qr-logo.png';
      } catch (err) {
        console.warn('QR image composite error:', err);
        resolve(qrDataUrlOrSrc);
      }
    };

    qrImg.onerror = () => {
      resolve(qrDataUrlOrSrc);
    };

    qrImg.src = qrDataUrlOrSrc;
  });
};
