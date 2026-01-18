# Requirements Document

## Project Description (Input)
accesstoken-sample-app

## Introduction

本プロジェクトは、アクセストークンとリフレッシュトークンの仕組みを学習するための教育用サンプルアプリケーションです。React + Viteによるフロントエンドと、HonoによるバックエンドAPIを分離したモノレポ構成で、認証トークンの基本的な動作フローを実装します。

学習者が認証の流れを理解し、実際に手を動かして挙動を確認できる最小構成を目指します。

## Requirements

### Requirement 1: ユーザー認証機能

**Objective:** As a 学習者, I want ユーザー名とパスワードによる認証を実行できる, so that アクセストークンとリフレッシュトークンの発行プロセスを理解できる

#### Acceptance Criteria

1. The Backend API shall ログインエンドポイント (`/auth/login`) を提供する
2. When ユーザーが有効な認証情報を送信した, the Backend API shall アクセストークンとリフレッシュトークンを発行する
3. When ユーザーが無効な認証情報を送信した, then the Backend API shall 401 Unauthorized エラーレスポンスを返す
4. The Backend API shall アクセストークンに有効期限を設定する（短期間: 例 15分）
5. The Backend API shall リフレッシュトークンに有効期限を設定する（長期間: 例 7日）

### Requirement 2: トークン更新機能

**Objective:** As a 学習者, I want リフレッシュトークンを使ってアクセストークンを更新できる, so that トークンのライフサイクル管理を理解できる

#### Acceptance Criteria

1. The Backend API shall トークン更新エンドポイント (`/auth/refresh`) を提供する
2. When 有効なリフレッシュトークンが送信された, the Backend API shall 新しいアクセストークンを発行する
3. If リフレッシュトークンが無効または期限切れである, then the Backend API shall 401 Unauthorized エラーレスポンスを返す
4. The Backend API shall 新しいアクセストークンの有効期限をリセットする

### Requirement 3: 認証状態の保護されたリソースへのアクセス

**Objective:** As a 学習者, I want アクセストークンを使って保護されたAPIにアクセスできる, so that 認証済みリクエストの仕組みを理解できる

#### Acceptance Criteria

1. The Backend API shall 保護されたエンドポイント (`/api/protected`) を提供する
2. When 有効なアクセストークンがリクエストに含まれている, the Backend API shall 保護されたリソースへのアクセスを許可する
3. If アクセストークンが無効または期限切れである, then the Backend API shall 401 Unauthorized エラーレスポンスを返す
4. If アクセストークンがリクエストに含まれていない, then the Backend API shall 401 Unauthorized エラーレスポンスを返す

### Requirement 4: フロントエンドのログイン画面

**Objective:** As a 学習者, I want ブラウザからログイン操作ができる, so that 認証フローを視覚的に確認できる

#### Acceptance Criteria

1. The Frontend Application shall ログインフォームを表示する
2. The Frontend Application shall ユーザー名とパスワードの入力フィールドを提供する
3. When ログインボタンがクリックされた, the Frontend Application shall バックエンドのログインエンドポイントにリクエストを送信する
4. When ログインが成功した, the Frontend Application shall 受信したトークンをローカルストレージまたはメモリに保存する
5. When ログインが失敗した, the Frontend Application shall エラーメッセージを表示する

### Requirement 5: フロントエンドのトークン管理

**Objective:** As a 学習者, I want フロントエンドでトークンのライフサイクルが自動管理される, so that クライアント側のトークン処理パターンを理解できる

#### Acceptance Criteria

1. The Frontend Application shall アクセストークンをHTTPリクエストヘッダー (Authorization: Bearer) に自動付与する
2. When アクセストークンの有効期限が切れた, the Frontend Application shall リフレッシュトークンを使って自動的に更新を試みる
3. If リフレッシュトークンも期限切れである, then the Frontend Application shall ユーザーをログイン画面にリダイレクトする
4. The Frontend Application shall ログアウト機能を提供し、保存されたトークンを削除する

### Requirement 6: 保護されたリソースの表示

**Objective:** As a 学習者, I want 認証後に保護されたコンテンツを閲覧できる, so that エンドツーエンドの認証フローを体験できる

#### Acceptance Criteria

1. The Frontend Application shall 認証成功後に保護されたページを表示する
2. When 保護されたページが表示された, the Frontend Application shall バックエンドの保護されたエンドポイントからデータを取得する
3. The Frontend Application shall 取得したデータを画面に表示する
4. While ユーザーが認証されていない, the Frontend Application shall 保護されたページへのアクセスをブロックする

### Requirement 7: 開発者向けの学習支援機能

**Objective:** As a 学習者, I want トークンの内容や状態を確認できる, so that 認証の仕組みを深く理解できる

#### Acceptance Criteria

1. The Frontend Application shall 現在のアクセストークンの有効期限を表示する機能を提供する
2. The Frontend Application shall トークンのペイロード内容（デコードされたJWT）を表示する機能を提供する
3. Where デバッグモードが有効である, the Frontend Application shall API通信のログをコンソールに出力する

### Requirement 8: ローカル開発環境のセットアップ

**Objective:** As a 学習者, I want 簡単にローカル環境を起動できる, so that すぐに学習を開始できる

#### Acceptance Criteria

1. The Project shall pnpm workspaceによるモノレポ構成を維持する
2. The Project shall フロントエンド・バックエンドを別々に起動できるnpmスクリプトを提供する
3. The Frontend Application shall デフォルトでポート5173で起動する
4. The Backend API shall デフォルトでポート3001で起動する
5. The Project shall 依存関係インストール後、すぐに起動できる状態を保つ

