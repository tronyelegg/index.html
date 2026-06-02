import os
import json
import requests

# 유저님의 Gist 고유 ID (주소창에서 복사한 값)
GIST_ID = "aa065a2c885931e6676cbc7d5a00f51c"

# GitHub Secrets에서 가져올 토큰
GITHUB_TOKEN = os.environ.get("GIST_TOKEN")

# 💡 최신 니케 데이터(JSON)를 가져올 원본 주소 (예: 커뮤니티 데이터마이닝 주소 등)
# 이 주소는 항상 최신 상태를 유지하는 원본 API나 Raw URL로 설정해 주세요.
UPSTREAM_URL = "https://sg-tools-cdn.blablalink.com/wi-97/ni-77/ffc69c4074f27bc772acbe869127e616.json" 

def update_gist():
    if not GITHUB_TOKEN:
        print("🚨 에러: GIST_TOKEN이 설정되지 않았습니다.")
        return

    # 1. 최신 데이터 가져오기
    print("📥 최신 니케 데이터를 가져옵니다...")
    try:
        response = requests.get(UPSTREAM_URL)
        response.raise_for_status()
        new_data = response.text
    except Exception as e:
        print(f"🚨 데이터 다운로드 실패: {e}")
        return

    # 2. Gist 업데이트 API 호출
    print("🚀 Gist를 업데이트합니다...")
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    # Gist 안에 있는 어떤 파일을 수정할지 지정
    payload = {
        "files": {
            "nikke_main_db.json": {
                "content": new_data
            }
        }
    }

    patch_url = f"https://api.github.com/gists/{GIST_ID}"
    res = requests.patch(patch_url, headers=headers, data=json.dumps(payload))

    if res.status_code == 200:
        print("✨ Gist 업데이트 성공! 새로운 니케가 추가되었습니다.")
    else:
        print(f"🚨 업데이트 실패: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    update_gist()
