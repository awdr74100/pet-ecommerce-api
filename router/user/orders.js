const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 建立訂單
router.post('/', async (req, res) => {
  const { uid } = req.user;
  const { user, message, paymentMethod = 'atm' } = req.body;
  if (!user) return res.send({ success: false, message: '購買人資料為必填' });
  if (!message) return res.send({ success: false, message: '留言欄位為必填' });
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
      status: 'underway',
      paid_date: false,
      payment_method: paymentMethod,
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

// 取消訂單
router.patch('/:id', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    const orderSnapshot = await db.ref('/orders').child(uid).child(id).once('value');
    if (!orderSnapshot.exists()) return res.send({ success: false, message: '找不到訂單' });
    const order = orderSnapshot.val();
    if (order.status === 'canceled') return res.send({ success: false, message: '重複取消訂單' });
    if (order.status === 'ispaid') return res.send({ success: false, message: '訂單已完成結帳' });
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
    await db.ref('/orders').child(uid).child(id).update({ status: 'canceled' });
    return res.send({ success: true, message: '已取消訂單' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取得訂單列表
router.get('/', async (req, res) => {
  const { uid } = req.user;
  try {
    const ordersSnapshot = await db.ref('/orders').child(uid).once('value');
    const orders = ordersSnapshot.val() || [];
    const ordersToArray = Object.keys(orders).map((orderId) => {
      const order = {
        id: orderId,
        ...orders[orderId],
      };
      return order;
    });
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
