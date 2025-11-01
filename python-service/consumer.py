import pika
import json
import sys
import requests
import os 
from dotenv import load_dotenv

# SADECE UZMANLARI VE YARDIMCILARI IMPORT ET
from analyzers import squat_analyzer, pushup_analyzer 
# 'video_processor' import'u kaldırıldı

# .env dosyasındaki değişkenleri yükle
load_dotenv()

# --- .ENV'DEN OKUMA (Varsayılan değer OLMADAN) ---
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST')
QUEUE_NAME = os.getenv('QUEUE_NAME')
BACKEND_HOST = os.getenv('BACKEND_HOST')
BACKEND_PORT = os.getenv('BACKEND_PORT')
BACKEND_RESULTS_PATH = os.getenv('BACKEND_RESULTS_PATH')

# --- KONTROL BLOĞU ---
REQUIRED_VARS = {
    'RABBITMQ_HOST': RABBITMQ_HOST, 'QUEUE_NAME': QUEUE_NAME,
    'BACKEND_HOST': BACKEND_HOST, 'BACKEND_PORT': BACKEND_PORT,
    'BACKEND_RESULTS_PATH': BACKEND_RESULTS_PATH
}
missing_vars = [key for key, value in REQUIRED_VARS.items() if value is None]
if missing_vars:
    print(f"--- HATA: .env DOSYASI EKSİK: {', '.join(missing_vars)} ---")
    sys.exit(1)
# ------------------------------------

BACKEND_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}{BACKEND_RESULTS_PATH}"


def send_results_to_backend(video_id, result):
    """Analiz sonucunu Spring Boot API'sine POST eder."""
    payload = {
        "videoId": video_id,
        "correctReps": result.get("correct_reps", 0),
        "wrongReps": result.get("wrong_reps", 0),
        "feedback": result.get("feedback", "Analiz sırasında hata oluştu.")
    }
    try:
        response = requests.post(BACKEND_URL, json=payload) 
        if response.status_code == 200:
            print(f" [i] Video ID {video_id} için sonuçlar backend'e başarıyla gönderildi.")
        else:
            print(f" [!] Backend hatası! Video ID: {video_id}, Durum: {response.status_code}, Yanıt: {response.text}")
    except requests.exceptions.ConnectionError:
        print(f" [!] Backend'e bağlanılamadı! ({BACKEND_URL}) Spring Boot çalışıyor mu?")


def callback(ch, method, properties, body):
    """Kuyruktan bir mesaj alındığında bu fonksiyon çalışır."""
    print(f"\n--- [x] YENİ MESAJ ALINDI ---")
    
    video_id = None
    analysis_result = None

    try:
        message_data = json.loads(body.decode('utf-8'))
        
        video_id = message_data.get('videoId')
        video_url = message_data.get('videoUrl')
        exercise_name = message_data.get('exerciseName')

        if not video_id or not video_url or not exercise_name:
            print(f" [!] Hatalı mesaj formatı: {body.decode('utf-8')}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        print(f" [i] Video ID: {video_id}, Hareket: {exercise_name}")
        
        # 1. Dağıtım (Senin istediğin mantık)
        # 'video_processor' yok. Doğrudan 'uzman' çağrılıyor.
        print(f" [>] Uzman analizci çağrılıyor: {exercise_name}")
        
        if exercise_name.lower() == 'squat':
            # Uzmana URL'i VE video_id'yi gönderiyoruz
            analysis_result = squat_analyzer.analyze_squat(video_url, video_id)
            
        elif exercise_name.lower() in ['push-up', 'pushup']:
            # Push-up uzmanını çağır
            analysis_result = pushup_analyzer.analyze_pushup(video_url)
            
        else:
            print(f" [!] UYARI: '{exercise_name}' için bir analizci bulunamadı.")
            analysis_result = {
                "correct_reps": 0, "wrong_reps": 0,
                "feedback": f"'{exercise_name}' hareketi için analiz modülü henüz eklenmemiş."
            }

        print(f" [>] Analiz tamamlandı. Sonuç: {analysis_result}")

        # 2. Sonuçları Geri Gönder
        send_results_to_backend(video_id, analysis_result)
        
        print(f" [✓] Mesaj başarıyla işlendi ve kuyruktan silindi.")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f" [!] İşlem sırasında beklenmedik bir hata oluştu: {e}")
        if video_id:
             send_results_to_backend(video_id, {"feedback": f"Analiz hatası: {e}", "correct_reps": 0, "wrong_reps": 0})
        ch.basic_ack(delivery_tag=method.delivery_tag)

def main():
    """Ana dinleyici fonksiyonu."""
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST)
        )
        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME, durable=False) 
        channel.basic_consume(
            queue=QUEUE_NAME,
            on_message_callback=callback
        )
        print(f' [*] Kuyruk dinleniyor: {QUEUE_NAME}')
        print(' [*] Mesaj bekleniyor. Çıkmak için CTRL+C basın')
        channel.start_consuming()

    except pika.exceptions.AMQPConnectionError as e:
        print(f"HATA: RabbitMQ sunucusuna bağlanılamadı ({RABBITMQ_HOST}).")
    except KeyboardInterrupt:
        print('\nKapatıldı.')
    sys.exit(0)

if __name__ == '__main__':
    main()