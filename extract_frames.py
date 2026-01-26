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
from typing import List, Dict, Any


def ms_to_frame(timestamp_ms: float, fps: float) -> int:
    """Convert milliseconds to frame number."""
    return int((timestamp_ms / 1000.0) * fps)


def frame_to_ms(frame_num: int, fps: float) -> float:
    """Convert frame number to milliseconds."""
    return (frame_num / fps) * 1000.0


def get_video_info(video_path: Path) -> Dict[str, Any]:
    """Get video metadata (fps, frame count, duration)."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Try to compute duration from the end position for more reliable fps
    cap.set(cv2.CAP_PROP_POS_AVI_RATIO, 1)
    duration_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
    if duration_ms <= 0 and fps > 0 and frame_count > 0:
        duration_ms = (frame_count / fps) * 1000

    computed_fps = None
    if duration_ms > 0 and frame_count > 0:
        computed_fps = frame_count / (duration_ms / 1000.0)

    # Some containers report fps as 1000 or 0; prefer computed fps if implausible
    if computed_fps and (fps <= 0 or fps > 240):
        fps = computed_fps

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()

    return {
        "fps": fps,
        "computed_fps": computed_fps,
        "frame_count": frame_count,
        "duration_ms": duration_ms,
        "width": width,
        "height": height
    }


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


def extract_frames_window(
    video_path: Path,
    timestamp_ms: float,
    window_start_ms: float,
    window_end_ms: float,
    output_dir: Path,
    stimulus_name: str,
    fps: float
) -> List[Dict[str, Any]]:
    """
    Extract all frames within a time window around timestamp_ms.

    Uses sequential frame reading for reliability instead of seeking.

    Args:
        video_path: Path to video file
        timestamp_ms: Stimulus time in milliseconds
        window_start_ms: Window start offset relative to stimulus (ms)
        window_end_ms: Window end offset relative to stimulus (ms, exclusive)
        output_dir: Directory to save frames
        stimulus_name: Name for this stimulus (used in filenames)
        fps: Video frames per second

    Returns:
        List of dicts with frame info (filename, timestamp, frame_number)
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    start_frame = ms_to_frame(timestamp_ms + window_start_ms, fps)
    end_frame = ms_to_frame(timestamp_ms + window_end_ms, fps)
    if window_end_ms > window_start_ms:
        end_frame -= 1

    # Ensure valid frame range
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    start_frame = max(0, start_frame)
    # Only constrain end_frame if total_frames is valid (webm often returns invalid values)
    if total_frames > 0:
        end_frame = min(total_frames - 1, end_frame)

    output_dir.mkdir(parents=True, exist_ok=True)

    extracted_frames = []

    # Set to start position using frame number (more reliable than ms)
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    current_frame = start_frame
    while current_frame <= end_frame:
        ret, frame = cap.read()
        if not ret:
            break

        # Calculate actual timestamp
        actual_ms = frame_to_ms(current_frame, fps)
        relative_ms = actual_ms - timestamp_ms

        # Save frame
        filename = f"{stimulus_name}_frame{current_frame:06d}_{relative_ms:.0f}ms.jpg"
        frame_path = output_dir / filename
        cv2.imwrite(str(frame_path), frame)

        extracted_frames.append({
            "filename": filename,
            "frame_number": current_frame,
            "absolute_ms": actual_ms,
            "relative_ms": relative_ms
        })

        current_frame += 1

    cap.release()
    return extracted_frames


def extract_frames(
    video_path,
    excel_path,
    output_dir,
    participant_id=None,
    foi_offset_ms=None,
    baseline_start_ms=-500.0,
    baseline_end_ms=0.0,
    foi_start_ms=0.0,
    foi_end_ms=500.0
):
    """
    Extract baseline and FOI frames for each stimulus.

    Args:
        video_path: Path to video file
        excel_path: Path to participant_metadata.xlsx
        output_dir: Base output directory
        participant_id: Optional participant ID (used for output subfolder)
        foi_offset_ms: Custom FOI offset in ms (legacy single-frame mode).
                       If None, uses range-based extraction with baseline/foi windows.
        baseline_start_ms: Baseline window start offset relative to stimulus (ms)
        baseline_end_ms: Baseline window end offset relative to stimulus (ms)
        foi_start_ms: FOI window start offset relative to stimulus (ms)
        foi_end_ms: FOI window end offset relative to stimulus (ms)

    Returns:
        Dict with extraction metadata
    """
    video_path = Path(video_path)
    output_dir = Path(output_dir)

    # Load Excel and filter incomplete rows
    df = pd.read_excel(excel_path)
    df = df.dropna(subset=['Image', 'Stimulus Start Time (ms)'])
    print(f"Loaded {len(df)} stimuli from {excel_path}")

    # Get video info
    video_info = get_video_info(video_path)
    fps = video_info["fps"]
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
        "video_info": video_info,
        "baseline_window_ms": [baseline_start_ms, baseline_end_ms],
        "foi_window_ms": [foi_start_ms, foi_end_ms],
        "stimuli": []
    }

    for idx, (_, row) in enumerate(df.iterrows()):
        image_name = row['Image']
        stimulus_name = Path(image_name).stem
        stimulus_start_ms = row['Stimulus Start Time (ms)']

        # Create subdirectories for this stimulus
        stimulus_dir = frames_dir / stimulus_name
        baseline_dir = stimulus_dir / "baseline"
        foi_dir = stimulus_dir / "foi"

        try:
            # Extract baseline frames (window before/at stimulus)
            baseline_frames = extract_frames_window(
                video_path=video_path,
                timestamp_ms=stimulus_start_ms,
                window_start_ms=baseline_start_ms,
                window_end_ms=baseline_end_ms,
                output_dir=baseline_dir,
                stimulus_name=f"{stimulus_name}_baseline",
                fps=fps
            )

            # Extract FOI frames (window after stimulus)
            foi_frames = extract_frames_window(
                video_path=video_path,
                timestamp_ms=stimulus_start_ms,
                window_start_ms=foi_start_ms,
                window_end_ms=foi_end_ms,
                output_dir=foi_dir,
                stimulus_name=f"{stimulus_name}_foi",
                fps=fps
            )

            results["stimuli"].append({
                "image_name": image_name,
                "stimulus_name": stimulus_name,
                "stimulus_start_ms": stimulus_start_ms,
                "baseline_frames_extracted": len(baseline_frames),
                "baseline_frames": baseline_frames,
                "foi_frames_extracted": len(foi_frames),
                "foi_frames": foi_frames,
                "correct_emotion": row.get('Corr_emotion'),
                "user_response": row.get('User response'),
                "reaction_time_ms": row.get('Reaction Time (ms)')
            })

            print(f"  [{idx+1}/{len(df)}] {stimulus_name}: "
                  f"baseline={len(baseline_frames)} frames, foi={len(foi_frames)} frames")

        except Exception as e:
            print(f"  [{idx+1}/{len(df)}] {stimulus_name}: Error - {e}")
            results["stimuli"].append({
                "image_name": image_name,
                "stimulus_name": stimulus_name,
                "stimulus_start_ms": stimulus_start_ms,
                "error": str(e)
            })

    # Save metadata
    metadata_path = frames_dir / "extraction_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(results, f, indent=2)

    total_baseline = sum(s.get("baseline_frames_extracted", 0) for s in results["stimuli"])
    total_foi = sum(s.get("foi_frames_extracted", 0) for s in results["stimuli"])
    print(f"\nExtracted {total_baseline} baseline + {total_foi} FOI frames to {frames_dir}/")
    return results


def main():
    parser = argparse.ArgumentParser(description="Extract baseline + FOI frames from video")
    parser.add_argument("video", type=Path, help="Path to video file")
    parser.add_argument("excel", type=Path, help="Path to participant_metadata.xlsx")
    parser.add_argument("-o", "--output", type=Path, default=Path("output"), help="Output directory")
    parser.add_argument("-p", "--participant", type=str, help="Participant ID")
    parser.add_argument("--baseline-start", type=float, default=-500.0,
                        help="Baseline window start offset in ms (default: -500)")
    parser.add_argument("--baseline-end", type=float, default=0.0,
                        help="Baseline window end offset in ms (default: 0)")
    parser.add_argument("--foi-start", type=float, default=0.0,
                        help="FOI window start offset in ms (default: 0)")
    parser.add_argument("--foi-end", type=float, default=500.0,
                        help="FOI window end offset in ms (default: 500)")

    args = parser.parse_args()

    extract_frames(
        video_path=args.video,
        excel_path=args.excel,
        output_dir=args.output,
        participant_id=args.participant,
        baseline_start_ms=args.baseline_start,
        baseline_end_ms=args.baseline_end,
        foi_start_ms=args.foi_start,
        foi_end_ms=args.foi_end
    )


if __name__ == "__main__":
    main()
