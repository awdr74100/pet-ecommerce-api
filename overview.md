1. 管理員註冊 => /admin/signup

- (200):true - 註冊成功
- (200):false - 無效電子郵件
- (200):false - 已存在用戶
- (200):false - 密碼強度不夠
- (500):false - error.message

2. 管理員登入 => /admin/login

- (200):true - {{account}}
- (200):false - 無效電子郵件
- (200):false - 帳號或密碼錯誤
- (500):false - error.message

3. 管理員登出 => /admin/logout

- (200):true - 已登出

4. 檢查用戶是否持續登入 => /admin/check

- (200):true - interval > 5 ? 刷新 : 不刷新
- (200):false - 未帶有訪問令牌
- (200):false - 無效的訪問令牌

---
