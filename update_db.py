import os
import json
import requests

# 💡 Gist 설정
GIST_ID = "aa065a2c885931e6676cbc7d5a00f51c"
GITHUB_TOKEN = os.getenv("GIST_TOKEN")

# 💡 AB0C 생성용 맵핑 사전
RARE_MAP = {"R": 1, "SR": 3, "SSR": 5}
CLASS_MAP = {"Attacker": 1, "Defender": 2, "Supporter": 3}
WEAPON_MAP = {"SG": 1, "SMG": 2, "AR": 3, "MG": 4, "RL": 5, "SR": 6}

def get_stat_enhance_id(rare, char_class, weapon):
    """A(등급) + B(클래스) + 0 + C(무기) 조합 공식"""
    a = RARE_MAP.get(rare, 5)        # 기본값 SSR(5)
    b = CLASS_MAP.get(char_class, 1) # 기본값 Attacker(1)
    c = WEAPON_MAP.get(weapon, 3)    # 기본값 AR(3)
    return int(f"{a}{b}0{c}")

def main():
    print("🔄 1. Gist에서 기존 메인 DB 다운로드 중...")
    gist_url = f"https://api.github.com/gists/{GIST_ID}"
    gist_resp = requests.get(gist_url).json()
    
    if "files" not in gist_resp:
        print("🚨 Gist 데이터를 불러올 수 없습니다.")
        return
        
    main_db = json.loads(gist_resp["files"]["nikke_main_db.json"]["content"])
    
    print("🔄 2. 원본 데이터(raw_data.json) 로드 중...")
    # ⚠️ 유저님이 깃허브에 올릴 왼쪽 포맷의 원본 JSON 파일 이름입니다.
    if not os.path.exists("raw_data.json"):
        print("🚨 원본 데이터 파일(raw_data.json)을 찾을 수 없습니다! 스크립트를 종료합니다.")
        return
        
    with open("raw_data.json", "r", encoding="utf-8") as f:
        raw_data = json.load(f)
        
    print("🛠️ 3. AB0C 공식 적용 및 데이터 병합 시작...")
    new_cnt = 0
    upd_cnt = 0
    
    for item in raw_data:
        if "name_code" not in item:
            continue
            
        code = str(item["name_code"])
        rare = item.get("original_rare", "SSR")
        char_class = item.get("class", "Attacker")
        
        # 무기 타입 추출 (구조 안쪽 깊숙이 있으므로 try-except로 안전하게 파싱)
        weapon = "AR"
        try:
            weapon = item["shot_id"]["element"]["weapon_type"]
        except KeyError:
            pass
            
        # 💡 유저님의 아이디어: stat_enhance_id 동적 생성
        stat_id = get_stat_enhance_id(rare, char_class, weapon)
        
        # 이름 추출 (왼쪽 포맷은 딕셔너리로 되어 있으므로 처리)
        name_local = item.get("name_localkey", f"알수없는니케({code})")
        if isinstance(name_local, dict):
            name_local = name_local.get("name", f"알수없는니케({code})")
            
        if code not in main_db:
            main_db[code] = {}
            new_cnt += 1
        else:
            upd_cnt += 1
            
        # 기존 Gist DB에 오른쪽 포맷으로 데이터 덮어쓰기
        main_db[code].update({
            "id": item.get("id"),
            "name_code": int(code),
            "name_localkey": name_local,
            "original_rare": rare,
            "class": char_class,
            "stat_enhance_id": stat_id
        })
        
        # element_id 데이터 등 추가 병합
        if "element_id" in item and "element" in item["element_id"]:
            main_db[code]["element_details"] = [item["element_id"]["element"]]
            
    print(f"✅ 파싱 완료: 신규 추가 {new_cnt}개, 업데이트 {upd_cnt}개")
    
    if not GITHUB_TOKEN:
        print("⚠️ GIST_TOKEN이 설정되지 않아 Gist 업데이트를 건너뜁니다.")
        return
        
    print("🚀 4. Gist에 최종 DB 업로드 중...")
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    payload = {
        "files": {
            "nikke_main_db.json": {
                "content": json.dumps(main_db, ensure_ascii=False, indent=2)
            }
        }
    }
    
    patch_resp = requests.patch(gist_url, headers=headers, json=payload)
    if patch_resp.status_code == 200:
        print("🎉 Gist 메인 DB 성공적으로 업데이트 되었습니다!")
    else:
        print(f"🚨 업로드 에러: {patch_resp.text}")

if __name__ == "__main__":
    main()
