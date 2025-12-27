import cv2
import mediapipe as mp
import numpy as np
import os
import requests
import tempfile

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

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

def draw_landmarks_and_stats(image, landmarks, stats, feedback):
    mp_drawing.draw_landmarks(
        image, landmarks, mp_pose.POSE_CONNECTIONS,
        mp_drawing.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=2),
        mp_drawing.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2)
    )

    cv2.rectangle(image, (0, 0), (300, 200), (24, 24, 24), -1)

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

    if feedback:
        cv2.rectangle(image, (0, image.shape[0] - 50),
                      (image.shape[0], image.shape[0]), (24, 24, 24), -1)
        cv2.putText(image, feedback, (15, image.shape[0] - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)

def analyze_squat(video_url, video_id):
    temp_file_path = None
    cap = None
    out = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            temp_file_path = temp_file.name

        with requests.get(video_url, stream=True) as r:
            r.raise_for_status()
            with open(temp_file_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

        cap = cv2.VideoCapture(temp_file_path)
        if not cap.isOpened():
            return {"correct_reps": 0, "wrong_reps": 0, "feedback": "Video dosyası okunamadı."}

        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        output_fps = cap.get(cv2.CAP_PROP_FPS)
        if output_fps <= 0:
            output_fps = 30.0

        frame_delay_ms = max(1, int(1000 / output_fps))

        output_folder = 'analysis_videos'
        os.makedirs(output_folder, exist_ok=True)
        output_path = os.path.join(output_folder, f"analysis_output_{video_id}.mp4")

        out = cv2.VideoWriter(
            output_path,
            cv2.VideoWriter_fourcc(*'mp4v'),
            output_fps,
            (frame_width, frame_height)
        )

        correct_reps = 0
        wrong_reps = 0
        state = "up"
        feedback = ""
        feedback_list = set()
        went_deep_enough = False

        UP_THRESHOLD = 140
        DOWN_THRESHOLD = 90

        current_knee_angle = 180.0

        with mp_pose.Pose(min_detection_confidence=0.5,
                          min_tracking_confidence=0.5) as pose:

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image.flags.writeable = False
                results = pose.process(image)
                image.flags.writeable = True
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

                feedback = ""

                try:
                    landmarks = results.pose_landmarks

                    hip = landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
                    knee = landmarks.landmark[mp_pose.PoseLandmark.LEFT_KNEE]
                    ankle = landmarks.landmark[mp_pose.PoseLandmark.LEFT_ANKLE]

                    current_knee_angle = calculate_angle(hip, knee, ankle)

                    if current_knee_angle is not None:
                        if state == "up":
                            if current_knee_angle < UP_THRESHOLD - 10:
                                state = "down"
                                went_deep_enough = False

                        elif state == "down":
                            if current_knee_angle < DOWN_THRESHOLD:
                                went_deep_enough = True

                            if current_knee_angle > UP_THRESHOLD:
                                state = "up"
                                if went_deep_enough:
                                    correct_reps += 1
                                    feedback = "Dogru Tekrar!"
                                else:
                                    wrong_reps += 1
                                    feedback = "HATA: Yeterince derine inmediniz"
                                    feedback_list.add(feedback)

                    if state == "down":
                        shoulder = landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
                        if shoulder.visibility > 0.5:
                            if knee.x > ankle.x + 0.05:
                                feedback = "HATA: Dizleriniz one kayiyor"
                                feedback_list.add(feedback)

                except Exception:
                    current_knee_angle = None
                    feedback = "Kamerada insan tespiti basarisiz"

                stats_data = {
                    "correct_reps": correct_reps,
                    "wrong_reps": wrong_reps,
                    "state": state,
                    "knee_angle": current_knee_angle
                }

                if results.pose_landmarks:
                    draw_landmarks_and_stats(
                        image,
                        results.pose_landmarks,
                        stats_data,
                        feedback
                    )

                out.write(image)

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
        if cap:
            cap.release()
        if out:
            out.release()
        cv2.destroyAllWindows()
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
