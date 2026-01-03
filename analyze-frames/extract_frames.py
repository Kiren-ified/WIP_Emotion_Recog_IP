#!/usr/bin/env python3
"""
Simplified frame extraction from video at specified timestamps.

Extracts frames from a 500ms window around each stimulus presentation time.
Uses frame-by-frame reading instead of seeking for reliable extraction.
"""

import cv2
import json
from pathlib import Path
from typing import List, Dict, Any
import argparse


def get_video_info(video_path: Path) -> Dict[str, Any]:
    """Get video metadata (fps, frame count, duration)."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_ms = (frame_count / fps) * 1000 if fps > 0 else 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()

    return {
        "fps": fps,
        "frame_count": frame_count,
        "duration_ms": duration_ms,
        "width": width,
        "height": height
    }


def ms_to_frame(timestamp_ms: float, fps: float) -> int:
    """Convert milliseconds to frame number."""
    return int((timestamp_ms / 1000.0) * fps)


def frame_to_ms(frame_num: int, fps: float) -> float:
    """Convert frame number to milliseconds."""
    return (frame_num / fps) * 1000.0


def extract_frames_window(
    video_path: Path,
    timestamp_ms: float,
    window_ms: float,
    output_dir: Path,
    stimulus_name: str,
    fps: float
) -> List[Dict[str, Any]]:
    """
    Extract all frames within a time window starting at timestamp_ms.

    Uses sequential frame reading for reliability instead of seeking.

    Args:
        video_path: Path to video file
        timestamp_ms: Start time in milliseconds
        window_ms: Duration of window to capture (default 500ms)
        output_dir: Directory to save frames
        stimulus_name: Name for this stimulus (used in filenames)
        fps: Video frames per second

    Returns:
        List of dicts with frame info (filename, timestamp, frame_number)
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    start_frame = ms_to_frame(timestamp_ms, fps)
    end_frame = ms_to_frame(timestamp_ms + window_ms, fps)

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


def process_video(
    video_path: Path,
    timestamps_ms: List[float],
    stimulus_names: List[str],
    output_folder: Path,
    window_ms: float = 500.0
) -> Dict[str, Any]:
    """
    Process a video and extract frames for all timestamps.

    Args:
        video_path: Path to input video
        timestamps_ms: List of stimulus presentation times (milliseconds)
        stimulus_names: Names for each stimulus (for folder naming)
        output_folder: Base output directory
        window_ms: Window duration to capture (default 500ms)

    Returns:
        Dict with extraction results and metadata
    """
    # Create output structure
    output_folder.mkdir(parents=True, exist_ok=True)
    frames_dir = output_folder / "frames"
    frames_dir.mkdir(exist_ok=True)

    # Get video info
    video_info = get_video_info(video_path)
    fps = video_info["fps"]

    results = {
        "video_file": str(video_path.name),
        "video_info": video_info,
        "window_ms": window_ms,
        "stimuli": []
    }

    # Process each stimulus
    for i, (timestamp_ms, name) in enumerate(zip(timestamps_ms, stimulus_names)):
        print(f"Processing stimulus {i+1}/{len(timestamps_ms)}: {name} at {timestamp_ms:.1f}ms")

        # Create subfolder for this stimulus
        stimulus_dir = frames_dir / name

        try:
            frames = extract_frames_window(
                video_path=video_path,
                timestamp_ms=timestamp_ms,
                window_ms=window_ms,
                output_dir=stimulus_dir,
                stimulus_name=name,
                fps=fps
            )

            results["stimuli"].append({
                "name": name,
                "start_timestamp_ms": timestamp_ms,
                "frames_extracted": len(frames),
                "frames": frames
            })

            print(f"  Extracted {len(frames)} frames")

        except Exception as e:
            print(f"  Error: {e}")
            results["stimuli"].append({
                "name": name,
                "start_timestamp_ms": timestamp_ms,
                "error": str(e)
            })

    # Save timestamps
    timestamps_file = output_folder / "timestamps.json"
    with open(timestamps_file, "w") as f:
        json.dump({
            "stimulus_timestamps_ms": dict(zip(stimulus_names, timestamps_ms)),
            "window_ms": window_ms
        }, f, indent=2)

    # Save metadata
    metadata_file = output_folder / "metadata.json"
    with open(metadata_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nOutput saved to: {output_folder}")
    print(f"  - frames/ (with subfolders per stimulus)")
    print(f"  - timestamps.json")
    print(f"  - metadata.json")

    return results


def load_timing_file(timing_path: Path) -> Dict[str, Any]:
    """Load timing data from JSON file exported by webapp."""
    with open(timing_path, "r") as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(
        description="Extract frames from video at specified timestamps"
    )
    parser.add_argument("video", type=Path, nargs="?", help="Path to video file")
    parser.add_argument("--timing-file", type=Path,
                        help="JSON timing file from webapp (alternative to manual timestamps)")
    parser.add_argument("--timestamps", type=float, nargs="+",
                        help="Stimulus timestamps in milliseconds")
    parser.add_argument("--names", type=str, nargs="+",
                        help="Names for each stimulus (default: stim_0, stim_1, ...)")
    parser.add_argument("--output", type=Path, default=Path("output"),
                        help="Output folder name")
    parser.add_argument("--window", type=float, default=500.0,
                        help="Window duration in ms (default: 500)")

    args = parser.parse_args()

    # Load from timing file if provided
    if args.timing_file:
        timing_data = load_timing_file(args.timing_file)

        # Extract timestamps and names from timing file
        timestamps = [s["timestamp_ms"] for s in timing_data["stimuli"]]
        names = [s["image_name"].replace(".jpg", "").replace(".png", "")
                 for s in timing_data["stimuli"]]

        # Determine video path
        if args.video:
            video_path = args.video
        else:
            # Try to find video in same directory as timing file
            timing_dir = args.timing_file.parent
            video_name = timing_data.get("video_file", "")
            if video_name:
                video_path = timing_dir / video_name
                if not video_path.exists():
                    parser.error(f"Video file not found: {video_path}")
            else:
                parser.error("No video path provided and none found in timing file")

        # Use participant_id for output folder if not specified
        if args.output == Path("output"):
            participant_id = timing_data.get("participant_id", "output")
            args.output = Path(f"output/{participant_id}")

        print(f"Loaded timing from: {args.timing_file}")
        print(f"  Participant: {timing_data.get('participant_id', 'unknown')}")
        print(f"  Stimuli: {len(timestamps)}")
    else:
        # Manual mode - require video and timestamps
        if not args.video:
            parser.error("video is required when not using --timing-file")
        if not args.timestamps:
            parser.error("--timestamps is required when not using --timing-file")

        video_path = args.video
        timestamps = args.timestamps

        # Generate default names if not provided
        if args.names:
            names = args.names
        else:
            names = [f"stim_{i}" for i in range(len(timestamps))]

        if len(names) != len(timestamps):
            parser.error("Number of names must match number of timestamps")

    process_video(
        video_path=video_path,
        timestamps_ms=timestamps,
        stimulus_names=names,
        output_folder=args.output,
        window_ms=args.window
    )


if __name__ == "__main__":
    main()
