# accesstoken-sample

React + Honoで開発するアクセストークン、リフレッシュトークン学習用のプロジェクト

## 概要

アクセストークン、リフレッシュトークンの仕組みを学習するためのサンプルプロジェクトです。

フロントエンドはReact + Vite、バックエンドは Honoで構築しています。

## システム概要

- 目的: アクセストークン/リフレッシュトークンの仕組みを学習するためのサンプル
- フロントエンド: React + Vite + TypeScript
- バックエンド: Hono + Node.js + TypeScript
- 認証方式: Access Tokenはレスポンスで返却、Refresh TokenはHttpOnly Cookieで保持

## 機能一覧

1. ログイン（/auth/login）
2. アクセストークンのリフレッシュ（/auth/refresh）
3. 保護リソース取得（/api/protected）
4. 401時の自動リトライ（フロントのAPIクライアント）
5. 認可ガードとルーティング（ProtectedRoute/App）
6. トークンデバッグ表示（TokenDebugPanel, devのみ）

## 処理シーケンス図

### ログイン

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as Frontend(LoginForm)
  participant AuthCtx as AuthContext
  participant API as Backend(/auth/login)
  participant AuthSvc as AuthService

  User->>UI: ユーザー名/パスワード送信
  UI->>AuthCtx: login(username, password)
  AuthCtx->>API: POST /auth/login (credentials: include)
  API->>AuthSvc: 認証/トークン発行
  AuthSvc-->>API: accessToken + refreshToken
  API-->>AuthCtx: accessToken + user (refreshTokenはCookie)
  AuthCtx->>AuthCtx: accessToken/user をstate保存
  AuthCtx-->>UI: ログイン完了
```

### アクセストークンのリフレッシュ

```mermaid
sequenceDiagram
  autonumber
  participant AuthCtx as AuthContext
  participant API as Backend(/auth/refresh)
  participant AuthSvc as AuthService
  participant Cookie as Browser Cookie

  AuthCtx->>API: POST /auth/refresh (Cookie送信)
  Cookie-->>API: refreshToken
  API->>AuthSvc: refresh(refreshToken)
  AuthSvc-->>API: 新しいaccessToken
  API-->>AuthCtx: accessToken
  AuthCtx->>AuthCtx: JWTデコードしてuser更新
```

### 保護リソース取得

```mermaid
sequenceDiagram
  autonumber
  participant UI as Frontend(ProtectedPage)
  participant ApiClient as createApiClient
  participant API as Backend(/api/protected)
  participant AuthMW as authMiddleware
  participant AuthSvc as AuthService

  UI->>ApiClient: GET /api/protected
  ApiClient->>API: Authorization: Bearer accessToken
  API->>AuthMW: トークン検証
  AuthMW->>AuthSvc: verifyAccessToken(token)
  AuthSvc-->>AuthMW: payload(user)
  AuthMW-->>API: next()
  API-->>ApiClient: Protected data
  ApiClient-->>UI: data表示
```

### 401時の自動リトライ

```mermaid
sequenceDiagram
  autonumber
  participant UI as Frontend(ProtectedPage)
  participant ApiClient as createApiClient
  participant AuthCtx as AuthContext
  participant API as Backend

  UI->>ApiClient: GET /api/protected
  ApiClient->>API: Authorization: Bearer expired
  API-->>ApiClient: 401
  ApiClient->>AuthCtx: refresh()
  AuthCtx->>API: POST /auth/refresh (Cookie送信)
  API-->>AuthCtx: new accessToken
  AuthCtx-->>ApiClient: refresh完了
  ApiClient->>API: GET /api/protected (再試行)
  API-->>ApiClient: 200 data
  ApiClient-->>UI: data表示
```

### 認可ガードとルーティング

```mermaid
sequenceDiagram
  autonumber
  participant Router as App Routes
  participant Guard as ProtectedRoute
  participant AuthCtx as AuthContext
  participant UI as ProtectedPage
  participant Login as LoginForm

  Router->>Guard: /protected へ遷移
  Guard->>AuthCtx: isAuthenticated?
  alt 認証済み
    Guard-->>UI: ProtectedPage表示
  else 未認証
    Guard-->>Login: /loginへリダイレクト
  end
```

### トークンデバッグ表示（devのみ）

```mermaid
sequenceDiagram
  autonumber
  participant UI as ProtectedPage
  participant Panel as TokenDebugPanel
  participant AuthCtx as AuthContext
  participant JWT as JWT Decoder (jose)

  UI->>Panel: debugMode=true で描画
  Panel->>AuthCtx: accessToken取得
  alt accessTokenあり
    Panel->>JWT: decodeJwt(accessToken)
    JWT-->>Panel: payload/exp
    Panel-->>UI: 期限・payload表示
  else なし
    Panel-->>UI: 何も表示しない
  end
```

### ログイン失敗（認証エラー）

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as Frontend(LoginForm)
  participant AuthCtx as AuthContext
  participant API as Backend(/auth/login)
  participant AuthSvc as AuthService
  participant Err as ErrorHandler

  User->>UI: ユーザー名/パスワード送信
  UI->>AuthCtx: login(username, password)
  AuthCtx->>API: POST /auth/login
  API->>AuthSvc: 認証
  AuthSvc-->>API: AuthenticationError
  API->>Err: onError
  Err-->>AuthCtx: 401 + error
  AuthCtx-->>UI: 例外
  UI-->>User: ログインに失敗しました
```

### リフレッシュ失敗（トークン不正/期限切れ）

```mermaid
sequenceDiagram
  autonumber
  participant ApiClient as createApiClient
  participant AuthCtx as AuthContext
  participant API as Backend(/auth/refresh)
  participant AuthSvc as AuthService
  participant Err as ErrorHandler

  ApiClient->>AuthCtx: refresh()
  AuthCtx->>API: POST /auth/refresh (Cookie送信)
  API->>AuthSvc: refresh(refreshToken)
  AuthSvc-->>API: TokenExpiredError / InvalidTokenError
  API->>Err: onError
  Err-->>AuthCtx: 401 + error
  AuthCtx->>AuthCtx: accessToken/user を破棄
  AuthCtx-->>ApiClient: 例外
```

### 保護リソース取得失敗（Authorizationヘッダ不正）

```mermaid
sequenceDiagram
  autonumber
  participant UI as Frontend(ProtectedPage)
  participant ApiClient as createApiClient
  participant API as Backend(/api/protected)
  participant AuthMW as authMiddleware

  UI->>ApiClient: GET /api/protected
  ApiClient->>API: Authorization: (なし/不正)
  API->>AuthMW: header検証
  AuthMW-->>API: 401 error
  API-->>ApiClient: 401
  ApiClient-->>UI: 例外
  UI-->>UI: データの取得に失敗しました
```

## 動かし方

### インストール

```bash
pnpm i
```

### フロントエンドの起動

```bash
pnpm frontend dev
```

### バックエンドサーバーの起動

```bash
pnpm backend dev
```

アクセストークンの検証に成功した時のログ

```bash
Verified access token payload: {
  sub: 'user-demo-001',
  username: 'demo',
  iat: 1768794320,
  exp: 1768795220
}
```

## 参考文献
- [JWT Decorder](https://www.jwt.io/ja)
