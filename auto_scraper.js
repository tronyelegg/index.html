const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const GIST_ID = 'aa065a2c885931e6676cbc7d5a00f51c';
const IMAGES_DIR = path.join(__dirname, 'images');

(async () => {
    console.log("🚀 [T.RONY 자동 스캐너] 백그라운드 봇 가동 시작...");

    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

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
        
        // 화면 크기를 넉넉하게 잡아줍니다
        await page.setViewport({ width: 1280, height: 1080 });
        await page.goto('https://www.blablalink.com/shiftyspad/nikke-list', { waitUntil: 'networkidle2' });
        
        console.log("⏳ 지연 로딩(Lazy Loading) 방지를 위해 페이지를 스크롤합니다...");
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 300;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if(totalHeight >= scrollHeight - window.innerHeight){
                        clearInterval(timer);
                        resolve();
                    }
                }, 150);
            });
        });
        await new Promise(r => setTimeout(r, 2000)); // 스크롤 후 추가 대기

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
        let missedNames = new Set(); // 매칭 실패한 텍스트 저장용

        for (const item of scrapedData) {
            const cleanUiText = item.text.replace(/[^가-힣a-zA-Z0-9]/g, '');
            if (!cleanUiText) continue; // 빈 텍스트 무시

            let charName = null;
            let charCode = null;

            for (const db of dbNames) {
                if (cleanUiText.endsWith(db.clean)) {
                    charName = db.original;
                    charCode = db.code;
                    break;
                }
            }

            // 💡 [디버그 추가] 매칭에 실패하면 로그를 남깁니다.
            if (!charCode) {
                missedNames.add(cleanUiText);
                continue;
            }

            const fileName = `${charCode}.webp`;
            
            if (existingFiles.has(fileName)) continue;

            console.log(`[발견!] ✨ 신규 니케: ${charName} (${fileName}) - 다운로드 시작...`);
            
            try {
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

        // 매칭 실패 로그 출력
        if (missedNames.size > 0) {
            console.log("\n⚠️ [디버그] DB와 이름 매칭에 실패한 항목들 (Gist DB 업데이트 필요):");
            missedNames.forEach(name => console.log(` - ${name}`));
            console.log("--------------------------------------------------\n");
        }

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
