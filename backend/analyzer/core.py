"""
Ana analiz motoru — tüm alt modülleri koordine eder.
Dosya ağacı oluşturur, dil tespiti yapar, teknoloji yığınını belirler,
bağımlılıkları listeler ve kalite skoru hesaplar.
"""

import os
import re
import json


from .language_detector import detect_languages, get_language_for_file
from .tech_detector import detect_tech_stack
from .dependency_analyzer import analyze_dependencies
from .quality_scorer import calculate_quality_score
from .security_analyzer import analyze_security


# Yok sayılacak dizinler (büyük veya gereksiz)
IGNORED_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv", "env",
    ".idea", ".vscode", "dist", "build", ".next", ".nuxt",
    "vendor", "target", "bin", "obj", ".cache", "coverage",
    ".svn", ".hg", "bower_components", ".tox", ".mypy_cache",
    ".pytest_cache", ".eggs", "*.egg-info",
}

# Binary (ikili) dosya uzantıları — satır sayımına dahil edilmez
BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg", ".webp",
    ".mp3", ".mp4", ".avi", ".mov", ".wav", ".flac", ".ogg",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".zip", ".tar", ".gz", ".rar", ".7z", ".bz2",
    ".exe", ".dll", ".so", ".dylib", ".bin",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".pyc", ".pyo", ".class", ".o", ".obj",
    ".lock", ".sum",
    ".sqlite", ".db", ".sqlite3",
}


def get_file_structure_summary(filename: str, ext: str, content: str) -> str:
    """
    Dosyanın içeriğini analiz ederek nesnel, gerçekçi ve yapısal bir özet üretir.
    Hiçbir öznel veya kişisel yorum içermez, tamamen koddaki somut bileşenleri listeler.
    """
    lines = content.splitlines()
    num_lines = len(lines)
    
    imports = []
    functions = []
    classes = []
    
    if ext == '.py':
        for line in lines:
            line_strip = line.strip()
            if line_strip.startswith('import ') or line_strip.startswith('from '):
                parts = line_strip.split()
                if len(parts) > 1:
                    imports.append(parts[1].split('.')[0])
            elif line_strip.startswith('def ') and '(' in line_strip:
                func_name = line_strip.split('def ')[1].split('(')[0].strip()
                if not func_name.startswith('_'):
                    functions.append(f"`{func_name}()`")
            elif line_strip.startswith('class ') and ':' in line_strip:
                class_name = line_strip.split('class ')[1].split('(')[0].split(':')[0].strip()
                classes.append(f"`{class_name}`")
                
        summary_parts = ["Bu bir Python kaynak kod dosyasıdır."]
        if imports:
            unique_imports = sorted(list(set(imports)))[:10]
            summary_parts.append(f"İçe aktarılan kütüphaneler/modüller: {', '.join(unique_imports)}.")
        if classes:
            summary_parts.append(f"Tanımlanan sınıflar: {', '.join(classes)}.")
        if functions:
            summary_parts.append(f"Tanımlanan ana fonksiyonlar: {', '.join(functions)}.")
        if not classes and not functions:
            summary_parts.append("Dosya düz prosedürel veya yapılandırma kodları içeriyor.")
        return " ".join(summary_parts)

    elif ext in ('.js', '.jsx', '.ts', '.tsx'):
        for line in lines:
            line_strip = line.strip()
            if line_strip.startswith('import '):
                match = re.search(r'from\s+[\'"]([^\'"]+)[\'"]', line_strip)
                if match:
                    imports.append(match.group(1).split('/')[-1])
                else:
                    parts = line_strip.split()
                    if len(parts) > 1:
                        imports.append(parts[1].replace('{','').replace('}','').replace(',',''))
            
            if 'function ' in line_strip and '(' in line_strip:
                parts = line_strip.split('function ')
                if len(parts) > 1:
                    func_name = parts[1].split('(')[0].strip()
                    if func_name and func_name.isidentifier():
                        functions.append(f"`{func_name}()`")
            elif 'const ' in line_strip and '=>' in line_strip and '=' in line_strip:
                parts = line_strip.split('const ')
                if len(parts) > 1:
                    func_name = parts[1].split('=')[0].strip()
                    if func_name and func_name.isidentifier():
                        functions.append(f"`{func_name}()`")
            elif 'class ' in line_strip and '{' in line_strip:
                parts = line_strip.split('class ')
                if len(parts) > 1:
                    class_name = parts[1].split('{')[0].split('extends')[0].strip()
                    if class_name:
                        classes.append(f"`{class_name}`")
                        
        summary_parts = [f"Bu bir JavaScript/TypeScript ({ext[1:].upper()}) kaynak dosyasıdır."]
        if imports:
            unique_imports = sorted(list(set(imports)))[:10]
            summary_parts.append(f"İçe aktarılan modüller/dosyalar: {', '.join(unique_imports)}.")
        if classes:
            summary_parts.append(f"Tanımlanan sınıflar/arayüzler: {', '.join(classes)}.")
        if functions:
            summary_parts.append(f"Tanımlanan fonksiyonlar/bileşenler: {', '.join(functions)}.")
        return " ".join(summary_parts)

    elif ext in ('.css', '.scss', '.sass', '.less'):
        selectors = []
        for line in lines:
            line_strip = line.strip()
            if line_strip.endswith('{'):
                selector = line_strip[:-1].strip()
                if selector.startswith('.') or selector.startswith('#') or selector.startswith('@media'):
                    selectors.append(selector)
        
        summary_parts = ["Bu bir stil (CSS) dosyasıdır."]
        if selectors:
            unique_sel = sorted(list(set(selectors)))[:12]
            summary_parts.append(f"Tanımlanan ana stil kuralları/seçicileri: {', '.join(unique_sel)}.")
        return " ".join(summary_parts)

    elif ext == '.json':
        try:
            data = json.loads(content)
            if isinstance(data, dict):
                keys = list(data.keys())
                return f"Bu bir JSON yapılandırma dosyasıdır. Kök düzeyinde tanımlanan anahtarlar: {', '.join(keys)}."
            elif isinstance(data, list):
                return f"Bu bir JSON dosyasıdır. {len(data)} öğelik bir liste (dizi) yapısı barındırmaktadır."
        except Exception:
            return "Bu bir JSON verisidir ancak geçersiz sözdizimine sahip."
        return "Bu bir JSON dosyasıdır."

    elif ext == '.md':
        headings = []
        for line in lines:
            line_strip = line.strip()
            if line_strip.startswith('#'):
                headings.append(line_strip.lstrip('#').strip())
        summary_parts = ["Bu bir Markdown dokümantasyon dosyasıdır."]
        if headings:
            summary_parts.append(f"Belgede yer alan önemli başlıklar: {', '.join(headings[:8])}.")
        return " ".join(summary_parts)

    elif ext in ('.html', '.htm'):
        tags = []
        if '<head>' in content: tags.append('<head>')
        if '<body>' in content: tags.append('<body>')
        if '<script' in content: tags.append('<script>')
        if '<style' in content: tags.append('<style>')
        if '<div' in content: tags.append('<div>')
        
        summary_parts = ["Bu bir HTML arayüz şablonudur."]
        if tags:
            summary_parts.append(f"İçerdiği ana etiketler: {', '.join(tags)}.")
        return " ".join(summary_parts)

    elif ext in ('.yaml', '.yml'):
        keys = []
        for line in lines:
            line_strip = line.strip()
            if line_strip and not line_strip.startswith('#') and ':' in line_strip:
                key = line_strip.split(':')[0].strip()
                if key.isidentifier():
                    keys.append(key)
        summary_parts = ["Bu bir YAML yapılandırma dosyasıdır."]
        if keys:
            summary_parts.append(f"İçerdiği yapılandırma alanları: {', '.join(sorted(list(set(keys)))[:8])}.")
        return " ".join(summary_parts)

    else:
        return f"Bu dosya, '{ext}' uzantılı bir düz metin/kod dosyasıdır. Toplam {num_lines} satır içermektedir."



def build_file_tree(root_path: str, base_path: str | None = None) -> list[dict]:
    """
    Verilen dizinden recursive olarak dosya ağacı yapısı oluşturur.
    Her düğüm (node) şu bilgileri içerir: name, path, type, size, language, children
    """
    if base_path is None:
        base_path = root_path

    tree = []
    try:
        entries = sorted(os.listdir(root_path))
    except PermissionError:
        return tree

    for entry in entries:
        full_path = os.path.join(root_path, entry)
        relative_path = os.path.relpath(full_path, base_path)

        # Gizli dosyaları filtrele (bazı önemli konfigürasyonlar hariç)
        if entry.startswith(".") and entry not in (
            ".gitignore", ".env.example", ".eslintrc.js", ".prettierrc",
            ".dockerignore", ".editorconfig",
        ):
            if os.path.isdir(full_path):
                continue

        if os.path.isdir(full_path):
            # Yok sayılacak dizinleri atla
            if entry in IGNORED_DIRS:
                continue
            children = build_file_tree(full_path, base_path)
            dir_size = _calculate_tree_size(children)
            tree.append({
                "name": entry,
                "path": relative_path.replace("\\", "/"),
                "type": "directory",
                "children": children,
                "size": dir_size,
            })
        else:
            ext = os.path.splitext(entry)[1].lower()
            try:
                size = os.path.getsize(full_path)
            except OSError:
                size = 0

            language = get_language_for_file(entry)

            # Dosya içeriğini oku ve özetini çıkar
            content = ""
            summary = ""
            if ext not in BINARY_EXTENSIONS and size < 35 * 1024:
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read(35 * 1024)
                    summary = get_file_structure_summary(entry, ext, content)
                except Exception as e:
                    summary = f"Dosya içeriği okunurken hata oluştu: {str(e)}"
            elif ext not in BINARY_EXTENSIONS and size >= 35 * 1024:
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read(35 * 1024)
                    content += "\n\n... [Dosya boyutu 35KB'tan büyük olduğu için geri kalan kısım önizlemede kesilmiştir] ..."
                    summary = f"Büyük dosya ({size // 1024}KB). Bellek tasarrufu için yalnızca ilk 35KB'lık kısım yüklenmiştir."
                except Exception as e:
                    summary = f"Dosya içeriği okunurken hata oluştu: {str(e)}"
            elif ext in BINARY_EXTENSIONS:
                summary = "Bu dosya ikili (binary) bir medya veya kaynak dosyasıdır."

            tree.append({
                "name": entry,
                "path": relative_path.replace("\\", "/"),
                "type": "file",
                "size": size,
                "language": language,
                "extension": ext,
                "content": content,
                "summary": summary,
            })


    return tree


def _calculate_tree_size(tree: list[dict]) -> int:
    """Dosya ağacındaki toplam boyutu hesaplar."""
    total = 0
    for item in tree:
        if item["type"] == "file":
            total += item.get("size", 0)
        elif item["type"] == "directory":
            total += item.get("size", 0)
    return total


def count_files_recursive(tree: list[dict]) -> int:
    """Dosya ağacındaki toplam dosya sayısını hesaplar."""
    count = 0
    for item in tree:
        if item["type"] == "file":
            count += 1
        elif item["type"] == "directory":
            count += count_files_recursive(item.get("children", []))
    return count


def extract_project_intro(repo_path: str, language_stats: list[dict], tech_stack: dict) -> str:
    """
    Proje kök dizinindeki README dosyasını tarayarak veya dosya yapısı & dillerden 
    faydalanarak projenin kısa ve anlamlı bir tanıtım özetini çıkarır.
    """
    readme_content = None
    try:
        for entry in os.listdir(repo_path):
            if entry.lower().startswith("readme"):
                readme_path = os.path.join(repo_path, entry)
                if os.path.isfile(readme_path):
                    with open(readme_path, "r", encoding="utf-8", errors="ignore") as f:
                        readme_content = f.read(15000) # ilk 15KB'ı oku
                    break
    except Exception:
        pass

    if readme_content:
        # Markdown etiketlerini ve başlıkları temizleyerek ilk anlamlı paragrafı almaya çalışalım
        lines = readme_content.splitlines()
        paragraphs = []
        current_paragraph = []
        
        for line in lines:
            line_strip = line.strip()
            
            # Başlıklar
            if line_strip.startswith("#"):
                if current_paragraph:
                    paragraphs.append(" ".join(current_paragraph))
                    current_paragraph = []
                continue
                
            # Boş satırlar paragraf ayırıcıdır
            if not line_strip:
                if current_paragraph:
                    paragraphs.append(" ".join(current_paragraph))
                    current_paragraph = []
                continue
                
            # HTML etiketleri veya badge satırlarını atla
            if line_strip.startswith("<") or line_strip.startswith("[!") or line_strip.startswith("![") or line_strip.startswith("["):
                continue
                
            current_paragraph.append(line_strip)
            
        if current_paragraph:
            paragraphs.append(" ".join(current_paragraph))
            
        # İlk 2-3 anlamlı paragrafı birleştir
        valid_paragraphs = []
        for p in paragraphs:
            # En az 30 karakterlik, kod blokları veya tablolar içermeyen paragrafları al
            if len(p) > 30 and not p.startswith("`") and not p.startswith("|") and not p.startswith("-"):
                # Markdown linklerini ve kalın/italik yazıları temizle (basit regex)
                p_clean = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', p) # linkler
                p_clean = re.sub(r'[*_`]', '', p_clean) # formatlar
                valid_paragraphs.append(p_clean)
                if len(valid_paragraphs) >= 2:
                    break
                    
        if valid_paragraphs:
            return "\n\n".join(valid_paragraphs)

    # README yoksa veya anlamlı paragraf çıkarılamadıysa otomatik özet oluştur
    langs = [lang["language"] for lang in language_stats[:3]]
    techs = []
    for cat in ["frontend", "backend", "database"]:
        for t in tech_stack.get(cat, []):
            techs.append(t["name"])
            
    intro = "Bu projenin analiz sonuçlarına göre; "
    if langs:
        intro += f"ağırlıklı olarak {', '.join(langs)} programlama dilleri kullanılarak geliştirilmiştir."
    else:
        intro += "çeşitli kaynak kod dosyaları içermektedir."
        
    if techs:
        intro += f" Proje bünyesinde {', '.join(techs[:5])} gibi teknolojilerin/kütüphanelerin kullanıldığı tespit edilmiştir."
        
    intro += " Detaylı dosya hiyerarşisi, dil dağılımı ve kalite kriterlerini aşağıdaki bölümlerden inceleyebilirsiniz."
    return intro


def analyze_repository(repo_path: str) -> dict:
    """
    Ana analiz fonksiyonu — tüm alt modülleri çağırır ve sonuçları birleştirir.
    
    Returns:
        {
            "summary": {...},
            "file_tree": [...],
            "languages": [...],
            "tech_stack": {...},
            "dependencies": {...},
            "quality": {...},
            "project_intro": "..."
        }
    """
    # 1. Dosya ağacı oluştur
    file_tree = build_file_tree(repo_path)

    # 2. Dil tespiti ve satır sayımı
    language_stats = detect_languages(repo_path, IGNORED_DIRS, BINARY_EXTENSIONS)

    # 3. Teknoloji yığını tespiti
    tech_stack = detect_tech_stack(repo_path)

    # 4. Bağımlılık analizi
    dependencies = analyze_dependencies(repo_path)

    # 5. Kalite skoru hesaplama
    quality = calculate_quality_score(repo_path, language_stats)

    # 6. Özet istatistikler
    total_files = count_files_recursive(file_tree)
    total_lines = sum(lang["lines"] for lang in language_stats)
    total_size = sum(lang["bytes"] for lang in language_stats)

    # 7. Proje tanıtım/özet metni
    project_intro = extract_project_intro(repo_path, language_stats, tech_stack)

    # 8. Güvenlik taraması
    security = analyze_security(repo_path, IGNORED_DIRS, BINARY_EXTENSIONS)

    return {
        "summary": {
            "total_files": total_files,
            "total_lines": total_lines,
            "total_size": total_size,
            "total_languages": len(language_stats),
            "total_dependencies": dependencies.get("total_count", 0),
        },
        "file_tree": file_tree,
        "languages": language_stats,
        "tech_stack": tech_stack,
        "dependencies": dependencies,
        "quality": quality,
        "project_intro": project_intro,
        "security": security,
    }

