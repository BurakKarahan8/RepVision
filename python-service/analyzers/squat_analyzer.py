import cv2
import mediapipe as mp
import numpy as np
import os
import requests
import tempfile

# MediaPipe'in araçları
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# --- 1. YARDIMCI FONKSİYON (Açı Hesaplama) ---
def calculate_angle(a, b, c):
    """Üç eklem noktası (landmark) arasındaki açıyı 3D olarak hesaplar."""
    try:
        p_a = np.array([a.x, a.y, a.z])
        p_b = np.array([b.x, b.y, b.z])
        p_c = np.array([c.x, c.y, c.z])
        bac_ab = p_a - p_b
        bac_bc = p_c - p_b
        dot_product = np.dot(bac_ab, bac_bc)
        mag_ab = np.linalg.norm(bac_ab)
        mag_bc = np.linalg.norm(bac_bc)
        if mag_ab == 0 or mag_bc == 0: return 180.0
        cosine_angle = np.clip(dot_product / (mag_ab * mag_bc), -1, 1)
        angle = np.degrees(np.arccos(cosine_angle))
        return angle
    except Exception as e:
        return None

# --- 2. YARDIMCI FONKSİYON (Çizim) ---
def draw_landmarks_and_stats(image, landmarks, stats, feedback):
    """
    Her karenin (image) üzerine iskeleti, açıları ve istatistikleri çizer.
    """
    # 1. İskeleti çiz
    mp_drawing.draw_landmarks(
        image, landmarks, mp_pose.POSE_CONNECTIONS,
        mp_drawing.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=2), 
        mp_drawing.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2)
    )
    
    # 2. İstatistik kutusunu çiz
    cv2.rectangle(image, (0, 0), (300, 200), (24, 24, 24), -1)
    
    # 3. Verileri ekrana yaz
    cv2.putText(image, 'DOGRU REPS', (15, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    cv2.putText(image, str(stats["correct_reps"]), (20, 70), 
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (57, 255, 20), 2, cv2.LINE_AA)
                
    cv2.putText(image, 'YANLIS REPS', (120, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    cv2.putText(image, str(stats["wrong_reps"]), (125, 70), 
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 2, cv2.LINE_AA)
                
    cv2.putText(image, 'STATE', (15, 110), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    cv2.putText(image, stats["state"].upper(), (20, 150), 
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (57, 255, 20), 2, cv2.LINE_AA)

    cv2.putText(image, 'DIZ ACISI', (120, 110), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    angle_text = str(round(stats["knee_angle"], 1)) if stats["knee_angle"] is not None else 'N/A'
    cv2.putText(image, angle_text, (125, 150), 
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (57, 255, 20), 2, cv2.LINE_AA)

    # 4. Hata mesajını ekranın altına yaz
    if feedback:
        cv2.rectangle(image, (0, image.shape[0] - 50), (image.shape[0], image.shape[0]), (24, 24, 24), -1)
        cv2.putText(image, feedback, (15, image.shape[0] - 20), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)


# --- 3. ANA ANALİZ FONKSİYONU ---
def analyze_squat(video_url, video_id):
    """
    Ana Squat analiz fonksiyonu.
    Sadece 3 noktaya (Diz Açısı) göre tekrar sayar.
    Yeterince derine inilmezse 'Yanlış Tekrar' sayar.
    """
    
    print(f"--- UZMAN: GERÇEK SQUAT ANALİZİ (ID: {video_id} - v2) ÇALIŞTI ---")
    
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
        output_filename = f"analysis_output_{video_id}.mp4" 
        output_path = os.path.join(output_folder, output_filename)
        out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), output_fps, (frame_width, frame_height))

        # --- YENİ ANALİZ DEĞİŞKENLERİ ---
        correct_reps = 0
        wrong_reps = 0 
        state = "up" # Başlangıç durumu
        feedback = ""  # Anlık geri bildirim
        feedback_list = set() # Tüm kalıcı hataları biriktir
        
        # 'Yeterince derine indi mi?' bayrağı (flag)
        # Bu, 'wrong_rep' saymak için KİLİT değişkendir
        went_deep_enough = False 
        
        # Eşik açıları (Bunlarla oynayabiliriz)
        UP_THRESHOLD = 160  # Tamamen ayakta durma açısı
        DOWN_THRESHOLD = 100 # Doğru tekrar için inilmesi gereken minimum derinlik
        
        frame_count = 0
        current_knee_angle = 180.0 

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
                
                feedback = "" # Anlık geri bildirimi her karede sıfırla
                
                try:
                    landmarks = results.pose_landmarks
                    
                    # --- 1. GEREKLİ AÇILARI HESAPLA ---
                    # (Sayma için 3 ana nokta)
                    hip = landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
                    knee = landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE]
                    ankle = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ANKLE]
                    
                    current_knee_angle = calculate_angle(hip, knee, ankle)

                    # --- 2. TEKRAR SAYMA MANTIĞI ---
                    # (Sadece 'current_knee_angle' None değilse çalışır)
                    if current_knee_angle is not None:
                        # 1. AYAKTA DURUMU (state = "up")
                        if state == "up":
                            if current_knee_angle < UP_THRESHOLD - 10: # (Harekete başladı)
                                state = "down"
                                went_deep_enough = False # Yeni tekrar için bayrağı sıfırla
                        
                        # 2. HAREKETLİ DURUM (state = "down")
                        elif state == "down":
                            # Derinlik bayrağını kontrol et
                            if current_knee_angle < DOWN_THRESHOLD:
                                went_deep_enough = True
                            
                            # Tekrar ayağa kalktı mı?
                            if current_knee_angle > UP_THRESHOLD:
                                state = "up" # Durumu "up" yap
                                
                                # Tekrarı değerlendir:
                                if went_deep_enough:
                                    correct_reps += 1
                                    feedback = "Dogru Tekrar!"
                                    print(f"    -> DOGRU TEKRAR! Toplam: {correct_reps}")
                                else:
                                    wrong_reps += 1 # YETERİNCE DERİN DEĞİL
                                    feedback = "HATA: Yeterince derine inmediniz"
                                    feedback_list.add(feedback)
                                    print(f"    -> YANLIS TEKRAR! Toplam: {wrong_reps}")

                    # --- 3. AYRI FEEDBACK MANTIĞI ---
                    # (Bu kısım çökse bile ana sayacı etkilemez)
                    if state == "down":
                        try:
                            # Omuz görünürse diz kaymasını kontrol et
                            shoulder = landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
                            if shoulder.visibility > 0.5:
                                if knee.x > ankle.x + 0.05:
                                    feedback = "HATA: Dizleriniz one kayiyor"
                                    feedback_list.add(feedback)
                        except Exception as e:
                            pass # Omuz görünmüyorsa bu hatayı atla
                                
                except Exception as e:
                    # Bu blok, 'landmarks'ın kendisi None ise (iskelet hiç yoksa)
                    # veya 'landmark[...]' (örn: LEFT_HIP) bulunamadıysa çalışır.
                    current_knee_angle = None
                    feedback = "Kamerada insan tespiti basarisiz"
                    pass 

                # --- ÇİZİM HER ZAMAN ÇALIŞIR ---
                stats_data = {
                    "correct_reps": correct_reps,
                    "wrong_reps": wrong_reps,
                    "state": state,
                    "knee_angle": current_knee_angle
                }
                if results.pose_landmarks: # Çizecek bir iskelet varsa çiz
                    draw_landmarks_and_stats(
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

        # Toplanan tüm benzersiz hataları birleştir
        if not feedback_list and correct_reps > 0 and wrong_reps == 0:
            final_feedback = f"Toplam {correct_reps} tekrar yapıldı. Formunuz harika!"
        elif correct_reps == 0 and wrong_reps == 0:
             final_feedback = "Videoda squat hareketi tespit edilemedi."
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