# Research & Design Decisions

## Summary
- **Feature**: `accesstoken-sample`
- **Discovery Scope**: New Feature / Complex Integration
- **Key Findings**:
  - Honoには公式JWT middlewareが存在し、TypeScript完全サポートあり
  - トークン保存のベストプラクティス: Access Token→メモリ、Refresh Token→HttpOnly Cookie
  - JWTライブラリは`jose`が2026年推奨（ESM、軽量、Web標準準拠）
  - React認証はContext API + Protected Routesパターンが標準

## Research Log

### Hono JWT認証実装パターン

- **Context**: バックエンドAPIでJWT認証を実装する方法を調査
- **Sources Consulted**:
  - [JWT Auth Middleware - Hono](https://hono.dev/docs/middleware/builtin/jwt)
  - [JWT Authentication Helper - Hono](https://hono.dev/docs/helpers/jwt)
  - [hono/src/middleware/jwt/jwt.ts](https://github.com/honojs/hono/blob/main/src/middleware/jwt/jwt.ts)
- **Findings**:
  - Honoには公式の`jwt()`ミドルウェアが提供されている
  - ヘルパー関数: `sign()`, `verify()`, `decode()`
  - サポートアルゴリズム: HS256, HS384, HS512, RS256, RS384, RS512, PS256, PS384, PS512, ES256, ES384, ES512, EdDSA
  - デフォルトはHS256
  - Cookieからのトークン取得もサポート
  - ペイロード検証: exp (有効期限), nbf (開始時刻), iat (発行時刻), iss (発行者)
  - TypeScript完全サポート
- **Implications**:
  - Honoの公式middlewareを使用することで実装が簡潔になる
  - 学習用途のため、シンプルなHS256アルゴリズムを採用
  - ヘルパー関数で署名・検証ロジックを統一

### React認証パターンとトークン管理

- **Context**: フロントエンドでの認証状態管理とトークン処理方法を調査
- **Sources Consulted**:
  - [Building Secure Authentication in React](https://medium.com/@sandeepkemidi1602/building-secure-authentication-and-authorization-in-react-best-practices-and-example-code-e730c99870eb)
  - [React User Authentication - SuperTokens](https://supertokens.com/blog/react-user-authentication)
  - [The Complete Guide to React User Authentication - Auth0](https://auth0.com/blog/complete-guide-to-react-user-authentication/)
  - [React Authentication: Best Practices Using HOC](https://dev.to/amangupta/react-authentication-best-practices-for-handling-token-securely-using-hoc-2ll0)
- **Findings**:
  - Context APIで認証ロジックを集中管理する
  - Protected Routesパターンで未認証アクセスを制御
  - トークンの有効期限チェックとリフレッシュメカニズムが必須
  - カスタムフックで認証ロジックを再利用可能にする
  - HTTPSの使用が前提
  - MFA（多要素認証）は学習用途では不要
- **Implications**:
  - `AuthContext`でトークン状態とログイン/ログアウト関数を管理
  - `useAuth`カスタムフックで認証状態にアクセス
  - React Router v6のProtected Route実装

### JWT トークン保存セキュリティ

- **Context**: Access TokenとRefresh Tokenの安全な保存方法を調査
- **Sources Consulted**:
  - [JWT Storage in React: Local Storage vs Cookies](https://cybersierra.co/blog/react-jwt-storage-guide/)
  - [Understanding Token Storage: Local Storage vs HttpOnly Cookies](https://www.wisp.blog/blog/understanding-token-storage-local-storage-vs-httponly-cookies)
  - [LocalStorage vs Cookies: Securely Store Session Tokens](https://www.pivotpointsecurity.com/local-storage-versus-cookies-which-to-use-to-securely-store-session-tokens/)
  - [The Developer's Guide to JWT Storage](https://www.descope.com/blog/post/developer-guide-jwt-storage)
- **Findings**:
  - **ベストプラクティス（2026）**: Access Token→メモリ（React state）、Refresh Token→HttpOnly Cookie
  - **localStorage**: XSS攻撃に脆弱、JavaScriptから読み取り可能
  - **HttpOnly Cookie**: JavaScriptからアクセス不可、XSS耐性あり、CSRF対策が必要（`sameSite`フラグ使用）
  - **メモリストレージ**: ページリフレッシュ時に消失するが、リフレッシュトークンで再取得可能
  - OWASPコミュニティはCookie使用を推奨
- **Implications**:
  - Access Tokenは短命（15分）でReact stateに保存
  - Refresh Tokenは長命（7日）でHttpOnly Cookieに保存
  - ページロード時にリフレッシュエンドポイントを自動呼び出し
  - CSRF対策として`sameSite: 'strict'`を設定

### TypeScript JWT ライブラリ選定

- **Context**: TypeScriptプロジェクトに適したJWTライブラリを調査
- **Sources Consulted**:
  - [panva/jose - GitHub](https://github.com/panva/jose)
  - [Jose vs Jsonwebtoken - Medium](https://joodi.medium.com/jose-vs-jsonwebtoken-why-you-should-switch-4f50dfa3554c)
  - [JWT Libraries Comparison](https://npm-compare.com/express-jwt,jose,jsonwebtoken,jwa,passport-jwt)
  - [jose - npm](https://www.npmjs.com/package/jose)
- **Findings**:
  - **jose**: モダン、ESM、依存ゼロ、Tree-shakeable、Web標準準拠、複数ランタイム対応（Node.js, Deno, Bun, Cloudflare Workers, Browser）
  - **jsonwebtoken**: レガシー、コールバックベース、大規模コミュニティ、標準JWT機能のみ
  - 2026年の推奨: **jose**（新規プロジェクトに最適）
  - joseはJWT, JWS, JWE, JWK, JWKSをサポート
  - joseは拡張性が高く、カスタムアルゴリズムも実装可能
- **Implications**:
  - バックエンド（Hono）では`jose`ライブラリを採用
  - フロントエンド（React）でもJWTデコード用に`jose`を使用
  - TypeScript型定義が完備され、型安全性を確保

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Layered Architecture | フロント/バックを完全分離、各層で責務を明確化 | シンプル、学習しやすい、モノレポ構成と相性良好 | スケーラビリティには限界あり | 学習用途に最適、既存構成と一致 |
| Hexagonal (Ports & Adapters) | ドメインロジックを中心に据え、外部との接続をアダプタ化 | テスタビリティ高い、ドメイン独立性 | 学習用途には過剰、実装コスト高 | 将来的な拡張時に検討 |
| Serverless / Edge | CloudflareやVercelなどのEdge環境での実行 | グローバル配信、低レイテンシ | ローカル学習環境には不適 | 本プロジェクトでは不要 |

## Design Decisions

### Decision: トークン保存戦略

- **Context**: Access TokenとRefresh Tokenの保存場所を決定
- **Alternatives Considered**:
  1. 両トークンをlocalStorageに保存 — 実装簡単だがXSS脆弱
  2. 両トークンをHttpOnly Cookieに保存 — 安全だがJavaScriptからアクセス不可
  3. Access Token→メモリ、Refresh Token→HttpOnly Cookie — ハイブリッドアプローチ
- **Selected Approach**: Access Token→React state、Refresh Token→HttpOnly Cookie
- **Rationale**:
  - Access Tokenは短命なのでメモリ保存でも問題なし
  - Refresh Tokenは長命なのでHttpOnly Cookieで安全に保存
  - XSS攻撃時もRefresh Tokenは保護される
  - 学習者がトークンのライフサイクルを理解しやすい
- **Trade-offs**:
  - **Benefits**: 高セキュリティ、XSS/CSRF両方への耐性、業界標準パターン
  - **Compromises**: ページリフレッシュ時に再取得ロジックが必要、実装複雑度やや高
- **Follow-up**: リフレッシュエンドポイント実装、CSRF対策の検証

### Decision: JWTライブラリ選定

- **Context**: TypeScriptプロジェクトに適したJWTライブラリを選定
- **Alternatives Considered**:
  1. jsonwebtoken — 実績豊富、大規模コミュニティ
  2. jose — モダン、ESM、軽量、Web標準
  3. Hono組み込みヘルパー — シンプルだが機能限定
- **Selected Approach**: `jose`を採用
- **Rationale**:
  - ESMモジュールで既存スタックと一致
  - 依存ゼロで軽量
  - TypeScript型定義が完備
  - 2026年の推奨ライブラリ
  - 複数ランタイム対応（将来的な拡張に有利）
- **Trade-offs**:
  - **Benefits**: モダン、軽量、型安全、拡張性高
  - **Compromises**: jsonwebtokenより小規模コミュニティ
- **Follow-up**: Honoでのjose統合、署名アルゴリズム選定（HS256）

### Decision: React認証状態管理

- **Context**: フロントエンドでの認証状態とトークン管理方法を決定
- **Alternatives Considered**:
  1. Redux/Zustand などの状態管理ライブラリ — 強力だが学習コスト高
  2. React Context API — シンプル、React標準
  3. ローカル状態のみ — 再利用性低い
- **Selected Approach**: React Context API + カスタムフック
- **Rationale**:
  - React標準機能で追加依存なし
  - 学習用途に適したシンプルさ
  - 認証ロジックを集中管理可能
  - カスタムフック(`useAuth`)で再利用性確保
- **Trade-offs**:
  - **Benefits**: シンプル、追加依存なし、学習しやすい
  - **Compromises**: 大規模アプリには不向き（本プロジェクトでは問題なし）
- **Follow-up**: AuthProviderの設計、Protected Routeパターン実装

### Decision: バックエンド認証アーキテクチャ

- **Context**: Honoでのミドルウェアとエンドポイント構成を決定
- **Alternatives Considered**:
  1. カスタムJWT実装 — 学習には良いが車輪の再発明
  2. Hono公式JWT middleware — 公式サポート、保守性高
  3. 外部認証サービス（Auth0, Supabase） — 学習用途には過剰
- **Selected Approach**: Hono公式JWT middleware + joseヘルパー
- **Rationale**:
  - Hono公式middlewareで検証ロジック統一
  - joseで署名・検証の詳細制御
  - TypeScript型安全性確保
  - 学習者がミドルウェアパターンを理解できる
- **Trade-offs**:
  - **Benefits**: 公式サポート、型安全、保守性高
  - **Compromises**: カスタム実装より柔軟性低（学習用途では問題なし）
- **Follow-up**: ミドルウェア適用順序、エラーハンドリング

## Risks & Mitigations

- **リスク1: XSS攻撃によるトークン漏洩** — 緩和策: HttpOnly CookieでRefresh Token保護、CSP (Content Security Policy) 設定
- **リスク2: CSRF攻撃** — 緩和策: `sameSite: 'strict'`フラグ設定、必要に応じてCSRFトークン実装
- **リスク3: トークン有効期限切れ時のUX低下** — 緩和策: 自動リフレッシュメカニズム、エラーハンドリング明確化
- **リスク4: ページリフレッシュ時の認証状態喪失** — 緩和策: アプリ起動時にリフレッシュエンドポイント自動呼び出し
- **リスク5: JWT署名鍵の漏洩** — 緩和策: 環境変数で鍵管理、.gitignore設定、学習用途でもベストプラクティス適用

## References

- [JWT Auth Middleware - Hono](https://hono.dev/docs/middleware/builtin/jwt)
- [JWT Authentication Helper - Hono](https://hono.dev/docs/helpers/jwt)
- [Building Secure Authentication in React](https://medium.com/@sandeepkemidi1602/building-secure-authentication-and-authorization-in-react-best-practices-and-example-code-e730c99870eb)
- [JWT Storage in React: Local Storage vs Cookies](https://cybersierra.co/blog/react-jwt-storage-guide/)
- [Understanding Token Storage: Local Storage vs HttpOnly Cookies](https://www.wisp.blog/blog/understanding-token-storage-local-storage-vs-httponly-cookies)
- [panva/jose - GitHub](https://github.com/panva/jose)
- [Jose vs Jsonwebtoken - Medium](https://joodi.medium.com/jose-vs-jsonwebtoken-why-you-should-switch-4f50dfa3554c)
- [React User Authentication - SuperTokens](https://supertokens.com/blog/react-user-authentication)
- [The Developer's Guide to JWT Storage](https://www.descope.com/blog/post/developer-guide-jwt-storage)
