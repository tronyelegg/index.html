(async function() {
    if(document.getElementById('nikke-dashboard-modal-overlay')) return;
    const ui = {
        create: function() {
            const overlay = document.createElement('div');
            overlay.id = 'nikke-dashboard-modal-overlay';
            Object.assign(overlay.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center' });
            const modal = document.createElement('div');
            Object.assign(modal.style, { backgroundColor: '#fff', borderRadius: '8px', padding: '20px', width: '90%', maxWidth: '320px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontFamily: 'sans-serif', color: '#333', textAlign: 'center' });
            const title = document.createElement('div');
            title.innerHTML = '<span style="font-size:15px;font-weight:bold;">NIKKE Spec Extractor v16.4</span><br><span style="font-size:11px;color:#666;">GitHub Cloud Engine</span>';
            title.style.borderBottom = '1px solid #eee'; title.style.paddingBottom = '10px';
            const status = document.createElement('p');
            status.id = 'nikke-status-text'; status.innerText = '서버 통신 중...';
            status.style.fontSize = '14px'; status.style.margin = '20px 0'; status.style.fontWeight = 'bold';
            const closeBtn = document.createElement('button');
            closeBtn.innerText = '닫기';
            Object.assign(closeBtn.style, { padding: '6px 15px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'none' });
            closeBtn.onclick = () => overlay.remove();
            modal.appendChild(title); modal.appendChild(status); modal.appendChild(closeBtn);
            overlay.appendChild(modal); document.body.appendChild(overlay);
        },
        update: function(text) {
            const el = document.getElementById('nikke-status-text');
            if (el) el.innerText = text;
        },
        finish: function(payload, nickname) {
            const el = document.getElementById('nikke-status-text');
            if (!el) return;
            el.innerHTML = '<span style="color:#009688;">🟢 데이터 추출 완료!</span><br><br><span style="font-size:12px;color:#555;">원하시는 작업을 선택해주세요.</span>';
            const link = document.createElement('button');
            link.innerText = '🚀 빌더 사이트로 자동 전송';
            Object.assign(link.style, { width: '100%', padding: '12px', backgroundColor: '#3F51B5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' });
            link.onclick = () => {
                const newWin = window.open("https://tronyelegg.github.io/index.html", "_blank");
                if (newWin) { setTimeout(() => { newWin.postMessage({ type: 'NIKKE_SPEC_DATA', payload: payload }, "*"); }, 2500); } 
                else { alert("팝업 차단이 감지되었습니다."); }
            };
            const jsonBtn = document.createElement('button');
            jsonBtn.innerText = '🔒 JSON 파일로 저장';
            Object.assign(jsonBtn.style, { width: '100%', padding: '12px', backgroundColor: '#009688', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' });
            jsonBtn.onclick = () => {
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `NIKKE_Data_${nickname}.json`; a.click();
            };
            el.parentNode.insertBefore(link, el.nextSibling);
            link.parentNode.insertBefore(jsonBtn, link.nextSibling);
            const btn = el.parentNode.querySelector('button:last-child');
            if (btn) btn.style.display = 'block';
        }
    };
    ui.create();

    try {
        ui.update("OpenID 탐색 중...");
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
        if (!targetId) { ui.update("🚨 OpenID를 찾을 수 없습니다."); return; }

        ui.update("서버 스캔 중...");
        let areaId = null;
        for (const ta of [81, 82, 83, 84, 85, 86]) {
            try {
                const res = await fetch("https://api.blablalink.com/api/game/proxy/Game/GetUserCharacterDetails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intl_open_id: targetId, nikke_area_id: ta, name_codes: [5167] }), credentials: "include" });
                const data = await res.json();
                if (data.code === 0) { areaId = ta; break; }
            } catch (e) {}
        }
        if (!areaId) { ui.update("🚨 서버 정보를 찾지 못했습니다."); return; }
        const regionCodeMap = { 81: "JP", 82: "NA", 83: "KR", 84: "Global", 85: "SEA", 86: "TW" };

        ui.update("데이터베이스 동기화 중...");
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
            if (eq && eq.id) {
                equipMap[eq.id] = { hp: eq.stat.find(s => s.stat_type === 'Hp')?.stat_value || 0, atk: eq.stat.find(s => s.stat_type === 'Atk')?.stat_value || 0, def: eq.stat.find(s => s.stat_type.startsWith('Def') || s.stat_type === 'Defence')?.stat_value || 0 };
            }
        });

        const affectionMap = {};
        const affArr = Array.isArray(affData) ? affData : Object.values(affData);
        const targetAffArr = (affArr[1] && Array.isArray(affArr[1])) ? affArr[1] : affArr;
        targetAffArr.forEach(a => { if (a) affectionMap[a.attractive_level] = a; });

        const charMap = { 5170: "네온 : 비전 아이", 5169: "아니스 : 스타", 5168: "백학", 5167: "아르카나 : 포츈 메이트", 5166: "E.H.", 5165: "타키나", 5164: "치사토", 5163: "벨벳", 5162: "레이블", 5161: "스노우 화이트 : 헤비암즈", 5160: "브리드 : 사일런트 트랙", 5159: "디젤 : 윈터 스위츠", 5158: "솔린 : 프로스트 티켓", 5129: "라피 : 레드 후드", 5101: "레드 후드" };
        Object.values(mainDB).forEach(c => {
            if (c.name_code && c.name_localkey && !charMap[c.name_code]) {
                let n = c.name_localkey; if (n === "라피 : 레드후드") n = "라피 : 레드 후드"; if (n === "레드후드") n = "레드 후드";
                charMap[c.name_code] = n;
            }
        });

        const commonV = { "01": "4.77%", "02": "5.47%", "03": "6.18%", "04": "6.88%", "05": "7.59%", "06": "8.29%", "07": "9.00%", "08": "9.70%", "09": "10.40%", "10": "11.11%", "11": "11.81%", "12": "12.52%", "13": "13.22%", "14": "13.93%", "15": "14.63%" };
        const optValMap = { "13": commonV, "12": commonV, "11": { "01": "2.30%", "02": "2.64%", "03": "2.98%", "04": "3.32%", "05": "3.66%", "06": "4.00%", "07": "4.35%", "08": "4.69%", "09": "5.03%", "10": "5.37%", "11": "5.70%", "12": "6.05%", "13": "6.39%", "14": "6.73%", "15": "7.07%" }, "10": { "01": "1.98%", "02": "2.28%", "03": "2.57%", "04": "2.86%", "05": "3.16%", "06": "3.45%", "07": "3.75%", "08": "4.04%", "09": "4.33%", "10": "4.63%", "11": "4.92%", "12": "5.21%", "13": "5.51%", "14": "5.80%", "15": "6.09%" }, "09": commonV, "08": commonV, "07": { "01": "27.84%", "02": "31.95%", "03": "36.06%", "04": "40.17%", "05": "44.28%", "06": "48.39%", "07": "52.50%", "08": "56.60%", "09": "60.71%", "10": "64.82%", "11": "68.93%", "12": "73.04%", "13": "77.15%", "14": "81.26%", "15": "85.37%" }, "06": commonV, "05": { "01": "9.54%", "02": "10.94%", "03": "12.34%", "04": "13.75%", "05": "15.15%", "06": "16.55%", "07": "17.95%", "08": "19.35%", "09": "20.75%", "10": "22.15%", "11": "23.56%", "12": "24.96%", "13": "26.36%", "14": "27.76%", "15": "29.16%" } };
        const shortOpt = { "05": "우코", "06": "명중", "07": "장탄", "08": "공증", "09": "차댐", "10": "차속", "11": "크확", "12": "크뎀", "13": "방증" };

        ui.update("전투력 연산 중...");
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
                            const cId = char.name_code || chunk[0]; const cName = charMap[cId] || `알수없는니케(${cId})`; const mInfo = mainDB[cId] || {};
                            const cls = (mInfo.class || "Attacker").toUpperCase(); const corp = (mInfo.corporation || "ELYSION").toUpperCase();
                            const sId = mInfo.stat_enhance_id || 0; const grw = growthDB[sId] || null;
                            const gr = char.grade || 0; const co = char.core || 0;
                            let brkStr = (co > 0) ? ((co === 7) ? "풀코" : `${co}코강`) : ((gr === 3) ? "풀돌" : (gr === 0 ? "명함" : `${gr}돌`));
                            const rLv = charLevelMap[cId] || 1; const skStr = `${char.skill1_lv || 1}/${char.skill2_lv || 1}/${char.ulti_skill_lv || 1}`;
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
                            
                            let colHp = 0, colAtk = 0, colDef = 0, colCo = 0; const fTid = char.favorite_item_tid || 0; const fLv = char.favorite_item_lv || 0; let fGr = "None";
                            if (fTid) { if (String(fTid).startsWith("2")) fGr = "Favorite"; else if (String(fTid).startsWith("100")) fGr = String(fTid).charAt(5) === "1" ? "R" : "SR"; }
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
                            
                            extracted.push({ code: cId, name: cName, break: brkStr, skill: skStr, equip: eqStr, overload: ovrDisp, cp: getCp(rLv) });
                        } catch (e) {}
                    });
                }
            } catch (e) {}
        }
        
        extracted.sort((a, b) => b.cp - a.cp);
        ui.finish({ playerName: finalNickname, server: regionCodeMap[areaId] || String(areaId), synchroLevel: synLevel, characters: extracted }, finalNickname);
    } catch (e) {
        ui.update("🚨 오류 발생: " + e.message);
    }
})();
