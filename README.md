# LINE連携チャットシステム(webhookサーバー)
## 概要
集客活動で活用されるチャットアプリの開発。従来のLINEを使用した方法では、アカウントが凍結されるなどの課題があったため、独自のチャットシステムを構築。

## 機能
- webhookイベント検知
- ユーザー保存
- LINEにメッセージ送信
- アカウント保存

## 技術スタック
- **言語**: Node.js
- **パッケージ管理**: npm

### クラウドインフラ
- **サーバーホスティング**: AWS EC2
- **モニタリング**: AWS CloudWatch
- **ネットワーク**: AWS Route 53 (DNS管理)
- **負荷分散**: AWS Elastic Load Balancer (ELB)
- **固定IP**: AWS Elastic IP (EIP)
---

## サーバー環境

(EC2)
- chat-bot-loadbalancer1
- chat-bot-loadbalancer2

(ELB)
- chat-bot

(キー名)
- chat-bot-loadbalancer
  
(ドメイン)
- chat-bot.me

> [!IMPORTANT]
>キーの場所: `\\192.168.100.101\kyoyu\61.システム開発\Line連携チャットシステム\AWS KEY(本番)`
---

## 必要条件
- Node.js & NPM

---

## インストール
### 1. リポジトリのクローン:
任意のディレクトリに移動し、リポジトリをクローンし、vsCodeで開く
```bash
git@github.com:If-you-give-up-then-it-all-ends-here/line_bot.git
```
```bash
cd line_bot
```

### 2. .envファイルの設定
.envファイルをルート直下に作成する
> [!IMPORTANT]
> envファイルの場所: `\\192.168.100.101\kyoyu\61.システム開発\Line連携チャットシステム\env\LINE-chat-app`

### 3. 依存関係のインストール:

必要なライブラリなどのインストール
```bash
npm install
```

> [!IMPORTANT]
> 本番のサーバーでpm2のインストールを行ってください
```bash
npm install -g pm2
```
---

### 5. サーバー起動
すべてセットアップ出来たら、開発サーバーを起動する
```bash
pm2 start index.js
```

---

### 6. ドメイン変更した場合
(1). `.env`の変更
```bash
DECRYPT_URL=https://chat-manager.info/api/decrypt //チャット管理画面URL
SYSTEM_URL=https://chat-system.info/chat/ //チャット画面URL
SOCKET_URL=https://chat-socket.info:3000　//　チャットソケットURL
```

---

### 7. その他重要事項
#### a. envファイルの切り替え
本番環境と開発環境で、`.env`ファイルの中身の切り替えを行ってください




