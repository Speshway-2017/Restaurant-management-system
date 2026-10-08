const orderRepository = require('../repositories/orderRepository');
const Table = require('../models/Table');

class OrderService {
  async processIncomingItems(items) {
    if (!Array.isArray(items) || items.length === 0) return [];
    let MenuItem = null;
    let menuItems = [];
    try {
      MenuItem = require('../models/MenuItem');
      menuItems = await MenuItem.find({}).lean();
    } catch (e) {
      console.warn("Could not fetch MenuItems for validation:", e.message);
    }
    
    const menuItemMap = new Map();
    menuItems.forEach(mi => {
      if (mi._id) menuItemMap.set(mi._id.toString(), mi);
      if (mi.name) menuItemMap.set(mi.name.toLowerCase().trim(), mi);
    });

    const DEFAULT_SPICE_DEFAULTS = {
      'mild': 0,
      'medium': 0,
      'spicy': 15,
      'extra hot': 25
    };

    const DEFAULT_ADDON_DEFAULTS = {
      'extra cheese': 35,
      'extra sauce': 25,
      'extra sauce / gravy': 25,
      'extra gravy': 25,
      'less oil': 0,
      'less oil / low sodium': 0,
      'low sodium': 0
    };

    return items.map((item, idx) => {
      const rawId = item.menuItemId || item.id || item._id || '';
      const rawName = (item.name || item.dishId || '').trim();

      // Find matching MenuItem in DB
      let matchedMenuItem = null;
      if (rawId && menuItemMap.has(String(rawId))) {
        matchedMenuItem = menuItemMap.get(String(rawId));
      } else if (rawName && menuItemMap.has(rawName.toLowerCase())) {
        matchedMenuItem = menuItemMap.get(rawName.toLowerCase());
      }

      const basePrice = matchedMenuItem ? Number(matchedMenuItem.price) : Number(item.basePrice !== undefined ? item.basePrice : (item.price || 0));

      // Spice level
      const selectedSpiceLevel = item.selectedSpiceLevel || item.spiceLevel || matchedMenuItem?.spiceLevel || 'Medium';
      let spiceLevelPrice = 0;

      if (matchedMenuItem && Array.isArray(matchedMenuItem.spiceLevels) && matchedMenuItem.spiceLevels.length > 0) {
        const foundSpice = matchedMenuItem.spiceLevels.find(s => s.name?.toLowerCase().trim() === selectedSpiceLevel.toLowerCase().trim());
        if (foundSpice && foundSpice.priceAdjustment !== undefined && foundSpice.priceAdjustment !== null) {
          spiceLevelPrice = Number(foundSpice.priceAdjustment) || 0;
        } else if (item.spiceLevelPrice !== undefined && item.spiceLevelPrice !== null && !isNaN(Number(item.spiceLevelPrice))) {
          spiceLevelPrice = Number(item.spiceLevelPrice);
        } else {
          spiceLevelPrice = DEFAULT_SPICE_DEFAULTS[selectedSpiceLevel.toLowerCase().trim()] ?? 0;
        }
      } else if (item.spiceLevelPrice !== undefined && item.spiceLevelPrice !== null && !isNaN(Number(item.spiceLevelPrice))) {
        spiceLevelPrice = Number(item.spiceLevelPrice);
      } else {
        spiceLevelPrice = DEFAULT_SPICE_DEFAULTS[selectedSpiceLevel.toLowerCase().trim()] ?? 0;
      }

      // Add-ons / Customizations
      const rawAddOns = item.selectedAddOns || item.addOns || item.customizations || [];
      let addOnsTotal = 0;
      const validatedAddOns = rawAddOns.map(ao => {
        let name = '';
        if (typeof ao === 'string') {
          name = ao.trim();
        } else if (ao && typeof ao === 'object') {
          name = (ao.name || '').trim();
        }

        if (!name) return null;

        let price = 0;
        if (matchedMenuItem && Array.isArray(matchedMenuItem.customizations) && matchedMenuItem.customizations.length > 0) {
          const foundCustom = matchedMenuItem.customizations.find(c => c.name?.toLowerCase().trim() === name.toLowerCase().trim());
          if (foundCustom && foundCustom.price !== undefined && foundCustom.price !== null) {
            price = Number(foundCustom.price) || 0;
          } else if (typeof ao === 'object' && ao.price !== undefined && !isNaN(Number(ao.price))) {
            price = Number(ao.price);
          } else {
            price = DEFAULT_ADDON_DEFAULTS[name.toLowerCase().trim()] ?? 0;
          }
        } else if (typeof ao === 'object' && ao.price !== undefined && !isNaN(Number(ao.price))) {
          price = Number(ao.price);
        } else {
          price = DEFAULT_ADDON_DEFAULTS[name.toLowerCase().trim()] ?? 0;
        }

        addOnsTotal += price;
        return { name, price };
      }).filter(Boolean);

      const unitPrice = Number((basePrice + spiceLevelPrice + addOnsTotal).toFixed(2));
      const quantity = Math.max(1, Number(item.quantity || item.qty || 1));
      const totalPrice = Number((unitPrice * quantity).toFixed(2));

      return {
        id: item.id || item._id || `item-${Date.now()}-${idx}`,
        menuItemId: matchedMenuItem ? matchedMenuItem._id.toString() : (item.menuItemId || item.id || ''),
        name: matchedMenuItem ? matchedMenuItem.name : (item.name || 'Delicious Item'),
        basePrice: basePrice,
        selectedSpiceLevel: selectedSpiceLevel,
        spiceLevel: selectedSpiceLevel,
        spiceLevelPrice: spiceLevelPrice,
        selectedAddOns: validatedAddOns,
        addOns: validatedAddOns,
        unitPrice: unitPrice,
        price: unitPrice, // unitPrice for backward compatibility
        quantity: quantity,
        totalPrice: totalPrice,
        status: item.status || (item.isDelivered ? 'DELIVERED' : (item.isReady ? 'READY' : 'PLACED')),
        isReady: Boolean(item.isReady || item.status === 'READY' || item.status === 'DELIVERED'),
        isDelivered: Boolean(item.isDelivered || item.status === 'DELIVERED')
      };
    });
  }

  async getOrders(query = {}) {
    return await orderRepository.findAll(query) || [];
  }

  async createOrder(data) {
    // Format table number cleanly
    const rawTable = data.table || data.tableNumber || data.tableId || 'T-10';
    const rawDigits = String(rawTable).replace(/[^0-9]/g, '');
    const cleanNum = rawDigits ? String(parseInt(rawDigits, 10)) : '10';
    const formattedTable = `T-${cleanNum.padStart(2, '0')}`;

    // Normalize and validate incoming new items with full menu configuration price recalculation
    const newIncomingItems = await this.processIncomingItems(data.items);

    const OrderModel = require('../models/Order');
    const exactRegex = new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i');

    // BACKEND ENFORCEMENT: Reject order creation if table is Cleaning or Billing
    const tableDoc = await Table.findOne({
      $or: [{ number: formattedTable }, { number: cleanNum }, { name: exactRegex }, { number: exactRegex }]
    });

    if (tableDoc && tableDoc.status === 'Cleaning') {
      throw new Error(`Table ${formattedTable} is currently unavailable due to cleaning & sanitization.`);
    }

    if (tableDoc && tableDoc.status === 'Billing') {
      throw new Error(`The bill has already been generated for Table ${formattedTable}. Additional items cannot be placed.`);
    }

    // 0. Resolve current ACTIVE session and active reservation as single source of truth for customer name
    const TableSession = require('../models/TableSession');
    const Reservation = require('../models/Reservation');
    const todayStr = new Date().toISOString().split('T')[0];
    const searchNums = [formattedTable, cleanNum, `T-${cleanNum.padStart(2, '0')}`];

    const activeResv = await Reservation.findOne({
      $or: [
        { tableNo: { $in: searchNums } },
        { tableNo: exactRegex }
      ],
      date: todayStr,
      status: { $in: ['Confirmed', 'Checked_In', 'Seated', 'Pending'] }
    }).sort({ updatedAt: -1, date: -1 });

    const reservedGuestName = (activeResv && activeResv.guestName) ? String(activeResv.guestName).trim() : '';

    let activeSession = await TableSession.findOne({
      $or: [
        { tableNum: { $in: searchNums } },
        { mergedTableNums: { $in: searchNums } }
      ],
      status: 'ACTIVE'
    });

    if (!activeSession) {
      const sessionToken = `SESS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      activeSession = await TableSession.create({
        tableNum: formattedTable,
        sessionToken,
        guestName: reservedGuestName || ((data.customer && data.customer !== 'Guest Diner' && data.customer !== 'Guest') ? String(data.customer).trim() : ''),
        phone: activeResv?.phone || data.phone || '',
        partySize: activeResv?.guests || 2,
        specialOccasion: activeResv?.specialOccasion || 'None',
        notes: activeResv?.notes || '',
        status: 'ACTIVE',
        isWalkIn: !Boolean(reservedGuestName),
        isReceptionistAssigned: Boolean(reservedGuestName),
        seatedAt: new Date()
      });
    } else if (reservedGuestName && (!activeSession.guestName || activeSession.guestName === 'Guest Diner' || activeSession.guestName === 'Guest')) {
      activeSession.guestName = reservedGuestName;
      if (activeResv?.phone) activeSession.phone = activeResv.phone;
      if (activeResv?.guests) activeSession.partySize = activeResv.guests;
      if (activeResv?.specialOccasion) activeSession.specialOccasion = activeResv.specialOccasion;
      activeSession.isReceptionistAssigned = true;
      activeSession.isWalkIn = false;
      await activeSession.save();
    }

    const isGenericDiner = (n) => !n || ['guest diner', 'guest', 'valued guest', '-', 'n/a', 'null', 'undefined', 'test diner', 'test', 'test customer', 'test guest'].includes(String(n).trim().toLowerCase());

    let verifiedCustomerName = (reservedGuestName && !isGenericDiner(reservedGuestName)) ? reservedGuestName : 'Guest Diner';
    if (data.customer && !isGenericDiner(data.customer)) {
      verifiedCustomerName = String(data.customer).trim();
      activeSession.guestName = verifiedCustomerName;
      await activeSession.save();
    } else if (activeSession.guestName && !isGenericDiner(activeSession.guestName)) {
      verifiedCustomerName = String(activeSession.guestName).trim();
    }

    // 1. Check if an ACTIVE (open/unpaid) order already exists for this table
    let existingActiveOrder = await OrderModel.findOne({
      $or: [
        { table: formattedTable },
        { table: `Table ${cleanNum}` },
        { table: cleanNum },
        { table: exactRegex }
      ],
      status: { $nin: ['Completed', 'Paid', 'Cancelled'] },
      payment: { $ne: 'Paid' }
    });

    // Resolve Table model for tableId and assigned waiter
    let targetTableDoc = null;
    try {
      targetTableDoc = await Table.findOne({
        $or: [
          { number: formattedTable },
          { number: cleanNum },
          { number: `T-${cleanNum}` },
          { name: exactRegex },
          { number: exactRegex }
        ]
      });
    } catch (e) { }

    if (existingActiveOrder) {
      // Active session guestName is single source of truth! Client cannot override!
      existingActiveOrder.customer = verifiedCustomerName;
      if (activeSession) {
        existingActiveOrder.sessionId = activeSession._id.toString();
        existingActiveOrder.sessionToken = activeSession.sessionToken;
      }
      if (targetTableDoc) {
        if (!existingActiveOrder.tableId) existingActiveOrder.tableId = targetTableDoc._id.toString();
        if (!existingActiveOrder.waiterId && targetTableDoc.assignedWaiterId) {
          existingActiveOrder.waiterId = targetTableDoc.assignedWaiterId;
          existingActiveOrder.waiterName = targetTableDoc.assignedWaiterName || '';
        }
      }

      // Block adding items if bill has already been generated
      const isAlreadyBillGenerated = Boolean(
        existingActiveOrder.isBillGenerated ||
        existingActiveOrder.billGenerated ||
        existingActiveOrder.status === 'Bill Generated' ||
        existingActiveOrder.status === 'Billing' ||
        existingActiveOrder.payment === 'Awaiting Payment' ||
        existingActiveOrder.paymentStatus === 'Awaiting Payment'
      );
      if (isAlreadyBillGenerated) {
        throw new Error(`The bill has already been generated for Table ${existingActiveOrder.table || 'this table'}. Additional items cannot be added.`);
      }

      // Append new chef notes if provided
      const newNotes = (data.notes || data.chefNotes || data.instructions || '').trim();
      if (newNotes && !existingActiveOrder.notes?.includes(newNotes)) {
        existingActiveOrder.notes = existingActiveOrder.notes ? `${existingActiveOrder.notes} | ${newNotes}` : newNotes;
      }

      // MERGE NEW ITEMS INTO EXISTING ACTIVE ORDER (SAME ORDER ID)
      const existingItems = Array.isArray(existingActiveOrder.items) ? [...existingActiveOrder.items] : [];

      // Append new items while preserving existing item statuses completely
      newIncomingItems.forEach((newItem) => {
        existingItems.push(newItem);
      });

      existingActiveOrder.items = existingItems;

      // Recalculate total amount for the combined order using line totals
      const activeExistingItems = existingItems.filter(it => it && it.status !== 'CANCELLED' && !it.isCancelled);
      const newCalculatedSubtotal = activeExistingItems.reduce((sum, it) => {
        const lineTot = it.totalPrice !== undefined ? Number(it.totalPrice) : (Number(it.price || 0) * Number(it.quantity || 1));
        return sum + lineTot;
      }, 0);

      existingActiveOrder.subtotal = Number(newCalculatedSubtotal.toFixed(2));
      existingActiveOrder.originalTotal = Number(newCalculatedSubtotal.toFixed(2));

      // Fetch active Admin Settings for GST calculation
      const Settings = require('../models/Settings');
      let activeSettings = null;
      try {
        activeSettings = await Settings.findOne({}).sort({ updatedAt: -1 });
      } catch (e) {}
      const rawAdminGst = activeSettings?.gstRate || '5%';
      const adminGstNum = parseFloat(String(rawAdminGst).replace(/[^0-9.]/g, '')) || 5;

      const cgstRateVal = adminGstNum / 2;
      const sgstRateVal = adminGstNum / 2;
      const cgstAmtVal = Number(((newCalculatedSubtotal * cgstRateVal) / 100).toFixed(2));
      const sgstAmtVal = Number(((newCalculatedSubtotal * sgstRateVal) / 100).toFixed(2));
      const gstAmtVal = Number((cgstAmtVal + sgstAmtVal).toFixed(2));
      const tipVal = Number(existingActiveOrder.tipAmount ?? existingActiveOrder.tip ?? 0);
      const grandTotalVal = Number((newCalculatedSubtotal + gstAmtVal + tipVal).toFixed(2));

      existingActiveOrder.gstRate = `${adminGstNum}%`;
      existingActiveOrder.cgstRate = cgstRateVal;
      existingActiveOrder.sgstRate = sgstRateVal;
      existingActiveOrder.cgstAmount = cgstAmtVal;
      existingActiveOrder.sgstAmount = sgstAmtVal;
      existingActiveOrder.gstAmount = gstAmtVal;
      existingActiveOrder.grandTotal = grandTotalVal;
      existingActiveOrder.total = grandTotalVal;

      // Reopen/continue order status if new unserved items are added
      const hasDeliveredItems = existingItems.some(i => i.isDelivered || i.status === 'DELIVERED' || i.status === 'SERVED');
      const hasUnservedItems = existingItems.some(i => !i.isDelivered && i.status !== 'DELIVERED' && i.status !== 'SERVED');

      if (hasUnservedItems) {
        existingActiveOrder.status = hasDeliveredItems ? 'PARTIALLY DELIVERED' : 'Placed';
        if (newIncomingItems.length > 0) {
          existingActiveOrder.chefStatus = 'NEW';
        }
        // If the order had previously been completed/served by waiter, reopen it for service
        if (existingActiveOrder.waiterStatus === 'SERVED') {
          existingActiveOrder.waiterStatus = 'ACCEPTED';
        }
        // Disappear generated bill since customer placed more items!
        if (existingActiveOrder.payment === 'Awaiting Payment' || existingActiveOrder.payment === 'Bill Generated') {
          existingActiveOrder.payment = 'Pending';
        }
        if (existingActiveOrder.paymentStatus === 'Awaiting Payment' || existingActiveOrder.paymentStatus === 'Bill Generated') {
          existingActiveOrder.paymentStatus = 'Pending';
        }
        existingActiveOrder.isBillGenerated = false;
        existingActiveOrder.billGenerated = false;
      } else {
        existingActiveOrder.status = hasDeliveredItems ? 'Served' : 'Placed';
      }

      if (data.managerId && !existingActiveOrder.managerId) {
        existingActiveOrder.managerId = String(data.managerId);
      }

      if (verifiedCustomerName && verifiedCustomerName !== 'Guest Diner' && (!existingActiveOrder.customer || existingActiveOrder.customer === 'Guest Diner')) {
        existingActiveOrder.customer = verifiedCustomerName;
      }

      await existingActiveOrder.save();

      // Ensure table remains occupied with this currentOrder
      try {
        await Table.findOneAndUpdate(
          {
            $or: [
              { number: formattedTable },
              { number: cleanNum },
              { number: `T-${cleanNum}` },
              { name: exactRegex },
              { number: exactRegex }
            ]
          },
          { status: 'Occupied', currentOrder: existingActiveOrder.orderId || existingActiveOrder._id },
          { new: true }
        );
      } catch (e) { }

      return existingActiveOrder;
    }

    // 2. If NO active order exists, generate a new orderId and create a brand new order document
    const orderId = data.orderId || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedWaiterId = (targetTableDoc && targetTableDoc.assignedWaiterId) || data.waiterId || '';
    const assignedWaiterName = (targetTableDoc && targetTableDoc.assignedWaiterName) || data.waiterName || '';
    const resolvedTableId = targetTableDoc ? targetTableDoc._id.toString() : (data.tableId || '');

    // Fetch active Admin Settings for GST calculation
    const Settings = require('../models/Settings');
    let activeSettings = null;
    try {
      activeSettings = await Settings.findOne({}).sort({ updatedAt: -1 });
    } catch (e) {}

    const rawAdminGst = activeSettings?.gstRate || '5%';
    const adminGstNum = parseFloat(String(rawAdminGst).replace(/[^0-9.]/g, '')) || 5;

    const activeIncomingItems = newIncomingItems.filter(it => it && it.status !== 'CANCELLED' && !it.isCancelled);
    const calculatedSubtotal = activeIncomingItems.reduce((sum, it) => sum + (it.totalPrice !== undefined ? Number(it.totalPrice) : (Number(it.price || 0) * Number(it.quantity || 1))), 0);
    const subtotalVal = Number(calculatedSubtotal.toFixed(2));

    const cgstRateVal = adminGstNum / 2;
    const sgstRateVal = adminGstNum / 2;
    const cgstAmtVal = Number(((subtotalVal * cgstRateVal) / 100).toFixed(2));
    const sgstAmtVal = Number(((subtotalVal * sgstRateVal) / 100).toFixed(2));
    const gstAmtVal = Number((cgstAmtVal + sgstAmtVal).toFixed(2));
    const tipVal = Number(data.tipAmount ?? data.tip ?? 0);
    const grandTotalVal = Number((subtotalVal + gstAmtVal + tipVal).toFixed(2));

    const orderData = {
      orderId: orderId,
      table: formattedTable,
      tableId: resolvedTableId,
      type: (data.type === 'Takeaway' || data.type === 'Delivery') ? data.type : 'Dine-In',
      customer: verifiedCustomerName,
      sessionId: activeSession ? activeSession._id.toString() : (data.sessionId || ''),
      sessionToken: activeSession ? activeSession.sessionToken : '',
      phone: (activeSession && activeSession.phone) || data.phone || '+91 Direct QR',
      managerId: data.managerId ? String(data.managerId) : undefined,
      chefStatus: 'NEW',
      waiterStatus: 'PENDING',
      chefId: '',
      chefName: '',
      waiterId: assignedWaiterId,
      waiterName: assignedWaiterName,
      items: newIncomingItems,
      subtotal: subtotalVal,
      originalTotal: subtotalVal,
      originalAmount: subtotalVal,
      gstRate: `${adminGstNum}%`,
      cgstRate: cgstRateVal,
      sgstRate: sgstRateVal,
      cgstAmount: cgstAmtVal,
      sgstAmount: sgstAmtVal,
      gstAmount: gstAmtVal,
      grandTotal: grandTotalVal,
      total: grandTotalVal,
      totalAmount: grandTotalVal,
      finalAmount: grandTotalVal,
      tip: tipVal,
      tipAmount: tipVal,
      status: 'Placed',
      payment: data.payment || 'Pending',
      paymentStatus: data.paymentStatus || data.payment || 'Pending',
      notes: (data.notes || data.chefNotes || data.instructions || '').trim(),
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Create and persist new order in MongoDB database
    const newOrder = await orderRepository.create(orderData);

    if (activeSession) {
      activeSession.orderId = newOrder.orderId || newOrder._id.toString();
      await activeSession.save();
    }

    // Only after successful order persistence, update table status to Occupied
    if (formattedTable) {
      try {
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
            currentOrder: newOrder.orderId || newOrder._id,
            activeSessionId: activeSession ? activeSession._id.toString() : null
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
            currentOrder: newOrder.orderId || newOrder._id,
            activeSessionId: activeSession ? activeSession._id.toString() : null,
            assignedWaiterId: assignedWaiterId,
            assignedWaiterName: assignedWaiterName
          });
        }
      } catch (tableErr) {
        console.error('Failed to update table status in database after order creation:', tableErr.message);
      }
    }

    return newOrder;
  }

  async syncTableStatusForOrder(tableIdentifier, forceStatus = null) {
    if (!tableIdentifier) return;
    const rawDigits = String(tableIdentifier).replace(/[^0-9]/g, '');
    const cleanNum = rawDigits ? String(parseInt(rawDigits, 10)) : '';
    if (!cleanNum) return;

    try {
      const OrderModel = require('../models/Order');
      const exactRegex = new RegExp(`^(T-|Table\\s*)?0*${cleanNum}$`, 'i');

      const TableSession = require('../models/TableSession');

      if (forceStatus === 'Cleaning') {
        const cleaningTime = new Date(Date.now() + 10 * 60 * 1000);
        await Table.findOneAndUpdate(
          { $or: [{ number: exactRegex }, { name: exactRegex }] },
          { status: 'Cleaning', currentOrder: '', activeSessionId: null, cleaningUntil: cleaningTime }
        );
        await TableSession.updateMany(
          { $or: [{ tableNum: exactRegex }, { mergedTableNums: exactRegex }], status: 'ACTIVE' },
          { status: 'CLOSED', closedAt: new Date() }
        );
        return;
      }

      if (forceStatus === 'Available') {
        await Table.findOneAndUpdate(
          { $or: [{ number: exactRegex }, { name: exactRegex }] },
          { status: 'Available', currentOrder: '', activeSessionId: null }
        );
        await TableSession.updateMany(
          { $or: [{ tableNum: exactRegex }, { mergedTableNums: exactRegex }], status: 'ACTIVE' },
          { status: 'CLOSED', closedAt: new Date() }
        );
        return;
      }

      const tableOrders = await OrderModel.find({
        $or: [
          { table: exactRegex },
          { tableNumber: exactRegex }
        ]
      });

      // Orders that keep the table OCCUPIED (including Bill Generated and Awaiting Payment)
      const occupiedStatuses = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Bill Generated', 'Awaiting Payment'];
      const activeOccupiedOrders = tableOrders.filter(o => occupiedStatuses.includes(o.status) && o.payment !== 'Completed' && o.payment !== 'Paid');

      if (activeOccupiedOrders.length > 0) {
        // Table MUST REMAIN Occupied
        const latestActive = activeOccupiedOrders[activeOccupiedOrders.length - 1];
        await Table.findOneAndUpdate(
          { $or: [{ number: exactRegex }, { name: exactRegex }] },
          {
            status: 'Occupied',
            currentOrder: latestActive.orderId || latestActive._id
          }
        );
      } else {
        // Check if latest order was Paid / Completed -> Auto transition to Cleaning
        const lastOrder = tableOrders[tableOrders.length - 1];
        if (lastOrder && (lastOrder.payment === 'Completed' || lastOrder.payment === 'Paid' || lastOrder.status === 'Completed' || lastOrder.status === 'Paid')) {
          await Table.findOneAndUpdate(
            { $or: [{ number: exactRegex }, { name: exactRegex }] },
            {
              status: 'Cleaning',
              currentOrder: '',
              activeSessionId: null
            }
          );
          await TableSession.updateMany(
            { $or: [{ tableNum: exactRegex }, { mergedTableNums: exactRegex }], status: 'ACTIVE' },
            { status: 'CLOSED', closedAt: new Date() }
          );
        }
      }
    } catch (err) {
      console.warn("Could not sync table status for order completion:", err.message);
    }
  }

  async updateOrderStatus(id, status, fullOrderData = {}) {
    const OrderModel = require('../models/Order');
    let existingOrder = null;
    try {
      existingOrder = await orderRepository.findById(id);
    } catch (e) { }

    if (!existingOrder && (fullOrderData.table || id)) {
      const rawNum = String(fullOrderData.table || id).replace(/[^0-9]/g, '');
      if (rawNum) {
        const exactRegex = new RegExp(`^(T-|Table\\s*)?0*${rawNum}$`, 'i');
        existingOrder = await OrderModel.findOne({
          $or: [{ table: exactRegex }, { tableNumber: exactRegex }],
          status: { $nin: ['Completed', 'Paid', 'Cancelled'] }
        });
      }
    }

    const isExplicitlyCompleted = status === 'Completed' || fullOrderData.orderStatus === 'Completed';
    const isPaid = status === 'Paid' || isExplicitlyCompleted || fullOrderData.payment === 'Completed' || fullOrderData.payment === 'Paid' || fullOrderData.paymentStatus === 'Paid';
    const isBillGenerated = status === 'Bill Generated' || status === 'Awaiting Payment' || fullOrderData.isBillGenerated || fullOrderData.billGenerated || fullOrderData.payment === 'Bill Generated' || fullOrderData.payment === 'Awaiting Payment';

    // BLOCK ORDER COMPLETION if waiter payment confirmation is NOT confirmed
    if (isExplicitlyCompleted && existingOrder) {
      const orderIsPaid = existingOrder.paymentStatus === 'Paid' || existingOrder.payment === 'Paid' || isPaid;
      const isWaiterConfirmed = existingOrder.waiterPaymentConfirmation === 'CONFIRMED' || fullOrderData.waiterPaymentConfirmation === 'CONFIRMED';
      if (!orderIsPaid) {
        throw new Error(`Cannot mark order as Completed. Customer payment status must be Paid.`);
      }
      if (!isWaiterConfirmed) {
        throw new Error(`Cannot mark order as Completed. Waiter payment confirmation is required first.`);
      }
    }

    // BLOCK PAYMENT if waiter has not generated the bill yet
    if (isPaid && !isBillGenerated && existingOrder) {
      const isAlreadyBillGenerated = Boolean(
        existingOrder.isBillGenerated ||
        existingOrder.billGenerated ||
        existingOrder.status === 'Bill Generated' ||
        existingOrder.status === 'Billing' ||
        existingOrder.payment === 'Awaiting Payment' ||
        existingOrder.paymentStatus === 'Awaiting Payment'
      );

      if (!isAlreadyBillGenerated) {
        throw new Error(`Payment is blocked for Table ${existingOrder.table || 'this table'}. The waiter must generate the bill before payment can be completed.`);
      }
    }

    // Fetch active Admin Settings for GST calculation
    const Settings = require('../models/Settings');
    let activeSettings = null;
    try {
      activeSettings = await Settings.findOne({}).sort({ updatedAt: -1 });
    } catch (e) {}

    const rawAdminGst = activeSettings?.gstRate || '5%';
    const adminGstNum = parseFloat(String(rawAdminGst).replace(/[^0-9.]/g, '')) || 5;

    const isAlreadyBillStored = Boolean(
      existingOrder?.isBillGenerated ||
      existingOrder?.billGenerated ||
      existingOrder?.status === 'Completed' ||
      existingOrder?.status === 'Bill Generated' ||
      existingOrder?.status === 'Paid' ||
      existingOrder?.payment === 'Paid' ||
      existingOrder?.paymentStatus === 'Paid' ||
      existingOrder?.payment === 'Awaiting Payment' ||
      existingOrder?.paymentStatus === 'Awaiting Payment'
    );

    // Determine GST rate: preserve stored rate for historical/already-billed orders
    let totalGstRateNum = adminGstNum;
    if (isAlreadyBillStored && existingOrder?.gstRate !== undefined && existingOrder?.gstRate !== null) {
      const parsedStored = parseFloat(String(existingOrder.gstRate).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedStored) && parsedStored >= 0) {
        totalGstRateNum = parsedStored;
      }
    } else if (fullOrderData.gstRate !== undefined && fullOrderData.gstRate !== null) {
      const parsedPayload = parseFloat(String(fullOrderData.gstRate).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedPayload) && parsedPayload >= 0) {
        totalGstRateNum = parsedPayload;
      }
    }

    const cgstRateNum = (isAlreadyBillStored && existingOrder?.cgstRate !== undefined && existingOrder?.cgstRate !== null)
      ? Number(existingOrder.cgstRate)
      : (fullOrderData.cgstRate !== undefined && fullOrderData.cgstRate !== null ? Number(fullOrderData.cgstRate) : totalGstRateNum / 2);

    const sgstRateNum = (isAlreadyBillStored && existingOrder?.sgstRate !== undefined && existingOrder?.sgstRate !== null)
      ? Number(existingOrder.sgstRate)
      : (fullOrderData.sgstRate !== undefined && fullOrderData.sgstRate !== null ? Number(fullOrderData.sgstRate) : totalGstRateNum / 2);

    const itemsList = fullOrderData.items || existingOrder?.items || [];
    const activeItems = itemsList.filter(it => it && it.status !== 'CANCELLED' && it.status !== 'Cancelled' && !it.isCancelled);
    const calculatedSubtotal = activeItems.reduce((sum, it) => sum + (it.totalPrice !== undefined ? Number(it.totalPrice) : (Number(it.price || 0) * Number(it.quantity || 1))), 0);

    const subtotal = (isAlreadyBillStored && existingOrder?.subtotal !== undefined && existingOrder?.subtotal !== null && Number(existingOrder.subtotal) >= 0)
      ? Number(existingOrder.subtotal)
      : (fullOrderData.subtotal !== undefined && fullOrderData.subtotal !== null && Number(fullOrderData.subtotal) >= 0
        ? Number(fullOrderData.subtotal)
        : calculatedSubtotal);

    const cgstAmount = (isAlreadyBillStored && existingOrder?.cgstAmount !== undefined && existingOrder?.cgstAmount !== null)
      ? Number(existingOrder.cgstAmount)
      : (fullOrderData.cgstAmount !== undefined && fullOrderData.cgstAmount !== null
        ? Number(fullOrderData.cgstAmount)
        : Number(((subtotal * cgstRateNum) / 100).toFixed(2)));

    const sgstAmount = (isAlreadyBillStored && existingOrder?.sgstAmount !== undefined && existingOrder?.sgstAmount !== null)
      ? Number(existingOrder.sgstAmount)
      : (fullOrderData.sgstAmount !== undefined && fullOrderData.sgstAmount !== null
        ? Number(fullOrderData.sgstAmount)
        : Number(((subtotal * sgstRateNum) / 100).toFixed(2)));

    const gstAmount = (isAlreadyBillStored && existingOrder?.gstAmount !== undefined && existingOrder?.gstAmount !== null)
      ? Number(existingOrder.gstAmount)
      : (fullOrderData.gstAmount !== undefined && fullOrderData.gstAmount !== null
        ? Number(fullOrderData.gstAmount)
        : Number((cgstAmount + sgstAmount).toFixed(2)));

    const tipVal = Number(fullOrderData.tipAmount ?? fullOrderData.tip ?? existingOrder?.tipAmount ?? existingOrder?.tip ?? 0);
    const grandTotal = Number((subtotal + gstAmount + tipVal).toFixed(2));

    const txnId = fullOrderData.transactionId || (isPaid ? `TXN-${Date.now().toString().slice(-8)}` : '');
    const paidTimestamp = fullOrderData.paidAt || (isPaid ? new Date() : null);

    const resolvedOrderStatus = isExplicitlyCompleted
      ? 'Completed'
      : (fullOrderData.orderStatus || (existingOrder?.orderStatus !== 'Completed' ? existingOrder?.orderStatus : null) || (existingOrder?.status !== 'Completed' && existingOrder?.status !== 'Paid' ? existingOrder?.status : null) || (status !== 'Paid' ? status : null) || 'Served');

    const updatePayload = {
      ...fullOrderData,
      status: resolvedOrderStatus,
      orderStatus: resolvedOrderStatus,
      payment: isPaid ? 'Paid' : (isBillGenerated ? 'Awaiting Payment' : (fullOrderData.payment || 'Pending')),
      paymentStatus: isPaid ? 'Paid' : (isBillGenerated ? 'Awaiting Payment' : (fullOrderData.paymentStatus || 'Pending')),
      isBillGenerated: isBillGenerated || existingOrder?.isBillGenerated || false,
      billGenerated: isBillGenerated || existingOrder?.billGenerated || false,
      subtotal: subtotal,
      originalTotal: subtotal,
      originalAmount: subtotal,
      gstRate: `${totalGstRateNum}%`,
      cgstRate: cgstRateNum,
      sgstRate: sgstRateNum,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      gstAmount: gstAmount,
      grandTotal: grandTotal,
      finalAmount: grandTotal,
      total: grandTotal,
      totalAmount: grandTotal,
      tip: tipVal,
      tipAmount: tipVal,
      customerPaidAmount: fullOrderData.customerPaidAmount !== undefined ? Number(fullOrderData.customerPaidAmount) : grandTotal,
      ...(fullOrderData.couponCode !== undefined && { couponCode: String(fullOrderData.couponCode) }),
      ...(fullOrderData.discountAmount !== undefined && { discountAmount: Number(fullOrderData.discountAmount) }),
      ...(fullOrderData.paymentMethod !== undefined && { paymentMethod: String(fullOrderData.paymentMethod) }),
      transactionId: txnId,
      ...(paidTimestamp && { paidAt: paidTimestamp })
    };

    if (isPaid && fullOrderData.couponCode) {
      try {
        const Coupon = require('../models/Coupon');
        const cleanCode = String(fullOrderData.couponCode).trim().toUpperCase();
        const foundCoupon = await Coupon.findOne({ code: { $regex: new RegExp(`^${cleanCode}$`, 'i') } });
        if (foundCoupon && foundCoupon.isActive) {
          foundCoupon.usedCount = (foundCoupon.usedCount || 0) + 1;
          await foundCoupon.save();
        }
      } catch (err) {
        console.warn('Coupon usage update error:', err.message);
      }
    }

    const targetId = existingOrder ? (existingOrder._id || existingOrder.orderId || id) : id;
    const updatedOrder = await orderRepository.updateStatus(targetId, updatePayload.status, updatePayload);
    const tableId = (updatedOrder && updatedOrder.table) || (fullOrderData && fullOrderData.table);

    if (tableId) {
      if (isPaid) {
        // Successful payment -> Table AUTOMATICALLY changes to Cleaning
        await this.syncTableStatusForOrder(tableId, 'Cleaning');

        // Update Guest Loyalty Points & Visit Count in MongoDB
        try {
          const Guest = require('../models/Guest');
          const phoneNum = updatedOrder?.phone || fullOrderData?.phone || '';
          const customerName = updatedOrder?.customer || fullOrderData?.customer || 'Guest Diner';
          if (phoneNum && phoneNum.length >= 10) {
            const pointsEarned = Math.floor((updatedOrder?.total || fullOrderData?.finalAmount || 100) / 10);
            await Guest.findOneAndUpdate(
              { phone: phoneNum },
              {
                $set: { name: customerName, lastVisitDate: new Date() },
                $inc: { visitCount: 1, loyaltyPoints: pointsEarned }
              },
              { upsert: true, new: true }
            );
          }
        } catch (e) {
          console.warn('Could not update guest loyalty points in DB:', e.message);
        }
      } else if (isBillGenerated) {
        // Bill Generated -> Table STAYS Occupied
        await this.syncTableStatusForOrder(tableId, 'Occupied');
      } else {
        await this.syncTableStatusForOrder(tableId);
      }
    }
    return updatedOrder;
  }

  async updateOrderItemStatus(id, itemIds = [], targetStatus = 'DELIVERED') {
    const order = await orderRepository.findById(id);
    if (!order) throw new Error('Order not found');

    const itemIdsToUpdate = Array.isArray(itemIds) ? itemIds.map(i => String(i)) : [String(itemIds)];

    let rawItems = order.items || [];
    let itemsUpdatedCount = 0;

    const updatedItems = rawItems.map((item, idx) => {
      const itemObj = item.toObject ? item.toObject() : item;
      const itemIdStr = String(itemObj._id || itemObj.id || itemObj.itemId || `item-${idx}`);
      const itemNameStr = String(itemObj.name || '').trim().toLowerCase();

      const isTarget = itemIdsToUpdate.some(target => {
        const cleanTarget = String(target || '').trim().toLowerCase();
        if (!cleanTarget) return false;
        return cleanTarget === itemIdStr.toLowerCase() ||
          cleanTarget === String(idx) ||
          cleanTarget === itemNameStr ||
          cleanTarget === String(itemObj._id || '').toLowerCase() ||
          cleanTarget === String(itemObj.id || '').toLowerCase() ||
          cleanTarget === String(itemObj.itemId || '').toLowerCase();
      });

      if (isTarget) {
        if (targetStatus === 'DELIVERED') {
          // Backend Validation Rule (Req #12):
          // Must ONLY allow delivery if item's current status is READY (or isReady is true) and NOT ALREADY DELIVERED.
          const isCurrentlyReady = itemObj.status === 'READY' || itemObj.isReady === true;
          const isAlreadyDelivered = itemObj.status === 'DELIVERED' || itemObj.status === 'SERVED' || itemObj.isDelivered === true;

          if (isCurrentlyReady && !isAlreadyDelivered) {
            itemObj.status = 'DELIVERED';
            itemObj.isDelivered = true;
            itemObj.isReady = true;
            itemsUpdatedCount++;
          }
        } else if (targetStatus === 'READY') {
          if (itemObj.status !== 'DELIVERED') {
            itemObj.status = 'READY';
            itemObj.isReady = true;
            itemsUpdatedCount++;
          }
        } else if (targetStatus === 'PREPARING') {
          if (itemObj.status !== 'DELIVERED') {
            itemObj.status = 'PREPARING';
            itemObj.isReady = false;
            itemsUpdatedCount++;
          }
        }
      }
      return itemObj;
    });

    // Derive Order Status (Req #7)
    const totalCount = updatedItems.length;
    const deliveredCount = updatedItems.filter(i => i.status === 'DELIVERED' || i.isDelivered).length;
    const readyCount = updatedItems.filter(i => (i.status === 'READY' || i.isReady) && (i.status !== 'DELIVERED' && !i.isDelivered)).length;

    let derivedOrderStatus = order.status;
    if (totalCount > 0 && deliveredCount === totalCount) {
      derivedOrderStatus = 'Served'; // Fully Delivered
    } else if (deliveredCount > 0) {
      derivedOrderStatus = 'PARTIALLY DELIVERED';
    } else if (readyCount === totalCount || (readyCount > 0 && readyCount + deliveredCount === totalCount)) {
      derivedOrderStatus = 'Ready';
    } else if (readyCount > 0) {
      derivedOrderStatus = 'Preparing';
    } else {
      derivedOrderStatus = (order.status === 'Placed' || order.status === 'NEW') ? 'Placed' : 'Preparing';
    }

    const extraUpdates = {
      items: updatedItems,
      status: derivedOrderStatus
    };
    if (totalCount > 0 && deliveredCount === totalCount) {
      extraUpdates.waiterStatus = 'SERVED';
      extraUpdates.waiterServedAt = new Date();
    } else if (deliveredCount > 0) {
      extraUpdates.waiterStatus = 'SERVING';
      extraUpdates.waiterServingAt = new Date();
    }

    const updatedOrder = await orderRepository.updateStatus(order.orderId || order._id || id, derivedOrderStatus, extraUpdates);

    return updatedOrder;
  }

  async confirmWaiterPayment(id, waiterData = {}) {
    const OrderModel = require('../models/Order');
    let existingOrder = null;
    try {
      existingOrder = await orderRepository.findById(id);
    } catch (e) { }

    if (!existingOrder) {
      const rawNum = String(id).replace(/[^0-9]/g, '');
      if (rawNum) {
        const exactRegex = new RegExp(`^(T-|Table\\s*)?0*${rawNum}$`, 'i');
        existingOrder = await OrderModel.findOne({
          $or: [{ table: exactRegex }, { tableNumber: exactRegex }, { orderId: id }]
        });
      }
    }

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const isPaid = existingOrder.paymentStatus === 'Paid' || existingOrder.payment === 'Paid' || existingOrder.status === 'Paid' || existingOrder.status === 'Completed';
    if (!isPaid) {
      throw new Error('Cannot confirm payment. Customer payment has not been marked as Paid.');
    }

    if (existingOrder.waiterPaymentConfirmation === 'CONFIRMED') {
      return existingOrder;
    }

    const staffName = waiterData.waiterName || waiterData.staffName || existingOrder.waiterName || 'Staff Waiter';
    const staffId = waiterData.waiterId || waiterData.staffId || existingOrder.waiterId || '';

    existingOrder.waiterPaymentConfirmation = 'CONFIRMED';
    existingOrder.waiterPaymentConfirmedBy = staffName;
    existingOrder.waiterPaymentConfirmedAt = new Date();
    if (staffId && !existingOrder.waiterId) {
      existingOrder.waiterId = staffId;
      existingOrder.waiterName = staffName;
    }

    await existingOrder.save();
    return existingOrder;
  }
}

module.exports = new OrderService();
