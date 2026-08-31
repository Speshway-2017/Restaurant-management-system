const fs = require('fs');
const path = require('path');
const Settings = require('../models/Settings');

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({}).sort({ updatedAt: -1 });
    if (!settings) {
      settings = await Settings.create({});
    }
    const obj = settings.toObject ? settings.toObject() : { ...settings };
    const nameVal = obj.restaurantName || obj.brandName || obj.name || 'Flavora Kitchen';
    const logoVal = obj.logoUrl || obj.logo || obj.brandLogo || '/logo.png';

    obj.restaurantName = nameVal;
    obj.brandName = nameVal;
    obj.name = nameVal;
    obj.logoUrl = logoVal;
    obj.logo = logoVal;
    obj.brandLogo = logoVal;

    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({}).sort({ updatedAt: -1 });
    const updateData = { ...req.body };

    const nameVal = updateData.restaurantName || updateData.brandName || updateData.name;
    if (nameVal) {
      updateData.restaurantName = nameVal;
      updateData.brandName = nameVal;
      updateData.name = nameVal;
    }

    let logoVal = updateData.logoUrl || updateData.logo || updateData.brandLogo;

    // Server-side hardening: Convert base64 data URI to a persistent file on disk if sent directly
    if (logoVal && typeof logoVal === 'string' && logoVal.startsWith('data:image/')) {
      try {
        let ext = 'png';
        const matches = logoVal.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        let base64Data = logoVal;
        if (matches) {
          ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          base64Data = matches[2];
        } else {
          base64Data = logoVal.split(';base64,')[1];
        }
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const fileName = `brand_logo_${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        logoVal = `/uploads/${fileName}`;
      } catch (fileErr) {
        console.error('Error writing base64 logo to disk:', fileErr.message);
      }
    }

    if (logoVal) {
      updateData.logoUrl = logoVal;
      updateData.logo = logoVal;
      updateData.brandLogo = logoVal;
    }

    // Convert base64 data URIs in gallery array items to persistent disk files
    if (updateData.gallery && Array.isArray(updateData.gallery)) {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      updateData.gallery = updateData.gallery.map((item, idx) => {
        if (item && item.src && typeof item.src === 'string' && item.src.startsWith('data:image/')) {
          try {
            let ext = 'png';
            const matches = item.src.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            let base64Data = item.src;
            if (matches) {
              ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              base64Data = matches[2];
            } else {
              base64Data = item.src.split(';base64,')[1];
            }
            const fileName = `gallery_${Date.now()}_${idx}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            return { ...item, src: `/uploads/${fileName}` };
          } catch (fileErr) {
            console.error('Error writing base64 gallery image to disk:', fileErr.message);
          }
        }
        return item;
      });
    }

    // Convert base64 data URIs in blogs array items to persistent disk files
    if (updateData.blogs && Array.isArray(updateData.blogs)) {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      updateData.blogs = updateData.blogs.map((blog, idx) => {
        if (blog && blog.image && typeof blog.image === 'string' && blog.image.startsWith('data:image/')) {
          try {
            let ext = 'png';
            const matches = blog.image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            let base64Data = blog.image;
            if (matches) {
              ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              base64Data = matches[2];
            } else {
              base64Data = blog.image.split(';base64,')[1];
            }
            const fileName = `blog_${Date.now()}_${idx}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            return { ...blog, image: `/uploads/${fileName}` };
          } catch (fileErr) {
            console.error('Error writing base64 blog image to disk:', fileErr.message);
          }
        }
        return blog;
      });
    }

    if (!settings) {
      settings = await Settings.create(updateData);
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, updateData, { new: true, upsert: true });
    }

    // Clean up duplicate settings records to maintain a single source of truth document
    try {
      const allSettings = await Settings.find({}).sort({ updatedAt: -1 });
      if (allSettings.length > 1) {
        const keepId = settings._id;
        await Settings.deleteMany({ _id: { $ne: keepId } });
      }
    } catch (cleanErr) {}

    const obj = settings.toObject ? settings.toObject() : { ...settings };
    const finalName = obj.restaurantName || obj.brandName || obj.name || 'Flavora Kitchen';
    const finalLogo = obj.logoUrl || obj.logo || obj.brandLogo || '/logo.png';

    obj.restaurantName = finalName;
    obj.brandName = finalName;
    obj.name = finalName;
    obj.logoUrl = finalLogo;
    obj.logo = finalLogo;
    obj.brandLogo = finalLogo;

    res.json(obj);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
