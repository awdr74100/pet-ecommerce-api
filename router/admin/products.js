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
    is_enabled: data.is_enabled || true,
    num: data.num || 1,
    imgUrl: data.imgUrl || '',
    created_at: Date.now(),
  };
  try {
    await db.ref('/products').push(product);
    return res.send({ success: true, message: '以新增產品' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取得產品列表
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.ref('/products').once('value');
    const data = snapshot.val() || [];
    const products = Object.entries(data).reduce((acc, cur) => {
      acc.push({ ...cur[1], id: cur[0] });
      return acc;
    }, []);
    return res.send({ success: true, products });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 修改產品
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const product = {
    ...data,
  };
  try {
    const snapshot = await db.ref('/products').child(id).once('value');
    if (!snapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    await db.ref('/products').child(id).update(product);
    return res.send({ success: true, message: '已修改產品' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 刪除產品
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const snapshot = await db.ref('/products').child(id).once('value');
    if (!snapshot.exists()) return res.send({ success: false, message: '找不到產品' });
    await db.ref('/products').child(id).remove();
    return res.send({ success: true, message: '已刪除產品' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;