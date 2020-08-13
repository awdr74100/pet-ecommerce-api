1. POST 管理員註冊 => /api/admin/signup

- (200):true - 註冊成功
- (200):false - 無效電子郵件
- (200):false - 已存在用戶
- (200):false - 密碼強度不夠
- (500):false - error.message

2. POST 管理員登入 => /api/admin/signin

- (200):true - {{ admin }}
- (200):false - 無效電子郵件
- (200):false - 帳號或密碼錯誤 / 3
- (500):false - error.message

3. POST 管理員登出 => /api/admin/signout

- (200):true - 已登出

4. POST 檢查管理員是否持續登入 => /api/admin/check

- (200):true - interval < 5 ? 刷新 : 不刷新
- (200):false - 未帶有訪問令牌
- (200):false - 無效的訪問令牌

---

5. POST 新增產品 => /api/admin/products

- (200):true - 已新增產品
- (500):false - error.message

6. GET 取得產品列表 => /api/admin/products

- (200):true - { products }
- (500):false - error.message

7. PATCH 修改產品 => /api/admin/products/:id

- (200):true - 已修改產品
- (200):false - 找不到產品
- (500):false - error.message

8. DELETE 刪除產品 => /api/admin/products/:id

- (200):true - 已刪除產品
- (200):false - 找不到產品
- (500):false - error.message

---

9. POST 新增優惠卷 => /api/admin/coupons

- (200):true - 已新增優惠卷
- (200):false - 重複代碼
- (500):false - error.message

10. GET 取得優惠卷列表 => /api/admin/coupons

- (200):true - { coupons }
- (500):false - error.message

11. PATCH 修改優惠卷 => /api/admin/coupons/:id

- (200):true - 已修改優惠卷
- (200):false - 找不到優惠卷
- (500):false - error.message

12. DELETE 刪除優惠卷 => /api/admin/coupons/:id

- (200):true - 已刪除優惠卷
- (200):false - 找不到優惠卷
- (500):false - error.message

---

13. GET 取得訂單列表 => /api/admin/orders

- (200):true - { orders }
- (500):false - error.message

---

14. POST 上傳圖片 => /api/admin/upload

- (200):true - { 圖片網址 }
- (200):false - 欄位輸入不正確
- (200):false - 不支援的檔案格式
- (200):false - 超過圖片限制大小
- (500):false - error.message

---

15. GET 取得產品列表 => /api/products

- (200):truw - { products }
- (500):false - error.message

16. GET 取得單一產品細節 => /api/products/:id

- (200):true - { product }
- (200):false - 找不到產品
- (200):flase - 產品未啟用
- (500):false - error.message

---

17. POST 用戶註冊 => /api/user/signup

- (200):true - 註冊成功
- (200):false - 無效電子郵件
- (200):false - 已存在用戶
- (200):false - 密碼強度不夠
- (500):false - error.message

18. POST 用戶登入 => /api/user/signin

- (200):true - { user }
- (200):false - 無效電子郵件
- (200):false - 帳號或密碼錯誤 / 3
- (500):false - error.message

19. POST 用戶登出 => /api/user/signout

- (200):true - 已登出

20. POST 檢查用戶是否持續登入 => /api/user/check

- (200):true - interval < 5 ? 刷新 : 不刷新
- (200):false - 未帶有訪問令牌
- (200):false - 無效的訪問令牌

---

21. POST 產品加入購物車 => /api/user/cart

- (200):true - 已加入購物車
- (200):false - 找不到產品
- (200):false - 產品未啟用
- (200):false - 庫存不足 / 2
- (500):false - error.message

22. GET 取得購物車產品列表 => /api/user/cart

- (200):true - { cart }
- (500):false - error.message

23. PATCH 修改購物車產品購買數量 => /api/user/cart/:id

- (200):true - 已修改產品購買數量
- (200):false - 找不到產品
- (200):false - 庫存不足
- (500):false - error.message

24. DELETE 刪除購物車產品 => /api/user/cart/:id

- (200):true - 已刪除購物車產品
- (200):false - 找不到產品
- (500):false - error.message

25. DELETE 清空購物車 => /api/user/cart

- (200):true - 已清空購物車
- (500):false - error.message

---

26. POST 套用優惠卷 => /api/user/coupon

- (200):true - 已套用優惠卷
- (200):false - 找不到優惠卷
- (200):false - 優惠卷未啟用
- (200):false - 優惠卷已過期
- (500):false - error.message

---

27. POST 建立訂單 => /api/user/order

- (200):true - 已建立訂單
- (200):false - 購物車目前為空
- (200):false - 留言欄位為必填
- (200):false - 購買人資料為必填
- (500):false - error.message

28. GET 取得訂單列表 => /api/user/order

- (200):true - { orders }
- (500):false - error.message

29. GET 取得某一筆訂單 => /api/user/order/:id

- (200):true - { order }
- (200):true - 找不到訂單
- (500):false - error.messahe

---

30. POST 結帳付款 => /api/user/pay/:id

- (200):true - 付款完成
- (200):false - 找不到訂單
- (500):false - error.message
