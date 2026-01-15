# プロジェクト構成

- ルート: pnpm workspace (`pnpm-workspace.yaml`)。
- `pkgs/frontend/`: Vite + React フロントエンド。
  - `src/`: React エントリ (`main.tsx`) と UI (`App.tsx`)。
  - `public/`: 静的アセット。
- `pkgs/backend/`: Hono バックエンド。
  - `src/index.ts`: サーバー起動とルーティング。
- `.kiro/`: 仕様・ステアリング管理ディレクトリ。
