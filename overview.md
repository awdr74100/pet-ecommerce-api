1.  POST 管理員註冊 => /api/admin/signup

    - (200):true - 註冊成功
    - (200):false - 無效電子郵件
    - (200):false - 已存在用戶
    - (200):false - 密碼強度不夠
    - (500):false - error.message

2.  POST 管理員登入 => /api/admin/signin

    - (200):true - { admin }
    - (200):false - 無效電子郵件
    - (200):false - 帳號或密碼錯誤 ~ 3
    - (500):false - error.message

3.  POST 管理員登出 => /api/admin/signout

    - (200):true - 已登出

4.  POST 檢查管理員是否持續登入 => /api/admin/check

    - (200):true - interval < 10 ? 刷新 : 不刷新
    - (200):false - 未帶有訪問令牌
    - (200):false - 無效的訪問令牌
    - (200):false - 訪問令牌已過期

---

5.  POST 新增產品 => /api/admin/products

    - (200):true - 已新增產品
    - (500):false - error.message

6.  GET 取得產品列表 => /api/admin/products

    - (200):true - { products }
    - (500):false - error.message

7.  PATCH 修改產品 => /api/admin/products/:id

    - (200):true - 已修改產品
    - (200):false - 找不到產品
    - (500):false - error.message

8.  PATCH 修改產品啟用狀態 (接受批次處理) => /api/admin/products/:id/is_enabled

    - (200):true - 已修改狀態
    - (200):false - 超過批量修改上限
    - (200):false - 找不到產品
    - (500):false - error.message

9.  DELETE 刪除產品 (接受批次處理) => /api/admin/products/:id

    - (200):true - 已刪除產品
    - (200):false - 超過批量刪除上限
    - (200):false - 找不到產品
    - (500):false - error.message

---

10. POST 新增優惠卷 => /api/admin/coupons

    - (200):true - 已新增優惠卷
    - (200):false - 重複代碼
    - (500):false - error.message

11. GET 取得優惠卷列表 => /api/admin/coupons

    - (200):true - { coupons }
    - (500):false - error.message

12. PATCH 修改優惠卷 => /api/admin/coupons/:id

    - (200):true - 已修改優惠卷
    - (200):false - 找不到優惠卷
    - (500):false - error.message

13. PATCH 修改優惠卷啟用狀態 (接受批次處理) => /api/admin/coupons/:id/is_enabled

    - (200):true - 已修改狀態
    - (200):false - 超過批量修改上限
    - (200):false - 找不到優惠卷
    - (500):false - error.message

14. DELETE 刪除優惠卷 (接受批次處理) => /api/admin/coupons/:id

    - (200):true - 已刪除優惠卷
    - (200):false - 超過批量刪除上限
    - (200):false - 找不到優惠卷
    - (500):false - error.message

---

15. GET 取得訂單列表 (同時檢查訂單狀態) => /api/admin/orders

    - (200):true - { orders }
    - (500):false - error.message

16. PATCH 訂單出貨 (toship -> shipping) => /api/admin/orders/:uid/:id/ship

    - (200):true - 訂單已出貨
    - (200):false -找不到訂單
    - (200):false - 操作異常
    - (500):false - error.message

---

17. POST 上傳圖片 => /api/admin/upload

    - (200):true - { imgUrl }
    - (200):false - 欄位輸入不正確
    - (200):false - 不支援的檔案格式
    - (200):false - 超過圖片限制大小
    - (500):false - error.message

---

18. GET 取得產品列表 => /api/products

    - (200):true - { products }
    - (500):false - error.message

19. GET 取得單一產品細節 => /api/products/:id

    - (200):true - { product }
    - (200):false - 找不到產品
    - (200):flase - 產品未啟用
    - (500):false - error.message

---

20. POST 用戶註冊 => /api/user/signup

    - (200):true - 註冊成功
    - (200):false - 無效電子郵件
    - (200):false - 已存在用戶
    - (200):false - 密碼強度不夠
    - (500):false - error.message

21. POST 用戶登入 => /api/user/signin

    - (200):true - { user }
    - (200):false - 無效電子郵件
    - (200):false - 帳號或密碼錯誤 ~ 3
    - (500):false - error.message

22. POST 用戶登出 => /api/user/signout

    - (200):true - 已登出

23. POST 檢查用戶是否持續登入 => /api/user/check

    - (200):true - interval < 10 ? 刷新 : 不刷新
    - (200):false - 未帶有訪問令牌
    - (200):false - 無效的訪問令牌

24. POST 密碼重置 => /api/user/reset

    - (200):true - 發送成功
    - (200):false - 無效電子郵件
    - (200):false - 找不到用戶

---

25. POST 產品加入購物車 => /api/user/cart

    - (200):true - 已加入購物車
    - (200):false - 找不到產品
    - (200):false - 產品未啟用
    - (200):false - 庫存不足 ~ 2
    - (500):false - error.message

26. GET 取得購物車產品列表 => /api/user/cart

    - (200):true - { cart }
    - (200):true - { cart } (x 樣商品遭下架或被移除)
    - (500):false - error.message

27. PATCH 修改購物車產品購買數量 => /api/user/cart/:id

    - (200):true - 已修改產品購買數量
    - (200):false - 找不到產品
    - (200):false - 庫存不足
    - (500):false - error.message

28. DELETE 刪除購物車產品 (接受批次處理) => /api/user/cart/:id

    - (200):true - 已刪除購物車產品
    - (200):false - 超過批量刪除上限
    - (200):false - 找不到產品
    - (500):false - error.message

29. DELETE 清空購物車 => /api/user/cart

    - (200):true - 已清空購物車
    - (500):false - error.message

---

30. POST 套用優惠卷 => /api/user/coupon

    - (200):true - 已套用優惠卷
    - (200):false - 找不到優惠卷
    - (200):false - 優惠卷未啟用
    - (200):false - 優惠卷尚未生效
    - (200):false - 優惠卷已過期
    - (200):false - 禁止購物車為空
    - (500):false - error.message

---

31. POST 建立訂單 (unpaid 狀態) => /api/user/orders

    - (200):true - 已建立訂單
    - (200):false - 留言欄位為必填
    - (200):false - 購買人資料為必填
    - (200):false - 禁止購物車為空
    - (200):false - 部分商品庫存不足
    - (200):false - x 樣商品遭下架或移除
    - (500):false - error.message

32. PATCH 取消訂單 (模擬 unpaid -> cancelled) => /api/user/orders/:id/cancel

    - (200):true - 已取消訂單
    - (200):false - 找不到訂單
    - (200):false - 操作異常
    - (500):false - error.message

33. PATCH 完成訂單 (模擬 arrived -> completed) => /api/user/orders/:id/complete

    - (200):true - 已完成訂單
    - (200):false - 找不到訂單
    - (200):false - 操作異常
    - (500):false - error.message

34. GET 取得訂單列表 (同時檢查訂單狀態) => /api/user/orders

    - (200):true - { orders }
    - (500):false - error.message

35. GET 取得某一筆訂單 => /api/user/orders/:id

    - (200):true - { order }
    - (200):false - 找不到訂單
    - (500):false - error.messahe

---

36. POST 結帳付款 (模擬 unpaid -> toship) => /api/user/pay/:id

    - (200):true - 已完成結帳
    - (200):false - 找不到訂單
    - (200):false - 操作異常
    - (500):false - error.message
