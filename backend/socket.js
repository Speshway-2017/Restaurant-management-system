const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    // Client joins room based on role & identity
    socket.on('join', (data = {}) => {
      try {
        const { role, userId, managerId } = data;
        if (managerId) {
          socket.join(`manager_${managerId}`);
        }
        if (role) {
          const roleLower = String(role).toLowerCase();
          if (roleLower.includes('chef') && managerId) {
            socket.join(`chef_${managerId}`);
          }
          if (roleLower.includes('waiter') && userId) {
            socket.join(`waiter_${userId}`);
          }
          if (roleLower.includes('waiter') && managerId) {
            socket.join(`waiters_all_${managerId}`);
          }
        }
        if (userId) {
          socket.join(`user_${userId}`);
        }
      } catch (err) {
        console.warn('Socket join error:', err.message);
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  return io;
};

// Notification Dispatchers
const emitToRoleAndManager = (managerId, chefRoom, waiterRoom, event, payload) => {
  if (!io) return;
  // Always notify manager room
  if (managerId) {
    io.to(`manager_${managerId}`).emit(event, payload);
  } else {
    io.emit(event, payload);
  }
  // Notify chef room if provided
  if (chefRoom) {
    io.to(chefRoom).emit(event, payload);
  }
  // Notify waiter room if provided
  if (waiterRoom) {
    io.to(waiterRoom).emit(event, payload);
  }
  // Also broadcast the event globally for fallbacks
  io.emit(event, payload);
};

const notifyOrderCreated = (order) => {
  if (!io || !order) return;
  const managerId = order.managerId;
  const chefRoom = managerId ? `chef_${managerId}` : null;
  emitToRoleAndManager(managerId, chefRoom, null, 'order_created', {
    order,
    message: `New order #${order.orderId || order._id} placed for ${order.table || 'Table'}`
  });
};

const notifyChefAccepted = (order) => {
  if (!io || !order) return;
  const managerId = order.managerId;
  const chefRoom = managerId ? `chef_${managerId}` : null;
  emitToRoleAndManager(managerId, chefRoom, null, 'chef_accepted', {
    order,
    orderId: order.orderId || order._id,
    chefId: order.chefId,
    chefName: order.chefName,
    message: `Order #${order.orderId || order._id} accepted by Chef ${order.chefName || ''}`
  });
};

const notifyChefPreparing = (order) => {
  if (!io || !order) return;
  const managerId = order.managerId;
  const chefRoom = managerId ? `chef_${managerId}` : null;
  emitToRoleAndManager(managerId, chefRoom, null, 'chef_preparing', {
    order,
    orderId: order.orderId || order._id,
    chefId: order.chefId,
    chefName: order.chefName,
    message: `Order #${order.orderId || order._id} is being prepared by Chef ${order.chefName || ''}`
  });
};

const notifyChefReady = (order) => {
  if (!io || !order) return;
  const managerId = order.managerId;
  const waiterId = order.waiterId;
  const waiterRoom = waiterId ? `waiter_${waiterId}` : null;

  const payload = {
    order,
    orderId: order.orderId || order._id,
    orderNumber: order.orderId || order._id,
    tableNumber: order.table || 'T-01',
    table: order.table || 'T-01',
    items: order.items || [],
    chefName: order.chefName || 'Kitchen Chef',
    chefId: order.chefId,
    readyStatus: true,
    message: `Order #${order.orderId || order._id} is ready for Table ${order.table || ''}`
  };

  // Dedicated targeted notification to assigned Waiter
  if (waiterRoom) {
    io.to(waiterRoom).emit('chef_ready', payload);
    io.to(waiterRoom).emit('waiter_notification', {
      type: 'ORDER_READY',
      title: `🔔 Food Ready - Table ${order.table}`,
      message: `Order #${order.orderId} ready for Table ${order.table}`,
      orderId: order.orderId || order._id,
      table: order.table,
      chefName: order.chefName
    });
  }

  // Manager retains full visibility
  if (managerId) {
    io.to(`manager_${managerId}`).emit('chef_ready', payload);
  }
  // Global broadcast
  io.emit('chef_ready', payload);
};

const notifyWaiterAccepted = (order) => {
  if (!io || !order) return;
  const managerId = order.managerId;
  const waiterId = order.waiterId;
  const waiterRoom = waiterId ? `waiter_${waiterId}` : null;
  emitToRoleAndManager(managerId, null, waiterRoom, 'waiter_accepted', {
    order,
    orderId: order.orderId || order._id,
    waiterId: order.waiterId,
    waiterName: order.waiterName,
    message: `Order #${order.orderId || order._id} accepted by Waiter ${order.waiterName || ''}`
  });
};

const notifyWaiterServing = (order) => {
  if (!io || !order) return;
  const managerId = order.managerId;
  const waiterId = order.waiterId;
  const waiterRoom = waiterId ? `waiter_${waiterId}` : null;
  emitToRoleAndManager(managerId, null, waiterRoom, 'waiter_serving', {
    order,
    orderId: order.orderId || order._id,
    waiterId: order.waiterId,
    waiterName: order.waiterName,
    message: `Order #${order.orderId || order._id} is being served to Table ${order.table || ''}`
  });
};

const notifyWaiterServed = (order) => {
  if (!io || !order) return;
  const managerId = order.managerId;
  const waiterId = order.waiterId;
  const waiterRoom = waiterId ? `waiter_${waiterId}` : null;
  emitToRoleAndManager(managerId, null, waiterRoom, 'waiter_served', {
    order,
    orderId: order.orderId || order._id,
    waiterId: order.waiterId,
    waiterName: order.waiterName,
    message: `Order #${order.orderId || order._id} served to Table ${order.table || ''}`
  });
};

const notifyReservationCreated = (reservation) => {
  if (!io || !reservation) return;
  io.emit('reservation_created', {
    reservation,
    message: `📅 New Reservation #${reservation.bookingId}: ${reservation.guestName} (${reservation.guests} guests) on ${reservation.date} at ${reservation.timeSlot}`
  });
};

const notifyTableUpdated = (table) => {
  if (!io || !table) return;
  const payload = {
    table,
    tableNumber: table.number || table.name,
    status: table.status,
    currentOrder: table.currentOrder,
    assignedWaiterId: table.assignedWaiterId,
    assignedWaiterName: table.assignedWaiterName
  };
  io.emit('table_updated', payload);
  io.emit('table_status_updated', payload);
};

const notifyWaiterAssigned = (data) => {
  if (!io || !data) return;
  io.emit('waiter_assignment_updated', data);
  io.emit('table_updated', data);
};

const notifyOrderItemCancelled = (data) => {
  if (!io || !data) return;
  io.emit('order_item_cancelled', data);
  io.emit('order_updated', data.order || data);
};

const notifyPaymentCreated = (payment) => {
  if (!io || !payment) return;
  const payload = {
    payment,
    orderId: payment.orderId,
    table: payment.table || payment.tableNumber,
    status: payment.status || 'PAID',
    amount: payment.totalAmount || payment.amount
  };
  io.emit('payment_created', payload);
  io.emit('payment_updated', payload);
};

const notifyPaymentUpdated = (payment) => {
  if (!io || !payment) return;
  io.emit('payment_updated', { payment });
};

const notifyAssistanceUpdated = (assistance) => {
  if (!io || !assistance) return;
  io.emit('assistance_updated', { assistance });
};

const notifyWaiterProfileUpdated = (user) => {
  if (!io || !user) return;
  io.emit('waiter_profile_updated', { user, userId: user._id || user.id });
};

module.exports = {
  initSocket,
  getIO,
  notifyOrderCreated,
  notifyChefAccepted,
  notifyChefPreparing,
  notifyChefReady,
  notifyWaiterAccepted,
  notifyWaiterServing,
  notifyWaiterServed,
  notifyReservationCreated,
  notifyTableUpdated,
  notifyWaiterAssigned,
  notifyOrderItemCancelled,
  notifyPaymentCreated,
  notifyPaymentUpdated,
  notifyAssistanceUpdated,
  notifyWaiterProfileUpdated
};
