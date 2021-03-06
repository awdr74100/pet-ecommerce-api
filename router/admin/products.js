const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 新增產品
router.post('/', async (req, res) => {
  const data = req.body;
  const product = {
    title: data.title || '',
    category: data.category || '',
    origin_price: data.origin_price || 0,
    price: data.price || 0,
    unit: data.unit || '',
    description: data.description || '',
    content: data.content || '',
    is_enabled: data.is_enabled === undefined ? false : data.is_enabled,
    sales: data.sales || 0,
    stock: data.stock || 0,
    imgUrl: data.imgUrl || '',
    created_at: Date.now(),
  };
  try {
    await db.ref('/products').push(product);
    return res.send({ success: true, message: '已新增產品' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取得產品列表
router.get('/', async (req, res) => {
  try {
    const productsSnapshot = await db.ref('/products').once('value');
    const products = productsSnapshot.val() || [];
    const productsToArray = Object.keys(products).map((productId) => {
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

// 修改產品
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const productData = req.body;
  try {
    const productSnapshot = await db.ref('/products').child(id).once('value');
    if (!productSnapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    await db.ref('/products').child(id).update(productData);
    return res.send({ success: true, message: '已修改產品' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 修改產品啟用狀態 (接受批次處理)
router.patch('/:id/is_enabled', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const ids = id.split(',').map((productId) => productId.trim());
  if (ids.length >= 30) return res.send({ success: false, message: '超過批量修改上限' });
  const updateProducts = ids.reduce((arr, productId) => {
    const cacheProducts = arr;
    cacheProducts[`${productId}/is_enabled`] = status;
    return cacheProducts;
  }, {});
  try {
    const productsSnapshot = await db.ref('/products').once('value');
    const products = productsSnapshot.val() || [];
    const productsKey = Object.keys(products);
    const exists = ids.every((productId) => productsKey.includes(productId));
    if (!exists) return res.send({ success: false, message: '找不到產品' });
    await db.ref('/products').update(updateProducts);
    return res.send({ success: true, message: '已修改狀態' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 刪除產品 (接受批次處理)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const ids = id.split(',').map((productId) => productId.trim());
  if (ids.length >= 30) return res.send({ success: false, message: '超過批量刪除上限' });
  const deleteProducts = ids.reduce((arr, productId) => {
    const cacheProducts = arr;
    cacheProducts[productId] = null;
    return cacheProducts;
  }, {});
  try {
    const productsSnapshot = await db.ref('/products').once('value');
    const products = productsSnapshot.val() || [];
    const productsKey = Object.keys(products);
    const exists = ids.every((productId) => productsKey.includes(productId));
    if (!exists) return res.send({ success: false, message: '找不到產品' });
    await db.ref('/products').update(deleteProducts);
    return res.send({ success: true, message: '已刪除產品' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
