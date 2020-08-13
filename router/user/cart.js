const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 產品加入購物車
router.post('/', async (req, res) => {
  const { uid } = req.user;
  const { productId, qty } = req.body;
  try {
    // 檢查產品是否存在或未啟用或庫存足夠
    const productSnapshot = await db.ref('/products').child(productId).once('value');
    if (!productSnapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    const product = productSnapshot.val();
    if (!product.is_enabled) return res.send({ success: false, message: '產品未啟用' });
    const cartSnapshot = await db.ref('/carts').child(uid).once('value');
    const cart = cartSnapshot.val() || [];
    const cartProduct = Object.entries(cart).find(([, value]) => value.productId === productId);
    // 加入購物車 (存在購物車)
    if (cartProduct) {
      const [cartProductId, cartProductContent] = cartProduct;
      if (product.stock - (cartProductContent.qty + qty) < 0) return res.send({ success: false, message: '庫存不足' });
      await db
        .ref('/carts')
        .child(uid)
        .child(cartProductId)
        .update({ qty: cartProductContent.qty + qty });
      return res.send({ success: true, message: '已加入購物車' });
    }
    // 加入購物車 (不存在購物車)
    if (product.stock - qty < 0) return res.send({ success: false, message: '庫存不足' });
    await db.ref('/carts').child(uid).push({
      coupon: '',
      productId,
      qty,
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
    const cartSnapshot = await db.ref('carts').child(uid).once('value');
    if (!cartSnapshot.exists()) {
      return res.send({
        success: true,
        cart: [],
        total: 0,
        final_total: 0,
      });
    }
    const cart = cartSnapshot.val();
    const productsSnapshot = await db.ref('/products').once('value');
    const products = productsSnapshot.val();
    const cartToArray = Object.entries(cart).reduce((arr, cartProduct) => {
      const [cartProductId, { coupon, productId, qty }] = cartProduct;
      const product = products[productId];
      return arr.concat({
        id: cartProductId,
        coupon,
        product: { id: productId, ...product },
        qty,
        total: product.price * qty,
        final_total: Math.round(product.price * qty * ((coupon.percent || 100) / 100)),
      });
    }, []);
    let [total, finalTotal] = [0, 0];
    cartToArray.forEach((item) => {
      total += item.total;
      finalTotal += item.final_total;
    });
    return res.send({
      success: true,
      cart: cartToArray,
      total,
      final_total: finalTotal,
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
    const cartProductSnapshot = await db.ref('/carts').child(uid).child(id).once('value');
    if (!cartProductSnapshot.exists()) return res.send({ success: true, message: '找不到產品' });
    const { productId } = cartProductSnapshot.val();
    const productSnapshot = await db.ref('/products').child(productId).once('value');
    const { stock } = productSnapshot.val();
    if (stock - qty < 0) return res.send({ success: false, message: '庫存不足' });
    await db.ref('/carts').child(uid).child(id).update({ qty });
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
    const cartProductSnapshot = await db.ref('/carts').child(uid).child(id).once('value');
    if (!cartProductSnapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    await db.ref('/carts').child(uid).child(id).remove();
    return res.send({ success: true, message: '已刪除購物車產品' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 清空購物車
router.delete('/', async (req, res) => {
  const { uid } = req.user;
  try {
    await db.ref('/carts').child(uid).remove();
    return res.send({ success: true, message: '已清空購物車' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
