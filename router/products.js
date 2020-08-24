const router = require('express').Router();
const { db } = require('../connection/firebase-admin');

// 取得產品列表
router.get('/', async (req, res) => {
  try {
    const productsSnapshot = await db.ref('/products').once('value');
    const products = productsSnapshot.val() || [];
    const productsToArray = Object.keys(products)
      .filter((productId) => {
        const product = products[productId];
        return product.is_enabled;
      })
      .map((productId) => {
        const product = {
          id: productId,
          ...products[productId],
        };
        return product;
      });
    return res.send({ success: true, products: productsToArray });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取得單一產品細節
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const productSnapshot = await db.ref('/products').child(id).once('value');
    if (!productSnapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    const product = productSnapshot.val();
    if (!product.is_enabled) return res.send({ success: false, message: '產品未啟用' });
    return res.send({ success: true, product: { id, ...product } });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
