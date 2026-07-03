# 🔍 RepoVision

**RepoVision**, yüklenen veya GitHub linki verilen yazılım depolarını (repository) statik olarak analiz eden, kullanılan dil/teknoloji yığınlarını çıkaran, kod kalitesi puanlaması yapan, güvenlik taraması (SAST & Secret Detection) gerçekleştiren ve interaktif bir dosya ağacı ile kod içeriği incelemesi sunan modern bir web uygulamasıdır.

---

## ✨ Özellikler

* **📊 Dil Dağılım Grafiği (LOC):** Projenin hangi dillerden ne kadar kod satırı barındırdığını pasta grafiği (Recharts) ile görselleştirir.
* **📈 Klasör Dağılım Haritası (Treemap):** Kök klasörlerin ve dosyaların dosya boyutu ağırlıklarını Flat Partitioning algoritmasıyla görselleştirir. Kalabalıklaşmayı önlemek adına 12 kutu limiti ve "Katlanabilir/Kapatılabilir" yapısıyla sunulmuştur.
* **📦 Çoklu Ekosistem Bağımlılık Analizi:**
  * Node.js (`package.json`)
  * Python (`requirements.txt`)
  * PHP (Composer - `composer.json`)
  * Flutter/Dart (Pubspec - `pubspec.yaml`)
  * Bağımlılıkları sürüm bilgileriyle birlikte sekmeli kart arayüzünde listeler.
* **🛡️ Güvenlik Taraması (SAST & Secret Detection):** 
  * Sızdırılmış kimlik bilgilerini (AWS Key, Slack/GitHub Token, özel anahtarlar, sabit şifreler) bulur.
  * Olası kod zaafiyetlerini (SQL Injection, subprocess shell=True, eval vb.) satır numarası ve kod parçacığı (snippet) ile raporlar.
  * Sayfa düzenini korumak adına bulgu detayları listesi katlanabilir (collapsible) yapıda tasarlanmıştır.
* **🎯 Kalite Skoru:** Projeyi linter, testler, CI/CD, README kullanımı ve yorum satırı oranına göre 100 üzerinden puanlayıp harf notu verir.
* **📁 İnteraktif Kod Gezgini & Çoklu AI Ajanı:**
  * Proje dosya ağacını tarayıcıda dinamik olarak gezebilirsiniz.
  * Gemini, OpenAI veya Anthropic sağlayıcılarından dilediğinizi seçip kendi API anahtarınızla dosyayı inceletebilirsiniz.
  * AI Kod Asistanı paneli kod okuma alanını daraltmamak için katlanabilir/gizlenebilir yapıdadır.
* **📥 Raporu Dışa Aktarma:** Analiz özetini, kod kalitesini, bağımlılıkları ve tüm detaylı güvenlik açıklarını içeren **Markdown (.md) Raporu** veya **Ham Veri (JSON)** çıktısını tek tıkla indirmenizi sağlar.

---

## ⚡ Büyük Projeler İçin Performans Optimizasyonları

RepoVision, binlerce dosya içeren devasa depoların dahi saniyeler içerisinde analiz edilebilmesi için özel performans filtrelerine sahiptir:
1. **Güvenlik Taraması Boyut Sınırı:** Regex motorunun CPU kitlemesini önlemek için 100KB'tan büyük dosyalar SAST taramasından muaf tutulur.
2. **Hızlı Satır Sayıcı:** 100KB'tan büyük dosyalar için yorum satırı ayıklama döngüsü atlanarak dosya 1MB'lık ikili bloklarla doğrudan C-seviyesinde taranır.
3. **Önizleme Kırpma:** Dosya ağacındaki kod önizleme boyut sınırı 35KB ile sınırlandırılmış ve 35KB üzeri dosyalarda yavaş çalışan AST yapısı özetleyici es geçilmiştir. Bu sayede JSON veri transferi boyutu %99 küçültülmüştür.

---

## 🏗️ Proje Mimarisi

* **Backend:** FastAPI (Python 3.12+), Uvicorn sunucusu.
* **Frontend:** React 18, TypeScript, Vite, Recharts (Grafikler), Lucide Icons (Simgeler).

---

## 🚀 Başlangıç

### 1. Backend Kurulumu
Yeni bir terminalde:
```bash
cd backend

# Python sanal ortamı oluşturup aktif edin
python -m venv venv
# Windows için aktif etme:
venv\Scripts\activate
# macOS/Linux için aktif etme:
# source venv/bin/activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# Sunucuyu başlatın
uvicorn main:app --reload
```
*Backend varsayılan olarak `http://127.0.0.1:8000` adresinde çalışacaktır.*

### 2. Frontend Kurulumu
Farklı bir terminalde:
```bash
cd frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirici sunucusunu başlatın
npm run dev
```
*Frontend varsayılan olarak `http://localhost:5173` adresinde çalışacaktır.*

---

## 🔒 Güvenlik Notu

Yapay zeka asistanı için girilen API anahtarları sunucu tarafında veya herhangi bir veritabanında saklanmaz. Tamamen tarayıcınızın yerel hafızasında (`localStorage`) tutulur ve yalnızca asistan sorgusu yapıldığında istek anında backend'e gönderilir.

---

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.
