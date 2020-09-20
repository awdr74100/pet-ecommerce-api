const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 建立訂單 (unpaid 狀態)
router.post('/', async (req, res) => {
  const { uid } = req.user;
  const { user, message } = req.body;
  const { payment_method: paymentMethod, shipping_method: shippingMethod } = req.body;
  if (!user) return res.send({ success: false, message: '購買人資料為必填' });
  try {
    const cartProductsSnapshot = await db.ref('/carts').child(uid).once('value');
    if (!cartProductsSnapshot.exists()) return res.send({ success: false, message: '禁止購物車為空' });
    const cartProducts = cartProductsSnapshot.val();
    const productsSnapshot = await db.ref('/products').once('value');
    const products = productsSnapshot.val() || {};
    let cartProductsTotal = 0;
    let cartProductsFinalTotal = 0;
    const unlistedProducts = {};
    const adjustProductsStock = {};
    // 取得購物車產品列表 (存在且啟用且庫存足夠)
    const listedProducts = Object.entries(cartProducts).reduce((arr, cartProductEntries) => {
      const cacheListedProducts = arr;
      const [cartProductId, { coupon, productId, qty }] = cartProductEntries;
      // 產品存在且啟用
      if (products[productId] && products[productId].is_enabled) {
        if (products[productId].stock - qty < 0) throw new Error('stock error');
        const total = products[productId].price * qty;
        const finalTotal = Math.round(total * ((coupon.percent || 100) / 100));
        cartProductsTotal += total;
        cartProductsFinalTotal += finalTotal;
        adjustProductsStock[`${productId}/stock`] = products[productId].stock - qty;
        return [
          ...cacheListedProducts,
          {
            // id: cartProductId,
            coupon,
            product: { id: productId, ...products[productId] },
            qty,
            total,
            final_total: finalTotal,
          },
        ];
      }
      // 產品遭下架或移除
      unlistedProducts[cartProductId] = null;
      return [...cacheListedProducts];
    }, []);
    // 移除已下架或未啟用購物車產品
    if (Object.keys(unlistedProducts).length > 0) {
      await db.ref('/carts').child(uid).update(unlistedProducts);
      return res.send({ success: false, message: `${Object.keys(unlistedProducts).length} 樣商品遭下架或移除` });
    }
    // 建立訂單
    const { key: orderId } = await db.ref('/orders').child(uid).push({
      created_at: Date.now(),
      status: 'unpaid',
      cancel_date: false,
      paid_date: false,
      shipping_date: false,
      arrival_date: false,
      complete_date: false,
      payment_method: paymentMethod,
      shipping_method: shippingMethod,
      cart: listedProducts,
      user,
      message,
      total: cartProductsTotal,
      final_total: cartProductsFinalTotal,
    });
    // 調整商品庫存
    await db.ref('/products').update(adjustProductsStock);
    // 清空購物車
    await db.ref('/carts').child(uid).remove();
    return res.send({ success: true, message: '已建立訂單', orderId });
  } catch (error) {
    if (error.message === 'stock error') return res.send({ success: false, message: '部分商品庫存不足' });
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取消訂單 (模擬 unpaid -> cancelled)
router.patch('/:id/cancel', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    const orderSnapshot = await db.ref('/orders').child(uid).child(id).once('value');
    if (!orderSnapshot.exists()) return res.send({ success: false, message: '找不到訂單' });
    const order = orderSnapshot.val();
    // 限訂單狀態為 unpaid
    if (order.status !== 'unpaid') return res.send({ success: false, message: '操作異常' });
    const productsSnapshot = await db.ref('/products').once('value');
    const products = productsSnapshot.val() || {};
    const adjustProductsStock = order.cart.reduce((arr, cartProduct) => {
      const { qty, product } = cartProduct;
      const cacheAdjustProductsStock = arr;
      if (products[product.id]) {
        cacheAdjustProductsStock[`${product.id}/stock`] = products[product.id].stock + qty;
      }
      return cacheAdjustProductsStock;
    }, {});
    await db.ref('/products').update(adjustProductsStock);
    await db.ref('/orders').child(uid).child(id).update({
      status: 'cancelled',
      cancel_date: Date.now(),
    });
    return res.send({ success: true, message: '已取消訂單' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 完成訂單 (模擬 arrived -> completed)
router.patch('/:id/complete', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    const orderSnapshot = await db.ref('/orders').child(uid).child(id).once('value');
    if (!orderSnapshot.exists()) return res.send({ success: false, message: '找不到訂單' });
    const order = orderSnapshot.val();
    // 限訂單狀態為 arrived
    if (order.status !== 'arrived') return res.send({ success: false, message: '操作異常' });
    await db.ref('/orders').child(uid).child(id).update({
      status: 'completed',
      complete_date: Date.now(),
    });
    return res.send({ success: true, message: '已完成訂單' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取得訂單列表 (同時檢查訂單狀態)
router.get('/', async (req, res) => {
  const { uid } = req.user;
  try {
    const ordersSnapshot = await db.ref('/orders').child(uid).once('value');
    const orders = ordersSnapshot.val() || [];
    const adjustOrder = {};
    const ordersToArray = Object.keys(orders).map((orderId) => {
      const order = orders[orderId];
      let [newStatus, newArrivalDate, newCompleteDate] = [false, false, false];
      // 包裹已送達 (shipping -> arrived) (2天送達)
      if (order.status === 'shipping' && order.shipping_date + 86400000 * 2 - Date.now() < 0) {
        adjustOrder[`${orderId}/status`] = 'arrived';
        newStatus = 'arrived';
        adjustOrder[`${orderId}/arrival_date`] = order.shipping_date + 86400000 * 2;
        newArrivalDate = order.shipping_date + 86400000 * 2;
      }
      // 自動完成訂單 (arrived -> completed) (7天完成)
      if (order.status === 'arrived' && order.arrival_date + 86400000 * 7 - Date.now() < 0) {
        adjustOrder[`${orderId}/status`] = 'completed';
        newStatus = 'completed';
        adjustOrder[`${orderId}/complete_date`] = order.arrival_date + 86400000 * 7;
        newCompleteDate = order.arrival_date + 86400000 * 7;
      }
      return {
        id: orderId,
        ...order,
        // 覆蓋狀態
        status: newStatus || order.status, // 如果更動及覆蓋
        arrival_date: newArrivalDate || order.arrival_date, // 如果更動及覆蓋
        complete_date: newCompleteDate || order.complete_date, // 如果更動及覆蓋
      };
    });
    // 更新訂單狀態
    if (Object.keys(adjustOrder).length > 0) {
      await db.ref('/orders').child(uid).update(adjustOrder);
    }
    return res.send({ success: true, orders: ordersToArray });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取得某一筆訂單
router.get('/:id', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    const orderSnapshot = await db.ref('/orders').child(uid).child(id).once('value');
    if (!orderSnapshot.exists()) return res.send({ success: false, message: '找不到訂單' });
    const order = orderSnapshot.val();
    return res.send({ success: true, order: { id, ...order } });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
