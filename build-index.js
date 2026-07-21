#!/usr/bin/env node
/*
 * miniapp-presales-mock : index.html 自動生成スクリプト
 * ------------------------------------------------------------------
 * 【なぜ】index.html を全員が手編集していると、Upload時に他の人の追記が
 *  上書きで消える事故が起きるため。indexは自動生成にし、誰も手で触らない。
 *
 * 【モックの追加方法（チーム共通）】
 *  1. 自分のモック <yourmock>.html をリポジトリ直下に置く（Uploadでも可）
 *  2. その <head> に下記のmetaタグを入れる（任意だが推奨。無い場合は未分類で表示）
 *       <meta name="catalog:group"      content="業種別 提案モック">
 *       <meta name="catalog:title"      content="〇〇｜△△ミニアプリ">
 *       <meta name="catalog:badge"      content="業種">
 *       <meta name="catalog:desc"       content="一覧に出す説明文">
 *       <meta name="catalog:icon"       content="🎫">          (任意)
 *       <meta name="catalog:order"      content="50">          (任意/グループ内の並び)
 *       <meta name="catalog:iconColor"  content="var(--teal)"> (任意)
 *       <meta name="catalog:badgeColor" content="var(--teal)"> (任意)
 *       <meta name="catalog:protected"  content="true">        (任意/パスワード保護)
 *       <meta name="catalog:external"   content="true">        (任意/別リポジトリ等の外部リンク)
 *       <meta name="catalog:href"       content="https://...">  (任意/外部URLのとき)
 *  3. push すると GitHub Actions が index.html を自動再生成する
 *  → 共有ファイル(index.html)を手編集しないので、同時作業でも競合しない。
 *
 * 既存モックは下の LEGACY テーブルで一覧を再現している（既存HTMLは無改変）。
 * 既存モックにmetaタグを足せば、そのファイルの記述が LEGACY より優先される。
 */
const fs = require("fs");
const path = require("path");

const GROUP_ORDER = [
  "触れるデモ（最新・インタラクティブ）",
  "業種別 提案モック",
  "スタンプラリー パッケージ（開発検討・インド連携用）",
  "その他（未分類）",
];

// 既存モックの一覧データ（既存HTMLは改変せず、ここで再現）
const LEGACY = [
  { group:"触れるデモ（最新・インタラクティブ）", order:10, href:"./stamprally_interactive_demo.html", feature:true,
    icon:"🎫", iconColor:"var(--brand)", title:"住まいスタンプラリー｜触れるモック（最新 v0.6）", badge:"最新DEMO", badgeColor:"var(--brand)",
    desc:"実際に触れる通しプロトタイプ。会員登録（郵便番号→既定拠点）→TOP→QR読取→エリア別スタンプカード→段階景品→プレゼント。右側にME属性＋自前DB（CSV）をリアルタイム表示。ミサワ／汎用スタンプラリーの最新モックはこちら。" },

  { group:"業種別 提案モック", order:10, href:"./aimed-line-flow.html",
    icon:"🩺", iconColor:"var(--teal)", title:"アイメッド｜LINE完結フロー", badge:"医療", badgeColor:"var(--teal)",
    desc:"med.（オンライン診療）。レコメンド→診察予約→無人FAQ自動応答を、LINE 1:1トーク内で完結（ミニアプリ不要）。" },
  { group:"業種別 提案モック", order:20, href:"./eventlab-miniapp-flow.html",
    icon:"✈️", iconColor:"var(--navy)", title:"EVENT LAB｜ミニアプリ動線", badge:"旅行", badgeColor:"var(--navy)",
    desc:"Turkish Air &amp; Travel。リッチメニュー出し分け→マイページ（共通情報・クーポン）→Service Agent。LINEログインのみ。" },
  { group:"業種別 提案モック", order:30, href:"https://tfukuda-git.github.io/miniapp-hr-mock/", external:true,
    icon:"💼", iconColor:"var(--coral)", title:"求人マッチング｜求職者マイページ", badge:"人材", badgeColor:"var(--coral)",
    desc:"スワイプで求人をレコメンド。興味データを取得してカタログ配信の精度を上げる求職者向けマイページ（人材）。最新モックは別リポジトリ（miniapp-hr-mock）で公開。" },
  { group:"業種別 提案モック", order:40, href:"./hr-swipe-gacha-flow.html",
    icon:"🎰", iconColor:"var(--coral)", title:"スワイプ×デイリーガチャ｜人材ミニアプリ", badge:"人材", badgeColor:"var(--coral)",
    desc:"リリース済みスワイプUIに下部タブを追加（おしごと／ガチャ／クーポン）。1日1回無料ガチャ→面談来場クーポン→スタッフ消込で来場計測まで。Phase 1はMico運用代行＋月次実績レポート、セルフサーブ管理画面はPhase 2オプション。" },
  { group:"業種別 提案モック", order:50, href:"./insurance-family-share-flow.html",
    icon:"🛡️", iconColor:"var(--plum)", title:"家族あんしん共有｜保険マイページ", badge:"保険", badgeColor:"var(--plum)",
    desc:"保険証券・担当者名刺をOCRで登録→家族とLINEで共有。もしもの時に緊急連絡先へワンタップ発信。マイ保険・共有承認フロー・第三者提供同意・OCR登録まで再現（社名/商品名は架空）。" },
  { group:"業種別 提案モック", order:60, href:"./apparel-fitting-log-flow.html",
    icon:"🛍️", iconColor:"#B03060", title:"試着メモ×未購入フォロー｜アパレルミニアプリ", badge:"アパレル", badgeColor:"#B03060",
    desc:"店員に声をかけずに商品タグのQRをスキャン→試着商品・サイズをLINEに保存（データフィード連携で店員作業ゼロ）→仮会員証の購買情報と突合→「試着したが買わなかった」人にだけ自動フォロー配信。mock-component製・6画面。ブランド名は架空（MERIA）。" },
  { group:"業種別 提案モック", order:70, href:"./apparel-membership-quickfill-flow.html",
    icon:"👗", iconColor:"#B03060", title:"仮会員証＋クイック入力｜アパレル会員ミニアプリ", badge:"アパレル", badgeColor:"#B03060",
    desc:"店頭QR→5秒で仮会員証（バーコード）発行→ポイント可視化→クイック入力（共通プロフィール自動反映）で本会員化。退店後の自動フォロー配信まで6画面。※クイック入力は認証済みミニアプリ前提。ブランド名は架空（MERIA）。" },
  { group:"業種別 提案モック", order:80, href:"./tus-service-booking-flow.html",
    icon:"🚗", iconColor:"var(--navy)", title:"自動車ディーラー｜マイカー登録・入庫予約", badge:"自動車", badgeColor:"var(--navy)",
    desc:"車検満了トリガーの案内→4ステップ予約→受付/確定→予約後チャットまでLINEで完結。車両ごと管理・車検証登録・空き枠まとめ表示・管理ボード（アラート/ステータス）に対応。" },
  { group:"業種別 提案モック", order:90, href:"./pharmacy-loyalty-checkin-flow.html",
    icon:"💊", iconColor:"var(--line)", title:"薬局ロイヤリティ｜来店チェックイン・デジタル会員証", badge:"薬局", badgeColor:"var(--line)",
    desc:"店頭QRで来店チェックイン→来店ポイント付与、デジタル会員証（バーコード／QR）、ステージ、抽選くじまで。ポイントは来店を軸に付与し処方箋枚数はステージ判定のみに使用（規制対応）。会員基盤（EC-CRM）とCSV日次＋API連携。iPhoneフレーム＋LINE演出はmock-component（社名/ブランド名は架空）。" },
  { group:"業種別 提案モック", order:100, href:"./cruise-checkpoint-flow.html",
    icon:"🚢", iconColor:"var(--teal)", title:"クルーズ寄港地チェックポイント＆旅のしおり", badge:"旅行", badgeColor:"var(--teal)",
    desc:"寄港地のQRを読み込むと訪問記録→マップにピン→地点の読み物→旅のしおりに自動でまとまる。QR＝チェックポイント紐付け方式でGPS不要、国内＋台湾・韓国に対応。運営管理画面まで7画面（社名/ブランド名は架空）。" },
  { group:"業種別 提案モック", order:110, href:"./event-stamprally-mock.html", protected:true,
    icon:"🔒", iconColor:"var(--muted)", title:"スタンプラリー（イベント来場者向け）", badge:"要パスワード", badgeColor:"var(--muted)",
    desc:"会場回遊スタンプラリーの通しモック（サンクスメッセージ→ミニアプリ→景品交換）。パスワード保護のためご連絡先まで。" },

  { group:"スタンプラリー パッケージ（開発検討・インド連携用）", order:10, href:"./package1_ME_stamprally_for_dev.html",
    icon:"🏠", iconColor:"var(--muted)", title:"【旧版】ME連携 スタンプラリー＋抽選（モデルハウス）", badge:"旧 PKG①", badgeColor:"var(--muted)",
    desc:"初期の抽選統合版（参考）。最新の設計・仕様は上の「触れるモック（最新 v0.6）」を参照。※抽選→段階的景品／エリア別カード／郵便番号→既定拠点などに更新済み。" },
  { group:"スタンプラリー パッケージ（開発検討・インド連携用）", order:20, href:"./package2_standalone_for_dev.html",
    icon:"🎫", iconColor:"var(--plum)", title:"独立型 スタンプラリー＋回遊クーポン", badge:"PKG②", badgeColor:"var(--plum)",
    desc:"ME非依存のフルスタック版（自治体・イベント向け）。定義＋共通/モード別機能表＋回遊・スタンプ・集計のモック。" },
  { group:"スタンプラリー パッケージ（開発検討・インド連携用）", order:30, href:"./package_definitions.html",
    icon:"📄", iconColor:"var(--gold)", title:"パッケージ定義（①②比較・1枚）", badge:"", badgeColor:"var(--muted)",
    desc:"ME連携版／独立版の2パッケージを社内で握るための定義シート（各1ページ）。" },
];

function attr(html, name){
  const re = new RegExp('<meta[^>]*name=["\\047]catalog:'+name+'["\\047][^>]*content=["\\047]([^"\\047]*)["\\047]','i');
  const re2= new RegExp('<meta[^>]*content=["\\047]([^"\\047]*)["\\047][^>]*name=["\\047]catalog:'+name+'["\\047]','i');
  const m = html.match(re) || html.match(re2);
  return m ? m[1] : undefined;
}
function titleTag(html){ const m=html.match(/<title>([^<]*)<\/title>/i); return m?m[1].trim():undefined; }

function scanHtml(){
  const out=[];
  let files=[];
  try{ files = fs.readdirSync(process.cwd()).filter(f=>f.endsWith(".html") && f!=="index.html"); }catch(e){}
  for(const f of files){
    let html=""; try{ html=fs.readFileSync(f,"utf8"); }catch(e){ continue; }
    const t = attr(html,"title");
    if(t){
      out.push({ __src:"meta", href:"./"+f, group:attr(html,"group")||"その他（未分類）",
        order: parseInt(attr(html,"order")||"999",10), icon:attr(html,"icon")||"📄",
        iconColor:attr(html,"iconColor")||"var(--muted)", title:t, badge:attr(html,"badge")||"",
        badgeColor:attr(html,"badgeColor")||"var(--muted)", desc:attr(html,"desc")||"",
        external:(attr(html,"external")==="true"), protected:(attr(html,"protected")==="true"),
        feature:(attr(html,"feature")==="true") });
    } else {
      out.push({ __src:"fallback", href:"./"+f, group:"その他（未分類）", order:999, icon:"📄",
        iconColor:"var(--muted)", title:titleTag(html)||f, badge:"", badgeColor:"var(--muted)",
        desc:"（metaタグ未設定。catalog:title 等を追記すると一覧に整います）" });
    }
  }
  return out;
}

function esc(s){ return String(s==null?"":s); }
function renderItem(e){
  const cls = "item"+(e.feature?" feature":"");
  const ext = e.external ? ' target="_blank" rel="noopener"' : "";
  const arrow = e.external ? "↗" : "→";
  const badge = e.badge ? '<span class="badge" style="background:'+esc(e.badgeColor||"var(--muted)")+'">'+esc(e.badge)+'</span>' : "";
  return (
'    <a class="'+cls+'" href="'+esc(e.href)+'"'+ext+'>\n'+
'      <div class="ic" style="background:'+esc(e.iconColor||"var(--muted)")+'">'+esc(e.icon||"📄")+'</div>\n'+
'      <div class="it-body">\n'+
'        <div class="it-title">'+esc(e.title)+badge+'</div>\n'+
'        <div class="it-desc">'+esc(e.desc)+'</div>\n'+
'      </div>\n'+
'      <div class="arrow">'+arrow+'</div>\n'+
'    </a>');
}

function build(){
  // merge: meta-scanned overrides legacy (by href basename); fallback fills the rest
  const scanned = scanHtml();
  const byHref = new Map();
  for(const e of LEGACY) byHref.set(e.href.replace(/^\.\//,""), e);
  for(const e of scanned){
    const key = e.href.replace(/^\.\//,"");
    if(e.__src==="meta") byHref.set(key, e);          // meta優先
    else if(!byHref.has(key)) byHref.set(key, e);      // 未知のhtmlだけ追加
  }
  const entries = [...byHref.values()];
  const groups = {};
  for(const e of entries){ (groups[e.group]||(groups[e.group]=[])).push(e); }
  const orderedGroups = [...new Set([...GROUP_ORDER, ...Object.keys(groups)])].filter(g=>groups[g]);
  let body="";
  for(const g of orderedGroups){
    const list = groups[g].sort((a,b)=>(a.order||999)-(b.order||999) || String(a.title).localeCompare(String(b.title)));
    body += '\n  <div class="group">\n    <div class="ghead">'+esc(g)+'</div>\n\n'+list.map(renderItem).join("\n\n")+'\n  </div>\n';
  }
  const html =
'<!DOCTYPE html>\n<html lang="ja">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'+
'<title>ミニアプリ 提案モック 一覧</title>\n'+
'<!-- このファイルは build-index.js による自動生成です。直接編集しないでください（GitHub Actionsが上書きします）。 -->\n'+
'<style>\n'+
'  :root{\n    --line:#06C755; --navy:#0B3D4F; --teal:#0E7C86; --coral:#EE7B3C; --gold:#E8B23A; --plum:#7A4D8C;\n    --brand:#2E6BE6; --ink:#16242B; --muted:#6B7C84; --bg:#EEF2F3; --bd:#DBE4E6;\n  }\n'+
'  *{box-sizing:border-box; margin:0; padding:0;}\n'+
'  body{font-family:"Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif; color:var(--ink); background:var(--bg); -webkit-font-smoothing:antialiased;}\n'+
'  .wrap{max-width:880px; margin:0 auto; padding:46px 22px 70px;}\n'+
'  .eyebrow{color:var(--teal); font-weight:800; font-size:12px; letter-spacing:.14em;}\n'+
'  h1{font-size:28px; margin:8px 0 6px;}\n'+
'  .lead{font-size:14px; color:var(--muted); line-height:1.7; margin-bottom:30px;}\n'+
'  .group{margin-bottom:30px;}\n'+
'  .ghead{font-size:13px; font-weight:800; color:var(--navy); letter-spacing:.02em; margin:0 2px 12px; padding-bottom:8px; border-bottom:2px solid var(--bd);}\n'+
'  a.item{display:flex; align-items:center; gap:15px; text-decoration:none; color:inherit; background:#fff; border:1px solid var(--bd);\n    border-radius:13px; padding:15px 17px; margin-bottom:11px; transition:.15s; box-shadow:0 1px 2px rgba(0,0,0,.04);}\n'+
'  a.item:hover{border-color:var(--teal); box-shadow:0 6px 18px rgba(11,61,79,.10); transform:translateY(-1px);}\n'+
'  a.item.feature{border-color:var(--brand); background:#F5F8FF;}\n'+
'  .ic{width:46px; height:46px; border-radius:11px; flex:0 0 auto; display:flex; align-items:center; justify-content:center; font-size:22px; color:#fff;}\n'+
'  .it-body{flex:1 1 auto; min-width:0;}\n'+
'  .it-title{font-size:15px; font-weight:700; display:flex; align-items:center; gap:9px; flex-wrap:wrap;}\n'+
'  .badge{font-size:10px; font-weight:800; color:#fff; padding:2px 8px; border-radius:999px;}\n'+
'  .it-desc{font-size:12px; color:var(--muted); margin-top:4px; line-height:1.55;}\n'+
'  .arrow{color:var(--muted); font-size:20px; flex:0 0 auto;}\n'+
'  .foot{margin-top:34px; font-size:11px; color:var(--muted); border-top:1px solid var(--bd); padding-top:16px; line-height:1.7;}\n'+
'</style>\n</head>\n<body>\n<div class="wrap">\n'+
'  <div class="eyebrow">MICO ｜ PRE-SALES MOCK</div>\n'+
'  <h1>ミニアプリ 提案モック 一覧</h1>\n'+
'  <p class="lead">LINEミニアプリ／LINE完結フローの提案資料・画面モックの一覧です。各ページは商談・社内ディスカッション・開発チーム連携用のドラフトです。</p>\n'+
body+
'\n  <div class="foot">\n    各リンクは同じリポジトリ内のHTMLを参照しています。｜ この一覧は build-index.js による自動生成です（直接編集不可）。｜ 作成：株式会社Mico\n  </div>\n</div>\n</body>\n</html>\n';
  fs.writeFileSync("index.html", html);
  console.log("index.html generated. entries:", entries.length, "groups:", orderedGroups.join(" / "));
}
build();
