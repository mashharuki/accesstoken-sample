# 作業完了時のチェック

- フロントエンドを変更した場合: `pnpm --filter frontend lint` を検討。
- 影響範囲に応じて `pnpm --filter frontend build` / `pnpm --filter backend build` を検討。
- バックエンドの動作確認が必要なら `pnpm backend dev` で起動確認。
- テストは現状未整備のため、追加した場合はコマンドを更新。
