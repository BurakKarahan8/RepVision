import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose

def process_video(video_url):

    cap = cv2.VideoCapture(video_url)
    
    if not cap.isOpened():
        print(f" [!] HATA: Video açılamadı. URL: {video_url}")
        return None, "Video dosyası okunamadı veya bozuk."

    all_frame_landmarks = []
    frame_count = 0

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1

            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            
            results = pose.process(image)
            
            if results.pose_landmarks:
                all_frame_landmarks.append(results.pose_landmarks)
            else:
                all_frame_landmarks.append(None)

    cap.release()
    print(f" [i] Video işleme bitti. {frame_count} kare işlendi, {len(all_frame_landmarks)} iskelet verisi toplandı.")
    
    return all_frame_landmarks, None