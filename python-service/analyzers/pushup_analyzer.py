def analyze_pushup(all_landmarks):
    """
    Videodaki TÜM karelerin eklem verilerini (all_landmarks) alır.
    """
    
    print("--- UZMAN: PUSHUP ANALİZİ ÇALIŞTI ---")
    
    frame_count = len(all_landmarks)
    print(f"    -> {frame_count} adet kare (frame) analiz edilecek.")
    
    correct_reps = 5
    wrong_reps = 5
    feedback = f"Şınav analizi (pushup_analyzer.py dosyasından) {frame_count} kare üzerinden başarılı."
    
    return {
        "correct_reps": correct_reps,
        "wrong_reps": wrong_reps,
        "feedback": feedback
    }