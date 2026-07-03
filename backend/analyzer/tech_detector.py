"""
Proje dosyalarından teknoloji yığını (tech stack) tespit modülü.
package.json, requirements.txt, Dockerfile gibi dosyalardan
framework, kütüphane ve araç tespiti yapar.
"""

import os
import json


def detect_tech_stack(repo_path: str) -> dict:
    """
    Repo kök dizinini tarayarak kullanılan teknolojileri tespit eder.
    Sonuçlar kategori bazlı gruplanır: frontend, backend, database, devops, testing, other
    """
    tech_stack = {
        "frontend": [],
        "backend": [],
        "database": [],
        "devops": [],
        "testing": [],
        "other": [],
    }

    # Kök dizindeki dosyaları topla
    files_in_root = set()
    try:
        for item in os.listdir(repo_path):
            files_in_root.add(item.lower())
    except PermissionError:
        return tech_stack

    # ─── package.json Analizi (Node.js ekosistemi) ───
    pkg_path = os.path.join(repo_path, "package.json")
    if os.path.exists(pkg_path):
        try:
            with open(pkg_path, "r", encoding="utf-8") as f:
                pkg = json.load(f)
            all_deps = {}
            all_deps.update(pkg.get("dependencies", {}))
            all_deps.update(pkg.get("devDependencies", {}))

            # Frontend Frameworks
            _fw_map = {
                "react": ("React", "Framework"),
                "react-dom": None,  # React ile birlikte gelir
                "next": ("Next.js", "Framework"),
                "vue": ("Vue.js", "Framework"),
                "nuxt": ("Nuxt.js", "Framework"),
                "svelte": ("Svelte", "Framework"),
                "@angular/core": ("Angular", "Framework"),
            }
            for dep, info in _fw_map.items():
                if dep in all_deps and info:
                    tech_stack["frontend"].append({"name": info[0], "category": info[1]})

            # CSS / Styling
            _css_map = {
                "tailwindcss": ("Tailwind CSS", "Styling"),
                "sass": ("Sass/SCSS", "Styling"),
                "node-sass": ("Sass/SCSS", "Styling"),
                "styled-components": ("Styled Components", "Styling"),
                "@emotion/react": ("Emotion", "Styling"),
                "bootstrap": ("Bootstrap", "Styling"),
            }
            for dep, info in _css_map.items():
                if dep in all_deps:
                    tech_stack["frontend"].append({"name": info[0], "category": info[1]})

            # Animation
            _anim_map = {
                "framer-motion": ("Framer Motion", "Animation"),
                "gsap": ("GSAP", "Animation"),
                "animejs": ("Anime.js", "Animation"),
            }
            for dep, info in _anim_map.items():
                if dep in all_deps:
                    tech_stack["frontend"].append({"name": info[0], "category": info[1]})

            # State Management
            _state_map = {
                "redux": ("Redux", "State Management"),
                "@reduxjs/toolkit": ("Redux Toolkit", "State Management"),
                "zustand": ("Zustand", "State Management"),
                "recoil": ("Recoil", "State Management"),
                "mobx": ("MobX", "State Management"),
                "jotai": ("Jotai", "State Management"),
            }
            for dep, info in _state_map.items():
                if dep in all_deps:
                    tech_stack["frontend"].append({"name": info[0], "category": info[1]})

            # Build Tools
            _build_map = {
                "vite": ("Vite", "Build Tool"),
                "webpack": ("Webpack", "Build Tool"),
                "esbuild": ("esbuild", "Build Tool"),
                "rollup": ("Rollup", "Build Tool"),
                "parcel": ("Parcel", "Build Tool"),
                "turbo": ("Turborepo", "Build Tool"),
            }
            for dep, info in _build_map.items():
                if dep in all_deps:
                    tech_stack["devops"].append({"name": info[0], "category": info[1]})

            # Backend (Node.js)
            _backend_map = {
                "express": ("Express.js", "Framework"),
                "fastify": ("Fastify", "Framework"),
                "koa": ("Koa", "Framework"),
                "nestjs": ("NestJS", "Framework"),
                "@nestjs/core": ("NestJS", "Framework"),
                "hapi": ("Hapi", "Framework"),
            }
            for dep, info in _backend_map.items():
                if dep in all_deps:
                    tech_stack["backend"].append({"name": info[0], "category": info[1]})

            # Database / ORM
            _db_map = {
                "mongoose": ("MongoDB (Mongoose)", "NoSQL"),
                "mongodb": ("MongoDB", "NoSQL"),
                "pg": ("PostgreSQL", "SQL"),
                "mysql2": ("MySQL", "SQL"),
                "mysql": ("MySQL", "SQL"),
                "prisma": ("Prisma", "ORM"),
                "@prisma/client": ("Prisma", "ORM"),
                "sequelize": ("Sequelize", "ORM"),
                "typeorm": ("TypeORM", "ORM"),
                "drizzle-orm": ("Drizzle ORM", "ORM"),
                "redis": ("Redis", "Cache"),
                "ioredis": ("Redis", "Cache"),
            }
            for dep, info in _db_map.items():
                if dep in all_deps:
                    tech_stack["database"].append({"name": info[0], "category": info[1]})

            # Testing
            _test_map = {
                "jest": ("Jest", "Testing"),
                "vitest": ("Vitest", "Testing"),
                "cypress": ("Cypress", "E2E Testing"),
                "@playwright/test": ("Playwright", "E2E Testing"),
                "playwright": ("Playwright", "E2E Testing"),
                "mocha": ("Mocha", "Testing"),
                "@testing-library/react": ("React Testing Library", "Testing"),
            }
            for dep, info in _test_map.items():
                if dep in all_deps:
                    tech_stack["testing"].append({"name": info[0], "category": info[1]})

            # TypeScript
            if "typescript" in all_deps:
                tech_stack["frontend"].append({"name": "TypeScript", "category": "Language"})

        except (json.JSONDecodeError, IOError):
            pass

    # ─── Python Ekosistemi ───
    req_path = os.path.join(repo_path, "requirements.txt")
    if os.path.exists(req_path):
        tech_stack["backend"].append({"name": "Python", "category": "Language"})
        try:
            with open(req_path, "r", encoding="utf-8") as f:
                reqs = f.read().lower()
            _py_map = {
                "django": ("Django", "Framework", "backend"),
                "flask": ("Flask", "Framework", "backend"),
                "fastapi": ("FastAPI", "Framework", "backend"),
                "sqlalchemy": ("SQLAlchemy", "ORM", "database"),
                "pytest": ("Pytest", "Testing", "testing"),
                "celery": ("Celery", "Task Queue", "backend"),
                "pandas": ("Pandas", "Data Science", "other"),
                "numpy": ("NumPy", "Data Science", "other"),
                "tensorflow": ("TensorFlow", "ML/AI", "other"),
                "torch": ("PyTorch", "ML/AI", "other"),
                "scikit-learn": ("Scikit-learn", "ML/AI", "other"),
            }
            for dep, info in _py_map.items():
                if dep in reqs:
                    tech_stack[info[2]].append({"name": info[0], "category": info[1]})
        except IOError:
            pass

    # Pipenv
    if "pipfile" in files_in_root:
        tech_stack["devops"].append({"name": "Pipenv", "category": "Package Manager"})

    # pyproject.toml (Poetry)
    if "pyproject.toml" in files_in_root:
        tech_stack["devops"].append({"name": "Poetry / pyproject", "category": "Package Manager"})

    # ─── Docker ───
    if "dockerfile" in files_in_root or ".dockerignore" in files_in_root:
        tech_stack["devops"].append({"name": "Docker", "category": "Containerization"})
    if "docker-compose.yml" in files_in_root or "docker-compose.yaml" in files_in_root or "compose.yml" in files_in_root:
        tech_stack["devops"].append({"name": "Docker Compose", "category": "Orchestration"})

    # ─── CI/CD ───
    github_workflows = os.path.join(repo_path, ".github", "workflows")
    if os.path.exists(github_workflows):
        tech_stack["devops"].append({"name": "GitHub Actions", "category": "CI/CD"})

    gitlab_ci = os.path.join(repo_path, ".gitlab-ci.yml")
    if os.path.exists(gitlab_ci):
        tech_stack["devops"].append({"name": "GitLab CI", "category": "CI/CD"})

    # ─── Linting / Formatting ───
    eslint_files = {"eslint.config.js", ".eslintrc.js", ".eslintrc.json", ".eslintrc.yml", ".eslintrc"}
    if eslint_files & files_in_root:
        tech_stack["devops"].append({"name": "ESLint", "category": "Linting"})

    prettier_files = {".prettierrc", ".prettierrc.js", ".prettierrc.json", "prettier.config.js"}
    if prettier_files & files_in_root:
        tech_stack["devops"].append({"name": "Prettier", "category": "Formatting"})

    # ─── PHP / Laravel ───
    if "artisan" in files_in_root or "composer.json" in files_in_root:
        tech_stack["backend"].append({"name": "PHP", "category": "Language"})
        composer_path = os.path.join(repo_path, "composer.json")
        if os.path.exists(composer_path):
            try:
                with open(composer_path, "r", encoding="utf-8") as f:
                    composer = json.load(f)
                all_reqs = composer.get("require", {})
                if "laravel/framework" in all_reqs:
                    tech_stack["backend"].append({"name": "Laravel", "category": "Framework"})
                if "symfony/framework-bundle" in all_reqs:
                    tech_stack["backend"].append({"name": "Symfony", "category": "Framework"})
            except (json.JSONDecodeError, IOError):
                pass

    # ─── Flutter / Dart ───
    if "pubspec.yaml" in files_in_root:
        tech_stack["frontend"].append({"name": "Flutter", "category": "Mobile Framework"})
        tech_stack["frontend"].append({"name": "Dart", "category": "Language"})

    # ─── Tekrar eden girişleri temizle ───
    for category in tech_stack:
        seen = set()
        unique = []
        for item in tech_stack[category]:
            if item["name"] not in seen:
                seen.add(item["name"])
                unique.append(item)
        tech_stack[category] = unique

    return tech_stack
