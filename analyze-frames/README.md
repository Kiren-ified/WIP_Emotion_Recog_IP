# Frame Extraction Tool

Extract frames from video files within a 500ms window for each stimulus presentation.

## Setup

```bash
cd analyze-frames
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set up your Gemini API key:
```bash
export GEMINI_API_KEY='your-api-key-here'
```

Get your API key from: https://aistudio.google.com/apikey

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

## Analyzing Frames

After extracting frames, analyze them for emotion recognition using Gemini:

```bash
python analyze_images.py output/session1
```

Optional arguments:
- `--settings` - Analysis settings as JSON string (e.g., `'{"model": "gemini-3-flash-preview"}'`)
- `--output` - Output filename (default: analysis_results.json)

Example with custom model:
```bash
python analyze_images.py output/session1 \
    --settings '{"model": "gemini-3-flash-preview"}' \
    --output custom_results.json
```

Creates `analysis_results.json` with:
- Analysis timestamp and settings
- Emotion and description for each frame
- Complete metadata linking to extraction
- Raw API responses

## Programmatic Usage

```python
from extract_frames import process_video
from analyze_images import analyze_extracted_frames
from pathlib import Path

# Extract frames
results = process_video(
    video_path=Path("video.webm"),
    timestamps_ms=[1000.0, 3500.0],
    stimulus_names=["stim_A", "stim_B"],
    output_folder=Path("output/session1"),
    window_ms=500.0
)

# Analyze frames
analysis = analyze_extracted_frames(
    extraction_folder=Path("output/session1"),
    analysis_settings={"model": "gemini-3-flash-preview"}
)
```
