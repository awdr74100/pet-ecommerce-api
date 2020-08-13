const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 建立訂單
router.post('/', async (req, res) => {
  const { uid } = req.user;
  const { user, message, paymentMethod = 'atm' } = req.body;
  if (!user) return res.send({ success: false, message: '留言欄位為必填' });
  if (!message) return res.send({ success: false, message: '購買人資料為必填' });
  try {
    const cartSnapshot = await db.ref('/carts').child(uid).once('value');
    if (!cartSnapshot.exists()) return res.send({ success: false, message: '購物車目前為空' });
    const cart = cartSnapshot.val();
    const productsSnapshot = await db.ref('/products').once('value');
    const products = productsSnapshot.val();
    const replaceProduct = {};
    const productsToArray = Object.values(cart).reduce((arr, cartProductContent) => {
      const { coupon, productId, qty } = cartProductContent;
      const product = products[productId];
      replaceProduct[productId] = { ...product, stock: product.stock - qty };
      return arr.concat({
        id: productId,
        coupon,
        ...product,
        qty,
        total: product.price * qty,
        final_total: Math.round(product.price * qty * ((coupon.percent || 100) / 100)),
      });
    }, []);
    let [total, finalTotal] = [0, 0];
    productsToArray.forEach((item) => {
      total += item.total;
      finalTotal += item.final_total;
    });
    // 建立訂單
    const { key } = await db.ref('/orders').child(uid).push({
      created_at: Date.now(),
      is_paid: false,
      paid_date: false,
      payment_method: paymentMethod,
      user,
      message,
      products: productsToArray,
      total,
      final_total: finalTotal,
    });
    // 調整商品庫存
    await db.ref('/products').update({ ...products, ...replaceProduct });
    // 清空購物車產品
    await db.ref('/carts').child(uid).remove();
    return res.send({ success: true, message: '已建立訂單', orderId: key });
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
    const ordersToArray = Object.entries(orders).reduce((arr, order) => {
      const [orderId, orderContent] = order;
      return arr.concat({
        id: orderId,
        ...orderContent,
      });
    }, []);
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
