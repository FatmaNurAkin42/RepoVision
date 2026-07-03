import os
import re

# Secret scanning regexes
SECRET_PATTERNS = {
    "AWS Access Key ID": r"\b(AKIA|ASCA|ACCA)[0-9A-Z]{16}\b",
    "Slack Token": r"\bxox[bapr]-[0-9a-zA-Z]{10,48}\b",
    "GitHub Personal Access Token": r"\bghp_[a-zA-Z0-9]{36,255}\b",
    "Private Key Block": r"-----BEGIN[ A-Z_-]+PRIVATE KEY-----",
    "Hardcoded Password / Key": r"(?i)\b(api_key|apikey|secret_key|secretkey|private_key|privatekey|db_pass|db_password|dbpass|dbpassword|credential|credentials)\s*[:=]\s*['\"](?![^'\"]*\{\{[^'\"]*\}\})[a-zA-Z0-9_\-\.\/\+\=\:\@]{12,80}['\"]"
}

# SAST regexes (Code Safety issues)
SAST_PATTERNS = {
    "SQL Injection Pattern (Python)": (
        r"\.execute\(\s*f['\"].*\{\w+\}.*['\"]|\.execute\(\s*['\"].*['\"]\s*\+\s*\w+|\.execute\(\s*['\"].*%\s+\w+['\"]", 
        "MEDIUM",
        "Koddaki değişkenin SQL sorgusuna doğrudan birleştirildiği tespit edildi. Bu durum SQL Injection açıklarına neden olabilir. Parametreli sorgu kullanılması önerilir."
    ),
    "Insecure Command Execution (Python)": (
        r"subprocess\.(run|Popen|call|check_output)\(.*shell\s*=\s*True", 
        "HIGH",
        "Komut çalıştırmada 'shell=True' parametresi tespit edildi. Bu durum, girdi doğrulaması yapılmazsa uzaktan komut yürütme (RCE) açıklarına neden olabilir."
    ),
    "eval / exec Usage": (
        r"\beval\(|\bexec\(", 
        "MEDIUM",
        "eval veya exec fonksiyonlarının kullanımı tespit edildi. Güvenilmeyen girdilerin bu fonksiyonlara iletilmesi ciddi güvenlik açıklarına neden olur."
    ),
    "Insecure React render (dangerouslySetInnerHTML)": (
        r"dangerouslySetInnerHTML\s*=", 
        "MEDIUM",
        "React içerisinde 'dangerouslySetInnerHTML' kullanımı tespit edildi. Girdilerin sanitize edilmemesi durumunda Cross-Site Scripting (XSS) açıklarına yol açabilir."
    )
}

def analyze_security(repo_path: str, ignored_dirs: set, binary_extensions: set) -> dict:
    """
    Proje dizinindeki kaynak kodları tarayarak güvenlik açıklarını ve sızdırılmış anahtarları bulur.
    100 üzerinden bir güvenlik skoru hesaplar.
    """
    findings = []
    
    # Her dosya için tarama
    for root, dirs, files in os.walk(repo_path):
        # Yok sayılacak dizinleri atla
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in binary_extensions:
                continue
                
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, repo_path).replace("\\", "/")
            
            try:
                # Büyük dosyalarda regex kilitlenmelerini önlemek için 100KB sınırı uyguluyoruz
                size = os.path.getsize(full_path)
                if size > 100 * 1024:
                    continue
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
            except Exception:
                continue
                
            for line_idx, line in enumerate(lines, 1):
                line_strip = line.strip()
                if not line_strip:
                    continue
                
                # 1. Secret Scanning (Yorum satırları dahil her yeri tara)
                for name, pattern in SECRET_PATTERNS.items():
                    if re.search(pattern, line):
                        # Eşleşen kısmı veya tüm satırı ekle
                        findings.append({
                            "file": rel_path,
                            "line": line_idx,
                            "type": "Sızdırılmış Kimlik Bilgisi (Secret)",
                            "severity": "HIGH",
                            "name": name,
                            "description": f"Dosya içerisinde olası '{name}' değeri tespit edildi. Lütfen bu anahtarı koddan kaldırın ve çevre değişkeni (.env) kullanın.",
                            "snippet": line_strip[:150]
                        })
                
                # 2. SAST (Kod Güvenliği) Taraması (Yorum satırlarını atlayarak)
                if line_strip.startswith(("//", "#", "/*", "*")):
                    continue
                    
                for name, (pattern, severity, desc) in SAST_PATTERNS.items():
                    if re.search(pattern, line):
                        findings.append({
                            "file": rel_path,
                            "line": line_idx,
                            "type": "Kod Güvenliği Zaafiyeti (SAST)",
                            "severity": severity,
                            "name": name,
                            "description": desc,
                            "snippet": line_strip[:150]
                        })

    # Skorlama
    score = 100
    summary = {"high": 0, "medium": 0, "low": 0, "total": len(findings)}
    
    for f in findings:
        sev = f["severity"].lower()
        if sev == "high":
            summary["high"] += 1
            score -= 15
        elif sev == "medium":
            summary["medium"] += 1
            score -= 8
        elif sev == "low":
            summary["low"] += 1
            score -= 3
            
    # Skoru 0-100 arasında tut
    score = max(0, min(100, score))
    
    # Harf notu hesapla
    if score >= 90:
        grade = "A"
    elif score >= 75:
        grade = "B"
    elif score >= 60:
        grade = "C"
    elif score >= 40:
        grade = "D"
    else:
        grade = "F"
        
    return {
        "score": score,
        "grade": grade,
        "findings": findings,
        "summary": summary
    }
