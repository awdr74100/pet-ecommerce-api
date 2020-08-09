1. POST 管理員註冊 => /api/admin/signup

- (200):true - 註冊成功
- (200):false - 無效電子郵件
- (200):false - 已存在用戶
- (200):false - 密碼強度不夠
- (500):false - error.message

2. POST 管理員登入 => /api/admin/login

- (200):true - {{ admin }}
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

13. POST 上傳圖片 => /api/admin/upload

- (200):true - { 圖片網址 }
- (200):false - 欄位輸入不正確
- (200):false - 不支援的檔案格式
- (200):false - 超過圖片限制大小
- (500):false - error.message

14. GET 取得產品列表 => /api/products

- (200):truw - { products }
- (500):false - error.message

15. GET 取得指定產品 => /api/products/:id

- (200):true - { product }
- (200):false - 找不到產品
- (200):flase - 產品未啟用
- (500):false - error.message