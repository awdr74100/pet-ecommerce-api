const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 套用優惠卷
router.post('/', async (req, res) => {
  const { uid } = req.user;
  const { code } = req.body;
  try {
    const couponsSnapshot = await db.ref('/coupons').once('value');
    const coupons = couponsSnapshot.val() || [];
    const coupon = Object.values(coupons).find((item) => item.code === code);
    if (!coupon) return res.send({ success: false, message: '找不到優惠卷' });
    if (!coupon.is_enabled) return res.send({ success: false, message: '優惠卷未啟用' });
    if (coupon.effective_date > Date.now()) return res.send({ success: false, message: '優惠卷尚未生效' });
    if (coupon.due_date < Date.now()) return res.send({ success: false, message: '優惠卷已過期' });
    const cartProductsSnapshot = await db.ref('/carts').child(uid).once('value');
    if (!cartProductsSnapshot.exists()) return res.send({ success: false, message: '禁止購物車為空' });
    const cartProducts = cartProductsSnapshot.val();
    const updateCart = {};
    Object.keys(cartProducts).forEach((cartProductId) => {
      updateCart[`${cartProductId}/coupon`] = coupon;
    });
    await db.ref('/carts').child(uid).update(updateCart);
    return res.send({ success: true, message: '已套用優惠卷' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取得剩餘抽獎次數
router.get('/draws', async (req, res) => {
  const { uid } = req.user;
  try {
    const userSnapshot = await db.ref('/users/details').child(uid).once('value');
    const userDraws = userSnapshot.val().draws;
    return res.send({ success: true, draws: userDraws });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 取得隨機轉盤優惠卷
router.get('/', async (req, res) => {
  const { uid } = req.user;
  try {
    const userSnapshot = await db.ref('/users/details').child(uid).once('value');
    const user = userSnapshot.val();
    if (user.draws === 0) return res.send({ success: false, message: '已達抽獎次數上限' });
    const couponsSnapshot = await db.ref('/coupons').once('value');
    const coupons = couponsSnapshot.val() || [];
    const couponsToArray = Object.keys(coupons)
      .filter((couponId) => {
        const coupon = coupons[couponId];
        return coupon.title.trim() === '轉盤優惠卷';
      })
      .map((couponId) => {
        const coupon = {
          id: couponId,
          title: coupons[couponId].title,
          percent: coupons[couponId].percent,
          code: coupons[couponId].code,
        };
        return coupon;
      });
    // 生成完整列表
    let invalidIndex = 1;
    const couponList = couponsToArray.reduce((arr, cur) => {
      const cacheArr = [...arr, cur, { id: invalidIndex, title: '謝謝參與', percent: 100 }];
      invalidIndex += 2;
      return cacheArr;
    }, []);
    // 生成亂數
    const random = Math.floor(Math.random() * couponList.length);
    // 扣除抽獎次數
    await db
      .ref('users/details')
      .child(uid)
      .update({ draws: user.draws - 1 });
    return res.send({ success: true, coupon: couponList[random] });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
