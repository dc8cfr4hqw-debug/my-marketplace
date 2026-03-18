(function () {
  if (window.__uiFixLoaded) return;
  window.__uiFixLoaded = true;

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  function loggedIn() {
    return !!getToken();
  }

  function directDropdownChildren(right) {
    return Array.prototype.slice.call(right.children || []).filter(function (el) {
      return el && el.classList && el.classList.contains("dropdown");
    });
  }

  function ensureFontAwesome() {
    if (document.getElementById("fa-icons-cdn")) return;
    var fa = document.createElement("link");
    fa.id = "fa-icons-cdn";
    fa.rel = "stylesheet";
    fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
    fa.crossOrigin = "anonymous";
    fa.referrerPolicy = "no-referrer";
    document.head.appendChild(fa);
  }

  function ensureTemplateCoinIconCss() {
    if (document.getElementById("template-coin-icons")) return;
    var link = document.createElement("link");
    link.id = "template-coin-icons";
    link.rel = "stylesheet";
    link.href = "/assets/style.css";
    document.head.appendChild(link);
  }

  function ensureProfessionalFont() {
    if (document.getElementById("manrope-font")) return;
    var link = document.createElement("link");
    link.id = "manrope-font";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }

  function ensureSharedUiStyles() {
    if (document.getElementById("shared-ui-styles")) return;
    var style = document.createElement("style");
    style.id = "shared-ui-styles";
    style.textContent = [
      ":root{--jp-blue:#2f80ff;--jp-blue-soft:#5ea4ff;--jp-ink:#06111f;--jp-panel:#0c1726;--jp-line:rgba(105,132,173,.28);--jp-text:#ebf3ff;--jp-muted:#9fb4cf;}",
      "body,button,input,select,textarea{font-family:'Manrope',system-ui,-apple-system,'Segoe UI',sans-serif;}",
      ".header{position:sticky;top:0;z-index:999;backdrop-filter:blur(30px) saturate(155%);-webkit-backdrop-filter:blur(30px) saturate(155%);background:linear-gradient(90deg,rgba(3,7,14,.32),rgba(8,16,28,.23));border-bottom:1px solid rgba(89,113,149,.3)!important;}",
      ".header .header__body,.header.is-fixed .header__body,.header.is-fixed.is-small .header__body{min-height:140px!important;height:auto!important;padding-top:20px!important;padding-bottom:20px!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;}",
      ".header .container-fluid{padding-left:28px!important;padding-right:28px!important;}",
      ".header .header__left{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:24px;flex:1 1 auto!important;min-width:0;margin-right:auto!important;}",
      ".header .header__left .left__main{min-width:0;display:flex;align-items:center;justify-content:flex-start;margin-left:10px!important;}",
      ".header .header__left .main-nav{margin:0!important;}",
      ".header .header__left .main-nav .menu{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;}",
      ".header .logo{display:flex;align-items:center;justify-content:flex-start;min-width:190px;flex:0 0 auto;}",
      ".header .logo a{display:flex;align-items:center;}",
      ".header .logo img{max-height:29px!important;width:auto!important;}",
      ".header .logo img{filter:drop-shadow(0 8px 20px rgba(22,119,255,.22));}",
      ".header .header__left .main-nav .menu > li > a{position:relative;font-weight:700;letter-spacing:.01em;color:#c2cedf;font-size:16px;}",
      ".header .header__left .main-nav .menu > li > a:hover{color:#e6edf8;}",
      ".header .header__left .main-nav .menu > li.current-item > a,.header .header__left .main-nav .menu > li.current-menu-item > a{color:#c2cedf!important;}",
      ".header .header__left .main-nav .menu > li > a::after{content:'';position:absolute;left:0;bottom:-10px;width:100%;height:2px;background:linear-gradient(90deg,#86a3c7,transparent);transform:scaleX(0);transform-origin:left;transition:transform .2s ease;}",
      ".header .header__left .main-nav .menu > li:hover > a::after{transform:scaleX(1);}",
      ".ui-btn-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;vertical-align:middle;margin-right:8px;opacity:.95;}",
      ".btn-action,.btn-action-3,.uc-pill,.fiat-submit,.dep-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;}",
      ".btn-action{box-shadow:0 16px 34px rgba(42,116,255,.22);}",
      ".btn-action-3{border-color:rgba(95,131,183,.42)!important;}",
      ".ui-cta-polished{position:relative;overflow:hidden;}",
      ".ui-cta-polished::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);transform:translateX(-120%);transition:transform .5s ease;}",
      ".ui-cta-polished:hover::after{transform:translateX(120%);}",
      ".ui-login-links a{padding:9px 14px;border-radius:999px;border:1px solid rgba(89,113,149,.25);background:rgba(10,18,30,.52);}",
      ".ui-login-links a:last-child{background:linear-gradient(135deg,#257cff,#4f9eff);border-color:#257cff;color:#fff;}",
      ".header .header__right{display:flex!important;align-items:center;justify-content:flex-end;gap:14px;flex:0 0 auto;min-width:360px;padding-left:28px;margin-left:auto!important;}",
      ".ui-login-links{display:flex!important;align-items:center;gap:10px;flex-wrap:nowrap;white-space:nowrap;margin-left:0!important;}",
      ".ui-login-links a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;font-size:16px;font-weight:700;}",
      ".mode-switcher{display:none!important;}",
      ".hero .content .desc,.banner .content .desc{max-width:760px;color:#a8b8ce;}",
      "body.home-3{background:radial-gradient(circle at 20% -10%,#0b1730 0%,#05070c 42%,#030407 100%)!important;}",
      ".home-3 .banner{position:relative;z-index:2;overflow:hidden;min-height:720px;background:radial-gradient(1200px 450px at 70% 20%,rgba(35,124,255,.16),rgba(5,10,18,0));}",
      "#homeHeroVideoWrap.home-hero-video{position:absolute;inset:0;height:min(760px,82vh);z-index:1;pointer-events:none;overflow:hidden;background:#04070d;}",
      "#homeHeroVideoWrap.home-hero-video::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,7,14,.78) 0%,rgba(3,7,14,.62) 35%,rgba(3,7,14,.86) 100%);}",
      "#homeHeroVideoWrap video{width:100%;height:100%;object-fit:cover;opacity:.44;filter:saturate(.72) brightness(.62);}",
      ".home-3 .banner .container{position:relative;z-index:3;}",
      ".home-3 .banner .banner__content{background:rgba(8,15,26,.35);border:1px solid rgba(74,108,158,.2);backdrop-filter:blur(5px);border-radius:18px;padding:28px 24px;text-align:center;margin:0 auto;}",
      ".home-3 .banner .banner__content .title{max-width:900px;}",
      ".home-3 .banner .banner__content .title,.home-3 .banner .banner__content .desc{margin-left:auto;margin-right:auto;}",
      ".home-3 .banner .banner__content .btn-action{display:inline-flex;margin:10px auto 0;justify-content:center;}",
      ".home-scroll-indicator{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;margin-top:22px;border-radius:999px;border:1px solid rgba(201,220,247,.55);background:rgba(7,15,28,.44);animation:homeScrollPulse 1.8s ease-in-out infinite;}",
      ".home-scroll-indicator img{width:20px;height:20px;object-fit:contain;}",
      "@keyframes homeScrollPulse{0%,100%{transform:translateY(0);opacity:.9;}50%{transform:translateY(7px);opacity:1;}}",
      ".home-brand-rail{position:relative;z-index:1001;border-top:1px solid rgba(89,113,149,.22);border-bottom:1px solid rgba(89,113,149,.22);background:rgba(5,11,20,.82);overflow:hidden;margin-top:18px;}",
      ".home-brand-rail .track{display:flex;align-items:center;gap:42px;white-space:nowrap;padding:10px 0;animation:homeBrandMarquee 20s linear infinite;}",
      ".home-brand-rail .item img{height:24px;width:auto;object-fit:contain;filter:brightness(0) invert(1) opacity(.92);}",
      "@keyframes homeBrandMarquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}",
      ".home-coinbase{position:relative;z-index:4;padding:24px 0 38px;}",
      ".home-coinbase .container{max-width:min(1650px,94vw)!important;}",
      ".cb-wrap{background:linear-gradient(150deg,rgba(7,15,27,.95),rgba(5,10,19,.96));border:1px solid rgba(89,113,149,.34);border-radius:22px;padding:30px;}",
      ".cb-top{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:16px;}",
      ".cb-brand{display:flex;align-items:center;gap:12px;}",
      ".cb-brand img{height:30px;width:auto;object-fit:contain;filter:brightness(0) invert(1);}",
      ".cb-title{margin:0;font-size:34px;line-height:1.1;}",
      ".cb-sub{margin:8px 0 0;color:#a8b8cf;max-width:880px;}",
      ".cb-links{display:flex;gap:10px;flex-wrap:wrap;}",
      ".cb-link{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 14px;border-radius:999px;border:1px solid rgba(120,146,181,.5);text-decoration:none;color:#ebf2ff;background:rgba(11,19,32,.7);font-weight:700;}",
      ".cb-link:hover{background:rgba(27,44,70,.82);color:#fff;}",
      ".cb-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px;}",
      ".cb-step{border:1px solid rgba(89,113,149,.3);background:rgba(8,15,27,.7);border-radius:14px;padding:14px;}",
      ".cb-step i{display:inline-flex;width:34px;height:34px;border-radius:50%;align-items:center;justify-content:center;background:rgba(72,118,189,.18);color:#d7e7ff;margin-bottom:10px;}",
      ".cb-step h5{margin:0 0 6px;font-size:15px;line-height:1.3;}",
      ".cb-step p{margin:0;color:#9fb2cd;font-size:13px;line-height:1.45;}",
      ".home-platforms{position:relative;z-index:4;padding:28px 0 42px;}",
      ".home-platforms .container{max-width:min(1650px,94vw)!important;}",
      ".hp2-wrap{border-radius:24px;padding:22px 22px 18px;}",
      ".hp2-head{display:grid;grid-template-columns:1.15fr .85fr;gap:26px;align-items:start;margin:0 0 20px;}",
      ".hp2-head h3{font-size:42px;line-height:1.08;margin:0;font-weight:800;letter-spacing:-.01em;}",
      ".hp2-head h3 .dot{color:#00e6ff;}",
      ".hp2-head p{font-size:22px;line-height:1.45;color:#d5e2f6;margin:8px 0 0;max-width:100%;}",
      ".hp2-visual{position:relative;border-radius:20px;overflow:hidden;background:#020712;}",
      ".hp2-visual img{display:block;width:100%;height:auto;max-height:540px;object-fit:cover;filter:brightness(.94);}",
      ".hp2-pill{position:absolute;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 24px;border:1px solid #00d7ff;border-radius:16px;background:linear-gradient(120deg,rgba(34,143,172,.65),rgba(12,39,88,.7));color:#eaf2ff;font-weight:800;font-size:17px;box-shadow:0 10px 30px rgba(0,0,0,.35);}",
      ".hp2-pill.mt5{left:21%;top:19%;}",
      ".hp2-pill.web{right:14%;top:19%;}",
      ".hp2-pill.mt4{left:8%;top:52%;}",
      ".hp2-pill.tv{right:18%;bottom:20%;}",
      ".home-app-launch{position:relative;z-index:4;padding:0 0 38px;}",
      ".home-app-launch .container{max-width:min(1650px,94vw)!important;}",
      ".hal-wrap{background:transparent;border:0;border-radius:0;padding:0;}",
      ".hal-wrap h3{margin:0 0 10px;font-size:36px;}",
      ".hal-wrap p{margin:0 0 16px;color:#abc0dc;max-width:780px;}",
      ".hal-wrap img{width:100%;height:auto;max-height:none;object-fit:cover;border-radius:16px;border:0;display:block;}",
      ".testimonials-2 .testimonials-box-2 .bottom .info img{display:none!important;}",
      ".testimonials-2 .testimonials-box-2 .bottom .info{gap:0!important;}",
      ".home-bonds{position:relative;z-index:4;padding:0 0 44px;}",
      ".home-bonds .container{max-width:min(1650px,94vw)!important;}",
      ".hb-wrap{background:linear-gradient(95deg,rgba(11,23,39,.98),rgba(7,16,28,.98));border:1px solid rgba(89,113,149,.34);border-radius:18px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;}",
      ".hb-wrap h3{margin:0;font-size:28px;line-height:1.15;}",
      ".hb-steps{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0;}",
      ".hb-step{border:1px solid rgba(89,113,149,.26);background:rgba(10,19,33,.72);border-radius:999px;padding:8px 12px;display:inline-flex;align-items:center;gap:8px;}",
      ".hb-step .num{font-size:18px;font-weight:800;color:#00e6ff;}",
      ".hb-step h5{margin:0;font-size:14px;}",
      ".hb-cta{display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 18px;border-radius:999px;background:#2f80ff;color:#fff;text-decoration:none;font-weight:800;}",
      ".testimonials-2{background:#000!important;border-top:1px solid rgba(80,107,146,.3);border-bottom:1px solid rgba(80,107,146,.3);}",
      ".map-extra-stats{margin-top:14px;padding:14px;border:1px solid rgba(88,112,150,.32);border-radius:12px;background:rgba(10,17,31,.7);}",
      ".map-extra-stats h6{margin:0 0 10px;font-size:15px;}",
      ".map-extra-stats .row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}",
      ".map-extra-stats b{display:block;font-size:22px;line-height:1.1;color:#00e6ff;}",
      ".map-extra-stats span{display:block;color:#a8bdd8;font-size:12px;margin-top:4px;}",
      ".home-market-overview{position:relative;z-index:4;padding:18px 0 10px;}",
      ".hm-wrap{background:linear-gradient(150deg,rgba(5,11,20,.96),rgba(4,8,16,.95));border:1px solid rgba(71,106,156,.32);border-radius:20px;padding:18px;}",
      ".hm-title{font-size:44px;line-height:1.05;margin:0 0 14px;font-weight:800;}",
      ".hm-grid{display:grid;grid-template-columns:1.6fr .9fr;gap:14px;}",
      ".hm-panel{background:#050a12;border:1px solid #1c293d;border-radius:14px;padding:12px;}",
      ".hm-tabs{display:flex;gap:18px;margin-bottom:10px;font-weight:700;color:#8ea4c2;}",
      ".hm-tabs .active{color:#fff;}",
      ".hm-table{width:100%;border-collapse:collapse;}",
      ".hm-table th,.hm-table td{padding:10px 8px;border-bottom:1px solid #162237;white-space:nowrap;}",
      ".hm-table th{color:#7f98b8;font-size:12px;}",
      ".hm-row-name{display:flex;align-items:center;gap:10px;font-weight:700;}",
      ".hm-coin{width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;background:#182536;color:#fff;}",
      ".hm-up{color:#1fd08a;font-weight:700;}",
      ".hm-down{color:#ef5968;font-weight:700;}",
      ".hm-btn{display:inline-flex;align-items:center;justify-content:center;padding:6px 16px;border:1px solid rgba(208,224,248,.7);border-radius:999px;color:#edf4ff;text-decoration:none;font-weight:700;}",
      ".hm-btn:hover{background:rgba(44,122,255,.18);border-color:#4b8cff;color:#fff;}",
      ".hm-side-list{display:flex;flex-direction:column;gap:12px;}",
      ".hm-side-card{background:#050a12;border:1px solid #1c293d;border-radius:14px;padding:12px;}",
      ".hm-side-card h5{margin:0 0 8px;font-size:34px;font-weight:800;}",
      ".hm-side-row{display:grid;grid-template-columns:1.3fr .8fr .7fr;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #152135;}",
      ".hm-side-row:last-child{border-bottom:0;}",
      ".home-why{position:relative;z-index:4;padding:44px 0 36px;}",
      ".home-why .container{max-width:min(1380px,88vw)!important;}",
      ".hw-title{margin:0 0 24px;font-size:52px;line-height:1.08;font-weight:800;text-align:center;}",
      ".hw-title .dot{color:#00e6ff;}",
      ".hw-grid{display:grid;grid-template-columns:repeat(3,minmax(0,360px));justify-content:center;gap:18px;align-items:stretch;}",
      ".hw-card{position:relative;overflow:hidden;border-radius:22px;background:#02060d;border:2px solid rgba(0,231,255,.9);box-shadow:0 0 0 1px rgba(255,255,255,.18) inset;min-height:520px;}",
      ".hw-card:nth-child(2){border-color:rgba(255,255,255,.9);}",
      ".hw-card:nth-child(2){transform:translateY(-36px) scale(1.015);box-shadow:0 18px 42px rgba(0,0,0,.38),0 0 0 1px rgba(255,255,255,.18) inset;}",
      ".hw-video{position:absolute;inset:0;background:#01040a;}",
      ".hw-video video{width:100%;height:100%;object-fit:cover;opacity:.95;}",
      ".hw-overlay{position:absolute;left:0;right:0;bottom:0;padding:18px 18px 20px;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(2,7,16,.82) 42%,rgba(2,7,16,.96) 100%);}",
      ".hw-eyebrow{margin:0;color:#dde9fb;font-size:16px;line-height:1.3;font-weight:500;}",
      ".hw-heading{margin:6px 0 10px;color:#00e6ff;font-size:40px;line-height:1.04;font-weight:800;max-width:95%;}",
      ".hw-copy{margin:0;color:#e8f1ff;font-size:14px;line-height:1.5;max-width:96%;}",
      "@keyframes hwRise{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}",
      ".hw-card{opacity:0;animation:hwRise .65s ease forwards;}",
      ".hw-card:nth-child(1){animation-delay:.05s;}",
      ".hw-card:nth-child(2){animation-delay:.14s;}",
      ".hw-card:nth-child(3){animation-delay:.22s;}",
      ".home-device-showcase{position:relative;z-index:4;padding:28px 0 42px;}",
      ".home-device-showcase .container,.home-market-overview .container,.home-premium .container{max-width:min(1780px,96vw)!important;}",
      ".hds-wrap{background:linear-gradient(160deg,rgba(8,16,28,.95),rgba(5,10,20,.95));border:1px solid rgba(75,111,160,.34);border-radius:24px;padding:34px;display:grid;grid-template-columns:.82fr 1.18fr;gap:28px;align-items:center;}",
      ".hds-copy h3{margin:0 0 10px;font-size:38px;line-height:1.06;}",
      ".hds-copy p{margin:0;color:#9ab0cd;line-height:1.7;}",
      ".hds-points{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}",
      ".hds-pill{border:1px solid rgba(78,114,162,.34);background:rgba(8,15,26,.72);border-radius:12px;padding:10px 12px;color:#dce9ff;font-size:13px;}",
      ".hds-image-wrap{position:relative;display:flex;justify-content:center;}",
      ".hds-image-wrap::before{content:'';position:absolute;inset:8% 18%;background:radial-gradient(circle,rgba(43,130,255,.35),rgba(43,130,255,0));filter:blur(16px);}",
      ".hds-image-wrap img{position:relative;max-width:min(100%,1180px);width:100%;height:auto;z-index:1;}",
      ".home-premium{position:relative;z-index:3;padding:22px 0 72px;}",
      ".hp-wrap{background:linear-gradient(160deg,rgba(7,14,25,.96),rgba(4,9,18,.95));border:1px solid rgba(71,106,156,.36);border-radius:24px;padding:42px;}",
      ".hp-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}",
      ".hp-card{background:linear-gradient(150deg,rgba(14,24,39,.96),rgba(9,16,28,.95));border:1px solid rgba(86,117,164,.32);border-radius:18px;padding:28px;}",
      ".hp-card h3{font-size:54px!important;line-height:1.03;margin-bottom:14px!important;}",
      ".hp-card h4{font-size:34px!important;line-height:1.1;margin-bottom:14px!important;}",
      ".hp-card p{font-size:19px;line-height:1.72;}",
      ".hp-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:22px;}",
      ".hp-stat b{display:block;font-size:48px;line-height:1.02;}",
      ".hp-stat span{display:block;color:#97adca;font-size:15px;margin-top:6px;}",
      ".hp-partners{overflow:hidden;position:relative;border:1px solid rgba(86,117,164,.32);border-radius:14px;padding:14px;background:rgba(7,14,25,.88);}",
      ".hp-track{display:flex;gap:34px;align-items:center;white-space:nowrap;animation:hp-marquee 18s linear infinite;}",
      ".hp-logo{display:inline-flex;align-items:center;gap:8px;color:#deebff;font-weight:700;opacity:.9;}",
      ".hp-logo i{font-size:20px;color:#58a1ff;}",
      "@keyframes hp-marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}",
      ".home-3 .header,.home-3 .services-2,.home-3 .section-sale,.home-3 footer{position:relative;z-index:3;}",
      "body.home-3 .banner .banner__content{opacity:0;transform:translateY(10px);}",
      "body.home-3.home-hero-ready .banner .banner__content{opacity:1;transform:translateY(0);transition:opacity .45s ease,transform .45s ease;}",
      "@media only screen and (max-width:1024px){.home-3 .banner .banner__content{padding:20px 16px;}.home-3 .banner .banner__content .title{font-size:40px;line-height:1.12;}}",
      "@media only screen and (max-width:991px){.hm-title{font-size:34px;}.hm-grid,.hw-grid,.cb-steps,.map-extra-stats .row,.hp2-head{grid-template-columns:1fr;}.hds-wrap{grid-template-columns:1fr;}.hds-copy h3{font-size:30px;}.hw-title{font-size:40px;}.hw-card{min-height:520px;transform:none!important;}.hw-heading{font-size:32px;}.hw-copy{font-size:14px;}.hw-eyebrow{font-size:15px;}.cb-title{font-size:28px;}.hp2-head h3{font-size:34px;}.hp2-head p{font-size:18px;}.hp2-pill{font-size:15px;min-height:40px;padding:0 16px;}.hb-wrap{display:block;}.hb-steps{margin:12px 0;}}",
      "@media only screen and (max-width:767px){.home-3 .banner{min-height:640px;}#homeHeroVideoWrap.home-hero-video{height:52vh;}.home-3 .banner .banner__content .title{font-size:30px;}.home-3 .banner .banner__content .desc{font-size:16px;line-height:1.45;}.home-3 .banner .banner__content .btn-action{min-height:44px;padding:0 20px;}.hm-title{font-size:30px;}.home-brand-rail .item img{height:20px;}.home-why{padding:30px 0 22px;}.hw-title{font-size:32px;}.hw-card{min-height:500px;}.hw-overlay{padding:14px;}.hw-heading{font-size:26px;}.hw-copy{font-size:13px;}.hw-eyebrow{font-size:14px;}.cb-wrap{padding:18px;}.hp2-wrap{padding:14px;}.hp2-head h3{font-size:34px;}.hp2-head p{font-size:18px;}.hp2-visual img{max-height:360px;}.hp2-pill{font-size:15px;min-height:38px;padding:0 14px;border-radius:12px;}.hal-wrap h3{font-size:30px;}.hb-wrap h3{font-size:22px;}.hb-step{padding:7px 10px;}}",
      ".page-title .breadcrumbs ul li,.footer__bottom p{color:#90a3be;}",
      "@media only screen and (max-width:1024px){.ui-login-links{display:none!important;}}"
    ].join("");
    document.head.appendChild(style);
  }

  function svgIcon(path, viewBox) {
    return '<span class="ui-btn-icon"><svg viewBox="' + (viewBox || "0 0 24 24") + '" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="' + path + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  }

  function enhanceActionButtons() {
    var map = [
      { selector: ".btn-action", text: /start trading/i, icon: svgIcon("M5 12h14M13 5l7 7-7 7") },
      { selector: ".btn-action", text: /join now/i, icon: svgIcon("M12 5v14M5 12h14") },
      { selector: ".btn-action", text: /save profile/i, icon: svgIcon("M5 12.5l4 4L19 7") },
      { selector: ".btn-action", text: /start crypto deposit/i, icon: svgIcon("M4 7h16M6 17h5M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z") },
      { selector: ".btn-action-3", text: /back to dashboard/i, icon: svgIcon("M15 18l-6-6 6-6") }
    ];

    map.forEach(function (rule) {
      document.querySelectorAll(rule.selector).forEach(function (el) {
        if (el.dataset.uiEnhanced === "1") return;
        var text = (el.textContent || "").trim();
        if (!rule.text.test(text)) return;
        el.dataset.uiEnhanced = "1";
        el.classList.add("ui-cta-polished");
        el.innerHTML = rule.icon + "<span>" + text + "</span>";
      });
    });
  }

  function ensureAuthHeaderStyles() {
    if (document.getElementById("auth-header-styles")) return;
    var style = document.createElement("style");
    style.id = "auth-header-styles";
    style.textContent = [
      ".auth-header-host{position:relative;display:flex;align-items:center;gap:10px;margin-left:12px;z-index:25;}",
      ".auth-assets-toggle{display:flex;align-items:center;gap:8px;min-height:38px;padding:0 14px;border-radius:10px;border:1px solid rgba(67,91,126,.75);background:rgba(10,16,28,.9);color:#f2f6ff;font-weight:700;cursor:pointer;}",
      ".auth-assets-toggle:hover{border-color:#2d7dff;color:#fff;}",
      ".auth-account-chip{display:flex;align-items:center;gap:8px;min-height:38px;padding:0 12px;border-radius:999px;border:1px solid rgba(67,91,126,.7);background:rgba(10,16,28,.85);color:#e7eef8;font-weight:600;max-width:180px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}",
      ".auth-account-chip img{width:24px;height:24px;border-radius:50%;}",
      ".auth-assets-panel{position:absolute;top:48px;right:0;width:min(92vw,375px);padding:16px 16px 12px;border-radius:16px;border:1px solid rgba(66,98,146,.65);background:linear-gradient(140deg,rgba(8,13,24,.97),rgba(12,21,33,.98));box-shadow:0 20px 55px rgba(0,0,0,.5);opacity:0;transform:translateY(-6px);pointer-events:none;transition:all .2s ease;}",
      ".auth-assets-panel.open{opacity:1;transform:translateY(0);pointer-events:auto;}",
      ".ahv-label{font-size:13px;color:#9eb2cc;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;}",
      ".ahv-value{font-size:46px;font-weight:800;line-height:1;margin-bottom:4px;letter-spacing:.5px;}",
      ".ahv-sub{font-size:15px;color:#9cb0cc;margin-bottom:14px;}",
      ".ah-action-row{display:flex;gap:10px;margin-bottom:10px;}",
      ".ah-action-btn{flex:1;min-height:48px;border-radius:999px;border:1px solid #2f5da2;background:rgba(14,22,38,.75);color:#f6f9ff;font-size:15px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;}",
      ".ah-action-btn.primary{background:#1e77e8;border-color:#1e77e8;}",
      ".ah-action-btn i{font-size:20px;}",
      ".ah-menu{padding:8px 0 2px;}",
      ".ah-menu-item{display:flex;align-items:center;gap:12px;padding:9px 6px;border-radius:8px;color:#f0f5ff;text-decoration:none;font-weight:600;}",
      ".ah-menu-item:hover{background:rgba(29,44,66,.7);}",
      ".ah-menu-item i{font-size:23px;min-width:26px;color:#d7e4fb;}",
      ".ah-menu-item.muted{color:#9fb2cd;}",
      ".ah-menu-item.logout{color:#ff8b8b;}",
      ".ah-menu-item.logout i{color:#ff8b8b;}",
      ".ah-menu-line{height:1px;background:rgba(88,113,151,.44);margin:8px 0;}",
      ".ah-history-tag{margin-left:auto;color:#9fb2ce;font-weight:700;}",
      ".ah-mobile-backdrop{display:none;}",
      "@media only screen and (max-width:1550px){.header .header__right .auth-header-host{display:flex !important;}}",
      "@media only screen and (max-width:1024px){.auth-account-chip span{display:none;}.auth-assets-panel{right:-8px;}}"
    ].join("");
    document.head.appendChild(style);
  }

  function normalizeHeaderMenu() {
    var menu = document.getElementById("menu-primary-menu");
    if (!menu) return;

    var items = Array.prototype.slice.call(menu.children || []);
    items.forEach(function (li) {
      var a = li.querySelector("a");
      var txt = (a && a.textContent ? a.textContent : "").trim().toLowerCase();

      if (txt === "homepage") {
        li.remove();
        return;
      }

      if (txt === "buy crypto") {
        li.className = "menu-item-has-children";
        if (a) {
          a.textContent = "Deposit";
          a.setAttribute("href", "#");
        }
        var sub = li.querySelector("ul.sub-menu");
        if (!sub) {
          sub = document.createElement("ul");
          sub.className = "sub-menu";
          li.appendChild(sub);
        }
        sub.innerHTML =
          '<li class="menu-item"><a href="/user-center/assets/deposit/fiat.html">Crypto Deposit</a></li>' +
          '<li class="menu-item"><a href="/trade.html?symbol=btc">Convert</a></li>';
      }

      if (txt === "blog") {
        li.className = "menu-item";
        if (a) {
          a.textContent = "News";
          a.setAttribute("href", "/blog-default.html");
        }
        var subBlog = li.querySelector("ul.sub-menu");
        if (subBlog) subBlog.remove();
      }

      if (txt === "pages") {
        li.remove();
        return;
      }

      if (txt === "sell crypto") {
        li.remove();
        return;
      }

      if (txt.indexOf("bitusdt") !== -1) {
        li.remove();
      }
    });
  }

  function setupTabsFallback() {
    var allTabs = document.querySelectorAll(".flat-tabs");
    allTabs.forEach(function (tabs) {
      var menu = tabs.querySelector(".menu-tab");
      var content = tabs.querySelector(".content-tab");
      if (!menu || !content) return;

      var liItems = Array.prototype.slice.call(menu.children || []);
      var panels = Array.prototype.slice.call(content.children || []);
      if (!liItems.length || !panels.length) return;

      function activate(i) {
        liItems.forEach(function (li, idx) {
          li.classList.toggle("active", idx === i);
        });
        panels.forEach(function (p, idx) {
          p.style.display = idx === i ? "block" : "none";
          p.classList.toggle("active", idx === i);
        });
      }

      var activeIndex = liItems.findIndex(function (li) {
        return li.classList.contains("active");
      });
      if (activeIndex < 0) activeIndex = 0;
      activate(activeIndex);

      liItems.forEach(function (li, idx) {
        if (li.dataset.tabBound === "1") return;
        li.dataset.tabBound = "1";
        li.addEventListener("click", function (e) {
          e.preventDefault();
          activate(idx);
        });
      });
    });
  }

  function ensureGuestLinks() {
    var right = document.querySelector(".header__right");
    if (!right) return;

    var old = document.getElementById("guestAuthLinks");
    if (old) old.remove();

    if (loggedIn()) {
      directDropdownChildren(right).forEach(function (d) {
        d.style.display = "";
      });
      return;
    }

    directDropdownChildren(right).forEach(function (d) {
      d.style.display = "none";
    });

    var wrap = document.createElement("div");
    wrap.id = "guestAuthLinks";
    wrap.className = "ui-login-links";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "12px";
    wrap.style.marginLeft = "10px";
    wrap.innerHTML = '<a href="/login.html" style="font-weight:600">Login</a><a href="/register.html" style="font-weight:600">Register</a>';

    right.insertBefore(wrap, right.firstChild || null);
  }

  function normalizeLogo() {
    document.querySelectorAll(".header .logo").forEach(function (logo) {
      ["light", "dark"].forEach(function (klass, idx) {
        var anchor = logo.querySelector("a." + klass);
        if (!anchor) {
          anchor = document.createElement("a");
          anchor.className = klass;
          anchor.href = "/index.html";
          logo.appendChild(anchor);
        }
        var img = anchor.querySelector("img");
        if (!img) {
          img = document.createElement("img");
          if (idx === 0 && !document.getElementById("site-logo")) {
            img.id = "site-logo";
          }
          anchor.appendChild(img);
        }
        img.src = "/assets/images/logo/logo-dark.png";
        img.alt = "Neura";
        img.setAttribute("width", "118");
        img.setAttribute("height", "32");
        img.removeAttribute("srcset");
        img.removeAttribute("data-retina");
        if (!img.dataset.logoFallbackBound) {
          img.dataset.logoFallbackBound = "1";
          img.addEventListener("error", function () {
            img.src = "/assets/images/logo/image-Photoroom.png";
          });
        }
      });
    });

    var logos = document.querySelectorAll(".header .logo img");
    logos.forEach(function (img) {
      img.src = "/assets/images/logo/logo-dark.png";
      img.alt = "Neura";
      img.setAttribute("width", "118");
      img.setAttribute("height", "32");
      img.removeAttribute("srcset");
      img.removeAttribute("data-retina");
      if (!img.dataset.logoFallbackBound) {
        img.dataset.logoFallbackBound = "1";
        img.addEventListener("error", function () {
          img.src = "/assets/images/logo/image-Photoroom.png";
        });
      }
    });
  }

  function removeThemeToggle() {
    document.querySelectorAll(".mode-switcher").forEach(function (el) {
      el.remove();
    });
  }

  function applyBrandingContent() {
    var title = document.querySelector("title");
    if (title) title.textContent = String(title.textContent || "").replace(/neura/gi, "Neura");

    var heroTitle = document.querySelector(".banner .banner__content .title");
    var heroDesc = document.querySelector(".banner .banner__content .desc");
    if (heroTitle && (window.location.pathname === "/" || window.location.pathname.endsWith("/index.html"))) {
      heroTitle.textContent = "Invest in AI and crypto with confidence";
    }
    if (heroDesc && (window.location.pathname === "/" || window.location.pathname.endsWith("/index.html"))) {
      heroDesc.textContent = "Neura is a secure crypto and ETH wallet built for future-focused investors. Explore leading AI tokens, ETH exposure to top AI tech growth, plus BTC and major cryptocurrencies in one account.";
    }

    var whyTitle = document.querySelector(".services__content .heading");
    if (whyTitle && /why choose neura/i.test(whyTitle.textContent || "")) {
      whyTitle.textContent = "Why choose Neura";
    }

    var whyDesc = document.querySelector(".services__content .desc");
    if (whyDesc && /neura has a variety/i.test(whyDesc.textContent || "")) {
      whyDesc.textContent = "Neura combines secure wallet infrastructure with a focused AI investing experience, while still supporting major crypto markets.";
    }

    document.querySelectorAll("h3.heading, h6.title, p, a").forEach(function (el) {
      if (!el || !el.textContent) return;
      if (el.matches(".logo a, .logo a *")) return;
      if (el.querySelector && el.querySelector("img,svg")) return;
      el.textContent = el.textContent.replace(/\bneura\b/g, "Neura");
      el.textContent = el.textContent.replace(/\bFiat Deposit\b/g, "Crypto Deposit");
    });

    var footerBottom = document.querySelector(".footer__bottom p");
    if (footerBottom) {
      footerBottom.textContent = String(footerBottom.textContent || "").replace(/neura\.com/gi, "Neura");
    }
  }

  function closeAssetsPanel() {
    var panel = document.getElementById("ahAssetsPanel");
    if (panel) panel.classList.remove("open");
  }

  function toggleAssetsPanel() {
    var panel = document.getElementById("ahAssetsPanel");
    if (!panel) return;
    panel.classList.toggle("open");
  }

  function renderAuthHost(right) {
    var host = document.getElementById("authHeaderHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "authHeaderHost";
      host.className = "auth-header-host";
      host.innerHTML =
        '<button class="auth-assets-toggle" id="ahAssetsToggle" type="button" aria-expanded="false">' +
          '<span>Assets</span><i class="fa-solid fa-chevron-down"></i>' +
        "</button>" +
        '<button class="auth-account-chip" id="ahAccountChip" type="button">' +
          '<img src="/assets/images/avt/avt-01.jpg" alt="Account">' +
          '<span id="ahAccountName">Account</span>' +
        "</button>" +
        '<div class="auth-assets-panel" id="ahAssetsPanel">' +
          '<a href="/user-center/assets/dashboard.html" class="ahv-label" style="text-decoration:none;"><span>Estimated Total Value (USD)</span><i class="fa-solid fa-arrow-up-right-from-square"></i></a>' +
          '<div class="ahv-value" id="ahAssetsValue">$0.00</div>' +
          '<div class="ahv-sub" id="ahAssetsBtc">≈ 0.00000000 BTC</div>' +
          '<div class="ah-action-row">' +
            '<a class="ah-action-btn primary" href="/user-center/assets/deposit/fiat.html"><i class="fa-solid fa-wallet"></i><span>Deposit</span></a>' +
            '<a class="ah-action-btn" href="/user-center/withdrawals.html"><i class="fa-solid fa-arrow-up-right-from-square"></i><span>Withdraw</span></a>' +
          "</div>" +
          '<div class="ah-menu">' +
            '<a class="ah-menu-item" href="/user-center/assets/deposit/fiat.html"><i class="fa-solid fa-wallet"></i><span>Crypto Deposit</span></a>' +
            '<a class="ah-menu-item" href="/trade.html?symbol=btc"><i class="fa-solid fa-arrow-right-arrow-left"></i><span>Transfer</span></a>' +
            '<a class="ah-menu-item" href="/user-center/profile-page.html"><i class="fa-solid fa-user"></i><span>Account</span></a>' +
            '<a class="ah-menu-item muted" href="/user-center/assets/deposit/fiat.html"><i class="fa-regular fa-clock"></i><span>Deposit History</span><span class="ah-history-tag">USD</span></a>' +
            '<div class="ah-menu-line"></div>' +
            '<a class="ah-menu-item logout" href="#" id="ahLogoutBtn"><i class="fa-solid fa-power-off"></i><span>Logout</span></a>' +
          "</div>" +
        "</div>";
      right.insertBefore(host, right.firstChild || null);
    }

    var toggleBtn = document.getElementById("ahAssetsToggle");
    if (toggleBtn && !toggleBtn.dataset.bound) {
      toggleBtn.dataset.bound = "1";
      toggleBtn.addEventListener("click", function (e) {
        e.preventDefault();
        toggleAssetsPanel();
      });
    }

    if (!host.dataset.hoverBound) {
      host.dataset.hoverBound = "1";
      host.addEventListener("mouseenter", function () {
        if (window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
          var panel = document.getElementById("ahAssetsPanel");
          if (panel) panel.classList.add("open");
        }
      });
      host.addEventListener("mouseleave", function () {
        if (window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
          closeAssetsPanel();
        }
      });
    }

    var accountChip = document.getElementById("ahAccountChip");
    if (accountChip && !accountChip.dataset.bound) {
      accountChip.dataset.bound = "1";
      accountChip.addEventListener("click", function () {
        window.location.href = "/user-center/profile-page.html";
      });
    }

    var logout = document.getElementById("ahLogoutBtn");
    if (logout && !logout.dataset.bound) {
      logout.dataset.bound = "1";
      logout.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        window.location.href = "/login.html";
      });
    }

    if (!document.body.dataset.authPanelDocBound) {
      document.body.dataset.authPanelDocBound = "1";
      document.addEventListener("click", function (e) {
        var hostEl = document.getElementById("authHeaderHost");
        if (!hostEl) return;
        if (hostEl.contains(e.target)) return;
        closeAssetsPanel();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeAssetsPanel();
      });
    }
  }

  function ensureAuthMenus() {
    var right = document.querySelector(".header__right");
    if (!right) return;

    ensureAuthHeaderStyles();

    Array.prototype.slice.call(right.querySelectorAll(".wallet")).forEach(function (w) {
      w.remove();
    });

    var oldUser = right.querySelector(".dropdown.user");
    if (oldUser) oldUser.style.display = loggedIn() ? "none" : "";

    var host = document.getElementById("authHeaderHost");
    if (!loggedIn()) {
      if (host) host.remove();
      directDropdownChildren(right).forEach(function (d) {
        if (d.classList.contains("user")) return;
        d.style.display = "";
      });
      return;
    }

    directDropdownChildren(right).forEach(function (d) {
      if (d.classList.contains("notification")) return;
      d.style.display = "none";
    });

    renderAuthHost(right);
  }

  var loadedUser = false;
  async function fillAuthInfo() {
    if (!loggedIn()) return;

    var token = getToken();
    var assetsValue = document.getElementById("ahAssetsValue");
    var assetsBtc = document.getElementById("ahAssetsBtc");
    var accountName = document.getElementById("ahAccountName");

    try {
      var balRes = await fetch("/balance", {
        headers: { Authorization: "Bearer " + token }
      });

      if (balRes.status === 401 || balRes.status === 403) {
        localStorage.removeItem("token");
        ensureGuestLinks();
        ensureAuthMenus();
        return;
      }

      if (balRes.ok && assetsValue) {
        var b = await balRes.json();
        var usd = Number(b.total_usd_balance || b.balance || b.usd_balance || 0);
        var btcTotal = Number(b.total_btc_balance || b.btc_balance || 0);
        assetsValue.textContent = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usd);
        if (assetsBtc) {
          assetsBtc.textContent = "≈ " + btcTotal.toFixed(8) + " BTC";
        }
      }
    } catch (_) {}

    if (loadedUser) return;
    loadedUser = true;

    try {
      var meRes = await fetch("/api/me", {
        headers: { Authorization: "Bearer " + token }
      });
      if (meRes.ok && accountName) {
        var me = await meRes.json();
        accountName.textContent =
          me.first_name || me.username || (me.email ? String(me.email).split("@")[0] : "Account");
      }
    } catch (_) {}
  }

  function renderAll() {
    ensureProfessionalFont();
    ensureFontAwesome();
    ensureTemplateCoinIconCss();
    ensureSharedUiStyles();
    normalizeLogo();
    removeThemeToggle();
    normalizeHeaderMenu();
    ensureGuestLinks();
    ensureAuthMenus();
    setupTabsFallback();
    fillAuthInfo();
    enhanceActionButtons();
    applyBrandingContent();
    normalizeUserCenterSidebar();
    initHomeHeroVideo();
    ensureTopLogoCarousel();
    ensureHomeMarketOverview();
    ensureHomeWhySection();
    ensureCoinbasePartnerSection();
    ensureHomePlatformsSection();
    ensureHomeAppLaunchSection();
    ensureHomeBondsStartSection();
    tuneHomeUtilityElements();
    cleanHomeEmptySections();
    enhanceMapSection();
    tuneHomeTestimonials();
    normalizeFooterBranding();
    removeHomeLastBlogSection();
    removeUnwantedFooters();
    improveAuthPages();
  }

  function normalizeFooterBranding() {
    document.querySelectorAll("footer .logo img, .footer .logo img").forEach(function (img) {
      img.src = "/assets/images/logo/logo-dark.png";
      img.alt = "Neura";
      img.style.maxHeight = "34px";
      img.style.width = "auto";
    });
  }

  function removeUnwantedFooters() {
    var path = String(window.location.pathname || "");
    if (path.indexOf("/trade.html") !== -1 || path.indexOf("/markets.html") !== -1 || path.indexOf("/user-center/") !== -1) {
      document.querySelectorAll("footer.footer, body > footer").forEach(function (f) { f.remove(); });
    }
  }

  function removeHomeLastBlogSection() {
    if (!document.body.classList.contains("home-3")) return;
    var blog = document.querySelector(".blog-2");
    if (blog) blog.remove();
    var join = document.querySelector(".join");
    if (join) join.remove();
  }

  function improveAuthPages() {
    var path = String(window.location.pathname || "");
    if (!(path.endsWith("/login.html") || path.endsWith("/register.html"))) return;

    if (!document.getElementById("auth-page-polish")) {
      var style = document.createElement("style");
      style.id = "auth-page-polish";
      style.textContent = [
        "body{background:radial-gradient(1200px 500px at 80% -10%,rgba(43,126,255,.18),rgba(2,8,14,0)),#05070c!important;}",
        ".page-title{display:none;}",
        "section.register{padding:26px 0 56px;}",
        "section.register .container{max-width:980px;}",
        "section.register .block-text{margin-bottom:18px;}",
        "section.register .flat-tabs{background:rgba(11,19,31,.82);border:1px solid rgba(82,111,156,.34);backdrop-filter:blur(8px);border-radius:18px;padding:24px;}",
        "section.register .menu-tab{display:none!important;}",
        "section.register .content-tab .content-inner{display:block!important;}",
        "section.register form .form-group{margin-bottom:12px;}",
        "section.register form .form-control{min-height:46px;border-radius:10px;border:1px solid #30445f;background:#111d2f;color:#e6effb;padding:0 12px;}",
        "section.register form textarea.form-control{padding:10px 12px;min-height:110px;}",
        "section.register form .btn-action{min-height:46px;border-radius:999px;padding:0 20px;}",
        "section.register .bottom{margin-top:12px;}",
        "@media(max-width:767px){section.register .flat-tabs{padding:16px;}section.register .block-text .heading{font-size:28px;}}"
      ].join("");
      document.head.appendChild(style);
    }

    var title = document.querySelector("section.register .block-text .heading");
    var desc = document.querySelector("section.register .block-text .desc");
    if (title) title.textContent = path.endsWith("/login.html") ? "Login to Neura" : "Create Your Neura Account";
    if (desc) desc.textContent = "Secure access to your AI-focused crypto wallet.";
  }

  function initHomeHeroVideo() {
    if (!document.body.classList.contains("home-3")) return;
    var banner = document.querySelector(".banner");
    if (!banner) return;

    var wrap = document.getElementById("homeHeroVideoWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "homeHeroVideoWrap";
      wrap.className = "home-hero-video";
      wrap.innerHTML =
        '<video id="homeHeroVideo" autoplay muted loop playsinline preload="metadata" aria-hidden="true">' +
          '<source src="/assets/video/home-hero.mp4" type="video/mp4" />' +
        "</video>";
      banner.insertBefore(wrap, banner.firstChild);
    } else if (wrap.parentNode !== banner) {
      banner.insertBefore(wrap, banner.firstChild);
    }

    var video = wrap.querySelector("video");
    if (video && typeof video.play === "function") {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(function () {});
    }

    if (!document.body.classList.contains("home-hero-ready")) {
      requestAnimationFrame(function () {
        document.body.classList.add("home-hero-ready");
      });
    }
  }

  function on(path) {
    var p = String(window.location.pathname || "");
    return p === path || p.endsWith(path);
  }

  function spark(seed) {
    var out = "";
    var h = 32;
    var w = 128;
    var val = seed || 50;
    for (var i = 0; i < 20; i++) {
      val += (Math.random() - 0.45) * 8;
      val = Math.max(18, Math.min(88, val));
      var x = (i / 19) * w;
      var y = h - (val / 100) * h;
      out += (i ? " L " : "M ") + x.toFixed(2) + " " + y.toFixed(2);
    }
    return out;
  }

  function coinMark(sym) {
    var s = String(sym || "").toUpperCase();
    if (s === "BTC") return "B";
    if (s === "ETH") return "E";
    if (s === "SOL") return "S";
    if (s === "XRP") return "X";
    if (s === "AIQ") return "AI";
    return s.slice(0, 2);
  }

  function ensureTopLogoCarousel() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    if (document.getElementById("homeBrandRail")) return;
    var footer = document.querySelector("footer");
    if (!footer || !footer.parentNode) return;

    var logos = [
      "/assets/images/icon/coinmarketcap-logo.webp",
      "/assets/images/icon/investing-partner-logo.webp",
      "/assets/images/icon/sumsub-logo.webp",
      "/assets/images/icon/tradingview-logo.webp",
      "/assets/images/icon/mastercard-logo.png",
      "/assets/images/icon/visa-logo.png",
      "/assets/images/icon/simplex-logo.webp",
      "/assets/images/icon/alchemy-logo.webp",
      "/assets/images/icon/securitymetrics-logo.png"
    ];

    var line = logos.concat(logos).map(function (src) {
      return '<span class="item"><img src="' + src + '" alt="" /></span>';
    }).join("");

    var rail = document.createElement("div");
    rail.id = "homeBrandRail";
    rail.className = "home-brand-rail";
    rail.innerHTML = '<div class="container"><div class="track">' + line + "</div></div>";
    footer.parentNode.insertBefore(rail, footer);
  }

  function ensureCoinbasePartnerSection() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    if (document.getElementById("homeCoinbasePartner")) return;
    var target = document.querySelector(".trading");
    if (!target || !target.parentNode) return;

    var sec = document.createElement("section");
    sec.className = "home-coinbase";
    sec.id = "homeCoinbasePartner";
    sec.innerHTML = '' +
      '<div class="container">' +
        '<div class="cb-wrap">' +
          '<div class="cb-top">' +
            '<div>' +
              '<div class="cb-brand"><img src="/assets/images/logo/coinbase-logo-0.webp" alt="Coinbase Partner" /><h3 class="cb-title">Coinbase Partner Onboarding</h3></div>' +
              '<p class="cb-sub">Download Coinbase, connect your wallet, buy with Apple Pay or Google Pay, then start investing in AI on Neura with access to top ETH tokens and free financial help desk support.</p>' +
            '</div>' +
            '<div class="cb-links">' +
              '<a class="cb-link" href="https://apps.apple.com/us/app/coinbase-buy-bitcoin-ether/id886427730" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-apple"></i> Download on App Store</a>' +
              '<a class="cb-link" href="https://play.google.com/store/apps/details?id=com.coinbase.android" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-google-play"></i> Get it on Google Play</a>' +
            '</div>' +
          '</div>' +
          '<div class="cb-steps">' +
            '<article class="cb-step"><i class="fa-solid fa-mobile-screen-button"></i><h5>1. Download Coinbase</h5><p>Install the official Coinbase app on iOS or Android.</p></article>' +
            '<article class="cb-step"><i class="fa-solid fa-wallet"></i><h5>2. Connect Wallet</h5><p>Connect your wallet securely and verify your account.</p></article>' +
            '<article class="cb-step"><i class="fa-brands fa-apple-pay"></i><h5>3. Buy with Apple/Google Pay</h5><p>Use Apple Pay or Google Pay for fast funding.</p></article>' +
            '<article class="cb-step"><i class="fa-solid fa-brain"></i><h5>4. Invest in AI on Neura</h5><p>Move to Neura and open AI-focused positions.</p></article>' +
            '<article class="cb-step"><i class="fa-solid fa-headset"></i><h5>5. Get Free Financial Help Desk</h5><p>Access support for ETH tokens, coin selection, and setup.</p></article>' +
          '</div>' +
        '</div>' +
      '</div>';
    target.parentNode.insertBefore(sec, target);
  }

  function ensureHomePlatformsSection() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    if (document.getElementById("homePlatformsSection")) return;
    var target = document.querySelector(".home-app-launch") || document.querySelector(".trading");
    if (!target || !target.parentNode) return;
    var sec = document.createElement("section");
    sec.className = "home-platforms";
    sec.id = "homePlatformsSection";
    sec.innerHTML = '' +
      '<div class="container">' +
        '<div class="hp2-wrap">' +
          '<div class="hp2-head">' +
            '<h3>Always Ready For Your Next Move<span class="dot">.</span></h3>' +
            '<p>Wherever the market takes you, our trading platform suite keeps you prepared at every step.</p>' +
          '</div>' +
          '<div class="hp2-visual">' +
            '<img src="/assets/images/layout/home_platforms_img1_new.webp" alt="Trading platforms" />' +
            '<span class="hp2-pill mt5">MetaTrader 5</span>' +
            '<span class="hp2-pill web">WebTrader</span>' +
            '<span class="hp2-pill mt4">MetaTrader 4</span>' +
            '<span class="hp2-pill tv">TradingView</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    target.parentNode.insertBefore(sec, target);
  }

  function ensureHomeAppLaunchSection() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    if (document.getElementById("homeAppLaunchSection")) return;
    var target = document.querySelector(".home-bonds") || document.querySelector(".home-premium") || document.querySelector(".trading");
    if (!target || !target.parentNode) return;
    var sec = document.createElement("section");
    sec.className = "home-app-launch";
    sec.id = "homeAppLaunchSection";
    sec.innerHTML = '' +
      '<div class="container">' +
        '<div class="hal-wrap">' +
          '<h3>New App Launch: Neura Mobile</h3>' +
          '<p>Trade, track, and rebalance AI-focused positions on the go with a streamlined mobile-first interface.</p>' +
          '<img src="/assets/images/layout/app-nerua.jpeg" alt="Neura app launch" />' +
        '</div>' +
      '</div>';
    target.parentNode.insertBefore(sec, target);
  }

  function ensureHomeBondsStartSection() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    if (document.getElementById("homeBondsSection")) return;
    var rail = document.getElementById("homeBrandRail");
    var footer = document.querySelector("footer");
    var target = rail || footer;
    if (!target || !target.parentNode) return;
    var sec = document.createElement("section");
    sec.className = "home-bonds";
    sec.id = "homeBondsSection";
    sec.innerHTML = '' +
      '<div class="container">' +
        '<div class="hb-wrap">' +
          '<h3>Start Trading Bonds With Neura Today.</h3>' +
          '<div class="hb-steps">' +
            '<article class="hb-step"><span class="num">1</span><h5>Register</h5></article>' +
            '<article class="hb-step"><span class="num">2</span><h5>Deposit</h5></article>' +
            '<article class="hb-step"><span class="num">3</span><h5>Trade</h5></article>' +
          '</div>' +
          '<a class="hb-cta" href="/register.html"><i class="fa-solid fa-arrow-right"></i> Open Account Now</a>' +
        '</div>' +
      '</div>';
    target.parentNode.insertBefore(sec, target);
  }

  function tuneHomeUtilityElements() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    var sc = document.querySelector(".home-scroll-indicator");
    if (sc) sc.setAttribute("href", "#homeWhySection");
  }

  function cleanHomeEmptySections() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    var services = document.querySelector(".services-2");
    if (services) services.remove();
    var trading = document.querySelector(".trading");
    if (trading) trading.remove();
    var premium = document.getElementById("homePremiumWrap");
    if (premium) premium.remove();
    var device = document.getElementById("homeDeviceShowcase");
    if (device) device.remove();
    document.querySelectorAll("section").forEach(function (sec) {
      if (!sec || !sec.parentNode) return;
      var id = sec.id || "";
      if (id === "homeHeroVideoWrap" || id === "homeWhySection" || id === "homeCoinbasePartner" || id === "homePlatformsSection" || id === "homeAppLaunchSection" || id === "homeBondsSection") return;
      if (sec.classList.contains("banner") || sec.classList.contains("home-market-overview") || sec.classList.contains("counter-numbers") || sec.classList.contains("testimonials-2")) return;
      var txt = (sec.textContent || "").replace(/\s+/g, "");
      var hasMedia = sec.querySelector("img,video,iframe,canvas,svg");
      if (txt.length < 40 && !hasMedia) sec.remove();
    });
  }

  function enhanceMapSection() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    var numbers = document.querySelector(".counter-numbers .block-text");
    if (numbers && !document.getElementById("numbersExtraStats")) {
      var n = document.createElement("div");
      n.id = "numbersExtraStats";
      n.className = "map-extra-stats";
      n.innerHTML = '' +
        '<h6>Live Global Coverage</h6>' +
        '<div class="row">' +
          '<div><b>87</b><span>Countries Served</span></div>' +
          '<div><b>310+</b><span>Tradable Markets</span></div>' +
          '<div><b>24/7</b><span>Help Desk Availability</span></div>' +
        '</div>';
      numbers.appendChild(n);
    }
    var mapWrap = document.querySelector(".testimonials-2 .map-testimonial");
    if (!mapWrap) return;
    if (document.getElementById("mapExtraStats")) return;
    var box = document.createElement("div");
    box.id = "mapExtraStats";
    box.className = "map-extra-stats";
    box.innerHTML = '' +
      '<h6>Global Client Activity Snapshot</h6>' +
      '<div class="row">' +
        '<div><b>124K+</b><span>Monthly Active Traders</span></div>' +
        '<div><b>$3.8B</b><span>Monthly Volume Processed</span></div>' +
        '<div><b>98.7%</b><span>Support Satisfaction Rate</span></div>' +
      '</div>';
    mapWrap.appendChild(box);
  }

  function tuneHomeTestimonials() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    var slides = document.querySelectorAll(".testimonials-2 .swiper-slide .testimonials-box-2");
    if (!slides.length) return;

    var reviews = [
      {
        title: '"Neura Wallet is super simple to use."',
        body: "Clean dashboard, fast setup, and clear portfolio tracking. I was trading in minutes without confusion.",
        id: "ID NEURA-WLT-1042"
      },
      {
        title: '"Easy to trade, even for beginners."',
        body: "Order flow is straightforward, pricing is transparent, and it is easy to switch between AI and crypto markets.",
        id: "ID NEURA-WLT-2287"
      },
      {
        title: '"Customer service is excellent."',
        body: "Support replied quickly and solved my funding issue step by step. The help desk experience was smooth.",
        id: "ID NEURA-WLT-3371"
      },
      {
        title: '"Reliable wallet + smooth execution."',
        body: "I can fund, rebalance, and monitor positions without friction. The app feels stable and professional.",
        id: "ID NEURA-WLT-4499"
      },
      {
        title: '"Great for AI-focused investing."',
        body: "I use it to access top ETH ecosystem tokens and manage AI exposure in one place with clear controls.",
        id: "ID NEURA-WLT-5630"
      },
      {
        title: '"Best onboarding experience I have used."',
        body: "From registration to first trade, every step felt clear. Apple Pay deposit and wallet connection were quick.",
        id: "ID NEURA-WLT-6784"
      }
    ];

    slides.forEach(function (card, idx) {
      var review = reviews[idx % reviews.length];
      var h = card.querySelector("h6");
      var p = card.querySelector(".text");
      var name = card.querySelector(".name");
      var role = card.querySelector(".position");
      if (h) h.textContent = review.title;
      if (p) p.textContent = review.body;
      if (name) name.textContent = review.id;
      if (role) role.textContent = "Neura Wallet User";
    });
  }

  function ensureHomeMarketOverview() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    if (document.getElementById("homeMarketOverview")) return;
    var banner = document.querySelector(".banner");
    if (!banner || !banner.parentNode) return;

    var sec = document.createElement("section");
    sec.className = "home-market-overview";
    sec.id = "homeMarketOverview";
    sec.innerHTML = '' +
      '<div class="container">' +
        '<div class="hm-wrap">' +
          '<h3 class="hm-title">Seize Your Next Trading Opportunity</h3>' +
          '<div class="hm-grid">' +
            '<div class="hm-panel">' +
              '<div class="hm-tabs"><span class="active">Hot Futures</span><span>Hot Spot</span><span>Hot TradFi</span></div>' +
              '<table class="hm-table"><thead><tr><th>Products</th><th>Latest Price</th><th>24H Change</th><th>Chart</th><th>Trade</th></tr></thead><tbody id="hmMainRows"></tbody></table>' +
            '</div>' +
            '<div class="hm-side-list">' +
              '<article class="hm-side-card"><h5>Gainers</h5><div id="hmGainers"></div></article>' +
              '<article class="hm-side-card"><h5>New</h5><div id="hmNew"></div></article>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    banner.parentNode.insertBefore(sec, banner.nextSibling);

    function rowHtml(item) {
      var up = Number(item.price_change_percentage_24h || 0) >= 0;
      var symbol = String(item.symbol || "").toLowerCase();
      var route = "/trade.html?symbol=" + encodeURIComponent(symbol);
      var sparkPath = spark(up ? 65 : 45);
      return '' +
        '<tr>' +
          '<td><div class="hm-row-name"><span class="hm-coin">' + coinMark(item.symbol) + '</span><span>' + String(item.symbol || "").toUpperCase() + 'USDT</span></div></td>' +
          '<td>$' + Number(item.current_price || 0).toLocaleString("en-US", { maximumFractionDigits: 4 }) + "</td>" +
          '<td class="' + (up ? "hm-up" : "hm-down") + '">' + (up ? "+" : "") + Number(item.price_change_percentage_24h || 0).toFixed(2) + "%</td>" +
          '<td><svg width="128" height="32" viewBox="0 0 128 32" fill="none"><path d="' + sparkPath + '" stroke="' + (up ? "#1fd08a" : "#ef5968") + '" stroke-width="2" fill="none"/></svg></td>' +
          '<td><a class="hm-btn" href="' + route + '">Trade</a></td>' +
        "</tr>";
    }

    function sideHtml(item, name) {
      var up = Number(item.price_change_percentage_24h || 0) >= 0;
      return '' +
        '<div class="hm-side-row">' +
          '<div><div style="display:flex;align-items:center;gap:8px;"><span class="hm-coin">' + coinMark(item.symbol) + "</span><strong>" + String(item.symbol || "").toUpperCase() + "USDT</strong></div>" +
          (name ? '<div style="font-size:12px;color:#8ea5c2;margin-top:3px;">' + name + "</div>" : "") + "</div>" +
          "<div>$" + Number(item.current_price || 0).toLocaleString("en-US", { maximumFractionDigits: 4 }) + "</div>" +
          '<div class="' + (up ? "hm-up" : "hm-down") + '">' + (up ? "+" : "") + Number(item.price_change_percentage_24h || 0).toFixed(2) + "%</div>" +
        "</div>";
    }

    fetch("/markets").then(function (r) { return r.json(); }).then(function (all) {
      if (!Array.isArray(all) || !all.length) throw new Error("empty");
      var withAiq = all.slice(0, 9);
      withAiq.unshift({ symbol: "aiq", current_price: 48.35, price_change_percentage_24h: -0.5 });
      var rows = withAiq.slice(0, 7);
      var gainers = withAiq.slice().sort(function (a, b) {
        return Number(b.price_change_percentage_24h || 0) - Number(a.price_change_percentage_24h || 0);
      }).slice(0, 3);
      var newList = [
        { symbol: "aiq", current_price: 48.35, price_change_percentage_24h: -0.5, name: "Global X AI ETF" },
        { symbol: "tsm", current_price: 338.29, price_change_percentage_24h: 0.44, name: "Taiwan Semiconductor" },
        { symbol: "cost", current_price: 1008.09, price_change_percentage_24h: 0.42, name: "Costco Wholesale" }
      ];

      var main = document.getElementById("hmMainRows");
      var g = document.getElementById("hmGainers");
      var n = document.getElementById("hmNew");
      if (main) main.innerHTML = rows.map(rowHtml).join("");
      if (g) g.innerHTML = gainers.map(function (x) { return sideHtml(x); }).join("");
      if (n) n.innerHTML = newList.map(function (x) { return sideHtml(x, x.name); }).join("");
    }).catch(function () {
      var main = document.getElementById("hmMainRows");
      if (main) main.innerHTML = '<tr><td colspan="5" style="color:#90a6c2;">Live markets unavailable. Retry in a moment.</td></tr>';
    });
  }

  function ensureHomeWhySection() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    if (document.getElementById("homeWhySection")) return;
    var target = document.querySelector(".services-2");
    if (!target || !target.parentNode) return;

    var sec = document.createElement("section");
    sec.className = "home-why";
    sec.id = "homeWhySection";
    sec.innerHTML = '' +
      '<div class="container">' +
        '<h3 class="hw-title">Why Choose Neura<span class="dot">.</span></h3>' +
        '<div class="hw-grid">' +
          '<article class="hw-card">' +
            '<div class="hw-video">' +
              '<video autoplay muted loop playsinline preload="metadata" aria-hidden="true"><source src="/assets/images/widget%20/home-choose-us-animation1.webm" type="video/webm" /></video>' +
            "</div>" +
            '<div class="hw-overlay">' +
              '<p class="hw-eyebrow">Make informed trades</p>' +
              '<h4 class="hw-heading">Your key to staying ahead</h4>' +
              '<p class="hw-copy">Upgrade your trading edge with smart technology and complete market intelligence. Analyze charts and use expert insight before you execute.</p>' +
            "</div>" +
          "</article>" +
          '<article class="hw-card">' +
            '<div class="hw-video">' +
              '<video autoplay muted loop playsinline preload="metadata" aria-hidden="true"><source src="/assets/images/widget%20/home-choose-us-animation2.webm" type="video/webm" /></video>' +
            "</div>" +
            '<div class="hw-overlay">' +
              '<p class="hw-eyebrow">Support is one chat away</p>' +
              '<h4 class="hw-heading">Contact us anytime, anywhere</h4>' +
              '<p class="hw-copy">Our multilingual support team is ready to answer your questions and solve issues fast, so you can stay focused on your trading plan.</p>' +
            "</div>" +
          "</article>" +
          '<article class="hw-card">' +
            '<div class="hw-video">' +
              '<video autoplay muted loop playsinline preload="metadata" aria-hidden="true"><source src="/assets/images/widget%20/home-choose-us-animation3.webm" type="video/webm" /></video>' +
            "</div>" +
            '<div class="hw-overlay">' +
              '<p class="hw-eyebrow">Peace of mind</p>' +
              '<h4 class="hw-heading">Your capital is protected</h4>' +
              '<p class="hw-copy">Client funds are safeguarded with strict controls and resilient infrastructure built to keep your assets protected in volatile markets.</p>' +
            "</div>" +
          "</article>" +
        "</div>" +
      "</div>";
    target.parentNode.insertBefore(sec, target);
  }

  function ensureHomeDeviceShowcase() {
    if (!on("/index.html") && window.location.pathname !== "/") return;
    if (document.getElementById("homeDeviceShowcase")) return;
    var target = document.querySelector(".services-2");
    if (!target || !target.parentNode) return;

    var sec = document.createElement("section");
    sec.className = "home-device-showcase";
    sec.id = "homeDeviceShowcase";
    sec.innerHTML = '' +
      '<div class="container">' +
        '<div class="hds-wrap">' +
          '<div class="hds-copy">' +
            '<h3>One Wallet Across Desktop And Mobile</h3>' +
            '<p>Monitor crypto and AI ETF positions in real time, execute spot and trade actions in seconds, and keep your portfolio synced with enterprise-grade protection.</p>' +
            '<div class="hds-points">' +
              '<div class="hds-pill"><i class="fa-solid fa-shield-halved"></i> Multi-layer account protection</div>' +
              '<div class="hds-pill"><i class="fa-solid fa-bolt"></i> Fast execution and live pricing</div>' +
              '<div class="hds-pill"><i class="fa-solid fa-brain"></i> AI-focused investment categories</div>' +
              '<div class="hds-pill"><i class="fa-solid fa-mobile-screen-button"></i> Native app launch in progress</div>' +
            '</div>' +
          '</div>' +
          '<div class="hds-image-wrap">' +
            '<img src="/assets/images/widget%20/mac-phone-simulation.png" alt="Neura wallet on desktop and mobile" />' +
          '</div>' +
        '</div>' +
      '</div>';
    target.parentNode.insertBefore(sec, target);
  }

  function normalizeUserCenterSidebar() {
    var map = [
      { test: /asset overview/i, icon: "fa-solid fa-chart-pie", label: "Asset Overview" },
      { test: /crypto deposit|fiat deposit/i, icon: "fa-solid fa-wallet", label: "Crypto Deposit" },
      { test: /withdraw/i, icon: "fa-solid fa-money-bill-transfer", label: "Withdrawals" },
      { test: /financial advisors|customer/i, icon: "fa-solid fa-headset", label: "Financial Advisors" },
      { test: /contact/i, icon: "fa-regular fa-envelope", label: "Contact" },
      { test: /markets|trade/i, icon: "fa-solid fa-chart-line", label: "Trade" },
      { test: /profile|account/i, icon: "fa-solid fa-user", label: "Profile" }
    ];

    document.querySelectorAll(".uc-sidebar a, .profile-sidebar a, .w-sidebar a, .fa-sidebar a, .c-sidebar a").forEach(function (a) {
      var txt = String(a.textContent || "").trim();
      if (!txt) return;
      var found = map.find(function (m) { return m.test.test(txt); });
      if (!found) return;
      a.innerHTML = '<i class="' + found.icon + '" style="margin-right:8px;"></i>' + found.label;
      if (/markets|trade/i.test(txt)) a.setAttribute("href", "/markets.html");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var count = 0;
    renderAll();
    var t = setInterval(function () {
      count += 1;
      renderAll();
      if (count >= 20) clearInterval(t);
    }, 250);
  });
})();
