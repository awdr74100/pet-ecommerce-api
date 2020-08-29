const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 取得訂單列表 (同時檢查訂單狀態)
router.get('/', async (req, res) => {
  try {
    const ordersSnapshot = await db.ref('/orders').once('value');
    const orders = ordersSnapshot.val() || [];
    const adjustUserOrdersStatus = {};
    const ordersToArray = Object.keys(orders).reduce((arr, uid) => {
      const cacheOrdersToArray = arr;
      const uOrders = Object.keys(orders[uid]).map((uOrderId) => {
        const uOrder = orders[uid][uOrderId];
        let [newStatus, newCompleteDate] = [false, false];
        // 包裹已到達 (shipping -> arrived)
        if (uOrder.status === 'shipping' && uOrder.arrival_date < Date.now()) {
          adjustUserOrdersStatus[`${uid}/${uOrderId}/status`] = 'arrived';
          newStatus = 'arrived';
        }
        // 自動完成訂單 (arrived -> completed)
        if (uOrder.status === 'arrived' && uOrder.arrival_date + 86400000 * 7 - Date.now() < 0) {
          adjustUserOrdersStatus[`${uid}/${uOrderId}/status`] = 'completed';
          newCompleteDate = uOrder.arrival_date + 86400000 * 7;
          newStatus = 'completed';
        }
        return {
          uid,
          id: uOrderId,
          ...uOrder,
          // 覆蓋狀態
          status: newStatus || uOrder.status,
          complete_date: newCompleteDate || uOrder.complete_date,
        };
      });
      return [...cacheOrdersToArray, ...uOrders];
    }, []);
    // 更新訂單狀態
    if (Object.keys(adjustUserOrdersStatus).length > 0) {
      await db.ref('/orders').update(adjustUserOrdersStatus);
    }
    return res.send({ success: true, orders: ordersToArray });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 訂單出貨 (toship -> shipping)
router.patch('/:uid/:id/ship', async (req, res) => {
  const { uid, id } = req.params;
  try {
    const userOrderSnapshot = await db.ref('/orders').child(uid).child(id).once('value');
    if (!userOrderSnapshot.exists()) return res.send({ success: false, message: '找不到訂單' });
    const userOrder = userOrderSnapshot.val();
    // 限訂單狀態為 toship
    if (userOrder.status !== 'toship') return res.send({ success: false, message: '操作異常' });
    await db
      .ref('/orders')
      .child(uid)
      .child(id)
      .update({
        status: 'shipping',
        shipping_date: Date.now(),
        arrival_date: Date.now() + 86400000 * 2, // 模擬 2 天後到達
      });
    return res.send({ success: true, message: '訂單已出貨' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
