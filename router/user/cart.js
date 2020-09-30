const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 產品加入購物車
router.post('/', async (req, res) => {
  const { uid } = req.user;
  const { productId, qty } = req.body;
  try {
    // 檢查產品是否存在或已啟用
    const productSnapshot = await db.ref('/products').child(productId).once('value');
    if (!productSnapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    const product = productSnapshot.val();
    if (!product.is_enabled) return res.send({ success: false, message: '產品未啟用' });
    // 檢查是否已存在購物車
    const cartProductsSnapshot = await db.ref('/carts').child(uid).once('value');
    const cartProducts = cartProductsSnapshot.val() || [];
    const cartProduct = Object.entries(cartProducts).find((cartProductEntries) => {
      const [, cartProductContent] = cartProductEntries;
      return cartProductContent.productId === productId;
    });
    // 存在購物車 (庫存足夠下，更新產品購買數量)
    if (cartProduct) {
      const [cartProductId, cartProductContent] = cartProduct;
      const newQty = cartProductContent.qty + qty;
      if (product.stock - newQty < 0) return res.send({ success: false, message: '庫存不足' });
      await db.ref('/carts').child(uid).child(cartProductId).update({ qty: newQty });
      return res.send({ success: true, message: '已加入購物車' });
    }
    // 不存在購物車 (庫存足夠下，將產品加入購物車)
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
    const cartProductsSnapshot = await db.ref('/carts').child(uid).once('value');
    if (!cartProductsSnapshot.exists()) {
      return res.send({
        success: true,
        cart: [],
        total: 0,
        final_total: 0,
      });
    }
    const cartProducts = cartProductsSnapshot.val();
    const productsSnapshot = await db.ref('/products').once('value');
    const products = productsSnapshot.val() || {};
    let cartProductsTotal = 0;
    let cartProductsFinalTotal = 0;
    const unlistedProducts = {};
    // 取得購物車產品列表 (存在且啟用)
    const listedProducts = Object.entries(cartProducts).reduce((arr, cartProductEntries) => {
      const cacheUnlistedProducts = arr;
      const [cartProductId, { coupon, productId, qty }] = cartProductEntries;
      // 產品存在且啟用
      if (products[productId] && products[productId].is_enabled) {
        const total = products[productId].price * qty;
        const finalTotal = Math.round(total * ((coupon.percent || 100) / 100));
        cartProductsTotal += total;
        cartProductsFinalTotal += finalTotal;
        return [
          ...cacheUnlistedProducts,
          {
            id: cartProductId,
            coupon,
            product: { id: productId, ...products[productId] },
            qty,
            total,
            final_total: finalTotal,
            created_at: cartProductEntries[1].created_at,
          },
        ];
      }
      // 產品遭下架或移除
      unlistedProducts[cartProductId] = null;
      return [...cacheUnlistedProducts];
    }, []);
    // 移除已下架或移除購物車產品
    if (Object.keys(unlistedProducts).length > 0) {
      await db.ref('/carts').child(uid).update(unlistedProducts);
      return res.send({
        success: true,
        cart: listedProducts,
        total: cartProductsTotal,
        final_total: cartProductsFinalTotal,
        message: `${Object.keys(unlistedProducts).length} 樣商品遭下架或移除`,
      });
    }
    return res.send({
      success: true,
      cart: listedProducts,
      total: cartProductsTotal,
      final_total: cartProductsFinalTotal,
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

// 刪除購物車產品 (接受批次處理)
router.delete('/:id', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  const ids = id.split(',').map((cartProductId) => cartProductId.trim());
  if (ids.length >= 30) return res.send({ success: false, message: '超過批量刪除上限' });
  const deleteCartProducts = ids.reduce((arr, cartProductId) => {
    const cacheCartProducts = arr;
    cacheCartProducts[cartProductId] = null;
    return cacheCartProducts;
  }, {});
  try {
    const cartProductsSnapshot = await db.ref('/carts').child(uid).once('value');
    const cartProducts = cartProductsSnapshot.val() || [];
    const cartProductsKey = Object.keys(cartProducts);
    const exists = ids.every((cartProductId) => cartProductsKey.includes(cartProductId));
    if (!exists) return res.send({ success: false, message: '找不到產品' });
    await db.ref('/carts').child(uid).update(deleteCartProducts);
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
