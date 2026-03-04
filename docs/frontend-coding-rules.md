# Frontend Coding Rules

## 目的

- 本ドキュメントは、このプロジェクトのフロントエンド実装における具体ルールを定義する。
- 設計判断で迷う場合は「最小実装・可読性・不要コード削除」を優先する。

## マークアップ

- 同一画像しか使わない `picture` は使わず、`img` を使う。
- 役割のない装飾 `img`（線や記号など）は避け、原則CSSで表現する。
- SVGファイル内に `style` 属性を直接書かない。
- 未使用のアセット・クラスは削除する。

## CSS

- `@media (prefers-reduced-motion: reduce)` は使用しない。
- `will-change` は使用しない。
- `vh` と `dvh` の併記は禁止。必要な方を1つだけ使う。
- 3D変換の必要がない限り `translate3d` は使わず、`translate` を使う。
- 旧世代ベンダープレフィックス（例: `-webkit-mask`）は使わない。
- 既定値と同じ冗長指定（例: 不要な `object-position: center`）は書かない。
- 数値 `font-weight`（例: `500`）は禁止。`normal` / `bold` か `inherit` を使う。
- CSSファイルは役割単位で分割し、肥大化を避ける。
- CSS Nestingを優先する。
- `p:first-child` のような分離セレクタは避け、`p { &:first-child { ... } }` の形でまとめる。
- 親状態セレクタ（例: `&:hover`）で完結できる子要素指定は、親ブロック内にネストする。
- レンジメディアクエリは境界を統一する（例: `@media (width <= 768px)` と `@media (width > 768px)`）。
- `@media (width <= 767px)` は使用せず、`@media (width < 768px)` を使う。
- 範囲条件は `and` 連結より連鎖レンジを優先する（例: `@media (768px <= width < 992px)`）。
- `line-height` / `margin` / `padding` / `background` / `color` は、継承・既定値で足りる場合は指定しない。
- CSS変数は必要最小限にする。定義1回・利用1回の変数はハードコードする。
- CSS検証は `stylelint-config-recommended` + `stylelint-config-recess-order` を基本とし、ルールセット中心で運用する。

## UIモーション

- UIモーションは必須とする。
- 可能な限りCSS主体で実装し、命令的なJSアニメーションを増やさない。
- モーションは `@starting-style` と `allow-discrete` を優先して設計する。
- ホバー時の移動量は最小限にし、過剰な移動を避ける。
- 特別な指定がない限り、イージングはデフォルトを使う。
- `transition` は原則 `transition: 0.3s;` を使う。
- 離散遷移が必要な場合のみ `transition: 0.3s allow-discrete;` を使う。
- `transition` の個別分割指定（例: `opacity ... , display ...`）は避ける。
- スタッガーは `&:nth-of-type(...)` ではなく `sibling-index()` を優先する。

## ナビゲーションとオーバーレイ

- ハンバーガーメニューは `input[type=checkbox]` で実装しない。
- ハンバーガーメニューは `command` / `commandfor` と `dialog` を使う。
- メニュー表示中はページの縦スクロールを禁止する。
- `site-header` は `fixed` を維持する。
- メニュー内リンクはスムーズスクロールで遷移させる（JSでのスクロール制御はしない）。
- `:focus-visible` は原則使わない。

## Workライトボックス

- `prev` / `next` / `close` は `absolute` 配置とし、画像と重ねて配置する。
- 画像は常にビューポート中央に配置する。
- ライトボックス表示中はページの縦スクロールを禁止する。
- `prev` / `next` 遷移は、現在画像と次画像の両方を移動させる。
- `prev` / `next` では View Transitions API を使わない。
- `open` / `close` の View Transitions API 利用は可とする。
- `mix-blend-mode: plus-lighter` は重なり演出が必要な箇所だけに限定する。

## TypeScript / JavaScript

- 後方互換性を過剰に意識した防御コードを入れない。
- 不要な `instanceof`、過剰な分岐、意味の薄いフォールバックは追加しない。
- 変数名・関数名は短く明確にし、冗長な命名を避ける。
- JSDocは削除しない。必要な関数には簡潔に残す。
- 型定義は原則必須プロパティにし、オプショナルは最小限にする。

## 検証

- 変更ごとに `npm run fmt`、`npm run lint`、`npm run build` を実行する。
- レイアウト変更時は Playwright MCP で desktop / mobile の実画面を確認する。
- Figma参照タスクでは、PlaywrightスクリーンショットとFigmaを比較してズレの有無を確認する。
- 実行不能な検証がある場合は、理由を明記する。

## 画像

- 画像形式は原則AVIFを使用する。
- 解像度は実表示サイズのRetina（2x）を上限にし、過大な元画像をそのまま置かない。
