const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 取得訂單列表
router.get('/', async (req, res) => {
  try {
    const ordersSnapshot = await db.ref('/orders').once('value');
    const orders = ordersSnapshot.val() || [];
    const ordersToArray = Object.keys(orders).reduce((arr, uid) => {
      const cacheOrdersToArray = arr;
      const uOrders = Object.keys(orders[uid]).map((uOrderId) => {
        const uOrder = orders[uid][uOrderId];
        return {
          uid,
          id: uOrderId,
          ...uOrder,
        };
      });
      return [...cacheOrdersToArray, ...uOrders];
    }, []);
    return res.send({ success: true, orders: ordersToArray });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
