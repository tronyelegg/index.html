(async function() {
    if(document.getElementById('nikke-dashboard-modal-overlay')) return;

    // 💡 다국어(i18n) 지원: 브라우저 언어 자동 감지
    const langCode = (navigator.language || navigator.userLanguage || 'ko').substring(0, 2);
    const lang = ['ko', 'en', 'ja'].includes(langCode) ? langCode : 'en';

    const i18n = {
        'ko': {
            statusInit: '서버 통신 중...',
            btnClose: '닫기',
            successTitle: '✅ 데이터 추출 완벽 성공!',
            successDesc: '원하시는 작업을 선택해주세요.',
            btnWeb: '🚀 1. 스펙 빌더로 자동 전송',
            btnJson: '🔒 2. JSON 저장 후 사이트로 이동',
            btnExcel: '📊 3. 엑셀(EXCEL) 파일로 저장',
            msgBlocked: '🚨 팝업 차단이 감지되었습니다.',
            msgFindOpenId: 'OpenID를 자동으로 찾는 중...',
            msgNoOpenId: '🚨 비공개 계정이거나 OpenID를 찾을 수 없습니다.',
            msgScanServer: '서버 정보를 스캔 중입니다...',
            msgNoServer: '🚨 서버 정보를 찾지 못했습니다.\n계정 설정을 확인해주세요.',
            msgSyncDB: '게임 데이터베이스 동기화 중...',
            msgCreateExcel: '엑셀 파일 양식을 생성 중입니다...',
            msgCalcCP: '개별 전투력을 정밀 연산 중입니다...',
            msgNoExcelLib: '🚨 오류: 엑셀 라이브러리를 불러오지 못했습니다.'
        },
        'en': {
            statusInit: 'Communicating with server...',
            btnClose: 'Close',
            successTitle: '✅ Data Extraction Successful!',
            successDesc: 'Please select an action below.',
            btnWeb: '🚀 1. Auto-send to Spec Builder',
            btnJson: '🔒 2. Save JSON & Go to Site',
            btnExcel: '📊 3. Save as Excel file',
            msgBlocked: '🚨 Popup blocker detected.',
            msgFindOpenId: 'Automatically finding OpenID...',
            msgNoOpenId: '🚨 Private account or OpenID not found.',
            msgScanServer: 'Scanning server info...',
            msgNoServer: '🚨 Server info not found.\nPlease check account settings.',
            msgSyncDB: 'Synchronizing game database...',
            msgCreateExcel: 'Generating Excel template...',
            msgCalcCP: 'Calculating precise Combat Power...',
            msgNoExcelLib: '🚨 Error: Failed to load Excel library.'
        },
        'ja': {
            statusInit: 'サーバー通信中...',
            btnClose: '閉じる',
            successTitle: '✅ データ抽出完了！',
            successDesc: '希望する操作を選択してください。',
            btnWeb: '🚀 1. スペックビルダーへ自動送信',
            btnJson: '🔒 2. JSON保存後にサイトへ移動',
            btnExcel: '📊 3. Excelファイルとして保存',
            msgBlocked: '🚨 ポップアップブロックを検出しました。',
            msgFindOpenId: 'OpenIDを自動検索中...',
            msgNoOpenId: '🚨 非公開アカウント、またはOpenIDが見つかりません。',
            msgScanServer: 'サーバー情報をスキャン中...',
            msgNoServer: '🚨 サーバー情報が見つかりません。\nアカウント設定を確認してください。',
            msgSyncDB: 'ゲームデータベースを同期中...',
            msgCreateExcel: 'Excelファイルの書式を作成中...',
            msgCalcCP: '個別戦闘力を精密計算中...',
            msgNoExcelLib: '🚨 エラー：Excelライブラリを読み込めませんでした。'
        }
    };
    const t = (key) => i18n[lang][key];
    
    // 💡 T.RONY 다크 테크웨어 테마 (폰트 변경 및 약어 제거)
    const ui = {
        create: function() {
            const overlay = document.createElement('div');
            overlay.id = 'nikke-dashboard-modal-overlay';
            Object.assign(overlay.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)', fontFamily: "'Noto Sans KR', sans-serif, 'Segoe UI'" });
            
            const modal = document.createElement('div');
            Object.assign(modal.style, { backgroundColor: '#12151f', border: '2px solid #00E676', borderRadius: '12px', padding: '25px', width: '90%', maxWidth: '340px', boxShadow: '0 0 30px rgba(0, 230, 118, 0.2)', color: '#fff', textAlign: 'center' });
            
            const title = document.createElement('div');
            title.innerHTML = `
                <h1 style="font-family: 'Consolas', 'Menlo', 'Monaco', monospace; font-weight: 900; font-size: 46px; letter-spacing: 2px; margin: 0; color: #00E676; text-shadow: 0 0 10px rgba(0, 230, 118, 0.7), 0 0 20px rgba(0, 230, 118, 0.4);">T.RONY</h1>
            `;
            title.style.borderBottom = '1px solid #2e344e'; 
            title.style.paddingBottom = '15px';
            title.style.marginBottom = '20px';
            
            const status = document.createElement('div');
            status.id = 'nikke-status-text'; status.innerText = t('statusInit');
            Object.assign(status.style, { fontSize: '14px', margin: '20px 0', fontWeight: 'bold', color: '#00E676', wordBreak: 'keep-all' });
            
            const closeBtn = document.createElement('button');
            closeBtn.id = 'nikke-close-btn'; closeBtn.innerText = t('btnClose');
            Object.assign(closeBtn.style, { padding: '10px 30px', backgroundColor: '#4f5b82', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'none', margin: '10px auto 0 auto', transition: '0.2s' });
            closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#6876a3';
            closeBtn.onmouseout = () => closeBtn.style.backgroundColor = '#4f5b82';
            closeBtn.onclick = () => overlay.remove();
            
            modal.appendChild(title); modal.appendChild(status); modal.appendChild(closeBtn);
            overlay.appendChild(modal); document.body.appendChild(overlay);
        },
        update: function(text) {
            const el = document.getElementById('nikke-status-text');
            if (el) el.innerText = text;
        },
        finish: function(payload, excelBuffer, nickname) {
            const el = document.getElementById('nikke-status-text');
            if (!el) return;
            el.innerHTML = `
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px; color: #00E676;">${t('successTitle')}</div>
                <div style="font-size: 13px; color: #a6accd; margin-bottom: 20px;">${t('successDesc')}</div>
                <button id="btn-web" onmouseover="this.style.filter='brightness(1.2)'" onmouseout="this.style.filter='brightness(1)'" style="width: 100%; padding: 14px; margin-bottom: 10px; background: #3F51B5; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: 0.2s;">${t('btnWeb')}</button>
                <button id="btn-json" onmouseover="this.style.filter='brightness(1.2)'" onmouseout="this.style.filter='brightness(1)'" style="width: 100%; padding: 14px; margin-bottom: 10px; background: #00897B; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: 0.2s;">${t('btnJson')}</button>
                <button id="btn-excel" onmouseover="this.style.filter='brightness(1.2)'" onmouseout="this.style.filter='brightness(1)'" style="width: 100%; padding: 14px; margin-bottom: 15px; background: #2E7D32; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: 0.2s;">${t('btnExcel')}</button>
            `;
            document.getElementById('btn-web').onclick = () => {
                const newWin = window.open("https://tronyelegg.github.io/index.html", "_blank");
                if (newWin) { setTimeout(() => { newWin.postMessage({ type: 'NIKKE_SPEC_DATA', payload: payload }, "*"); }, 2500); } 
                else { alert(t('msgBlocked')); }
            };
            document.getElementById('btn-json').onclick = () => {
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `TRONY_Data_${nickname}.json`; a.click();
                URL.revokeObjectURL(a.href);
                setTimeout(() => window.open("https://tronyelegg.github.io/index.html", "_blank"), 500);
            };
            document.getElementById('btn-excel').onclick = () => {
                const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `TRONY_Dashboard_${nickname}.xlsx`; a.click();
                URL.revokeObjectURL(a.href);
            };
            const closeBtn = document.getElementById('nikke-close-btn');
            if (closeBtn) closeBtn.style.display = 'block';
        }
    };
    ui.create();

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
        });
    }

    async function huntOpenIdAutomated() {
        const extract15 = (str) => { if (!str) return null; const m = String(str).match(/(\d{15,})/); return m ? m[1] : null; };
        const urlParams = new URLSearchParams(window.location.search);
        let uidRaw = urlParams.get('uid') || urlParams.get('id') || urlParams.get('target_openid');
        let targetId = null;
        if (uidRaw) {
            try {
                let b64 = uidRaw.replace(/-/g, '+').replace(/_/g, '/');
                while (b64.length % 4) b64 += '=';
                targetId = extract15(atob(b64));
            } catch (e) {}
            if (!targetId) targetId = extract15(uidRaw);
        }
        if (!targetId && window.__API_INFO__) {
            targetId = extract15(window.__API_INFO__.targetOpenId) || extract15(window.__API_INFO__.target_openid);
        }
        if (!targetId) {
            const res = await fetch("https://api.blablalink.com/api/ugc/proxy/standalonesite/User/GetUserInfoNew", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ game_id: 29080, game_channelid: 131 }), credentials: "include" });
            const json = await res.json();
            if (json?.data?.info?.intl_openid) targetId = extract15(json.data.info.intl_openid);
        }
        if (!targetId) {
            const cookieMatch = document.cookie.match(/game_openid=(?:\d+-)?(\d{15,})/);
            if (cookieMatch) targetId = cookieMatch[1];
        }
        return targetId;
    }

    async function runMainLogic() {
        ui.update(t('msgFindOpenId'));
        let targetId = await huntOpenIdAutomated();
        if (!targetId) { ui.update(t('msgNoOpenId')); return; }
        
        ui.update(t('msgScanServer'));
        let areaId = null;
        let activeUid = null;

        // 💡 [완벽한 수정] 화면(DOM)에 렌더링된 진짜 서버명과 UID를 강제로 뜯어옵니다.
        // 쿠키나 로컬 스토리지는 서버를 스위칭할 때 즉각 갱신되지 않는 버그가 있어서 무시합니다.
        const domText = document.body.innerText;
        
        // 정규식: Global UID: 18935333 같은 형태를 찾아냅니다. (한국어/일본어 등 다국어 패턴도 모두 대응)
        const serverMatch = domText.match(/(Global|KR|JP|NA|SEA|TW|글로벌|한국|일본|북미|동남아|대만|グローバル|韓国|日本|北米|台湾)[\s\n]*UID[\s\n]*[:：]?[\s\n]*(\d+)/i);
        
        if (serverMatch) {
            const sName = serverMatch[1].toUpperCase();
            activeUid = serverMatch[2]; // 추출한 UID 백업
            const sMap = { "JP":81, "일본":81, "日本":81, "NA":82, "북미":82, "北米":82, "KR":83, "한국":83, "韓国":83, "GLOBAL":84, "글로벌":84, "グローバル":84, "SEA":85, "동남아":85, "TW":86, "대만":86, "台湾":86 };
            areaId = sMap[sName];
            console.log(`[T.RONY] 화면 스캔 성공! 현재 서버: ${sName}(area: ${areaId}), UID: ${activeUid}`);
        }

        // 2. 화면에 서버명은 짤려있고 UID만 보일 경우를 대비한 2차 방어선
        if (!areaId && !activeUid) {
            const uidOnlyMatch = domText.match(/UID[\s\n]*[:：]?[\s\n]*(\d+)/i);
            if (uidOnlyMatch) activeUid = uidOnlyMatch[1];
        }

        // 3. 만약 서버명을 못 찾았다면, API(GetGameRoleList)를 호출하여 UID와 일치하는 서버를 찾습니다.
        if (!areaId && activeUid) {
            try {
                const roleRes = await fetch("https://api.blablalink.com/api/ugc/proxy/standalonesite/User/GetGameRoleList", { 
                    method: "POST", headers: { "Content-Type": "application/json" }, 
                    body: JSON.stringify({ game_id: 29080, game_channelid: 131 }), credentials: "include" 
                });
                const roleData = await roleRes.json();
                if (roleData?.data?.list) {
                    const activeRole = roleData.data.list.find(r => String(r.role_id) === activeUid || String(r.uid) === activeUid);
                    if (activeRole) areaId = activeRole.area_id;
                }
            } catch (e) {}
        }

        // 4. 최후의 수단: 기존의 무차별 대입(총당번) 루프
        if (!areaId) {
            for (const ta of [81, 82, 83, 84, 85, 86]) {
                try {
                    const res = await fetch("https://api.blablalink.com/api/game/proxy/Game/GetUserCharacterDetails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intl_open_id: targetId, nikke_area_id: ta, name_codes: [3001] }), credentials: "include" });
                    const data = await res.json();
                    if (data.code === 0) { areaId = ta; break; }
                } catch (e) {}
            }
        }

        if (!areaId) { ui.update(t('msgNoServer')); return; }
        const regionCodeMap = { 81: "JP", 82: "NA", 83: "KR", 84: "Global", 85: "SEA", 86: "TW" };

        ui.update(t('msgSyncDB'));
        const ts = Date.now();
        const [resChars, resMainDB, resGrowthDB, resAff, resEquip, resCube, resColR, resColSR, resOutpost, resBasic] = await Promise.all([
            fetch("https://api.blablalink.com/api/game/proxy/Game/GetUserCharacters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intl_open_id: targetId, nikke_area_id: areaId }), credentials: "include" }),
            fetch("https://gist.githubusercontent.com/tronyelegg/aa065a2c885931e6676cbc7d5a00f51c/raw/nikke_main_db.json?t=" + ts),
            fetch("https://gist.githubusercontent.com/tronyelegg/aa065a2c885931e6676cbc7d5a00f51c/raw/nikke_growth_table.json?t=" + ts),
            fetch("https://sg-tools-cdn.blablalink.com/qe-66/cb6bd83fc9f961e0975612b760fbef8e.json"),
            fetch("https://sg-tools-cdn.blablalink.com/zr-95/5711d5ea12c6c0f7852e17e922db8ca8.json"),
            fetch("https://sg-tools-cdn.blablalink.com/cp-03/vw-39/6fd3572cf9e62ee8ded9442ca0f98682.json"),
            fetch("https://sg-tools-cdn.blablalink.com/et-10/ap-98/5838f34381f2f3fc02a6075db5bbb8e0.json"),
            fetch("https://sg-tools-cdn.blablalink.com/dl-61/cz-26/1d5f72120564cef28ac7889650c78a47.json"),
            fetch("https://api.blablalink.com/api/game/proxy/Game/GetUserProfileOutpostInfo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intl_open_id: targetId, nikke_area_id: areaId }), credentials: "include" }),
            fetch("https://api.blablalink.com/api/game/proxy/Game/GetUserProfileBasicInfo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intl_open_id: targetId, nikke_area_id: areaId, target_open_id: targetId }), credentials: "include" })
        ]);

        const listData = await resChars.json();
        let ownedIds = []; const charLevelMap = {};
        if (listData.code === 0 && listData.data?.characters) {
            listData.data.characters.forEach(c => { ownedIds.push(c.name_code); charLevelMap[c.name_code] = c.lv || 1; });
        }

        const mainDB = await resMainDB.json(); const growthDB = await resGrowthDB.json();
        const affData = await resAff.json(); const equipData = await resEquip.json();
        const cubeData = await resCube.json(); const colRData = await resColR.json();
        const colSRData = await resColSR.json(); const outpostData = (await resOutpost.json()).data?.outpost_info;

        let finalNickname = "지휘관";
        try {
            const bInfoStr = await resBasic.text();
            const nickMatch = bInfoStr.match(/"nickname"\s*:\s*"([^"]+)"/);
            if (nickMatch) finalNickname = nickMatch[1];
        } catch (e) {}
        if (finalNickname === "지휘관") {
            const domName = document.querySelector('.user-name') || document.querySelector('.name');
            if (domName) finalNickname = domName.innerText.trim();
        }

        const equipMap = {};
        (equipData.records || Object.values(equipData)).forEach(eq => {
            if (eq && eq.id) { equipMap[eq.id] = { hp: eq.stat.find(s => s.stat_type === 'Hp')?.stat_value || 0, atk: eq.stat.find(s => s.stat_type === 'Atk')?.stat_value || 0, def: eq.stat.find(s => s.stat_type.startsWith('Def') || s.stat_type === 'Defence')?.stat_value || 0 }; }
        });

        const affectionMap = {};
        const affArr = Array.isArray(affData) ? affData : Object.values(affData);
        const targetAffArr = (affArr[1] && Array.isArray(affArr[1])) ? affArr[1] : affArr;
        targetAffArr.forEach(a => { if (a) affectionMap[a.attractive_level] = a; });

        const commonV = { "01": "4.77%", "02": "5.47%", "03": "6.18%", "04": "6.88%", "05": "7.59%", "06": "8.29%", "07": "9.00%", "08": "9.70%", "09": "10.40%", "10": "11.11%", "11": "11.81%", "12": "12.52%", "13": "13.22%", "14": "13.93%", "15": "14.63%" };
        const optValMap = { "13": commonV, "12": commonV, "11": { "01": "2.30%", "02": "2.64%", "03": "2.98%", "04": "3.32%", "05": "3.66%", "06": "4.00%", "07": "4.35%", "08": "4.69%", "09": "5.03%", "10": "5.37%", "11": "5.70%", "12": "6.05%", "13": "6.39%", "14": "6.73%", "15": "7.07%" }, "10": { "01": "1.98%", "02": "2.28%", "03": "2.57%", "04": "2.86%", "05": "3.16%", "06": "3.45%", "07": "3.75%", "08": "4.04%", "09": "4.33%", "10": "4.63%", "11": "4.92%", "12": "5.21%", "13": "5.51%", "14": "5.80%", "15": "6.09%" }, "09": commonV, "08": commonV, "07": { "01": "27.84%", "02": "31.95%", "03": "36.06%", "04": "40.17%", "05": "44.28%", "06": "48.39%", "07": "52.50%", "08": "56.60%", "09": "60.71%", "10": "64.82%", "11": "68.93%", "12": "73.04%", "13": "77.15%", "14": "81.26%", "15": "85.37%" }, "06": commonV, "05": { "01": "9.54%", "02": "10.94%", "03": "12.34%", "04": "13.75%", "05": "15.15%", "06": "16.55%", "07": "17.95%", "08": "19.35%", "09": "20.75%", "10": "22.15%", "11": "23.56%", "12": "24.96%", "13": "26.36%", "14": "27.76%", "15": "29.16%" } };
        const shortOpt = { "05": "우코", "06": "명중", "07": "장탄", "08": "공증", "09": "차댐", "10": "차속", "11": "크확", "12": "크뎀", "13": "방증" };

        ui.update(t('msgCreateExcel'));
        const workbook = new ExcelJS.Workbook();
        const wsCalc = workbook.addWorksheet("🔮 실시간 스펙 검색기");
        const wsMyData = workbook.addWorksheet("✨ 내 니케 데이터", { views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] });
        wsMyData.addRow(['캐릭터 이름', '레벨', '돌파/코강', '소장품/애장품', '스킬 레벨', '장비 레벨', '오버옵션 합산', '호감도', '⚔️ Lv.40 전투력', '⚔️ 현재 싱크로 전투력', '⚔️ Lv.400 전투력']);
        wsMyData.autoFilter = 'A1:K1';
        wsCalc.columns = [{ header: '니케 선택 🔍 (클릭)', width: 25 }, { header: '레벨', width: 10 }, { header: '돌파 현황', width: 15 }, { header: '소장품/애장품', width: 20 }, { header: '스킬 레벨', width: 15 }, { header: '장비 레벨', width: 15 }, { header: '오버옵션 합산', width: 35 }, { header: '호감도', width: 10 }, { header: 'Lv.40 전투력', width: 15 }, { header: '싱크로 전투력', width: 15 }, { header: 'Lv.400 전투력', width: 15 }];
        
        wsCalc.getRow(1).eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE91E63' } }; c.font = { color: { argb: 'FFFFFFFF' }, bold: true }; c.alignment = { horizontal: 'center' }; });
        for (let rowNum = 2; rowNum <= 15; rowNum++) {
            const r = wsCalc.addRow(['(니케 이름을 선택하세요)', '', '', '', '', '', '', '', '', '', '']);
            r.getCell(1).dataValidation = { type: 'list', allowBlank: true, formulae: ["'✨ 내 니케 데이터'!$A$2:$A$300"] };
            for (let cNum = 2; cNum <= 11; cNum++) r.getCell(cNum).value = { formula: `=IFERROR(VLOOKUP(A${rowNum}, '✨ 내 니케 데이터'!A:K, ${cNum}, FALSE), "-")` };
            r.eachCell(c => c.alignment = { horizontal: 'center', vertical: 'middle' });
        }
        wsMyData.getRow(1).eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3F51B5' } }; c.font = { color: { argb: 'FFFFFFFF' }, bold: true }; c.alignment = { horizontal: 'center' }; });

        ui.update(t('msgCalcCP'));
        const synLevel = outpostData?.synchro_level || 1;
        let extracted = [];
        
        for (let i = 0; i < ownedIds.length; i += 50) {
            const chunk = ownedIds.slice(i, i + 50);
            try {
                const res = await fetch("https://api.blablalink.com/api/game/proxy/Game/GetUserCharacterDetails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intl_open_id: targetId, nikke_area_id: areaId, name_codes: chunk }), credentials: "include" });
                const det = await res.json();
                if (det.code === 0 && det.data?.character_details) {
                    det.data.character_details.forEach(char => {
                        try {
                            const cId = char.name_code || chunk[0]; 
                            const mInfo = mainDB[cId] || {};
                            
                            let rawName = mInfo.name_localkey || `알수없는니케(${cId})`;
                            if (rawName === "라피 : 레드후드") rawName = "라피 : 레드 후드";
                            if (rawName === "레드후드") rawName = "레드 후드";
                            const cName = rawName;

                            const cls = (mInfo.class || "Attacker").toUpperCase(); const corp = (mInfo.corporation || "ELYSION").toUpperCase();
                            const sId = mInfo.stat_enhance_id || 0; const grw = growthDB[sId] || null;
                            const gr = char.grade || 0; const co = char.core || 0;
                            let brkStr = (co > 0) ? ((co === 7) ? "풀코" : `${co}코강`) : ((gr === 3) ? "풀돌" : (gr === 0 ? "명함" : `${gr}돌`));
                            const rLv = charLevelMap[cId] || 1; 
                            let lvStatusStr = (rLv === synLevel) ? "싱크로" : String(rLv);
                            const skStr = `${char.skill1_lv || 1}/${char.skill2_lv || 1}/${char.ulti_skill_lv || 1}`;
                            const eqStr = `${char.head_equip_lv || 0}/${char.arm_equip_lv || 0}/${char.torso_equip_lv || 0}/${char.leg_equip_lv || 0}`;
                            const aLv = char.attractive_lv || char.attractive_level || char.attractive_stat_lv || char.likability_lv || 1;
                            
                            let ukoLv = 0, nonUkoLv = 0; let optSums = {};
                            ["head", "torso", "arm", "leg"].forEach(p => {
                                [1, 2, 3].forEach(o => {
                                    const oid = char[`${p}_equip_option${o}_id`];
                                    if (oid && String(oid).length === 7) {
                                        const ot = String(oid).substring(3, 5); const olStr = String(oid).substring(5, 7); const ol = parseInt(olStr, 10);
                                        if (ot === "05") ukoLv += ol; else if (["06", "07", "08", "09", "10", "11", "12", "13"].includes(ot)) nonUkoLv += ol;
                                        if (optValMap[ot] && optValMap[ot][olStr]) { optSums[ot] = (optSums[ot] || 0) + parseFloat(optValMap[ot][olStr].replace('%', '')); }
                                    }
                                });
                            });
                            let optArr = []; for (const [t, v] of Object.entries(optSums)) { if (shortOpt[t]) optArr.push(`${shortOpt[t]}:${v.toFixed(1)}%`); }
                            const ovrDisp = optArr.length > 0 ? optArr.join(', ') : "-";
                            
                            let eqHp = 0, eqAtk = 0, eqDef = 0;
                            ["head", "torso", "arm", "leg"].forEach(p => {
                                const tid = char[`${p}_equip_tid`]; const lv = char[`${p}_equip_lv`] || 0;
                                if (tid && equipMap[tid]) { eqHp += Math.round(equipMap[tid].hp * (10 + lv) / 10); eqAtk += Math.round(equipMap[tid].atk * (10 + lv) / 10); eqDef += Math.round(equipMap[tid].def * (10 + lv) / 10); }
                            });
                            
                            let cuHp = 0, cuAtk = 0, cuDef = 0, cuCo = 0; const cLv = char.harmony_cube_lv || 0;
                            if (cLv > 0 && cubeData?.hp) {
                                const idx = Math.min(cLv - 1, cubeData.hp.length - 1); cuHp = cubeData.hp[idx] || 0; cuAtk = cubeData.atk[idx] || 0; cuDef = cubeData.def[idx] || 0;
                                const l1 = cubeData.level1[idx] || 0; const l2 = cubeData.level2[idx] || 0;
                                if (cLv <= 4) cuCo = l1 + 1; else cuCo = l1 + l2 + 4;
                            }
                            
                            let colHp = 0, colAtk = 0, colDef = 0, colCo = 0; const fTid = char.favorite_item_tid || 0; const fLv = char.favorite_item_lv || 0; let fGr = "None"; let favStr = "-";
                            if (fTid) { if (String(fTid).startsWith("2")) { fGr = "Favorite"; favStr = `애장품 ${fLv}단계`; } else if (String(fTid).startsWith("100")) { fGr = String(fTid).charAt(5) === "1" ? "R" : "SR"; favStr = `${fGr}등급 ${fLv}레벨`; } }
                            if (fLv > 0) {
                                let cItm = fGr === "R" ? colRData : (fGr === "SR" || fGr === "Favorite" ? colSRData : null);
                                if (cItm?.hp) {
                                    const uLv = fGr === "Favorite" ? 15 : fLv; const idx = Math.min(uLv, 15);
                                    colHp = cItm.hp[idx] || 0; colAtk = cItm.atk[idx] || 0; colDef = cItm.def[idx] || 0;
                                    const l1 = Math.floor((uLv - 1) / 4) + 1; const l2 = Math.floor((uLv - 1) / 4) + 1;
                                    colCo = fGr === "R" ? (l1 + 6.33) : (l1 + l2 + 10.66);
                                }
                            }
                            
                            let aHp = 0, aAtk = 0, aDef = 0; const aD = affectionMap[aLv];
                            if (aD) {
                                if (cls === "ATTACKER") { aHp = aD.attacker_hp_rate; aAtk = aD.attacker_attack_rate; aDef = aD.attacker_defence_rate; }
                                else if (cls === "DEFENDER") { aHp = aD.defender_hp_rate; aAtk = aD.defender_attack_rate; aDef = aD.defender_defence_rate; }
                                else { aHp = aD.supporter_hp_rate; aAtk = aD.supporter_attack_rate; aDef = aD.supporter_defence_rate; }
                            }
                            
                            let conHp = 0, conAtk = 0, conDef = 0;
                            const coMap = { "ELYSION": 1201, "MISSILIS": 1202, "TETRA": 1203, "PILGRIM": 1204, "ABNORMAL": 1205 };
                            const clMap = { "ATTACKER": 1101, "DEFENDER": 1102, "SUPPORTER": 1103 };
                            if (outpostData?.recycle_room_researches) {
                                outpostData.recycle_room_researches.forEach(r => {
                                    if (r.tid === 1001) conHp += r.lv * 450;
                                    if (r.tid === clMap[cls]) { conHp += r.lv * 750; conDef += r.lv * 5; }
                                    if (r.tid === coMap[corp]) { conAtk += r.lv * 25; conDef += r.lv * 5; }
                                });
                            }
                            
                            let lbHp = 0, lbAtk = 0, lbDef = 0;
                            if (gr > 0) {
                                if (String(sId).startsWith("5") || mInfo.original_rare === "SSR") { lbHp = gr * 3000; lbAtk = gr * 20; lbDef = gr * 100; }
                                else { lbHp = gr * 2300; lbAtk = gr * 18; lbDef = gr * 90; }
                            }
                            
                            function getCp(lv) {
                                if (!grw?.character_level_hp_list) return 0;
                                const idx = Math.min(lv - 1, grw.character_level_hp_list.length - 1);
                                const sHp = grw.character_level_hp_list[idx] || 0; const sAtk = grw.character_level_attack_list[idx] || 0; const sDef = grw.character_level_defence_list[idx] || 0;
                                const s1 = char.skill1_lv || 1; const s2 = char.skill2_lv || 1; const bu = char.ulti_skill_lv || 1;
                                const lbC = 1 + (gr * 0.02); const coC = 1 + (co * 0.02);
                                const iHp = Math.round(sHp * lbC) + aHp + conHp + lbHp; const iAtk = Math.round(sAtk * lbC) + aAtk + conAtk + lbAtk; const iDef = Math.round(sDef * lbC) + aDef + conDef + lbDef;
                                const bHp = Math.round(iHp * coC) + eqHp + cuHp + colHp; const bAtk = Math.round(iAtk * coC) + eqAtk + cuAtk + colAtk; const bDef = Math.round(iDef * coC) + eqDef + cuDef + colDef;
                                const m1 = (130 + s1 + s2 + bu * 2) / 100 + ukoLv * 0.00828 + nonUkoLv * 0.0069; const m2 = cuCo * 0.0092 + colCo * 0.0069;
                                return Math.round((Math.round(bHp * 0.7) + Math.round(bAtk * 19.35) + Math.round(bDef * 70)) * (m1 + m2) / 100);
                            }
                            
                            wsMyData.addRow([cName, lvStatusStr, brkStr, favStr, skStr, eqStr, ovrDisp, aLv, getCp(40), getCp(synLevel), getCp(400)]);
                            
                            extracted.push({ 
                                code: cId, 
                                name: cName, 
                                break: brkStr, 
                                skill: skStr, 
                                equip: eqStr, 
                                overload: ovrDisp, 
                                cp: getCp(rLv),
                                cp40: getCp(40),
                                cp400: getCp(400)
                            });
                        } catch (e) {}
                    });
                }
            } catch (e) {}
        }
        
        [wsMyData, wsCalc].forEach(ws => {
            ws.eachRow({ includeEmpty: true }, row => {
                row.eachCell({ includeEmpty: true }, (cell, cNum) => {
                    if (cell.value && cell.value.formula) return;
                    const valStr = String(cell.value || ""); let vLen = 0;
                    for (let i = 0; i < valStr.length; i++) vLen += valStr.charCodeAt(i) > 127 ? 1.8 : 1.1;
                    const col = ws.getColumn(cNum); col.width = Math.min(Math.max(col.width || 12, vLen + 3), 40);
                });
            });
        });
        const excelBuffer = await workbook.xlsx.writeBuffer();

        extracted.sort((a, b) => b.cp - a.cp);
        ui.finish({ playerName: finalNickname, server: regionCodeMap[areaId] || String(areaId), synchroLevel: synLevel, characters: extracted }, excelBuffer, finalNickname);
    }

    async function startProcess() {
        try {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js');
            runMainLogic();
        } catch (e) {
            ui.update(t('msgNoExcelLib'));
        }
    }
    startProcess();
})();
