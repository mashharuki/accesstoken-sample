# よく使うコマンド

## セットアップ
- `pnpm i`

## 開発サーバー
- フロントエンド: `pnpm frontend dev`
- バックエンド: `pnpm backend dev`

## ビルド
- フロントエンド: `pnpm --filter frontend build` (または `pnpm frontend build` が通る場合)
- バックエンド: `pnpm --filter backend build`

## 起動 (ビルド後)
- バックエンド: `pnpm --filter backend start`

## リント
- フロントエンド: `pnpm --filter frontend lint`

## テスト
- ルート `package.json` にテストは未定義 (現状 `npm test` 相当は失敗)。
