🏋️‍♂️ RepVision - AI Destekli Kişisel Fitness Koçu
===================================================

 **RepVision**, egzersiz videolarını yapay zeka ile analiz eden, tekrar sayılarını doğrulayan ve form bozukluklarını tespit ederek kullanıcıya anlık geri bildirim veren, mikroservis mimarisine sahip mobil bir fitness asistanıdır.

🚀 Proje Hakkında
-----------------

RepVision, spor salonunda bir antrenör yanınızdaymış gibi çalışır. Sadece tekrar saymakla kalmaz, hareketin **doğruluğunu, derinliğini ve formunu** geometrik hesaplamalarla analiz eder.

Uygulama, kullanıcıdan alınan videoyu buluta yükler, asenkron bir mimari (RabbitMQ) ile işler ve sonuçları detaylı istatistiklerle raporlar.

### 🎯 Desteklenen Hareketler & Analiz Yetenekleri

Şu an için aşağıdaki hareketlerde **tekrar sayımı** ve **form analizi** yapılabilmektedir:

*   🏋️‍♀️ **Squat:** Diz açısına göre derinlik kontrolü ve "dizlerin içe kayması" (valgus) tespiti.
    
*   💪 **Push-up (Şınav):** Tam iniş/kalkış mesafesi ve vücut düzlüğü kontrolü.
    
*   🦾 **Barbell Curl:** Kol açısı takibi ve belden güç alma (cheat) tespiti.
    
*   🏋️‍♂️ **Shoulder Press:** Kolların tepe noktada tam kilitlenmesi (lockout) ve simetri kontrolü.
    
*   📉 **Bench Press:** Barın göğse tam iniş mesafesi ve kalkış analizi.
    

🏗️ Mimari ve Teknoloji Yığını
------------------------------

RepVision, modern yazılım prensiplerine uygun olarak **Event-Driven (Olay Güdümlü)** yapıda tasarlanmıştır.

| Alan | Teknolojiler |
| :--- | :--- |
| **Mobil (Frontend)** | React Native, Expo, Axios, Expo Camera |
| **Backend (API)** | Java Spring Boot, Spring Security (JWT), Hibernate, JPA |
| **Yapay Zeka (AI)** | Python, OpenCV, MediaPipe, NumPy |
| **Veritabanı** | PostgreSQL |
| **Mesaj Kuyruğu** | RabbitMQ (Asenkron iletişim için) |
| **Depolama** | Cloudinary (Video hosting) |
| **DevOps** | Docker |

### 🔄 Çalışma Mantığı (System Design)

1.  **Video Upload:** Kullanıcı React Native üzerinden videoyu çeker ve hareket türünü (örn: Bench Press) seçer.
    
2.  **API Gateway:** Video Cloudinary'ye yüklenir, URL ve metadata Spring Boot Backend'e iletilir.
    
3.  **Queueing:** Backend, analizi anında yapmak yerine **RabbitMQ** kuyruğuna bir görev bırakır.
    
4.  **AI Processing:** Python servisi kuyruğu dinler. Mesajı alır, videoyu işler ve **MediaPipe Pose** ile iskelet takibi yapar.
    
5.  **Logic & Math:** Python tarafındaki geometrik algoritmalar hareketi analiz eder.
    
6.  **Result:** Sonuçlar (Doğru/Yanlış tekrar, Feedback) Backend'e API üzerinden geri gönderilir ve veritabanına kaydedilir.
    

🛠️ Kurulum ve Çalıştırma
-------------------------

Projeyi yerel ortamınızda (Localhost) çalıştırmak için aşağıdaki adımları izleyin.

### Ön Gereksinimler

*   Docker Desktop (PostgreSQL ve RabbitMQ için)
    
*   Java JDK 17+
    
*   Python 3.10+
    
*   Node.js & npm
    

### 📂 1. Altyapı (Docker Compose)

Veritabanı ve Mesaj Kuyruğu servislerini tek tek kurmak yerine, projenin ana dizininde docker-compose.yml adında bir dosya oluşturun ve aşağıdaki kodu yapıştırın:
```
version: '3.8'


services:
  # Veritabanı Servisi
  postgres:
    image: postgres:15
    container_name: repvision_db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password  # Burayı kendi şifrenizle değiştirebilirsiniz
      POSTGRES_DB: repvision_db
    volumes:
      - postgres_data:/var/lib/postgresql/data


  # Mesaj Kuyruğu Servisi
  rabbitmq:
    image: rabbitmq:3-management
    container_name: repvision_rabbitmq
    ports:
      - "5672:5672"   # Uygulama portu
      - "15672:15672" # Yönetim paneli (http://localhost:15672)


volumes:
  postgres_data:
```

Ardından terminalde bu dosyanın olduğu klasörde şu komutu çalıştırın:

```
docker-compose up -d
```
### ⚙️ 2. Konfigürasyon (Environment Variables)

Projenin çalışması için API anahtarları ve IP adresleri gereklidir. Aşağıdaki örnekleri kopyalayıp ilgili klasörlerde .env dosyası oluşturarak yapıştırın.

#### A. Backend Ayarları (backend/.env)

backend klasörü içine .env dosyası oluşturun:
```
# --- VERİTABANI ---
# Docker Compose'da belirlediğiniz bilgiler
POSTGRES_URL=jdbc:postgresql://localhost:5432/repvision_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password


# --- GÜVENLİK (JWT) ---
# Rastgele uzun bir anahtar girin
APP_JWT_SECRET=buraya_cok_guvenli_rastgele_bir_sifre_yazin_123456
APP_JWT_EXPIRATION_MS=86400000


# --- RABBITMQ ---
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
```

#### B. Mobil Ayarları (mobile/.env)

mobile klasörü içine .env dosyası oluşturun:
```
# --- BACKEND BAĞLANTISI ---
# Bilgisayarınızın yerel IPv4 adresi (cmd -> ipconfig)
# Emülatör için: 10.0.2.2, Fiziksel cihaz için: 192.168.1.XX
EXPO_PUBLIC_BACKEND_IP=192.168.1.XX
EXPO_PUBLIC_BACKEND_PORT=8080
EXPO_PUBLIC_API_PATH=/api


# --- CLOUDINARY (Video Yükleme) ---
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=senin_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=senin_upload_preset


# --- EXPO (Opsiyonel) ---
EXPO_PUBLIC_EAS_PROJECT_ID=senin_eas_id
```

### ▶️ 3. Servisleri Başlatma

#### Backend (Spring Boot)

cd backend  ./mvnw spring-boot:run

#### AI Servisi (Python)
```
cd python-service  
# Sanal ortam (Opsiyonel)  
python -m venv venv  
# Windows: venv\Scripts\activate  
pip install -r requirements.txt  
python consumer.py
```
#### Mobil Uygulama (React Native)
```
cd mobile  
npm install  
npx expo start
```
🧠 Yapay Zeka Mantığı (Under the Hood)
--------------------------------------

Projenin beyni olan Python servisi, **MediaPipe** kütüphanesini kullanarak insan iskeletini (33 nokta) 30 FPS hızında analiz eder.

**Örnek Algoritma (Shoulder Press):**

1.  **Akıllı Taraf Seçimi:** Kamera açısına göre sağ veya sol omzun hangisinin daha net göründüğü otomatik algılanır.
    
2.  **State Machine:**
    
    *   Harekete başlarken STATE: DOWN (Eller omuzda).
        
    *   Kollar yukarı itildiğinde (Açı > 150°) STATE: UP.
        
3.  **Hata Tespiti:** Kullanıcı kolları yukarı iterken 150 dereceye ulaşamazsa, sistem bunu **"Yanlış Tekrar"** olarak işaretler ve _"Kollarını tam uzat!"_ şeklinde geri bildirim üretir.
    

👨‍💻 Geliştirici
-----------------

**Burak Karahan**

*   Yazılım Mühendisliği Öğrencisi
    
*   [Portfolio](https://devburakkarahan.com)
    
*   [LinkedIn](https://linkedin.com/in/burak-karahan)
    

📄 Lisans
---------

Bu proje MIT lisansı ile lisanslanmıştır.
