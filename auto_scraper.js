const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const GIST_ID = 'aa065a2c885931e6676cbc7d5a00f51c';
const IMAGES_DIR = path.join(__dirname, 'images');

(async () => {
    console.log("🚀 [T.RONY 자동 스캐너] 백그라운드 봇 가동 시작...");

    // 1. images 폴더가 없으면 생성
    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    // 2. 로컬(레포지토리)에 이미 존재하는 파일 목록 가져오기
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

        console.log("🕵️‍♂️ 2. 가상 브라우저(Puppeteer)를 열고 도감 사이트에 접속합니다...");
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        // 블라블라링크 도감 페이지 접속 (데이터 로딩 대기)
        await page.goto('https://www.blablalink.com/shiftyspad/nikke-list', { waitUntil: 'networkidle2' });
        
        // 화면이 렌더링될 시간 추가 대기
        await new Promise(r => setTimeout(r, 5000));

        // 가상 브라우저 내에서 DOM 스크래핑
        const scrapedData = await page.evaluate(() => {
            const items = document.querySelectorAll('.nikkes-player-item, .nikkes-all-item, div[data-cname="player-item"], div[data-cname="all-item"]');
            const data = [];
            items.forEach(item => {
                const imgEl = item.querySelector('img');
                if (!imgEl) return;
                const rawText = item.textContent || item.innerText || "";
                let imgSrc = imgEl.src;
                if (!imgSrc || imgSrc.includes('data:image') || imgSrc.includes('empty')) {
                    imgSrc = imgEl.dataset.src || imgEl.getAttribute('data-src') || imgSrc;
                }
                data.push({ text: rawText, img: imgSrc });
            });
            return data;
        });

        await browser.close();
        console.log(`✅ 총 ${scrapedData.length}개의 니케 DOM 데이터를 읽어왔습니다. 매칭 시작...`);

        let uploadCount = 0;

        for (const item of scrapedData) {
            const cleanUiText = item.text.replace(/[^가-힣a-zA-Z0-9]/g, '');
            let charName = null;
            let charCode = null;

            for (const db of dbNames) {
                if (cleanUiText.endsWith(db.clean)) {
                    charName = db.original;
                    charCode = db.code;
                    break;
                }
            }

            if (!charCode) continue;

            const fileName = `${charCode}.webp`;
            
            // 이미 다운로드된 파일이면 스킵
            if (existingFiles.has(fileName)) continue;

            console.log(`[발견!] ✨ 신규 니케: ${charName} (${fileName}) - 다운로드 시작...`);
            
            try {
                // 이미지 다운로드 후 파일로 저장
                const imgRes = await fetch(item.img);
                const arrayBuffer = await imgRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                fs.writeFileSync(path.join(IMAGES_DIR, fileName), buffer);
                console.log(`✅ 저장 완료: ${fileName}`);
                uploadCount++;
            } catch (e) {
                console.error(`❌ 이미지 다운로드 실패 (${charName}):`, e);
            }
        }

        if (uploadCount > 0) {
            console.log(`🎉 임무 완료! 총 ${uploadCount}개의 신규 이미지를 로컬에 저장했습니다.`);
        } else {
            console.log("✅ 추가할 신규 이미지가 없습니다.");
        }

    } catch (err) {
        console.error("🚨 봇 에러 발생:", err);
        process.exit(1); // 에러 발생 시 작업 실패 처리
    }
})();
