# Video Frame Analysis

Extract and analyze frames from video recordings to detect emotions at specific time points.

## Prerequisites

- A `.webm` video file from your experiment
- The `_timing.json` file from the experiment (auto-downloaded)
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

### Recommended: Use timing file from webapp

After running the experiment, you'll have `{participant}_timing.json` and `{participant}_video.webm`. Place them in the same folder:

```bash
python extract_frames.py --timing-file path/to/participant_timing.json
```

This automatically:
- Reads all stimulus timestamps from the JSON
- Uses image names as stimulus identifiers
- Finds the video file referenced in the JSON
- Creates output in `output/{participant_id}/`

### Alternative: Manual timestamps

```bash
python extract_frames.py video.webm \
    --timestamps 1000 3500 6200 \
    --names stimulus_A stimulus_B stimulus_C \
    --output output/session1
```

**Options:**
- `--timing-file` - JSON timing file from webapp (recommended)
- `--timestamps` - Time points in milliseconds (manual mode)
- `--names` - Labels for each stimulus (manual mode)
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
from extract_frames import process_video, load_timing_file
from analyze_images import analyze_extracted_frames
from pathlib import Path

# Load timing from webapp JSON
timing = load_timing_file(Path("participant_timing.json"))
timestamps = [s["timestamp_ms"] for s in timing["stimuli"]]
names = [s["image_name"].replace(".jpg", "") for s in timing["stimuli"]]

# Extract frames
results = process_video(
    video_path=Path("participant_video.webm"),
    timestamps_ms=timestamps,
    stimulus_names=names,
    output_folder=Path(f"output/{timing['participant_id']}")
)

# Analyze frames
analysis = analyze_extracted_frames(
    extraction_folder=Path(f"output/{timing['participant_id']}")
)
```
