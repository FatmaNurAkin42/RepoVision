"""
RepoVision Backend — FastAPI Uygulaması
ZIP dosyası yükleme ve otomatik kod analizi API'si.
"""

import os
import shutil
import tempfile
import zipfile
import urllib.request
import urllib.error


from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from analyzer.core import analyze_repository

app = FastAPI(
    title="RepoVision API",
    description="GitHub repo analiz servisi",
    version="1.0.0",
)

# CORS — Frontend'in backend'e erişimine izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    ZIP dosyası yükler, çıkartır, analiz eder ve sonuçları JSON olarak döndürür.
    GitHub'dan indirilen ZIP dosyalarını doğrudan destekler.
    """
    # Dosya türü kontrolü
    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Sadece ZIP dosyaları desteklenmektedir. Lütfen .zip uzantılı bir dosya yükleyin.",
        )

    # Dosya boyutu kontrolü (100MB üst limit)
    content = await file.read()
    max_size = 100 * 1024 * 1024  # 100MB
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"Dosya boyutu çok büyük. Maksimum {max_size // (1024*1024)}MB desteklenmektedir.",
        )

    temp_dir = tempfile.mkdtemp(prefix="repovision_")
    zip_path = os.path.join(temp_dir, "repo.zip")

    try:
        # ZIP dosyasını geçici dizine kaydet
        with open(zip_path, "wb") as f:
            f.write(content)

        # ZIP'i çıkart
        extract_dir = os.path.join(temp_dir, "extracted")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(extract_dir)

        # GitHub ZIP'leri genellikle tek bir kök klasör içerir (ör: repo-main/)
        items = os.listdir(extract_dir)
        if len(items) == 1 and os.path.isdir(os.path.join(extract_dir, items[0])):
            repo_path = os.path.join(extract_dir, items[0])
        else:
            repo_path = extract_dir

        # Analiz motorunu çalıştır
        result = analyze_repository(repo_path)

        # Proje adını dosya adından çıkar
        project_name = file.filename.replace(".zip", "")
        # GitHub formatı: "repo-main" → "repo"
        for suffix in ["-main", "-master", "-develop", "-dev"]:
            if project_name.endswith(suffix):
                project_name = project_name[: -len(suffix)]
                break
        result["project_name"] = project_name

        return result

    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=400,
            detail="Geçersiz ZIP dosyası. Lütfen dosyanın bozuk olmadığından emin olun.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analiz sırasında bir hata oluştu: {str(e)}",
        )
    finally:
        # Geçici dosyaları temizle
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/api/analyze-url")
async def analyze_url(payload: dict):
    """
    Girilen GitHub repository URL'sinden ZIP indirir, açar ve analiz sonuçlarını döner.
    """
    url = payload.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="Lütfen geçerli bir GitHub repository URL'si belirtin.")
    
    # Basit doğrulama ve temizlik
    url = url.strip().rstrip("/")
    if "github.com" not in url:
        raise HTTPException(
            status_code=400,
            detail="Desteklenmeyen URL. Sadece public GitHub depoları (https://github.com/kullanici/depo) desteklenmektedir."
        )

    parts = url.split("github.com/")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Geçersiz GitHub URL formatı.")

    repo_info = parts[1].split("/")
    if len(repo_info) < 2:
        raise HTTPException(
            status_code=400,
            detail="Geçersiz GitHub URL formatı. Lütfen https://github.com/kullanici/depo şeklinde girin."
        )

    username = repo_info[0]
    reponame = repo_info[1]

    # ZIP indirme URL'si (varsayılan branch 'main' veya 'master' aranır)
    zip_url = f"https://github.com/{username}/{reponame}/archive/refs/heads/main.zip"
    temp_dir = tempfile.mkdtemp(prefix="repovision_url_")
    zip_path = os.path.join(temp_dir, "repo.zip")

    try:
        # User-Agent header'ı ekleyerek isteği at
        req = urllib.request.Request(
            zip_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        try:
            with urllib.request.urlopen(req) as response:
                with open(zip_path, "wb") as f:
                    f.write(response.read())
        except urllib.error.HTTPError as e:
            if e.code == 404:
                # 'main' bulunamadıysa 'master' branch'ini dene
                zip_url_master = f"https://github.com/{username}/{reponame}/archive/refs/heads/master.zip"
                req_master = urllib.request.Request(
                    zip_url_master,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
                )
                try:
                    with urllib.request.urlopen(req_master) as response:
                        with open(zip_path, "wb") as f:
                            f.write(response.read())
                except urllib.error.HTTPError as e2:
                    raise HTTPException(
                        status_code=400,
                        detail=f"GitHub deposu indirilemedi. Deponun public olduğundan ve 'main' veya 'master' adında bir ana dalı (branch) bulunduğundan emin olun. (HTTP Hata: {e2.code})"
                    )
            else:
                raise HTTPException(
                    status_code=400, detail=f"Depo indirilirken bir hata oluştu: HTTP {e.code}"
                )

        # ZIP dosyasını çıkart
        extract_dir = os.path.join(temp_dir, "extracted")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(extract_dir)

        # GitHub ZIP'leri genellikle tek bir kök klasör içerir (ör: repo-main/)
        items = os.listdir(extract_dir)
        if len(items) == 1 and os.path.isdir(os.path.join(extract_dir, items[0])):
            repo_path = os.path.join(extract_dir, items[0])
        else:
            repo_path = extract_dir

        # Analiz et
        result = analyze_repository(repo_path)
        result["project_name"] = reponame
        return result

    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="İndirilen dosya geçerli bir ZIP arşivi değil.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analiz sırasında beklenmeyen hata: {str(e)}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.get("/api/health")
async def health():
    """Sunucu sağlık kontrolü."""
    return {"status": "ok", "service": "RepoVision API"}

import json

class AIRequest(BaseModel):
    file_path: str
    content: str
    question: str
    api_key: str | None = None
    provider: str | None = "gemini"

@app.post("/api/ai/ask")
async def ask_ai(request: AIRequest):
    provider = request.provider or "gemini"
    
    # Sağlayıcıya göre anahtar seçimi ve çevre değişkeni eşlemesi
    if provider == "gemini":
        api_key = request.api_key or os.environ.get("GEMINI_API_KEY")
        env_var_name = "GEMINI_API_KEY"
    elif provider == "openai":
        api_key = request.api_key or os.environ.get("OPENAI_API_KEY")
        env_var_name = "OPENAI_API_KEY"
    elif provider == "anthropic":
        api_key = request.api_key or os.environ.get("ANTHROPIC_API_KEY")
        env_var_name = "ANTHROPIC_API_KEY"
    else:
        raise HTTPException(status_code=400, detail=f"Geçersiz AI sağlayıcısı: {provider}")

    if not api_key:
        return {"answer": f"Yapay zeka asistanını kullanabilmek için lütfen geçerli bir {provider.upper()} API Anahtarı girin (veya backend dizinindeki .env dosyasına {env_var_name} tanımlayın)."}

    prompt = f"""
Sen bir uzman yazılım geliştiricisisin. Sana bir projedeki dosyanın içeriği ve yolu verilecek. 
Kullanıcının bu dosya hakkındaki sorusunu Türkçe olarak kısa ve anlaşılır bir şekilde cevapla.
Dosya Yolu: {request.file_path}

Dosya İçeriği:
```
{request.content}
```

Kullanıcının Sorusu: {request.question}
"""

    if provider == "gemini":
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            return {"answer": response.text}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gemini API Hatası: {str(e)}")

    elif provider == "openai":
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "Sen bir uzman yazılım geliştiricisisin. Türkçe cevap verirsin."},
                    {"role": "user", "content": prompt}
                ]
            }
            req = urllib.request.Request(
                url, 
                data=json.dumps(payload).encode("utf-8"), 
                headers=headers, 
                method="POST"
            )
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                answer = res_data["choices"][0]["message"]["content"]
                return {"answer": answer}
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8")
            try:
                err_json = json.loads(err_msg)
                detail = err_json.get("error", {}).get("message", err_msg)
            except Exception:
                detail = err_msg
            raise HTTPException(status_code=e.code, detail=f"OpenAI API Hatası: {detail}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OpenAI Bağlantı Hatası: {str(e)}")

    elif provider == "anthropic":
        try:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "claude-3-5-haiku-20241022",
                "max_tokens": 1024,
                "system": "Sen bir uzman yazılım geliştiricisisin. Türkçe cevap verirsin.",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            req = urllib.request.Request(
                url, 
                data=json.dumps(payload).encode("utf-8"), 
                headers=headers, 
                method="POST"
            )
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                answer = res_data["content"][0]["text"]
                return {"answer": answer}
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8")
            try:
                err_json = json.loads(err_msg)
                detail = err_json.get("error", {}).get("message", err_msg)
            except Exception:
                detail = err_msg
            raise HTTPException(status_code=e.code, detail=f"Anthropic API Hatası: {detail}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Anthropic Bağlantı Hatası: {str(e)}")



