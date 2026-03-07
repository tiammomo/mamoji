# SSL/TLS 配置指南

## 生成自签名证书（开发环境）

```bash
# 生成 PKCS12 格式证书
keytool -genkeypair \
  -alias mamoji \
  -keyalg RSA \
  -keysize 2048 \
  -storetype PKCS12 \
  -keystore mamoji.p12 \
  -validity 365 \
  -storepass changeit \
  -keypass changeit \
  -dname "CN=localhost, OU=Dev, O=Mamoji, L=City, ST=State, C=CN"

# 导出为 PEM 格式（Nginx/代理使用）
openssl pkcs12 -in mamoji.p12 -nokeys -out mamoji.crt
openssl pkcs12 -in mamoji.p12 -nocerts -out mamoji.key
```

## 配置环境变量

```bash
# 启用 SSL
SERVER_SSL_ENABLED=true

# 证书配置
SERVER_SSL_KEYSTORE=classpath:mamoji.p12
SERVER_SSL_KEYSTORE_PASSWORD=changeit
SERVER_SSL_KEYSTORE_TYPE=PKCS12
SERVER_SSL_KEY_ALIAS=mamoji
```

## 使用 Nginx 反向代理（推荐）

```nginx
server {
    listen 443 ssl http2;
    server_name mamoji.example.com;

    ssl_certificate /path/to/mamoji.crt;
    ssl_certificate_key /path/to/mamoji.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    location / {
        proxy_pass http://backend:38080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Let's Encrypt 免费证书（生产环境）

```bash
# 使用 certbot
sudo certbot --nginx -d mamoji.example.com

# 自动续期
sudo certbot renew --dry-run
```
