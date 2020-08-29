const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 新增優惠卷
router.post('/', async (req, res) => {
  const data = req.body;
  const coupon = {
    title: data.title || '',
    is_enabled: data.is_enabled === undefined ? true : data.is_enabled,
    percent: data.percent || 100,
    effective_date: data.effective_date || Date.now(), // 預設當下開始生效
    due_date: data.due_date || Date.now() + 86400000 * 7, // 預設 7 天到期
    code: data.code || '',
    created_at: Date.now(),
  };
  try {
    const couponsSnapshot = await db.ref('/coupons').once('value');
    const coupons = couponsSnapshot.val() || [];
    const exists = Object.values(coupons).some((item) => item.code === data.code);
    if (exists) return res.send({ success: false, message: '重複代碼' });
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
    const couponsToArray = Object.keys(coupons).map((couponId) => {
      const coupon = {
        id: couponId,
        ...coupons[couponId],
      };
      return coupon;
    });
    return res.send({ success: true, coupons: couponsToArray });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 修改優惠卷
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const couponData = req.body;
  try {
    const couponsSnapshot = await db.ref('/coupons').child(id).once('value');
    if (!couponsSnapshot.exists()) return res.send({ success: false, message: '找不到優惠卷' });
    await db.ref('/coupons').child(id).update(couponData);
    return res.send({ success: true, message: '已修改優惠卷' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 修改優惠卷啟用狀態 (接受批次處理)
router.patch('/:id/is_enabled', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const ids = id.split(',').map((couponId) => couponId.trim());
  if (ids.length >= 30) return res.send({ success: false, message: '超過批量修改上限' });
  const updateCoupons = ids.reduce((arr, couponId) => {
    const cacheCoupons = arr;
    cacheCoupons[`${couponId}/is_enabled`] = status;
    return cacheCoupons;
  }, {});
  try {
    const couponsSnapshot = await db.ref('/coupons').once('value');
    const coupons = couponsSnapshot.val() || [];
    const couponsKey = Object.keys(coupons);
    const exists = ids.every((couponKey) => couponsKey.includes(couponKey));
    if (!exists) return res.send({ success: false, message: '找不到優惠卷' });
    await db.ref('/coupons').update(updateCoupons);
    return res.send({ success: true, message: '已修改狀態' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 刪除優惠卷 (接受批次處理)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const ids = id.split(',').map((couponId) => couponId.trim());
  if (ids.length >= 30) return res.send({ success: false, message: '超過批量刪除上限' });
  const deleteCoupons = ids.reduce((arr, couponId) => {
    const cacheCoupons = arr;
    cacheCoupons[couponId] = null;
    return cacheCoupons;
  }, {});
  try {
    const couponsSnapshot = await db.ref('/coupons').once('value');
    const coupons = couponsSnapshot.val() || [];
    const couponsKey = Object.keys(coupons);
    const exists = ids.every((couponKey) => couponsKey.includes(couponKey));
    if (!exists) return res.send({ success: false, message: '找不到優惠卷' });
    await db.ref('/coupons').update(deleteCoupons);
    return res.send({ success: true, message: '已刪除優惠卷' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
