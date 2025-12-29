import cv2
import mediapipe as mp
import numpy as np
import os
import requests
import tempfile

mp_pose = mp.solutions.pose

def calculate_angle(a, b, c):
    try:
        p_a = np.array([a.x, a.y])
        p_b = np.array([b.x, b.y])
        p_c = np.array([c.x, c.y])
        
        radians_ba = np.arctan2(p_a[1] - p_b[1], p_a[0] - p_b[0])
        radians_bc = np.arctan2(p_c[1] - p_b[1], p_c[0] - p_b[0])
        
        angle_diff_rad = radians_bc - radians_ba
        angle_degrees = np.abs(np.degrees(angle_diff_rad))
        
        if angle_degrees > 180.0:
            angle_degrees = 360.0 - angle_degrees
            
        return angle_degrees
    except Exception:
        return None

def draw_pushup_stats(image, landmarks, stats, feedback, active_side):
    h, w, _ = image.shape
    
    sides_indices = [
        [11, 13, 15], 
        [12, 14, 16] 
    ]

    for indices in sides_indices:
        try:
            shoulder = landmarks.landmark[indices[0]]
            elbow = landmarks.landmark[indices[1]]
            wrist = landmarks.landmark[indices[2]]
            
            p_shoulder = (int(shoulder.x * w), int(shoulder.y * h))
            p_elbow = (int(elbow.x * w), int(elbow.y * h))
            p_wrist = (int(wrist.x * w), int(wrist.y * h))
            
            cv2.line(image, p_shoulder, p_elbow, (245, 117, 66), 3)
            cv2.line(image, p_elbow, p_wrist, (245, 117, 66), 3)
            
            cv2.circle(image, p_shoulder, 6, (245, 66, 230), -1)
            cv2.circle(image, p_elbow, 6, (245, 66, 230), -1)
            cv2.circle(image, p_wrist, 6, (245, 66, 230), -1)
        except:
            pass

    cv2.rectangle(image, (0, 0), (500, 200), (24, 24, 24), -1)
    
    cv2.putText(image, 'DOGRU TEKRAR', (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    cv2.putText(image, str(stats["correct_reps"]), (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (57, 255, 20), 2, cv2.LINE_AA)
    
    cv2.putText(image, 'YANLIS TEKRAR', (250, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    cv2.putText(image, str(stats["wrong_reps"]), (250, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 2, cv2.LINE_AA)
    
    status_color = (0, 255, 0) if stats["state"] == "up" else (200, 200, 200)
    cv2.putText(image, 'STATE', (15, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    cv2.putText(image, stats["state"].upper(), (20, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.5, status_color, 2, cv2.LINE_AA)

    side_text = "SOL ACI" if active_side == "left" else "SAG ACI"
    cv2.putText(image, side_text, (250, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 1, cv2.LINE_AA)
    angle_val = str(int(stats["elbow_angle"])) if stats["elbow_angle"] is not None else '0'
    cv2.putText(image, angle_val, (250, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 255), 2, cv2.LINE_AA)

    if feedback:
        cv2.rectangle(image, (0, h - 50), (w, h), (24, 24, 24), -1)
        cv2.putText(image, feedback, (15, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)

def analyze_pushup(video_url, video_id):
    print(f"--- UZMAN: PUSH-UP ANALİZİ (ID: {video_id}) BAŞLADI ---")
    
    temp_file_path = None
    cap = None
    out = None
    
    try:
        print(f" [i] Video Cloudinary'den indiriliyor...")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            temp_file_path = temp_file.name
        
        with requests.get(video_url, stream=True) as r:
            r.raise_for_status() 
            with open(temp_file_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192): 
                    f.write(chunk)
        print(f" [i] Video başarıyla indirildi: {temp_file_path}")
        cap = cv2.VideoCapture(temp_file_path)
        if not cap.isOpened():
            return {"correct_reps": 0, "wrong_reps": 0, "feedback": "Video dosyası okunamadı."}

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        
        output_folder = 'analysis_videos'
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
        
        output_filename = f"analysis_output_{video_id}.mp4"
        output_path = os.path.join(output_folder, output_filename)
        out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

        correct_reps = 0
        wrong_reps = 0
        state = "up"
        feedback = ""
        feedback_list = set()
        
        min_angle_in_rep = 180 
        
        UP_THRESHOLD = 160
        DOWN_THRESHOLD = 90
        
        frame_count = 0
        
        with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret: break
                
                frame_count += 1
                
                image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image.flags.writeable = False
                results = pose.process(image)
                image.flags.writeable = True
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                
                feedback = ""
                current_angle = 0
                active_side = "left"

                if results.pose_landmarks:
                    landmarks = results.pose_landmarks.landmark
                    
                    left_vis = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].visibility
                    right_vis = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].visibility
                    
                    if right_vis > left_vis:
                        active_side = "right"
                        shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
                        elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW]
                        wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST]
                    else:
                        active_side = "left"
                        shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
                        elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
                        wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]

                    current_angle = calculate_angle(shoulder, elbow, wrist)
                    
                    if current_angle is not None:
                        if state == "up":
                            if current_angle < 140:
                                state = "down"
                                min_angle_in_rep = current_angle
                        
                        elif state == "down":
                            if current_angle < min_angle_in_rep:
                                min_angle_in_rep = current_angle
                            
                            if current_angle > UP_THRESHOLD:
                                state = "up"
                                
                                if min_angle_in_rep <= DOWN_THRESHOLD:
                                    correct_reps += 1
                                    feedback = "Harika Derinlik!"
                                    print(f" -> DOGRU TEKRAR! Toplam: {correct_reps} (Dip Aci: {int(min_angle_in_rep)})")
                                else:
                                    wrong_reps += 1
                                    feedback = "Daha Asagi Inin!"
                                    feedback_list.add("Yeterince derine inmediniz (Yarım şınav)")
                                    print(f" -> YANLIS TEKRAR! Toplam: {wrong_reps} (Dip Aci: {int(min_angle_in_rep)} > {DOWN_THRESHOLD})")

                stats_data = {
                    "correct_reps": correct_reps, 
                    "wrong_reps": wrong_reps,
                    "state": state, 
                    "elbow_angle": current_angle
                }
                
                if results.pose_landmarks:
                    draw_pushup_stats(image, results.pose_landmarks, stats_data, feedback, active_side)
                
                out.write(image)

        print(f"    -> {frame_count} kare analiz edildi.")
        print(f"    -> İşlenmiş video '{output_path}' olarak kaydedildi.")
        
        final_msg = f"{correct_reps} doğru, {wrong_reps} yanlış tekrar."
        if feedback_list: final_msg += " Not: " + ", ".join(feedback_list)
        if correct_reps == 0 and wrong_reps == 0: final_msg = "Hareket algılanamadı."
            
        return {"correct_reps": correct_reps, "wrong_reps": wrong_reps, "feedback": final_msg}

    except Exception as e:
        print(f"HATA: {e}")
        return {"correct_reps": 0, "wrong_reps": 0, "feedback": f"Sistem hatası: {str(e)}"}
        
    finally:
        if cap: cap.release()
        if out: out.release()
        cv2.destroyAllWindows()
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            print(f" [i] Geçici dosya silindi: {temp_file_path}")