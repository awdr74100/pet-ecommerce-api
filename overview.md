1. POST 管理員註冊 => /api/admin/signup

- (200):true - 註冊成功
- (200):false - 無效電子郵件
- (200):false - 已存在用戶
- (200):false - 密碼強度不夠
- (500):false - error.message

2. POST 管理員登入 => /api/admin/login

- (200):true - { 管理員資料 }
- (200):false - 無效電子郵件
- (200):false - 帳號或密碼錯誤
- (500):false - error.message

3. POST 管理員登出 => /api/admin/logout

- (200):true - 已登出

4. POST 檢查用戶是否持續登入 => /api/admin/check

- (200):true - interval > 5 ? 刷新 : 不刷新
- (200):false - 未帶有訪問令牌
- (200):false - 無效的訪問令牌

---

5. POST 新增產品 => /api/admin/products

- (200):true - 產品新增成功
- (500):false - error.message

6. GET 取得產品列表 => /api/admin/products

- (200):true - { 所有產品 }
- (500):false - error.message

7. PATCH 修改指定產品 => /api/admin/products/:id

- (200):true - 產品修改成功
- (200):false - 找不到產品
- (500):false - error.message

8. DELETE 刪除指定產品 => /api/admin/products/:id

- (200):true - 產品刪除成功
- (200):false - 找不到產品
- (500):false - error.message

---

9. POST 新增優惠卷 => /api/admin/coupons

- (200):true - 優惠卷新增成功
- (500):false - error.message

10. GET 取得優惠卷列表 => /api/admin/coupons

- (200):true - { 所有優惠卷 }
- (500):false - error.message

11. PATCH 修改指定優惠卷 => /api/admin/coupons/:id

- (200):true - 優惠卷修改成功
- (200):false - 找不到優惠卷
- (500):false - error.message

12. DELETE 刪除指定優惠卷 => /api/admin/coupons/:id

- (200):true - 優惠卷刪除成功
- (200):false - 找不到優惠卷
- (500):false - error.message
