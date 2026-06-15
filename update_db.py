import os
import json
import requests

OFFICIAL_DB_URL = "https://sg-tools-cdn.blablalink.com/wi-97/ni-77/ffc69c4074f27bc772acbe869127e616.json"
GIST_ID = "aa065a2c885931e6676cbc7d5a00f51c"
GITHUB_TOKEN = os.getenv("GIST_TOKEN")

RARE_MAP = {"R": 1, "SR": 3, "SSR": 5}
CLASS_MAP = {"Attacker": 1, "Defender": 2, "Supporter": 3}
WEAPON_MAP = {"AR": 1, "SR": 2, "SMG": 3, "SG": 4, "RL": 5, "MG": 6}

def get_stat_enhance_id(rare, char_class, weapon):
    a = RARE_MAP.get(rare, 5)        
    b = CLASS_MAP.get(char_class, 1) 
    c = WEAPON_MAP.get(weapon, 1)    
    return int(f"{a}{b}0{c}")

def main():
    print("🔄 1. 블라블라 공식 DB 다운로드 중...")
    try:
        official_resp = requests.get(OFFICIAL_DB_URL)
        official_resp.raise_for_status()
        official_data = official_resp.json()
    except Exception as e:
        print(f"🚨 공식 DB 로드 실패: {e}")
        return

    print("🔄 2. Gist에서 내 기존 메인 DB 다운로드 중...")
    gist_url = f"https://api.github.com/gists/{GIST_ID}"
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
    gist_resp = requests.get(gist_url, headers=headers).json()
    if "files" not in gist_resp or "nikke_main_db.json" not in gist_resp["files"]:
        return
        
    raw_url = gist_resp["files"]["nikke_main_db.json"]["raw_url"]
    try:
        main_db = requests.get(raw_url).json()
    except json.JSONDecodeError:
        print("🚨 Gist DB 파싱 오류")
        return
    
    print("🛠️ 3. 데이터 파싱 및 스탯 ID 매칭 시작...")
    new_cnt, upd_cnt = 0, 0
    items = official_data if isinstance(official_data, list) else official_data.values()
    
    for item in items:
        if "name_code" not in item:
            continue
            
        code = str(item["name_code"])
        rare = item.get("original_rare", "SSR")
        char_class = item.get("class", "Attacker")
        
        weapon = "AR"
        try:
            weapon = item["shot_id"]["element"]["weapon_type"]
        except KeyError:
            pass
            
        name_local = item.get("name_localkey", f"알수없는니케({code})")
        if isinstance(name_local, dict):
            name_local = name_local.get("name", f"알수없는니케({code})")
            
        stat_id = item.get("stat_enhance_id")
        if not stat_id and "stat_enhance_detail" in item:
            stat_id = item["stat_enhance_detail"].get("id")
        if not stat_id:
            stat_id = get_stat_enhance_id(rare, char_class, weapon)
        
        if code not in main_db:
            main_db[code] = {}
            new_cnt += 1
        else:
            upd_cnt += 1
            
        main_db[code].update({
            "id": item.get("id"),
            "name_code": int(code),
            "name_localkey": name_local,
            "original_rare": rare,
            "class": char_class,
            "stat_enhance_id": stat_id
        })
        
        if "element_id" in item and "element" in item["element_id"]:
            main_db[code]["element_details"] = [item["element_id"]["element"]]
            
    print(f"✅ 작업 완료: 신규 발견 {new_cnt}개, 갱신 {upd_cnt}개")
    
    if not GITHUB_TOKEN:
        return
        
    print("🚀 4. Gist에 최종 업데이트된 DB 업로드 중...")
    payload = {"files": {"nikke_main_db.json": {"content": json.dumps(main_db, ensure_ascii=False, indent=2)}}}
    requests.patch(gist_url, headers=headers, json=payload)
    print("🎉 Gist DB 업데이트 완료!")

if __name__ == "__main__":
    main()
