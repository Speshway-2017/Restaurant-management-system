const { uploadToCloudinary } = require('../utils/cloudinary');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const uploadMedia = async (req, res) => {
  try {
    const { file, folder } = req.body;
    if (!file) {
      return errorResponse(res, 'No file data provided for upload', 400);
    }

    const result = await uploadToCloudinary(file, folder || 'flavora_resto');
    return successResponse(res, result, 'File uploaded to Cloudinary successfully', 201);
  } catch (error) {
    console.error('Upload controller error:', error.message);
    return errorResponse(res, `Cloudinary Upload Error: ${error.message}`, 500);
  }
};

module.exports = { uploadMedia };
