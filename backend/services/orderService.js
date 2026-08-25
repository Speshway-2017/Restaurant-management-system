const orderRepository = require('../repositories/orderRepository');
const Table = require('../models/Table');

class OrderService {
  async getOrders() {
    let orders = await orderRepository.findAll();
    if (!orders || orders.length === 0) {
      try {
        const OrderModel = require('../models/Order');
        const defaultOrders = [
          { orderId: 'ORD-6462', table: 'Table 01', type: 'Dine-In', customer: 'Jayanth', phone: '9876543210', total: 1620, payment: 'Pending', status: 'Placed', time: '05:16 pm', items: [{ name: 'Chicken 65', quantity: 1, price: 320 }, { name: 'Chicken Seekh Kebab', quantity: 1, price: 380 }, { name: 'Chicken Wings', quantity: 1, price: 320 }, { name: 'Mutton Dum Biryani', quantity: 2, price: 600 }] },
          { orderId: 'ORD-7124', table: 'Table 02', type: 'Dine-In', customer: 'Ram', phone: '9876543211', total: 1450, payment: 'Pending', status: 'Placed', time: '04:37 pm', items: [{ name: 'Chicken 65', quantity: 1, price: 320 }, { name: 'Chicken Pepper Fry', quantity: 1, price: 350 }, { name: 'Chicken Dum Biryani', quantity: 1, price: 380 }, { name: 'Fresh Lime Soda', quantity: 1, price: 100 }] }
        ];
        await OrderModel.insertMany(defaultOrders);
        orders = await orderRepository.findAll();
      } catch (e) {
        console.warn("Could not auto-seed orders:", e.message);
      }
    }
    return orders;
  }

  async createOrder(data) {
    // Generate orderId if missing
    const orderId = data.orderId || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Format table number cleanly
    const rawTable = data.table || data.tableNumber || data.tableId || 'T-10';
    const rawDigits = String(rawTable).replace(/[^0-9]/g, '');
    const cleanNum = rawDigits ? String(parseInt(rawDigits, 10)) : '10';
    const formattedTable = `T-${cleanNum.padStart(2, '0')}`;

    // Normalize payload to match Mongoose Order Schema strictly
    const orderData = {
      orderId: orderId,
      table: formattedTable,
      type: (data.type === 'Takeaway' || data.type === 'Delivery') ? data.type : 'Dine-In',
      customer: data.customer || data.guestName || 'Guest Diner',
      phone: data.phone || '+91 Direct QR',
      items: Array.isArray(data.items) ? data.items.map(item => ({
        name: item.name || item.dishId || 'Delicious Item',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity || item.qty || 1)
      })) : [],
      total: Number(data.total || data.totalAmount || 0),
      status: (data.status && ['Placed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Cancelled'].includes(data.status)) ? data.status : 'Placed',
      payment: data.payment || 'Pending',
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Create and persist order in MongoDB database
    const newOrder = await orderRepository.create(orderData);

    // 2. Only after successful order persistence, update table status to Occupied
    if (formattedTable) {
      try {
        const exactRegex = new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i');
        let updatedTable = await Table.findOneAndUpdate(
          {
            $or: [
              { number: formattedTable },
              { number: cleanNum },
              { number: `T-${cleanNum}` },
              { name: exactRegex },
              { number: exactRegex }
            ]
          },
          {
            status: 'Occupied',
            currentOrder: newOrder.orderId || newOrder._id
          },
          { new: true }
        );

        if (!updatedTable) {
          await Table.create({
            number: formattedTable,
            name: `Table ${cleanNum}`,
            seats: 4,
            section: 'Main Dining',
            status: 'Occupied',
            currentOrder: newOrder.orderId || newOrder._id
          });
        }
      } catch (tableErr) {
        console.error('Failed to update table status in database after order creation:', tableErr.message);
      }
    }

    return newOrder;
  }

  async syncTableStatusForOrder(tableIdentifier) {
    if (!tableIdentifier) return;
    const rawDigits = String(tableIdentifier).replace(/[^0-9]/g, '');
    const cleanNum = rawDigits ? String(parseInt(rawDigits, 10)) : '';
    if (!cleanNum) return;

    try {
      const OrderModel = require('../models/Order');
      const exactRegex = new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i');
      const tableOrders = await OrderModel.find({
        $or: [
          { table: exactRegex },
          { tableNumber: exactRegex }
        ]
      });

      const activeStatuses = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Served'];
      const activeOrders = tableOrders.filter(o => activeStatuses.includes(o.status));

      if (activeOrders.length > 0) {
        // CASE 2 & 3: Other active order(s) exist -> Table MUST REMAIN Occupied
        const latestActive = activeOrders[activeOrders.length - 1];
        await Table.findOneAndUpdate(
          { $or: [{ number: exactRegex }, { name: exactRegex }] },
          {
            status: 'Occupied',
            currentOrder: latestActive.orderId || latestActive._id
          }
        );
      } else {
        // CASE 1: No active orders exist -> Release table to 'Cleaning' for 10 mins
        const cleaningExpiration = new Date(Date.now() + 10 * 60 * 1000);
        await Table.findOneAndUpdate(
          { $or: [{ number: exactRegex }, { name: exactRegex }] },
          {
            status: 'Cleaning',
            cleaningUntil: cleaningExpiration,
            currentOrder: ''
          }
        );
      }
    } catch (err) {
      console.warn("Could not sync table status for order completion:", err.message);
    }
  }

  async updateOrderStatus(id, status, fullOrderData = {}) {
    const updatedOrder = await orderRepository.updateStatus(id, status, fullOrderData);
    if (updatedOrder && updatedOrder.table) {
      await this.syncTableStatusForOrder(updatedOrder.table);
    } else if (fullOrderData && fullOrderData.table) {
      await this.syncTableStatusForOrder(fullOrderData.table);
    }
    return updatedOrder;
  }
}

module.exports = new OrderService();
