import face_recognition
import numpy as np
import base64
from io import BytesIO
from PIL import Image

def faceEncoding(img_data):
    """
    Convert base64 image data to face encoding
    Returns: face encoding array or None if no face found
    """
    try:
        # Remove the data URL prefix if present
        if ',' in img_data:
            img_data = img_data.split(',')[1]
        
        # Convert base64 to image
        image_bytes = base64.b64decode(img_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Convert PIL image to numpy array
        image_array = np.array(image)
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(image_array)
        
        if len(face_encodings) > 0:
            return face_encodings[0].tolist()  # Convert numpy array to list for JSON serialization
        return None
    except Exception as e:
        print(f"Error in face encoding: {str(e)}")
        return None

def checkFaceExists(img_data):
    """
    Check if a face exists in the image
    Returns: True if face found, False otherwise
    """
    try:
        # Remove the data URL prefix if present
        if ',' in img_data:
            img_data = img_data.split(',')[1]
        
        # Convert base64 to image
        image_bytes = base64.b64decode(img_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Convert PIL image to numpy array
        image_array = np.array(image)
        
        # Get face locations
        face_locations = face_recognition.face_locations(image_array)
        
        return len(face_locations) > 0
    except Exception as e:
        print(f"Error in face detection: {str(e)}")
        return False

def compareFaces(known_encoding, unknown_encoding, tolerance=0.6):
    """
    Compare two face encodings
    Returns: True if faces match, False otherwise
    """
    try:
        if known_encoding is None or unknown_encoding is None:
            return False
            
        # Convert lists back to numpy arrays
        known_encoding = np.array(known_encoding)
        unknown_encoding = np.array(unknown_encoding)
        
        # Compare faces
        return face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=tolerance)[0]
    except Exception as e:
        print(f"Error in face comparison: {str(e)}")
        return False