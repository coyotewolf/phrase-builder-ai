# 本機依賴安全修補 — 2026-11-05

> 此文件保存推送前的本機修補與測試紀錄；「尚未提交／推送」是當時狀態。後續已獲准提交至修復分支並更新／建立草稿 PR；實際結果以 PR 與 commit 狀態為準，仍不合併、不部署、不執行 npm audit。

## Context Used

已檢查既有安全 PR、package.json、package-lock.json 與依賴呼叫者。未找到 checkout 的 AGENTS.md 或 .agents/skills 指示。

基底：[既有 PR #2](https://github.com/coyotewolf/phrase-builder-ai/pull/2)，commit 8993fb4941e416cba1917f15ae2ee33730ea9dff。本次變更留在隔離工作區的 fix/security-20261105 分支，尚未提交；原 checkout 未變更。

## Task Classification

依賴安全維護；Mechanism change: no。未變更遊戲機制、UI 流程、資料契約或 Supabase／Firebase 設定。

## Modified Files

package.json 與 package-lock.json。

Found：glob 10.5.0；受影響 minimatch 10.2.6, 9.0.9。

Replace with：僅針對受影響版本範圍設定 overrides，重新解析 lockfile：

```json
"minimatch@>=7.0.0 <11.0.1": "11.0.3",
"glob@>=9.0.0 <14.0.2": "14.0.2"
```

minimatch 3.x／5.x 與 glob 7 的舊 API 不在此覆寫範圍。修補後所有現代 glob 實際使用 minimatch 11.0.3。Node 24.16.0 安裝與測試；glob/minimatch 的引擎支援 18、20 或 >=22，Node 19／21 不支援。

既有 PR #2 已包含 protobufjs 7.6.6、lodash 4.18.1、Vite 6.4.5；本次保留這些修補，未重做或降級 Firebase。

## Validation

- npm install --package-lock-only --ignore-scripts --no-audit --no-fund 與 npm ci --ignore-scripts --no-audit --no-fund：通過。
- npm run build：通過。Parts／Schedule 的 SWC 在沙箱無法寫入原生快取；移至核准的沙箱外重跑通過。
- 真實 headless Chrome：production 首頁、無效路由 fallback、無未攔截 JS 錯誤通過；外部與後端請求全部阻擋。
- 直接相容性測試：async/sync glob、預先取消 AbortSignal、TypeScript ESLint projectService/allowDefaultProject、Sucrase project/files 編譯通過。Windows 上 Sucrase include 路徑回傳空集合，glob 10.5.0 與 14.0.2 結果相同，屬既有限制，未宣稱修復。

- npm run lint：22 errors / 17 warnings（更新前後相同）；未更動來源來掩蓋錯誤。

- git diff --check：通過。
- npm audit：自動安全審核拒絕把私人專案依賴樹傳給外部 npm，未執行，未重試或繞過。未宣稱完整 audit 為零。

本次工作區 ../evidence/ 中保存各命令輸出、inventory-before.jsonl、inventory-after.jsonl、dependency-diffs.json、tooling-compatibility.log、browser-smoke.log 與首頁截圖。

## Spec Sync

Mechanism change: no；spec/changelog 未修改，因本次只有依賴修補。Requires Lovable / Supabase action: no（僅就本次新增差異）；既有 PR 的後端部署待辦仍維持原狀。未推送、建立 PR、合併、部署或變更使用者環境。

## Commit Message

```text
fix(security): patch affected glob and minimatch dependency ranges
```

## 官方依據

- [minimatch CVE-2026-118764](https://github.com/advisories/GHSA-g3hv-75wg-m249)：>=7.0.0、<11.0.1，11.0.1 修補。
- [glob CVE-2026-118773](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)：>=9.0.0、<=14.0.1，14.0.2 修補。
- [protobufjs CVE-2026-41242](https://github.com/advisories/GHSA-xq3m-2v4x-88gg)：7.x 自 7.5.5 修補。
- [Vite v6 deny bypass](https://github.com/vitejs/vite/security/advisories/GHSA-8g5g-mxqh-grgj)：6.4.5 修補。
- [Vitest mocker Windows bypass](https://github.com/vitest-dev/vitest/security/advisories/GHSA-xp26-3454-mjgp)：4.1.12 修補；[原始 mocker traversal](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9)。
- [lodash template imports](https://github.com/lodash/lodash/security/advisories/GHSA-r5fr-rjxr-66jc)：4.18.1 修補。
