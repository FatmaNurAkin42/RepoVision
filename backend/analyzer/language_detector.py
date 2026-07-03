"""
Dosya uzantısına göre programlama dili tespiti ve satır sayımı modülü.
50+ dil/uzantı desteği ile LOC (Lines of Code) analizi yapar.
"""

import os

# --- Uzantı → Dil Eşleşme Tablosu ---
EXTENSION_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript (JSX)",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (TSX)",
    ".html": "HTML",
    ".htm": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".sass": "SASS",
    ".less": "LESS",
    ".json": "JSON",
    ".xml": "XML",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".md": "Markdown",
    ".java": "Java",
    ".kt": "Kotlin",
    ".kts": "Kotlin",
    ".swift": "Swift",
    ".go": "Go",
    ".rs": "Rust",
    ".rb": "Ruby",
    ".php": "PHP",
    ".c": "C",
    ".h": "C/C++ Header",
    ".cpp": "C++",
    ".hpp": "C++",
    ".cs": "C#",
    ".dart": "Dart",
    ".r": "R",
    ".sql": "SQL",
    ".sh": "Shell",
    ".bash": "Shell",
    ".zsh": "Shell",
    ".ps1": "PowerShell",
    ".vue": "Vue",
    ".svelte": "Svelte",
    ".lua": "Lua",
    ".pl": "Perl",
    ".scala": "Scala",
    ".ex": "Elixir",
    ".exs": "Elixir",
    ".erl": "Erlang",
    ".hs": "Haskell",
    ".toml": "TOML",
    ".ini": "INI",
    ".env": "Environment",
    ".graphql": "GraphQL",
    ".gql": "GraphQL",
    ".proto": "Protocol Buffers",
    ".tf": "Terraform",
    ".sol": "Solidity",
}

# --- GitHub tarzı renk eşleşmesi ---
LANGUAGE_COLORS = {
    "Python": "#3572A5",
    "JavaScript": "#f1e05a",
    "JavaScript (JSX)": "#f1e05a",
    "TypeScript": "#3178c6",
    "TypeScript (TSX)": "#3178c6",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "SCSS": "#c6538c",
    "SASS": "#a53b70",
    "LESS": "#1d365d",
    "JSON": "#292929",
    "Java": "#b07219",
    "Kotlin": "#A97BFF",
    "Swift": "#F05138",
    "Go": "#00ADD8",
    "Rust": "#dea584",
    "Ruby": "#701516",
    "PHP": "#4F5D95",
    "C": "#555555",
    "C/C++ Header": "#555555",
    "C++": "#f34b7d",
    "C#": "#178600",
    "Dart": "#00B4AB",
    "SQL": "#e38c00",
    "Shell": "#89e051",
    "PowerShell": "#012456",
    "Vue": "#41b883",
    "Svelte": "#ff3e00",
    "Markdown": "#083fa1",
    "YAML": "#cb171e",
    "XML": "#0060ac",
    "R": "#198CE7",
    "Lua": "#000080",
    "Scala": "#c22d40",
    "Elixir": "#6e4a7e",
    "Haskell": "#5e5086",
    "GraphQL": "#e10098",
    "Terraform": "#5C4EE5",
    "Solidity": "#AA6746",
    "TOML": "#9c4221",
    "INI": "#d1d5db",
    "Environment": "#ecd53f",
    "Protocol Buffers": "#8a2be2",
    "Perl": "#0298c3",
    "Erlang": "#B83998",
}


def get_language_for_file(filename: str) -> str | None:
    """Dosya adından programlama dilini tespit eder."""
    name_lower = filename.lower()

    # Özel dosya adları
    if name_lower == "dockerfile":
        return "Dockerfile"
    if name_lower == "makefile":
        return "Makefile"
    if name_lower == "jenkinsfile":
        return "Groovy"
    if name_lower == "vagrantfile":
        return "Ruby"

    ext = os.path.splitext(filename)[1].lower()
    return EXTENSION_MAP.get(ext, None)


def count_lines(file_path: str) -> dict:
    """
    Bir dosyanın satır istatistiklerini hesaplar.
    Returns: {"total": int, "code": int, "blank": int, "comment": int}
    """
    try:
        size = os.path.getsize(file_path)
        if size > 100 * 1024:
            # Büyük dosyalarda bellek ve işlemci tasarrufu için hızlıca \n sayıyoruz
            newlines = 0
            with open(file_path, "rb") as f:
                buf_size = 1024 * 1024
                read_f = f.raw.read
                buf = read_f(buf_size)
                while buf:
                    newlines += buf.count(b'\n')
                    buf = read_f(buf_size)
            if newlines == 0 and size > 0:
                newlines = 1
            return {"total": newlines, "code": newlines, "blank": 0, "comment": 0}

        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()

        total = len(lines)
        blank = sum(1 for line in lines if line.strip() == "")
        comment = 0

        # Basit yorum satırı tespiti (çoğu dil için)
        in_block_comment = False
        for line in lines:
            stripped = line.strip()

            if in_block_comment:
                comment += 1
                if "*/" in stripped:
                    in_block_comment = False
                continue

            # Tek satır yorumları
            if stripped.startswith("//") or stripped.startswith("#") or stripped.startswith("--"):
                comment += 1
            # Blok yorum başlangıcı
            elif stripped.startswith("/*"):
                comment += 1
                if "*/" not in stripped:
                    in_block_comment = True
            # Python docstring (basit tespit)
            elif stripped.startswith('"""') or stripped.startswith("'''"):
                comment += 1

        code = total - blank - comment
        return {"total": total, "code": max(code, 0), "blank": blank, "comment": comment}
    except Exception:
        return {"total": 0, "code": 0, "blank": 0, "comment": 0}


def detect_languages(repo_path: str, ignored_dirs: set, binary_extensions: set) -> list[dict]:
    """
    Repo içindeki tüm dosyaları tarar, dil başına satır ve dosya istatistiklerini toplar.
    """
    lang_stats: dict[str, dict] = {}

    for root, dirs, files in os.walk(repo_path):
        # Yok sayılacak dizinleri atla
        dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith(".")]

        for filename in files:
            ext = os.path.splitext(filename)[1].lower()
            if ext in binary_extensions:
                continue

            language = get_language_for_file(filename)
            if language is None:
                continue

            file_path = os.path.join(root, filename)
            line_info = count_lines(file_path)

            try:
                file_size = os.path.getsize(file_path)
            except OSError:
                file_size = 0

            if language not in lang_stats:
                lang_stats[language] = {
                    "language": language,
                    "files": 0,
                    "lines": 0,
                    "code_lines": 0,
                    "blank_lines": 0,
                    "comment_lines": 0,
                    "bytes": 0,
                    "color": LANGUAGE_COLORS.get(language, "#858585"),
                }

            lang_stats[language]["files"] += 1
            lang_stats[language]["lines"] += line_info["total"]
            lang_stats[language]["code_lines"] += line_info["code"]
            lang_stats[language]["blank_lines"] += line_info["blank"]
            lang_stats[language]["comment_lines"] += line_info["comment"]
            lang_stats[language]["bytes"] += file_size

    # Satır sayısına göre sırala
    result = sorted(lang_stats.values(), key=lambda x: x["lines"], reverse=True)

    # Yüzde hesapla
    total_lines = sum(lang["lines"] for lang in result)
    for lang in result:
        lang["percentage"] = round(
            (lang["lines"] / total_lines * 100) if total_lines > 0 else 0, 1
        )

    return result
