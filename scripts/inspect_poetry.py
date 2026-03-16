import pandas as pd
import sys

try:
    # Try different encodings
    encodings = ['utf-8', 'windows-1256', 'utf-16']
    df = None
    for enc in encodings:
        try:
            df = pd.read_csv('poetry_data/all_poems.csv', nrows=5, encoding=enc)
            print(f"Successfully read with {enc} encoding")
            break
        except:
            continue
            
    if df is not None:
        print("\nColumns:")
        print(df.columns.tolist())
        print("\nFirst row sample:")
        print(df.iloc[0].to_dict())
    else:
        print("Failed to read CSV with common encodings.")

except Exception as e:
    print(f"Error: {e}")
