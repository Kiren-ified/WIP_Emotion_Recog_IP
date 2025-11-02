# Frame Analysis Guide

This guide explains how to analyze video frames at 300ms after stimulus presentation in the emotion recognition experiment.

## Overview

The system extracts frames from participant videos at 300ms after each stimulus is presented. These frames are saved as images and can be analyzed using a custom `analyze_image` function.

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- `pandas`: For reading Excel metadata files
- `openpyxl`: For Excel file support
- `opencv-python`: For video frame extraction

### 2. Run the Experiment

The experiment app (`app.js`) has been updated to store stimulus presentation timestamps:
- `stimulusStartTime`: Absolute timestamp when stimulus was shown
- `stimulusStartOffset`: Milliseconds from video start
- `Frame at 300ms (ms)`: Calculated timestamp for frame extraction (added 300ms to start)

These timestamps are saved in the `{participantId}_metadata.xlsx` file.

## Usage

### Basic Usage

After running an experiment and collecting data:

```bash
python3 analyze_stimulus_frames.py <participant_id>
```

Example:
```bash
python3 analyze_stimulus_frames.py P001
```

### What the Script Does

1. **Reads metadata** from `output/{participantId}/{participantId}_metadata.xlsx`
2. **Opens video** from `output/{participantId}/{participantId}_video.webm` (or .mp4)
3. **Extracts frames** at 300ms after each stimulus presentation
4. **Saves frames** to `output/{participantId}/frames_300ms/`
5. **Calls analyze_image()** for each frame
6. **Generates JSON** output with all results

### Output Structure

The script creates:

```
output/
└── P001/
    ├── P001_metadata.xlsx          # Original metadata
    ├── P001_video.webm             # Original video
    ├── frames_300ms/                # Extracted frames
    │   ├── P001_AF01_AC_300ms.jpg
    │   ├── P001_AF02_SUR_300ms.jpg
    │   └── ...
    └── P001_frame_analysis.json    # Analysis results
```

### Output JSON Format

```json
{
  "participant_id": "P001",
  "video_file": "output/P001/P001_video.webm",
  "analysis_timestamp": "2025-11-01T10:30:00",
  "stimuli": [
    {
      "stimulus_filename": "AF01_AC.jpg",
      "timestamp_ms": 1234.5,
      "frame_image_path": "output/P001/frames_300ms/P001_AF01_AC_300ms.jpg",
      "stimulus_metadata": {
        "imageName": "AF01_AC.jpg",
        "stimulusIndex": 0,
        "timestamp_ms": 1234.5,
        "gender": "Female",
        "model": "AF_01",
        "race": "Asian",
        "mouth": "Closed",
        "correct_emotion": "Anger",
        "user_response": "anger",
        "reaction_time_ms": 1523
      },
      "analysis_results": {
        "analysis_status": "pending",
        "note": "Implement analyze_image function"
      }
    }
  ]
}
```

## Implementing Your Analysis Function

### Step 1: Locate the analyze_image Function

Open `analyze_stimulus_frames.py` and find the `analyze_image` function (around line 30).

### Step 2: Implement Your Analysis Logic

Replace the placeholder with your analysis code:

```python
def analyze_image(image_path: str, stimulus_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze a frame image.

    Args:
        image_path: Path to the extracted frame image
        stimulus_info: Dictionary with stimulus metadata

    Returns:
        Dictionary with your analysis results
    """
    # Example: Load image
    import cv2
    image = cv2.imread(image_path)

    # Example: Your analysis logic here
    # - Facial emotion recognition
    # - Gaze detection
    # - Facial action units
    # - etc.

    # Example return structure
    return {
        "detected_emotion": "happy",
        "confidence": 0.85,
        "facial_landmarks": {...},
        "gaze_direction": {"x": 0.5, "y": 0.3}
    }
```

### Example: Using a Facial Emotion Recognition Library

```python
# At the top of the file
from fer import FER

# Initialize detector (outside function for efficiency)
emotion_detector = FER(mtcnn=True)

def analyze_image(image_path: str, stimulus_info: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze facial emotions in the frame."""
    import cv2

    # Load image
    image = cv2.imread(image_path)

    # Detect emotions
    result = emotion_detector.detect_emotions(image)

    if result and len(result) > 0:
        # Get first face detected
        emotions = result[0]['emotions']
        dominant_emotion = max(emotions, key=emotions.get)

        return {
            "detected_emotions": emotions,
            "dominant_emotion": dominant_emotion,
            "confidence": emotions[dominant_emotion],
            "face_detected": True,
            "num_faces": len(result)
        }
    else:
        return {
            "face_detected": False,
            "num_faces": 0
        }
```

## Processing Multiple Participants

You can process multiple participants in a loop:

```bash
for participant in P001 P002 P003; do
    python3 analyze_stimulus_frames.py $participant
done
```

Or create a batch processing script:

```python
#!/usr/bin/env python3
import subprocess
from pathlib import Path

output_dir = Path("output")
for participant_dir in output_dir.iterdir():
    if participant_dir.is_dir():
        participant_id = participant_dir.name
        print(f"Processing {participant_id}...")
        subprocess.run(["python3", "analyze_stimulus_frames.py", participant_id])
```

## Troubleshooting

### Video File Not Found

- Ensure the video file exists in `output/{participantId}/`
- Video can be `.webm` or `.mp4` format
- If you have `.webm` and need `.mp4`, use ffmpeg:
  ```bash
  ffmpeg -i P001_video.webm P001_video.mp4
  ```

### Frame Extraction Fails

- Check that OpenCV is installed correctly: `pip install opencv-python`
- Verify the video file is not corrupted
- Ensure timestamp values in metadata are valid

### Missing Timestamp Columns

- Make sure you're using the updated `app.js` that stores timestamps
- Re-run the experiment to generate updated metadata files
- Check that the metadata Excel has "Stimulus Start Time (ms)" or "Frame at 300ms (ms)" columns

## Next Steps

1. Install dependencies: `pip install -r requirements.txt`
2. Implement your `analyze_image()` function
3. Run analysis on your participant data
4. Use the generated JSON for further analysis/visualization

## Additional Resources

- OpenCV Documentation: https://docs.opencv.org/
- Facial Emotion Recognition libraries:
  - FER: https://github.com/justinshenk/fer
  - DeepFace: https://github.com/serengil/deepface
  - MediaPipe: https://google.github.io/mediapipe/
