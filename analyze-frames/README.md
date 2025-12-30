# Frame Extraction Tool

Extract frames from video files within a 500ms window for each stimulus presentation.

## Setup

```bash
cd analyze-frames
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Usage

```bash
python extract_frames.py video.webm \
    --timestamps 1000 3500 6200 \
    --names stimulus_A stimulus_B stimulus_C \
    --output output/session1 \
    --window 500
```

## Arguments

- `video` - Path to video file (webm, mp4, etc.)
- `--timestamps` - Stimulus presentation times in milliseconds (required)
- `--names` - Names for each stimulus (optional, defaults to stim_0, stim_1, ...)
- `--output` - Output folder path (default: output)
- `--window` - Window duration in ms (default: 500)

## Output

Creates a folder structure with:
- `frames/` - Subfolders for each stimulus containing extracted JPG frames
- `timestamps.json` - Stimulus timing information
- `metadata.json` - Extraction results and video metadata

## Example

```python
from extract_frames import process_video
from pathlib import Path

results = process_video(
    video_path=Path("video.webm"),
    timestamps_ms=[1000.0, 3500.0],
    stimulus_names=["stim_A", "stim_B"],
    output_folder=Path("output/session1"),
    window_ms=500.0
)
```
