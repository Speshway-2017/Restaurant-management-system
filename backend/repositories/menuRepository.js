const MenuItem = require('../models/MenuItem');

class MenuRepository {
  async findAll() {
    return await MenuItem.find({});
  }

  async findById(id) {
    return await MenuItem.findById(id);
  }

  async create(itemData) {
    return await MenuItem.create(itemData);
  }

  async update(id, itemData) {
    return await MenuItem.findByIdAndUpdate(id, itemData, { new: true });
  }

  async delete(id) {
    return await MenuItem.findByIdAndDelete(id);
  }
}

module.exports = new MenuRepository();
