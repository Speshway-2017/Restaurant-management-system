const fs = require('fs');
const path = require('path');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const uploadMedia = async (req, res) => {
  try {
    const { file, folder } = req.body;
    if (!file) {
      return errorResponse(res, 'No file data provided for upload', 400);
    }

    try {
      const result = await uploadToCloudinary(file, folder || 'flavora_resto');
      return successResponse(res, result, 'File uploaded to Cloudinary successfully', 201);
    } catch (cloudinaryErr) {
      console.warn('Cloudinary upload failed/skipped, saving file to local uploads directory:', cloudinaryErr.message);

      let base64Data = file;
      let ext = 'png';
      if (typeof file === 'string' && file.includes(';base64,')) {
        const matches = file.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          base64Data = matches[2];
        } else {
          base64Data = file.split(';base64,')[1];
        }
      }

      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `brand_logo_${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      const relativeUrl = `/uploads/${fileName}`;
      return successResponse(res, { url: relativeUrl, secure_url: relativeUrl }, 'File saved locally to server uploads folder', 201);
    }
  } catch (error) {
    console.error('Upload controller error:', error.message);
    return errorResponse(res, `Upload Error: ${error.message}`, 500);
  }
};

module.exports = { uploadMedia };
