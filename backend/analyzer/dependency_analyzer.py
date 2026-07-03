"""
Bağımlılık analiz modülü.
package.json ve requirements.txt dosyalarını ayrıştırarak
production / development / Python bağımlılıklarını listeler.
"""

import os
import json


def analyze_dependencies(repo_path: str) -> dict:
    """
    Repo'daki bağımlılık dosyalarını parse ederek kategorize edilmiş bir liste döndürür.
    """
    result = {
        "production": [],
        "development": [],
        "python": [],
        "php": [],
        "dart": [],
        "total_count": 0,
    }

    # ─── package.json (Node.js) ───
    pkg_path = os.path.join(repo_path, "package.json")
    if os.path.exists(pkg_path):
        try:
            with open(pkg_path, "r", encoding="utf-8") as f:
                pkg = json.load(f)

            for name, version in pkg.get("dependencies", {}).items():
                result["production"].append({"name": name, "version": version})

            for name, version in pkg.get("devDependencies", {}).items():
                result["development"].append({"name": name, "version": version})
        except (json.JSONDecodeError, IOError):
            pass

    # ─── requirements.txt (Python) ───
    req_path = os.path.join(repo_path, "requirements.txt")
    if os.path.exists(req_path):
        try:
            with open(req_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or line.startswith("-"):
                        continue

                    # Versiyon ayırıcılarını parse et
                    for separator in ["==", ">=", "<=", "~=", "!="]:
                        if separator in line:
                            parts = line.split(separator, 1)
                            result["python"].append({
                                "name": parts[0].strip(),
                                "version": separator + parts[1].strip(),
                            })
                            break
                    else:
                        result["python"].append({"name": line, "version": "*"})
        except IOError:
            pass

    # ─── composer.json (PHP / Laravel / Symfony) ───
    composer_path = os.path.join(repo_path, "composer.json")
    if os.path.exists(composer_path):
        try:
            with open(composer_path, "r", encoding="utf-8") as f:
                composer = json.load(f)
            for name, version in composer.get("require", {}).items():
                result["php"].append({"name": name, "version": version})
            for name, version in composer.get("require-dev", {}).items():
                result["php"].append({"name": name + " (dev)", "version": version})
        except (json.JSONDecodeError, IOError):
            pass

    # ─── pubspec.yaml (Dart / Flutter) ───
    pubspec_path = os.path.join(repo_path, "pubspec.yaml")
    if os.path.exists(pubspec_path):
        try:
            with open(pubspec_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            lines = content.splitlines()
            in_dependencies = False
            in_dev_dependencies = False
            for line in lines:
                line_strip = line.rstrip()
                if not line_strip:
                    continue
                if not line.startswith(" ") and not line.startswith("\t"):
                    in_dependencies = (line_strip == "dependencies:")
                    in_dev_dependencies = (line_strip == "dev_dependencies:")
                    continue
                
                if in_dependencies or in_dev_dependencies:
                    indent = len(line) - len(line.lstrip())
                    if indent >= 2 and ":" in line_strip:
                        parts = line_strip.split(":", 1)
                        dep_name = parts[0].strip()
                        dep_version = parts[1].strip()
                        if dep_version == "":
                            continue
                        
                        suffix = " (dev)" if in_dev_dependencies else ""
                        result["dart"].append({
                            "name": dep_name + suffix,
                            "version": dep_version
                        })
        except Exception:
            pass

    result["total_count"] = (
        len(result["production"]) + len(result["development"]) + 
        len(result["python"]) + len(result["php"]) + len(result["dart"])
    )

    return result
