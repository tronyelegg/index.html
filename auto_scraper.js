const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const GIST_ID = 'aa065a2c885931e6676cbc7d5a00f51c';
const IMAGES_DIR = path.join(__dirname, 'images');
const DICT_PATH = path.join(__dirname, 'nikke_names.json');

(async () => {
    console.log("🚀 [T.RONY 자동 스캐너] 완전 무인화 봇 가동 시작...");

    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
    const existingFiles = new Set(fs.readdirSync(IMAGES_DIR));

    try {
        console.log("🔄 1. Gist에서 캐릭터 풀네임 DB를 가져옵니다...");
        const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`);
        const gistJson = await gistRes.json();
        const dbRes = await fetch(gistJson.files['nikke_main_db.json'].raw_url);
        const mainDb = await dbRes.json();
        
        const dbNames = [];
        for (const code in mainDb) {
            let charName = mainDb[code].name_localkey;
            if (typeof charName === 'object') charName = charName.name;
            if (charName) {
                const cleanName = charName.replace(/[^가-힣a-zA-Z0-9]/g, '');
                dbNames.push({ original: charName, clean: cleanName, code: code });
            }
        }
        dbNames.push({ original: '라피 : 레드 후드', clean: '라피레드후드', code: '5129' });
        dbNames.push({ original: '레드 후드', clean: '레드후드', code: '5101' });
        dbNames.push({ original: '아크레인저 블랙', clean: '블랙', code: '5174' });
        dbNames.sort((a, b) => b.clean.length - a.clean.length);

        // 💡 [핵심 패치] 언어를 바꿀 때마다 '완전히 새로운 브라우저'를 켰다 끕니다.
        const scrapeLanguage = async (langCode) => {
            const langFull = langCode === 'ko' ? 'ko-KR' : (langCode === 'ja' ? 'ja-JP' : 'en-US');
            console.log(`\n🕵️‍♂️ [${langCode.toUpperCase()}] 언어 모드로 백지 상태의 새 브라우저를 엽니다...`);
            
            const browser = await puppeteer.launch({ 
                args: ['--no-sandbox', '--disable-setuid-sandbox'] 
            });
            const page = await browser.newPage();

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({ 'Accept-Language': `${langFull},${langCode};q=0.9` });
            
            // 접속 전 완벽한 언어 세뇌
            await page.evaluateOnNewDocument((l, lf) => {
                Object.defineProperty(navigator, "language", { get: function() { return lf; } });
                Object.defineProperty(navigator, "languages", { get: function() { return [lf, l]; } });
                localStorage.setItem('__ss_storage_cookie_cache_lang__', l);
                localStorage.setItem('__ss_storage_ls_cache_local_saved_regions__', `["${l}"]`);
                localStorage.setItem('lang', l);
                localStorage.setItem('locale', l);
                document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000`;
                document.cookie = `__ss_storage_cookie_cache_lang__=${l}; domain=.blablalink.com; path=/; max-age=31536000`;
            }, langCode, langFull);

            await page.setViewport({ width: 1280, height: 1080 });
            await page.goto('https://www.blablalink.com/shiftyspad/nikke-list', { waitUntil: 'networkidle2' });

            // 접속 후 한 번 더 쐐기 박고 강력 새로고침
            await page.evaluate((l) => {
                localStorage.setItem('__ss_storage_cookie_cache_lang__', l);
                localStorage.setItem('__ss_storage_ls_cache_local_saved_regions__', `["${l}"]`);
                document.cookie = `__ss_storage_cookie_cache_lang__=${l}; domain=.blablalink.com; path=/; max-age=31536000`;
            }, langCode);
            await page.reload({ waitUntil: 'networkidle2' });
            
            // 페이지 스크롤 (지연 로딩 해제)
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0; const distance = 300;
                    const timer = setInterval(() => {
                        window.scrollBy(0, distance); totalHeight += distance;
                        if(totalHeight >= document.body.scrollHeight - window.innerHeight){ clearInterval(timer); resolve(); }
                    }, 150);
                });
            });
            await new Promise(r => setTimeout(r, 2000));

            const data = await page.evaluate(() => {
                const items = document.querySelectorAll('.nikkes-player-item, .nikkes-all-item, div[data-cname="player-item"], div[data-cname="all-item"]');
                const res = [];
                items.forEach(item => {
                    const imgEl = item.querySelector('img');
                    if (!imgEl) return;
                    let imgSrc = imgEl.src;
                    if (!imgSrc || imgSrc.includes('data:image') || imgSrc.includes('empty')) {
                        imgSrc = imgEl.dataset.src || imgEl.getAttribute('data-src') || imgSrc;
                    }
                    res.push({ img: imgSrc, text: item.textContent || "" });
                });
                return res;
            });
            
            // 💡 볼일이 끝난 브라우저는 완전히 종료 (캐시 오염 방지)
            await browser.close();
            return data;
        };

        // 💡 각각 독립된 브라우저 환경에서 스크래핑
        const koData = await scrapeLanguage('ko');
        const enData = await scrapeLanguage('en');
        const jaData = await scrapeLanguage('ja');

        console.log(`\n✅ 다국어 스캔 완료 (KO: ${koData.length}명, EN: ${enData.length}명, JA: ${jaData.length}명)`);

        // 텍스트에서 'LV. 120', '⚔ 123,456' 같은 잡음을 제거하는 함수
        const cleanNameText = (rawText) => {
            return rawText.replace(/LV\.\s*\d+/i, '').replace(/⚔\s*[\d,]+/g, '').trim();
        };

        // 이미지 주소(imgUrl)를 열쇠로 삼아 3개 국어 데이터를 하나로 합체
        const mergedMap = {};
        koData.forEach(k => mergedMap[k.img] = { ko: k.text });
        enData.forEach(e => { if (mergedMap[e.img]) mergedMap[e.img].en = cleanNameText(e.text); });
        jaData.forEach(j => { if (mergedMap[j.img]) mergedMap[j.img].ja = cleanNameText(j.text); });

        const dictionary = {};
        let uploadCount = 0;

        console.log("\n⚙️ 데이터 분석 및 사전(Dictionary) 편찬 시작...");
        for (const imgUrl in mergedMap) {
            const entry = mergedMap[imgUrl];
            if (!entry.ko) continue;

            const cleanKoText = cleanNameText(entry.ko).replace(/[^가-힣a-zA-Z0-9]/g, '');
            let officialName = null;
            let charCode = null;

            for (const db of dbNames) {
                if (cleanKoText.endsWith(db.clean)) {
                    officialName = db.original;
                    charCode = db.code;
                    break;
                }
            }

            if (!officialName || !charCode) continue;

            // 1. 번역 사전에 자동 등재
            if (entry.en && entry.ja) {
                dictionary[officialName] = { en: entry.en, ja: entry.ja };
            }

            // 2. 신규 이미지 다운로드 로직
            const fileName = `${charCode}.webp`;
            if (!existingFiles.has(fileName)) {
                console.log(`[발견!] ✨ 신규 니케: ${officialName} (${fileName}) - 다운로드 시작...`);
                try {
                    const imgRes = await fetch(imgUrl);
                    const buffer = Buffer.from(await imgRes.arrayBuffer());
                    fs.writeFileSync(path.join(IMAGES_DIR, fileName), buffer);
                    uploadCount++;
                } catch (e) {
                    console.error(`❌ 이미지 다운로드 실패 (${officialName}):`, e);
                }
            }
        }

        // 완성된 사전을 nikke_names.json 파일로 덮어쓰기
        fs.writeFileSync(DICT_PATH, JSON.stringify(dictionary, null, 4));
        console.log(`✅ [성공] 총 ${Object.keys(dictionary).length}명의 다국어 번역 사전 생성 및 저장 완료!`);

        if (uploadCount > 0) {
            console.log(`🎉 임무 완료! 총 ${uploadCount}개의 신규 이미지를 로컬에 저장했습니다.`);
        } else {
            console.log("✅ 추가할 신규 이미지가 없습니다.");
        }

    } catch (err) {
        console.error("🚨 봇 에러 발생:", err);
        process.exit(1); 
    }
})();
