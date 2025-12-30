# Video Frame Analysis

Extract and analyze frames from video recordings to detect emotions at specific time points.

## Prerequisites

- A `.webm` video file from your experiment
- Python 3.12 or later
- An API key for image analysis (get one at https://aistudio.google.com/apikey)

## Setup

1. Install dependencies:
```bash
cd analyze-frames
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Set your API key:
```bash
export GEMINI_API_KEY='your-api-key-here'
```

## Step 1: Extract Frames

Extract frames from your video at specific timestamps:

```bash
python extract_frames.py video.webm \
    --timestamps 1000 3500 6200 \
    --names stimulus_A stimulus_B stimulus_C \
    --output output/session1
```

**Options:**
- `--timestamps` - Time points in milliseconds when stimuli were presented (required)
- `--names` - Labels for each stimulus (optional)
- `--output` - Where to save the frames (default: output)
- `--window` - Duration around each timestamp to capture in ms (default: 500)

**Output:** Creates a folder with extracted frames and metadata files.

## Step 2: Analyze Frames

Analyze the extracted frames for emotion recognition:

```bash
python analyze_images.py output/session1
```

**Options:**
- `--output` - Name for the results file (default: analysis_results.json)

**Output:** Creates a JSON file with emotion and description for each frame.

## Python Usage

```python
from extract_frames import process_video
from analyze_images import analyze_extracted_frames
from pathlib import Path

# Extract frames
results = process_video(
    video_path=Path("video.webm"),
    timestamps_ms=[1000.0, 3500.0],
    stimulus_names=["stim_A", "stim_B"],
    output_folder=Path("output/session1")
)

# Analyze frames
analysis = analyze_extracted_frames(
    extraction_folder=Path("output/session1")
)
```
