import cv2
import mediapipe as mp
import numpy as np
import os
import requests
import tempfile

# MediaPipe'in araçları
mp_pose = mp.solutions.pose
# mp_drawing'e artık ihtiyacımız yok, manuel çizim yapacağız

# --- YENİ 2D AÇI HESAPLAMA FONKSİYONU ---
def calculate_angle(a, b, c):
    """
    Üç eklem noktası (landmark) arasındaki açıyı 2D olarak hesaplar.
    (Sadece X ve Y koordinatlarını kullanır)
    """
    try:
        # Sadece X ve Y koordinatlarını al
        p_a = np.array([a.x, a.y])
        p_b = np.array([b.x, b.y])
        p_c = np.array([c.x, c.y])
        
        # 'atan2' ile açıları hesapla (radyan cinsinden)
        radians_ba = np.arctan2(p_a[1] - p_b[1], p_a[0] - p_b[0])
        radians_bc = np.arctan2(p_c[1] - p_b[1], p_c[0] - p_b[0])
        
        # Açı farkını bul ve dereceye çevir
        angle_diff_rad = radians_bc - radians_ba
        angle_degrees = np.abs(np.degrees(angle_diff_rad))
        
        # Her zaman 0-180 derece arasındaki iç açıyı al
        # (Eğer dış açıyı hesapladıysa 360'tan çıkar)
        if angle_degrees > 180.0:
            angle_degrees = 360.0 - angle_degrees
            
        return angle_degrees
        
    except Exception as e:
        print(f"2D Açı hesaplama hatası: {e}")
        return None # Hata durumunda None dön

# --- 2. YARDIMCI FONKSİYON (Çizim - SENİN İSTEĞİNE GÖRE GÜNCELLENDİ) ---
def draw_curl_stats(image, landmarks, stats, feedback):
    """
    Her karenin (image) üzerine SADECE 3 NOKTAYI ve istatistikleri çizer.
    """
    
    # 1. SADECE 3 NOKTAYI ÇİZ
    try:
        # Görüntünün boyutlarını al (normalize koordinatları piksele çevirmek için)
        h, w, _ = image.shape
        
        # Gerekli 3 eklemi al
        shoulder = landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
        elbow = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW]
        wrist = landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST]
        
        # Piksel koordinatlarını hesapla
        shoulder_coords = (int(shoulder.x * w), int(shoulder.y * h))
        elbow_coords = (int(elbow.x * w), int(elbow.y * h))
        wrist_coords = (int(wrist.x * w), int(wrist.y * h))
        
        # 2 Kenarı (çizgiyi) çiz
        cv2.line(image, shoulder_coords, elbow_coords, (245, 117, 66), 3)
        cv2.line(image, elbow_coords, wrist_coords, (245, 117, 66), 3)
        
        # 3 Noktayı (eklemi) çiz
        cv2.circle(image, shoulder_coords, 6, (245, 66, 230), -1)
        cv2.circle(image, elbow_coords, 6, (245, 66, 230), -1)
        cv2.circle(image, wrist_coords, 6, (245, 66, 230), -1)

    except Exception as e:
        pass # Eğer eklemler görünmüyorsa çizim yapma

    
    # 2. İstatistik kutusunu çiz (Bu kısım aynı)
    cv2.rectangle(image, (0, 0), (300, 200), (24, 24, 24), -1)
    
    # 3. Verileri ekrana yaz
    cv2.putText(image, 'DOGRU REPS', (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    cv2.putText(image, str(stats["correct_reps"]), (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (57, 255, 20), 2, cv2.LINE_AA)
    cv2.putText(image, 'YANLIS REPS', (150, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    cv2.putText(image, str(stats["wrong_reps"]), (155, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 2, cv2.LINE_AA)
    cv2.putText(image, 'STATE', (15, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    cv2.putText(image, stats["state"].upper(), (20, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (57, 255, 20), 2, cv2.LINE_AA)
    cv2.putText(image, 'DIRSEK ACISI', (150, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    angle_text = str(round(stats["elbow_angle"], 1)) if stats["elbow_angle"] is not None else 'N/A'
    cv2.putText(image, angle_text, (155, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (57, 255, 20), 2, cv2.LINE_AA)

    # 4. Hata mesajını ekranın altına yaz
    if feedback:
        cv2.rectangle(image, (0, image.shape[0] - 50), (image.shape[0], image.shape[0]), (24, 24, 24), -1)
        cv2.putText(image, feedback, (15, image.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)


# --- 3. ANA ANALİZ FONKSİYONU (N/A HATASI İÇİN GÜNCELLENDİ) ---
def analyze_barbell_curl(video_url, video_id):
    
    print(f"--- UZMAN: GERÇEK BARBELL CURL ANALİZİ (ID: {video_id} - v2) ÇALIŞTI ---")
    
    temp_file_path = None
    cap = None
    out = None
    
    try:
        # --- VİDEOYU İNDİR ---
        print(f" [i] Video Cloudinary'den indiriliyor...")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            temp_file_path = temp_file.name
        with requests.get(video_url, stream=True) as r:
            r.raise_for_status() 
            with open(temp_file_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192): 
                    f.write(chunk)
        print(f" [i] Video başarıyla indirildi: {temp_file_path}")
        
        # --- VİDEOYU AÇ VE AYARLA ---
        cap = cv2.VideoCapture(temp_file_path) 
        if not cap.isOpened():
            return {"correct_reps": 0, "wrong_reps": 0, "feedback": "Video dosyası okunamadı."}

        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        output_fps = cap.get(cv2.CAP_PROP_FPS)
        
        if output_fps <= 0:
            output_fps = 30.0
            
        frame_delay_ms = max(1, int(1000 / output_fps))
        print(f" [i] Video {output_fps} FPS ile işlenecek. Kareler arası bekleme: {frame_delay_ms} ms")
        
        output_folder = 'analysis_videos'
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
        
        output_filename = f"analysis_output_{video_id}_curl.mp4" 
        output_path = os.path.join(output_folder, output_filename)
        out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), output_fps, (frame_width, frame_height))

        # --- ANALİZ DEĞİŞKENLERİ ---
        correct_reps = 0
        wrong_reps = 0 
        state = "down" # Başlangıç durumu (kol aşağıda)
        feedback = ""  
        feedback_list = set()
        is_fully_curled = False 
        
        EXTEND_THRESHOLD = 140
        CURL_THRESHOLD = 60   
        
        frame_count = 0
        current_elbow_angle = 180.0 

        # MediaPipe Pose modelini başlat
        with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break 
                
                frame_count += 1
                
                image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image.flags.writeable = False
                results = pose.process(image)
                image.flags.writeable = True
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                
                feedback = "" 
                
                try:
                    # --- N/A HATA DÜZELTMESİ BURADA ---
                    # (Visibility kontrolü kaldırıldı, Squat'taki gibi)
                    
                    landmarks = results.pose_landmarks
                    
                    # 1. GEREKLİ AÇILARI HESAPLA
                    shoulder = landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
                    elbow = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ELBOW]
                    wrist = landmarks.landmark[mp_pose.PoseLandmark.LEFT_WRIST]
                    
                    current_elbow_angle = calculate_angle(shoulder, elbow, wrist)
                    
                    # 2. TEKRAR SAYMA MANTIĞI
                    if current_elbow_angle is not None:
                        # 1. KOL AŞAĞIDA DURUMU (state = "down")
                        if state == "down":
                            if current_elbow_angle < EXTEND_THRESHOLD - 10: # (Kıvırmaya başladı)
                                state = "up"
                                is_fully_curled = False # Yeni tekrar için bayrağı sıfırla
                        
                        # 2. KOL KIVRILDI DURUMU (state = "up")
                        elif state == "up":
                            # Tam kıvrılma bayrağını kontrol et
                            if current_elbow_angle < CURL_THRESHOLD:
                                is_fully_curled = True
                            
                            # Tekrar kolunu açtı mı?
                            if current_elbow_angle > EXTEND_THRESHOLD:
                                state = "down" # Durumu "down" yap
                                
                                # Tekrarı değerlendir:
                                if is_fully_curled:
                                    correct_reps += 1
                                    feedback = "Dogru Tekrar!"
                                    print(f"    -> DOGRU TEKRAR! Toplam: {correct_reps}")
                                else:
                                    wrong_reps += 1 # YETERİNCE KIVIRMADI
                                    feedback = "HATA: Kolunuzu tam kivirmadiniz"
                                    feedback_list.add(feedback)
                                    print(f"    -> YANLIS TEKRAR! Toplam: {wrong_reps}")

                    # 3. AYRI FEEDBACK MANTIĞI
                    if state == "up": 
                        try:
                            hip = landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
                            if hip.visibility > 0.5 and (shoulder.y < hip.y - 0.1): 
                                 feedback = "HATA: Omuzunuzu kullaniyorsunuz (Hile)"
                                 feedback_list.add(feedback)
                        except Exception as e:
                            pass 
                                
                except Exception as e:
                    current_elbow_angle = None
                    feedback = "Kamerada insan tespiti basarisiz"
                    pass 

                # --- ÇİZİM HER ZAMAN ÇALIŞIR ---
                stats_data = {
                    "correct_reps": correct_reps,
                    "wrong_reps": wrong_reps,
                    "state": state,
                    "elbow_angle": current_elbow_angle
                }
                # 'results.pose_landmarks' varsa çizim yap
                if results.pose_landmarks: 
                    draw_curl_stats(
                        image, 
                        results.pose_landmarks, 
                        stats_data,
                        feedback
                    )
                
                out.write(image)
                if cv2.waitKey(frame_delay_ms) & 0xFF == 27:
                    break
        
        # --- DÖNGÜ BİTTİ ---
        print(f"    -> {frame_count} kare analiz edildi.")
        print(f"    -> İşlenmiş video '{output_path}' olarak kaydedildi.")
        print(f"    -> Sonuç: {correct_reps} doğru, {wrong_reps} yanlış.")

        if not feedback_list and correct_reps > 0 and wrong_reps == 0:
            final_feedback = f"Toplam {correct_reps} tekrar yapıldı. Formunuz harika!"
        elif correct_reps == 0 and wrong_reps == 0:
             final_feedback = "Videoda barbell curl hareketi tespit edilemedi."
        else:
            final_feedback = " | ".join(feedback_list)

        return {
            "correct_reps": correct_reps,
            "wrong_reps": wrong_reps,
            "feedback": final_feedback
        }

    finally:
        # Kaynakları serbest bırak ve geçici dosyayı sil
        if cap:
            cap.release()
        if out:
            out.release()
        cv2.destroyAllWindows()
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            print(f" [i] Geçici dosya silindi: {temp_file_path}")