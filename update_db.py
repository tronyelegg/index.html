import os, requests, difflib

# 1. DB 다운로드
db_url = "https://gist.githubusercontent.com/tronyelegg/aa065a2c885931e6676cbc7d5a00f51c/raw/bbe62d0132a52a2b7e3762e16d98252efc501e87/nikke_main_db.json"
db = requests.get(db_url).json()

# 2. 깨끗한 이름 사전 만들기
name_to_code = {}
for code, data in db.items():
    if "name_localkey" in data:
        # 공백, 콜론, 밑줄 완벽 제거
        clean_name = data["name_localkey"].replace(" ", "").replace(":", "").replace("_", "")
        name_to_code[clean_name] = str(data["name_code"])

valid_names = list(name_to_code.keys())

# 3. 폴더 경로 (본인 컴퓨터 경로로 수정!)
image_folder = r"C:\Users\sch\Downloads"

print("🔄 스마트 AI 이미지 매칭 시작...")
for filename in os.listdir(image_folder):
    if not filename.endswith(".webp") or filename.split(".")[0].isdigit():
        continue
        
    raw_name = filename.replace(".webp", "")
    # 다운로드된 파일명에 붙은 쓰레기 텍스트(LV_ 등) 제거
    clean_file = raw_name.replace("LV_", "").replace(" ", "").replace("_", "").replace(":", "")
    
    # 💡 [핵심] 가장 비슷한 이름 찾아주기!
    match = None
    if clean_file in name_to_code:
        match = clean_file
    else:
        # 40% 이상 비슷한 단어를 찾아줌 (예: iDoll오션 -> iDoll오션)
        closest = difflib.get_close_matches(clean_file, valid_names, n=1, cutoff=0.4)
        if closest:
            match = closest[0]
            
    if match:
        target_code = name_to_code[match]
        old_path = os.path.join(image_folder, filename)
        new_path = os.path.join(image_folder, f"{target_code}.webp")
        
        try:
            os.replace(old_path, new_path)
            print(f"✅ {filename} ➡️ {target_code}.webp (인식된 이름: {match})")
        except Exception as e:
            print(f"🚨 덮어쓰기 에러 ({filename}): {e}")
    else:
        print(f"⚠️ 매칭 실패: {filename}")

print("🎉 완벽하게 변환 완료!")
