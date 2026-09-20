import cv2
import mediapipe as mp
import numpy as np

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

def calculate_focus_score(image_bytes: bytes) -> dict:
    """
    Process an image frame, detect the face, and return a focus assessment.
    Returns a dict: {'is_focused': bool, 'score': int, 'error': str}
    """
    try:
        # Convert bytes to numpy array then to cv2 image
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return {"is_focused": False, "score": 0, "error": "Invalid image format"}

        # Convert the BGR image to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image and find faces
        results = face_mesh.process(image_rgb)
        
        if not results.multi_face_landmarks:
            # No face detected
            return {"is_focused": False, "score": 0, "error": "No face detected"}
            
        face_landmarks = results.multi_face_landmarks[0]
        
        # A simple heuristic for head pose:
        # We can compare the relative distances of the eyes and nose.
        # For a full production app, you would use solvePnP with a 3D face model.
        # Here we'll use a simplified 2D heuristic for demonstration.
        
        # Get coordinates of key landmarks
        # 1: Nose tip
        # 33: Left eye outer corner
        # 263: Right eye outer corner
        img_h, img_w, _ = image.shape
        
        nose_x = face_landmarks.landmark[1].x
        left_eye_x = face_landmarks.landmark[33].x
        right_eye_x = face_landmarks.landmark[263].x
        
        # Calculate the horizontal center between the eyes
        eyes_center_x = (left_eye_x + right_eye_x) / 2.0
        
        # Calculate the distance between eyes for scale
        eyes_dist = abs(right_eye_x - left_eye_x)
        
        # Calculate how far the nose is from the center of the eyes
        # A perfectly straight face will have the nose centered.
        offset = abs(nose_x - eyes_center_x)
        
        # Normalize the offset relative to the face width (eyes distance)
        # Typically, if the offset is more than 20% of the eye distance, the head is turned.
        relative_offset = offset / (eyes_dist + 1e-6)
        
        is_focused = relative_offset < 0.25
        
        # Calculate a 0-100 score based on how centered it is
        # Perfect center = 100, Edge of focus (0.25 offset) = ~50, Turned away = 0
        score = max(0, min(100, int(100 - (relative_offset * 200))))
        
        return {
            "is_focused": is_focused,
            "score": score,
            "error": None
        }

    except Exception as e:
        return {"is_focused": False, "score": 0, "error": str(e)}
