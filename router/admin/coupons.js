const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 新增優惠卷
router.post('/', async (req, res) => {
  const data = req.body;
  const coupon = {
    title: data.title || '',
    is_enabled: data.is_enabled || true,
    percent: data.percent || 100,
    due_date: data.due_date || 0,
    code: data.code || '',
    created_at: Date.now(),
  };
  try {
    await db.ref('/coupons').push(coupon);
    return res.send({ success: true, message: '已新增優惠卷' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取得優惠卷列表
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.ref('/coupons').once('value');
    const coupons = snapshot.val() || [];
    const couponsToArray = Object.entries(coupons).reduce((arr, [id, value]) => {
      const newArr = arr.concat({ id, ...value });
      return newArr;
    }, []);
    return res.send({ success: true, coupons: couponsToArray });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 修改優惠卷
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const coupon = { ...update };
  try {
    const snapshot = await db.ref('/coupons').child(id).once('value');
    if (!snapshot.exists()) return res.send({ success: false, message: '找不到優惠卷' });
    await db.ref('/coupons').child(id).update(coupon);
    return res.send({ success: true, message: '已修改優惠卷' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 刪除優惠卷
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const snapshot = await db.ref('/coupons').child(id).once('value');
    if (!snapshot.exists()) return res.send({ success: false, message: '找不到優惠卷' });
    await db.ref('/coupons').child(id).remove();
    return res.send({ success: true, message: '已刪除優惠卷' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
