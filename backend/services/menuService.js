const menuRepository = require('../repositories/menuRepository');

class MenuService {
  async getMenuItems() {
    return await menuRepository.findAll();
  }

  async createMenuItem(data) {
    return await menuRepository.create(data);
  }

  async updateMenuItem(id, data) {
    return await menuRepository.update(id, data);
  }

  async deleteMenuItem(id) {
    return await menuRepository.delete(id);
  }
}

module.exports = new MenuService();
