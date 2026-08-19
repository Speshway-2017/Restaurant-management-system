const crypto = require('crypto');

/**
 * Uploads a file (base64 Data URL or remote URL) to Cloudinary via REST API.
 * Uses native Node.js crypto and fetch.
 */
const uploadToCloudinary = async (fileDataUrl, folder = 'flavora_resto') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'xgnpvrlf';
  const apiKey = process.env.CLOUDINARY_API_KEY || '275198339298644';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'jJ8Y67x1211NPv6sLkZd8WZAKn8';

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials missing in .env configuration');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  
  // Sort parameters alphabetically for Cloudinary signature calculation: folder, timestamp
  const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

  const formData = new URLSearchParams();
  formData.append('file', fileDataUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', folder);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Cloudinary API Error:', data);
    throw new Error(data.error?.message || 'Cloudinary upload request failed');
  }

  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    format: data.format,
    resourceType: data.resource_type,
    bytes: data.bytes
  };
};

module.exports = { uploadToCloudinary };
