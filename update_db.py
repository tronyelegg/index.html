import os
import json
import requests

# 💡 1. 공식 블라블라 DB 및 내 Gist 설정
OFFICIAL_DB_URL = "https://sg-tools-cdn.blablalink.com/wi-97/ni-77/ffc69c4074f27bc772acbe869127e616.json"
GIST_ID = "aa065a2c885931e6676cbc7d5a00f51c"
GITHUB_TOKEN = os.getenv("GIST_TOKEN")

# 💡 2. 유저님의 천재적인 AB0C 스탯 ID 조합 공식 맵핑
RARE_MAP = {"R": 1, "SR": 3, "SSR": 5}
CLASS_MAP = {"Attacker": 1, "Defender": 2, "Supporter": 3}
WEAPON_MAP = {"SG": 1, "SMG": 2, "AR": 3, "MG": 4, "RL": 5, "SR": 6}

def get_stat_enhance_id(rare, char_class, weapon):
    """A(등급) + B(클래스) + 0 + C(무기) 조합 공식"""
    a = RARE_MAP.get(rare, 5)        
    b = CLASS_MAP.get(char_class, 1) 
    c = WEAPON_MAP.get(weapon, 3)    
    return int(f"{a}{b}0{c}")

def main():
    print("🔄 1. 블라블라 공식 DB(시프티패드) 다운로드 중...")
    try:
        official_resp = requests.get(OFFICIAL_DB_URL)
        official_resp.raise_for_status()
        official_data = official_resp.json()
    except Exception as e:
        print(f"🚨 공식 DB를 불러오는 데 실패했습니다: {e}")
        return

    print("🔄 2. Gist에서 내 기존 메인 DB 다운로드 중...")
    gist_url = f"https://api.github.com/gists/{GIST_ID}"
    
    # 💡 [핵심 픽스 1] GET 요청에도 인증 토큰을 넣어 깃허브 호출 제한(Rate Limit)을 피합니다.
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
    gist_resp = requests.get(gist_url, headers=headers).json()
    
    if "files" not in gist_resp or "nikke_main_db.json" not in gist_resp["files"]:
        print(f"🚨 Gist 데이터를 불러올 수 없습니다. 응답: {gist_resp}")
        return
        
    # 💡 [핵심 픽스 2] 불안정한 content 필드 대신, 직통 주소(raw_url)로 직접 다운로드합니다.
    raw_url = gist_resp["files"]["nikke_main_db.json"]["raw_url"]
    try:
        main_db_resp = requests.get(raw_url)
        main_db = main_db_resp.json()
    except json.JSONDecodeError:
        print("\n🚨 [치명적 오류] Gist에 저장된 nikke_main_db.json 파일이 텅 비어있거나 망가졌습니다!")
        print("➡️ 깃허브 Gist 페이지에 접속하셔서, 기존의 원본 JSON 데이터를 복사해서 다시 채워넣고 저장하신 뒤에 다시 실행해 주세요.\n")
        return
    
    print("🛠️ 3. 데이터 파싱 및 AB0C 스탯 공식 적용 시작...")
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
            
    print(f"✅ 파싱 완료: 신규 발견 {new_cnt}개, 기존 데이터 갱신 {upd_cnt}개")
    
    if not GITHUB_TOKEN:
        print("⚠️ GIST_TOKEN이 설정되지 않아 Gist 업로드를 건너뜁니다.")
        return
        
    print("🚀 4. Gist에 최종 업데이트된 DB 업로드 중...")
    payload = {
        "files": {
            "nikke_main_db.json": {
                "content": json.dumps(main_db, ensure_ascii=False, indent=2)
            }
        }
    }
    
    patch_resp = requests.patch(gist_url, headers=headers, json=payload)
    if patch_resp.status_code == 200:
        print("🎉 Gist 메인 DB가 성공적으로 무인 자동 업데이트 되었습니다!")
    else:
        print(f"🚨 업로드 에러: {patch_resp.text}")

if __name__ == "__main__":
    main()
