#!/bin/bash
# Script to convert WebM recordings to MP4 format
# Requires ffmpeg to be installed
# Usage: ./convert_to_mp4.sh [participant_id]

if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed."
    echo "Install it using: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: ./convert_to_mp4.sh [participant_id]"
    echo "Example: ./convert_to_mp4.sh P001"
    exit 1
fi

PARTICIPANT_ID=$1
WEBM_FILE="${PARTICIPANT_ID}_video.webm"
MP4_FILE="${PARTICIPANT_ID}_video.mp4"

if [ ! -f "$WEBM_FILE" ]; then
    echo "Error: File $WEBM_FILE not found."
    exit 1
fi

echo "Converting $WEBM_FILE to $MP4_FILE..."
ffmpeg -i "$WEBM_FILE" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k "$MP4_FILE" -y

if [ $? -eq 0 ]; then
    echo "Conversion successful! Created $MP4_FILE"
else
    echo "Conversion failed. Please check if ffmpeg is properly installed."
fi

