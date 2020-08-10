const router = require('express').Router();
const { db } = require('../connection/firebase-admin');

// 產品加入購物車
router.post('/', async (req, res) => {
  const { uid } = req.user;
  const { productId, qty } = req.body;
  try {
    const snapshot = await db.ref('/products').child(productId).once('value');
    if (!snapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    const product = { ...snapshot.val(), id: productId };
    const tPrice = product.price * qty;
    const ftPrice = product.price * qty;
    await db.ref('/carts').child(uid).push({
      product,
      qty,
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
    if (!snapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    const cartProduct = snapshot.val();
    const tPrice = cartProduct.product.price * qty;
    const ftPrice = cartProduct.product.price * qty;
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
