const router = require('express').Router();
const { db } = require('../connection/firebase-admin');

// 取得轉盤優惠卷列表
router.get('/', async (req, res) => {
  try {
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
    return res.send({ success: true, coupons: couponList });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
