const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 結帳付款
router.post('/:id', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    const orderSnapshot = await db.ref('/orders').child(uid).child(id).once('value');
    if (!orderSnapshot.exists()) return res.send({ success: false, message: '找不到訂單' });
    const order = orderSnapshot.val();
    if (order.status === 'ispaid') return res.send({ success: true, message: '重複結帳' });
    if (order.status === 'canceled') return res.send({ success: true, message: '訂單已被取消' });
    const productsSnapshot = await db.ref('/products').once('value');
    const products = productsSnapshot.val() || {};
    const adjustProductsSales = order.cart.reduce((arr, cartProduct) => {
      const { qty, product } = cartProduct;
      const cacheAdjustProductsSales = arr;
      if (products[product.id]) {
        cacheAdjustProductsSales[`${product.id}/sales`] = products[product.id].sales + qty;
      }
      return cacheAdjustProductsSales;
    }, {});
    await db.ref('/products').update(adjustProductsSales);
    await db.ref('/orders').child(uid).child(id).update({
      paid_date: Date.now(),
      status: 'ispaid',
    });
    return res.send({ success: true, message: '結帳完成' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
