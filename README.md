# Pet eCommerce 電商網站 API

## 更新日誌

- 2020/10/04：修復 Chrome 80+ 針對跨域 Cookie 的規則調整 (SameSite 必須從 Lax 改為 None 同時加上 Secure 屬性)

## 環境建置

- [Node.js](https://nodejs.org/en/)
- [Firebase](https://firebase.google.com/)

## 環境參數

```plain
FIREBASE_TYPE =
FIREBASE_PROJECT_ID =
FIREBASE_PRIVATE_KEY_ID =
FIREBASE_PRIVATE_KEY =
FIREBASE_CLIENT_EMAIL =
FIREBASE_CLIENT_ID =
FIREBASE_AUTH_URL =
FIREBASE_TOKEN_URL =
FIREBASE_AUTH_PROVIDER_X509_CERT_URL =
FIREBASE_CLIENT_X509_CERT_URL =
FIREBASE_DATABASEURL =

JWT_SECRET =

FIREBASE_APIKEY =
FIREBASE_AUTHDOMAIN =
FIREBASE_STORAGEBUCKET =
FIREBASE_MESSAGINGSENDERID =
FIREBASE_APPID =

NODE_ENV =
```

## 安裝流程

Clone 專案

```bash
git clone git@github.com:awdr74100/pet-ecommerce-api.git
```

安裝 npm 套件

```bash
npm install
```

設定環境參數

> 在 development 環境下，Access-Control-Allow-Origin 將反映請求的來源

```plain
NODE_ENV = development
```

啟動 server

```bash
npm run start
```

## API 文件

移至 [Wiki](https://github.com/awdr74100/pet-ecommerce-api/wiki)
