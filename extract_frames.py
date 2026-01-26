# Extract baseline + FOI frames from video using Excel metadata
# Works locally (CLI) and in Colab (function call)
#
# Dependencies: opencv-python, pandas, openpyxl

import cv2
import pandas as pd
import json
from pathlib import Path
import argparse
import subprocess
import shutil


def extract_frame_ffmpeg(video_path, timestamp_ms, output_path):
    """Extract a single frame using ffmpeg (more reliable for webm)."""
    timestamp_sec = timestamp_ms / 1000.0
    cmd = [
        'ffmpeg', '-y', '-ss', str(timestamp_sec),
        '-i', str(video_path),
        '-frames:v', '1',
        '-q:v', '2',
        str(output_path)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return Path(output_path).exists()


def extract_frames(
    video_path,
    excel_path,
    output_dir,
    participant_id=None,
    foi_offset_ms=None
):
    """
    Extract baseline and FOI frames for each stimulus.

    Args:
        video_path: Path to video file
        excel_path: Path to participant_metadata.xlsx
        output_dir: Base output directory
        participant_id: Optional participant ID (used for output subfolder)
        foi_offset_ms: Custom FOI offset in ms. If None, uses 'Frame at 300ms' column.
                       Can be a single value or dict {image_name: offset_ms}

    Returns:
        Dict with extraction metadata
    """
    video_path = Path(video_path)
    output_dir = Path(output_dir)

    # Load Excel and filter incomplete rows
    df = pd.read_excel(excel_path)
    df = df.dropna(subset=['Image', 'Stimulus Start Time (ms)'])
    print(f"Loaded {len(df)} stimuli from {excel_path}")

    # Check if ffmpeg is available (preferred for webm)
    use_ffmpeg = shutil.which('ffmpeg') is not None and video_path.suffix.lower() == '.webm'
    if use_ffmpeg:
        print("Using ffmpeg for webm extraction (more reliable)")

    # Get video info
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()
    print(f"Video: {video_path.name} ({fps:.2f} fps)")

    # Create output directory
    if participant_id:
        frames_dir = output_dir / participant_id
    else:
        frames_dir = output_dir
    frames_dir.mkdir(parents=True, exist_ok=True)

    results = {
        "video_file": video_path.name,
        "participant_id": participant_id,
        "fps": fps,
        "stimuli": []
    }

    extracted_count = 0
    total_frames = len(df) * 2

    for idx, (_, row) in enumerate(df.iterrows()):
        image_name = row['Image']
        stimulus_name = Path(image_name).stem
        baseline_ms = row['Stimulus Start Time (ms)']

        # Determine FOI timestamp
        if foi_offset_ms is not None:
            if isinstance(foi_offset_ms, dict):
                offset = foi_offset_ms.get(image_name, 300)
            else:
                offset = foi_offset_ms
            foi_ms = baseline_ms + offset
        else:
            foi_ms = row['Frame at 300ms (ms)']
            offset = foi_ms - baseline_ms

        baseline_path = frames_dir / f"{stimulus_name}_baseline.jpg"
        foi_path = frames_dir / f"{stimulus_name}_foi.jpg"

        # Extract frames
        if use_ffmpeg:
            baseline_ok = extract_frame_ffmpeg(video_path, baseline_ms, baseline_path)
            foi_ok = extract_frame_ffmpeg(video_path, foi_ms, foi_path)
        else:
            # Fallback to OpenCV time-based seeking
            cap = cv2.VideoCapture(str(video_path))
            cap.set(cv2.CAP_PROP_POS_MSEC, baseline_ms)
            ret, frame = cap.read()
            baseline_ok = ret
            if ret:
                cv2.imwrite(str(baseline_path), frame)

            cap.set(cv2.CAP_PROP_POS_MSEC, foi_ms)
            ret, frame = cap.read()
            foi_ok = ret
            if ret:
                cv2.imwrite(str(foi_path), frame)
            cap.release()

        if baseline_ok:
            extracted_count += 1
        if foi_ok:
            extracted_count += 1

        results["stimuli"].append({
            "image_name": image_name,
            "stimulus_name": stimulus_name,
            "baseline_ms": baseline_ms,
            "foi_ms": foi_ms,
            "foi_offset_ms": offset,
            "baseline_file": f"{stimulus_name}_baseline.jpg",
            "foi_file": f"{stimulus_name}_foi.jpg",
            "correct_emotion": row['Corr_emotion'],
            "user_response": row['User response'],
            "reaction_time_ms": row['Reaction Time (ms)']
        })

        print(f"  [{idx+1}/{len(df)}] {stimulus_name}: baseline@{baseline_ms:.0f}ms, foi@{foi_ms:.0f}ms")

    # Save metadata
    metadata_path = frames_dir / "extraction_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nExtracted {extracted_count}/{total_frames} frames to {frames_dir}/")
    return results


def main():
    parser = argparse.ArgumentParser(description="Extract baseline + FOI frames from video")
    parser.add_argument("video", type=Path, help="Path to video file")
    parser.add_argument("excel", type=Path, help="Path to participant_metadata.xlsx")
    parser.add_argument("-o", "--output", type=Path, default=Path("output"), help="Output directory")
    parser.add_argument("-p", "--participant", type=str, help="Participant ID")
    parser.add_argument("--foi-offset", type=float, help="Custom FOI offset in ms (overrides Excel column)")

    args = parser.parse_args()

    extract_frames(
        video_path=args.video,
        excel_path=args.excel,
        output_dir=args.output,
        participant_id=args.participant,
        foi_offset_ms=args.foi_offset
    )


if __name__ == "__main__":
    main()
