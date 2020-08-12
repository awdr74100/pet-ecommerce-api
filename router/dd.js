const router = require('express').Router();
const { db } = require('../connection/firebase-admin');

// 產品加入購物車
router.post('/', async (req, res) => {
  const { uid } = req.user;
  const { productId, qty } = req.body;
  try {
    const productSnapshot = await db.ref('/products').child(productId).once('value');
    if (!productSnapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    if (!productSnapshot.val().is_enabled) return res.send({ success: false, message: '產品未啟用' });
    const cartSnapshot = await db.ref('/carts').child(uid).once('value');
    const cart = cartSnapshot.val() || [];
    const callback = ([, value]) => value.product.id === productId;
    const cartProduct = Object.entries(cart).find(callback);
    if (cartProduct) {
      const [cartProductId, cartProductData] = cartProduct;
      const newQty = cartProductData.qty + qty;
      if (cartProductData.product.num - newQty < 0) return res.send({ success: false, message: '數量不足' });
      const couponPercent = (cartProductData.coupon.percent || 100) / 100;
      const tPrice = cartProductData.product.price * newQty;
      const ftPrice = cartProductData.product.price * newQty * couponPercent;
      await db.ref('/carts').child(uid).child(cartProductId).update({ qty: newQty, tPrice, ftPrice });
      return res.send({ success: true, message: '已加入購物車' });
    }
    const product = { ...productSnapshot.val(), id: productId };
    if (productSnapshot.val().num - qty < 0) return res.send({ success: false, message: '數量不足' });
    console.log(productSnapshot.val());
    const coupon = '';
    const tPrice = product.price * qty;
    const ftPrice = product.price * qty;
    await db.ref('/carts').child(uid).push({
      product,
      qty,
      coupon,
      tPrice,
      ftPrice,
      created_at: Date.now(),
    });
    return res.send({ success: true, message: '已加入購物車' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取得購物車產品列表
router.get('/', async (req, res) => {
  const { uid } = req.user;
  try {
    const snapshot = await db.ref('/carts').child(uid).once('value');
    const cart = snapshot.val() || [];
    let tPrice = 0;
    let ftPrice = 0;
    const cartToArray = Object.entries(cart).reduce((arr, [cartId, value]) => {
      tPrice += value.tPrice;
      ftPrice += value.ftPrice;
      return arr.concat({ id: cartId, ...value });
    }, []);
    return res.send({
      success: true,
      cart: cartToArray,
      tPrice,
      ftPrice,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 修改購物車產品購買數量
router.patch('/:id', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  const { qty } = req.body;
  try {
    const snapshot = await db.ref('/carts').child(uid).child(id).once('value');
    const cartProduct = snapshot.val();
    if (!snapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    if (cartProduct.product.num - qty < 0) return res.send({ success: false, message: '數量不足' });
    const couponPercent = cartProduct.coupon.percent || 100;
    const tPrice = cartProduct.product.price * qty;
    const ftPrice = cartProduct.product.price * qty * (couponPercent / 100);
    await db.ref('/carts').child(uid).child(id).update({ qty, tPrice, ftPrice });
    return res.send({ success: true, message: '已修改產品購買數量' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 刪除購物車產品
router.delete('/:id', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    const snapshot = await db.ref('/carts').child(uid).child(id).once('value');
    if (!snapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    await db.ref('/carts').child(uid).child(id).remove();
    return res.send({ success: true, message: '已刪除購物車產品' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
