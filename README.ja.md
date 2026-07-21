<div align="center">

# Echo · 回響

**運命検証エンジン**

*予測を発し、響きを待つ*

[简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

**[デモを見る →](https://weed33834.github.io/echo/)**

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-2.3-ffd859?logo=pinia&logoColor=black)
![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)
![Stars](https://img.shields.io/github/stars/weed33834/echo?style=social)

</div>

---

## これは何

Echo は占いソフトではありません。**仮説検証ツール**です。

八字、紫微、六爻などで出した結果は、本質的に**予測**です。Echo がすることはシンプルです：これらの予測を記録し、検証のタイミングを設定し、期限が来たら振り返る——当たったか、外れたか。時間が経つにつれて「命格の信頼度」が蓄積され、どの体系が自分に合っているかが見えてきます。

コアループ：**ノード設定 → 響きを待つ → 振り返り**

> すべての推演結果は文化アルゴリズムの視覚化であり、いかなる意思決定の根拠ともなりません。

## 機能概要

### 18 種の命理ツール

| カテゴリ | ツール | 説明 |
|----------|--------|------|
| 命理 | 八字排盘 | 四柱干支、日主五行、十神、大運流年 |
| 命理 | 紫微斗数 | 十二宮、主星四化 |
| 命理 | 奇門遁甲 | 九宮時盤、八門九星 |
| 命理 | 大六壬 | 四課三伝、天将盤 |
| 占卜 | 六爻占卜 | 金銭課起卦、六親装卦 |
| 占卜 | 梅花易数 | 時間起卦、体用生克 |
| 占卜 | 摇钱起卦 | 六十四卦銅銭法 |
| 健康 | 子午流注 | 十二時辰経絡流注 |
| 健康 | 節気養生 | 順時調養、節気宜忌 |
| 生活 | 老黄暦 | 毎日宜忌、沖煞、値神 |
| 生活 | 择吉日 | イベント日選び |
| 生活 | 毎日運勢 | 個別化日運、四維運勢 |
| 異域 | 西洋占星 | チャート三巨頭、惑星アスペクト |
| 異域 | マヤ暦 | 260 kin、銀河音調 |
| 異域 | タロット | 大アルカナ三カードスプレッド |
| 異域 | 周公解夢 | 夢のキーワード解析 |
| 風水 | 風水布局 | 九宮飛星、元運盤 |
| 風水 | 姓名学 | 三才五格、81 数理 |

### AI チャット

- DeepSeek / OpenAI / Claude / 通義千問 / Ollama ローカルモデル対応
- ツール呼び出し：AI が 18 種の命理ツールを起動
- ウェブ検索：Tavily API 連携でリアルタイム情報を取得
- セキュリティサンドボックス：パラメータ検証、タイムアウト制御、注入検出
- 知識検索：命理知識ベース + 節気感知 + Few-shot サンプル

### 命格パネル

- 五行レーダーチャート：金木水火土の分布を可視化
- 五行生克図：相生相克の関係ネットワーク
- 今日のアドバイスマトリクス：飲食 / 起居 / 運動 / 情志
- 推演タイムライン：履歴の可視化
- ツール使用統計
- 大運流年：十年大運と流年の推移

### 運命図譜

- SVG 関係ネットワーク図：中心ノード + 五行ノード + ツールノード
- インタラクティブノード：五行をクリックで調養アドバイス
- 印証統計と命格レベルの可視化

### その他の機能

- 毎日チェックイン + 連続日数マイルストーン
- 合婚匹配：双方の八字対照分析
- 学習センター：命理入門コース
- ダークモード（宣紙 / 墨硯デュアルテーマ）
- フォントサイズスケーリング（compact / standard / relaxed）
- 完全レスポンシブ：320px モバイル → 4K ディスプレイ

## 技術アーキテクチャ

```
src/
├── main.js                    # アプリエントリー
├── router/index.js            # 15 ルート
├── stores/
│   ├── echo.js                # 命格/履歴/档案/ツール登録 store
│   └── chat.js                # AI チャット/モデル設定 store
├── services/
│   ├── ai.js                  # マルチモデル AI サービス
│   ├── tools.js               # ツールスケジューリングと実行
│   ├── sandbox.js             # セキュリティサンドボックス
│   └── webSearch.js           # Tavily ウェブ検索
├── prompts/
│   └── system.js              # システムプロンプト/Few-shot/知識ベース
├── utils/
│   └── engines.js             # 18 個の命理エンジン
├── components/
│   ├── EchoUI.jsx             # 基礎コンポーネントライブラリ
│   ├── TabBar.jsx             # ナビゲーションバー（レスポンシブ）
│   ├── ChatFab.jsx            # 浮遊 AI エントリー
│   ├── BaziChart.jsx          # 八字可視化
│   └── Timeline.jsx           # タイムラインコンポーネント
├── pages/                     # 15 ページ
│   ├── Home.jsx               # ホーム
│   ├── Tools.jsx              # ツール一覧
│   ├── ToolDetail.jsx         # ツール推演
│   ├── Profile.jsx            # プロフィール
│   ├── Daily.jsx              # 今日の運勢
│   ├── Dashboard.jsx          # 命格パネル
│   ├── Compatibility.jsx      # 合婚匹配
│   ├── Learn.jsx              # 学習センター
│   ├── EchoCenter.jsx         # 印証センター
│   ├── Graph.jsx              # 運命図譜
│   ├── Chat.jsx               # AI チャット
│   ├── Me.jsx                 # 個人センター
│   ├── Settings.jsx           # 設定
│   ├── Admin.jsx              # 管理バックエンド
│   └── Checkin.jsx            # 毎日チェックイン
└── designs/                   # デザインシステム
    ├── tokens.css             # デザイントークン
    ├── base.css               # グローバルリセット
    ├── animations.css         # アニメーションキーフレーム
    └── ...                    # 各ページスタイル
```

### 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Vue 3 | 3.5 | フレームワーク（JSX + Composition API） |
| Pinia | 2.3 | 状態管理 |
| Vue Router | 4.6 | ルーティング |
| Vite | 5.4 | ビルドツール |

**ランタイム依存ゼロ**——Vue/Pinia/Router の 3 つのコアライブラリ以外、すべて自前実装：
- Markdown レンダラー（marked/markdown-it 不使用）
- SVG レーダー / 生克 / ネットワークグラフ（echarts/d3 不使用）
- Toast / Modal / Progress（UI ライブラリ不使用）

## クイックスタート

> 前提条件：Node.js ≥ 18（推奨 20.x、`.nvmrc` 参照）、npm ≥ 9

```bash
# リポジトリをクローン
git clone https://github.com/weed33834/echo.git
cd echo

# 依存関係をインストール
npm install

#（任意）環境変数を設定
cp .env.example .env  # API Key を入力、アプリ内の設定ページでも設定可能

# 開発サーバーを起動
npm run dev

# プロダクションビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

ブラウザで `http://localhost:5173` を開いてください。

### AI チャットの設定

1. 「設定」ページへ移動
2. 「AI チャット」エリアに API Key を入力
3. または「デフォルトモデルを使用」でプレースホルダー返信を体験
4. 対応プロバイダー：DeepSeek / OpenAI / Claude / 通義千問 / Ollama

### 管理バックエンド

`#/admin` で管理バックエンドにアクセス（初回使用時にシステム設定でパスワードを設定）。

機能：モデル管理（プリセット/カスタム CRUD）、プロンプト管理、使用量統計、システム設定。

## レスポンシブデザイン

| ブレイクポイント | シナリオ | 戦略 |
|-----------------|----------|------|
| ≤340px | 超狭画面（iPhone SE 1） | 間隔圧縮、グリッド列削減 |
| 341-767px | 標準モバイル | 下部 TabBar、単列レイアウト |
| 768-1023px | タブレット | 二列グリッド、横向きレーダー |
| 1024-1439px | デスクトップ | サイドナビ、二列パネル |
| ≥1440px | ワイド画面 | 五列ツールグリッド |
| ≥1920px | 超ワイド | 最大幅 1280px |
| 横画面 ≤500h | モバイル横画面 | 垂直間隔圧縮 |

## デザイントークン

CSS カスタムプロパティをデザイントークンとして使用：

```css
:root {
  --accent: #5b3fd6;     /* メイン：紫 */
  --gold: #b8893a;       /* 金色 */
  --ink: #15131f;        /* テキスト */
  --bg: #f7f5f0;         /* 背景 */

  --wuxing-metal: #d4a843;
  --wuxing-wood: #5a9e5a;
  --wuxing-water: #5a8db5;
  --wuxing-fire: #d45a5a;
  --wuxing-earth: #a8825a;
}
```

ダークモード（`[data-theme="dark"]`）とフォントスケーリング（`[data-font-scale]`）に対応。

## セキュリティサンドボックス

```
ユーザー入力 → sanitizeInput → detectInjection → AI
                                    ↓
ツール呼び出し → validateArgs → executeWithTimeout → sanitizeToolResult → AI
                                    ↓
AI 出力 → validateOutput → 安全通知を付加
```

## 命格レベルシステム

| レベル | 称号 | 必要経験値 |
|--------|------|-----------|
| 1 | 初悟 | 0 |
| 2 | 渐明 | 100 |
| 3 | 通玄 | 300 |
| 4 | 識命 | 600 |
| 5 | 知機 | 1000 |
| 6 | 洞微 | 1500 |
| 7 | 明心 | 2200 |
| 8 | 見性 | 3000 |

経験値 = 印証回数 × 10 + 応験回数 × 20

## プロジェクトドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [SPEC.md](./SPEC.md) | 技術仕様（アーキテクチャ / エンジン / デザインシステム / セキュリティ） |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | コントリビューションガイド（開発環境 / コードスタイル / コミット規約） |
| [SECURITY.md](./SECURITY.md) | セキュリティポリシー（脆弱性報告 / サンドボックス / ガードレール） |
| [CHANGELOG.md](./CHANGELOG.md) | 変更履歴 |
| [.env.example](./.env.example) | 環境変数テンプレート |

## コントリビュート

Issue と Pull Request を歓迎します。開発ガイドラインは [CONTRIBUTING.md](./CONTRIBUTING.md) をお読みください。

新しい命理エンジンの追加は 3 ステップ：
1. `engines.js` に `{ calc, meta }` 構造を実装
2. `echo.js` の `TOOLS` 配列にツールメタ情報を登録
3. `tools.js` の `ENGINES` マップにエンジンを関連付け

## ライセンス

[MIT License](./LICENSE)

## 免責事項

本プロジェクトのすべての推演結果は文化アルゴリズムの視覚化であり、いかなる意思決定の根拠ともなりません。命理文化の価値は思考と自己認識を啓発することにあり、未来を正確に予測することではありません。Echo の核心は「ノード設定 → 響きを待つ → 振り返り」という検証プロセスにあり、単発の予測の当否ではありません。

健康、法律、財務などの機密性の高い話題については、専門家にご相談ください。

---

<div align="center">

**このプロジェクトにインスピレーションを受けたら、Star で応援してください**

</div>
