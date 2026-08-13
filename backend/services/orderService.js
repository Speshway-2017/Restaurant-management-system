const orderRepository = require('../repositories/orderRepository');

class OrderService {
  async getOrders() {
    return await orderRepository.findAll();
  }

  async createOrder(data) {
    return await orderRepository.create(data);
  }

  async updateOrderStatus(id, status) {
    return await orderRepository.updateStatus(id, status);
  }
}

module.exports = new OrderService();
