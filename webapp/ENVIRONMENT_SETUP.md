# Environment Setup Guide

This project uses a Python virtual environment to manage dependencies.

## Initial Setup

Run the setup script to create the virtual environment and install all dependencies:

```bash
./setup_env.sh
```

Or manually:

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

## Using the Virtual Environment

### Activate the environment:
```bash
source venv/bin/activate
```

When activated, you'll see `(venv)` in your terminal prompt.

### Deactivate the environment:
```bash
deactivate
```

### Run scripts with the virtual environment:
```bash
# Make sure environment is activated
source venv/bin/activate

# Then run your scripts
python analyze_stimulus_frames.py P001 --list-models
```

## Dependencies

The virtual environment includes:
- **pandas** - For reading Excel files
- **openpyxl** - For Excel file support
- **opencv-python** - For video frame extraction
- **torch** - PyTorch for EMO-AffectNet models
- **torchvision** - For image preprocessing
- **numpy** - Numerical operations
- **Pillow** - Image processing

## Troubleshooting

If you encounter import errors:
1. Make sure the virtual environment is activated
2. Verify dependencies are installed: `pip list`
3. Reinstall if needed: `pip install -r requirements.txt --force-reinstall`





