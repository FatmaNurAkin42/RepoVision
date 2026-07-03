"""
Kod kalitesi skorlama modülü.
Repo'daki en iyi uygulamaların (best practices) varlığını kontrol ederek
100 üzerinden bir kalite puanı hesaplar.
"""

import os


def calculate_quality_score(repo_path: str, language_stats: list[dict]) -> dict:
    """
    Repo kalitesini çeşitli kriterlere göre 100 üzerinden puanlar.
    Her kriter geçildiğinde belirlenen puan eklenir.
    """
    score = 0
    max_score = 100
    criteria = []

    # Kök dizindeki dosyaları topla (küçük harfe çevrilerek)
    files_in_root = set()
    try:
        for item in os.listdir(repo_path):
            files_in_root.add(item.lower())
    except PermissionError:
        pass

    # ── 1. README dosyası (20 puan) ──
    has_readme = any(f.startswith("readme") for f in files_in_root)
    criteria.append({
        "name": "README dosyası",
        "passed": has_readme,
        "points": 20,
    })
    if has_readme:
        score += 20

    # ── 2. .gitignore dosyası (10 puan) ──
    has_gitignore = ".gitignore" in files_in_root
    criteria.append({
        "name": ".gitignore dosyası",
        "passed": has_gitignore,
        "points": 10,
    })
    if has_gitignore:
        score += 10

    # ── 3. Linter yapılandırması (10 puan) ──
    linter_files = {
        "eslint.config.js", ".eslintrc.js", ".eslintrc.json", ".eslintrc",
        ".pylintrc", "setup.cfg", "pyproject.toml", ".flake8", "biome.json",
    }
    has_linter = bool(linter_files & files_in_root)
    criteria.append({
        "name": "Linter yapılandırması",
        "passed": has_linter,
        "points": 10,
    })
    if has_linter:
        score += 10


    # ── 5. Test dosyaları (15 puan) ──
    has_tests = False
    for root, dirs, files in os.walk(repo_path):
        # Büyük dizinlerde taramayı sınırla
        dirs[:] = [d for d in dirs if d not in {"node_modules", ".git", "__pycache__", "venv", "dist"}]
        for f in files:
            fl = f.lower()
            if (
                fl.endswith(".test.ts") or fl.endswith(".test.tsx") or fl.endswith(".test.js")
                or fl.endswith(".spec.ts") or fl.endswith(".spec.tsx") or fl.endswith(".spec.js")
                or fl.startswith("test_") or fl.endswith("_test.py")
            ):
                has_tests = True
                break
        if has_tests:
            break
    criteria.append({
        "name": "Test dosyaları",
        "passed": has_tests,
        "points": 15,
    })
    if has_tests:
        score += 15

    # ── 6. CI/CD pipeline (10 puan) ──
    has_cicd = (
        os.path.exists(os.path.join(repo_path, ".github", "workflows"))
        or os.path.exists(os.path.join(repo_path, ".gitlab-ci.yml"))
        or "jenkinsfile" in files_in_root
    )
    criteria.append({
        "name": "CI/CD pipeline",
        "passed": has_cicd,
        "points": 10,
    })
    if has_cicd:
        score += 10

    # ── 7. Lisans dosyası (10 puan) ──
    has_license = any(f.startswith("license") or f.startswith("licence") for f in files_in_root)
    criteria.append({
        "name": "Lisans dosyası",
        "passed": has_license,
        "points": 10,
    })
    if has_license:
        score += 10

    # ── 8. Dependency lock dosyası (10 puan) ──
    lock_files = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock", "pipfile.lock"}
    has_lock = bool(lock_files & files_in_root)
    criteria.append({
        "name": "Dependency lock dosyası",
        "passed": has_lock,
        "points": 10,
    })
    if has_lock:
        score += 10

    # ── 9. Yorum oranı (15 puan — %5+ yorum hedefi) ──
    total_lines = sum(lang.get("lines", 0) for lang in language_stats)
    total_comments = sum(lang.get("comment_lines", 0) for lang in language_stats)
    comment_ratio = (total_comments / total_lines * 100) if total_lines > 0 else 0
    has_good_comments = comment_ratio >= 5
    criteria.append({
        "name": f"Yorum oranı ({comment_ratio:.1f}%)",
        "passed": has_good_comments,
        "points": 15,
    })
    if has_good_comments:
        score += 15

    # ── Harf notu hesapla ──
    if score >= 90:
        grade = "A+"
    elif score >= 80:
        grade = "A"
    elif score >= 70:
        grade = "B"
    elif score >= 60:
        grade = "C"
    elif score >= 50:
        grade = "D"
    else:
        grade = "F"

    return {
        "score": score,
        "max_score": max_score,
        "grade": grade,
        "criteria": criteria,
    }
