# View and summarize analysis results
# Works locally and in Colab
#
# Dependencies: pandas

import pandas as pd
from pathlib import Path
import argparse


def load_results(results_path):
    """
    Load analysis results from CSV or directory.

    Args:
        results_path: Path to analysis_results.csv or directory containing it

    Returns:
        DataFrame with analysis results
    """
    results_path = Path(results_path)

    if results_path.is_dir():
        results_path = results_path / "analysis_results.csv"

    df = pd.read_csv(results_path)
    return df


def summarize(df):
    """Print summary statistics."""
    n = len(df)

    def pct(col):
        valid = df[col].notna()
        total = valid.sum()
        correct = df.loc[valid, col].sum()
        return f"{int(correct)}/{int(total)} ({100*correct/total:.1f}%)" if total > 0 else "N/A"

    print("=== Summary ===")
    print(f"Stimuli: {n}")
    print(f"Participant Accuracy: {pct('participant_correct')}")
    print(f"Model Detected Change: {pct('model_changed')}")
    print(f"Model FOI Matches (correct OR participant): {pct('foi_matches')}")
    print()

    return df


def main():
    parser = argparse.ArgumentParser(description="View analysis results")
    parser.add_argument("results", type=Path, help="Path to analysis_results.csv or output directory")

    args = parser.parse_args()

    df = load_results(args.results)
    summarize(df)
    print(df.to_string(index=False))


if __name__ == "__main__":
    main()
