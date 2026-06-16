import pandas as pd
import numpy as np

# Load files
submission = pd.read_csv('d:/Traffic_pridiction/backend/data/predictions/submission.csv')
sample = pd.read_csv('d:/Traffic_pridiction/e88186124ec611f1/dataset/sample_submission.csv')
test = pd.read_csv('d:/Traffic_pridiction/e88186124ec611f1/dataset/test.csv')

print('=' * 60)
print('SUBMISSION CSV VALIDATION REPORT')
print('=' * 60)

all_pass = True

# 1. Column check
print('\n1. COLUMN CHECK:')
print(f'   Sample submission columns: {list(sample.columns)}')
print(f'   Your submission columns:   {list(submission.columns)}')
cols_match = list(sample.columns) == list(submission.columns)
status = "PASS" if cols_match else "FAIL"
print(f'   Columns match: {status}')
if not cols_match:
    all_pass = False

# 2. Row count check
print(f'\n2. ROW COUNT CHECK:')
print(f'   Test set rows:        {len(test)}')
print(f'   Submission rows:      {len(submission)}')
rows_match = len(submission) == len(test)
status = "PASS" if rows_match else "FAIL"
print(f'   Row count match: {status}')
if not rows_match:
    all_pass = False

# 3. Index check
print(f'\n3. INDEX CHECK:')
test_indices = sorted(test['Index'].values)
sub_indices = sorted(submission['Index'].values)
indices_match = np.array_equal(test_indices, sub_indices)
print(f'   Test Index range:       [{test["Index"].min()}, {test["Index"].max()}]')
print(f'   Submission Index range: [{submission["Index"].min()}, {submission["Index"].max()}]')
status = "PASS" if indices_match else "FAIL"
print(f'   All indices present: {status}')
if not indices_match:
    all_pass = False

# 4. Demand value checks
print(f'\n4. DEMAND VALUE CHECK:')
print(f'   Data type:     {submission["demand"].dtype}')

has_nan = submission["demand"].isna().any()
status = "FAIL" if has_nan else "PASS"
print(f'   Any NaN:       {has_nan} -> {status}')
if has_nan:
    all_pass = False

has_inf = np.isinf(submission["demand"]).any()
status = "FAIL" if has_inf else "PASS"
print(f'   Any Inf:       {has_inf} -> {status}')
if has_inf:
    all_pass = False

min_val = submission["demand"].min()
status = "PASS" if min_val >= 0 else "FAIL"
print(f'   Min value:     {min_val:.6f} (>=0: {status})')
if min_val < 0:
    all_pass = False

max_val = submission["demand"].max()
status = "PASS" if max_val <= 1 else "FAIL"
print(f'   Max value:     {max_val:.6f} (<=1: {status})')
if max_val > 1:
    all_pass = False

print(f'   Mean:          {submission["demand"].mean():.6f}')
print(f'   Median:        {submission["demand"].median():.6f}')
print(f'   Std:           {submission["demand"].std():.6f}')

# 5. Duplicates
print(f'\n5. DUPLICATE INDEX CHECK:')
dup_count = submission['Index'].duplicated().sum()
status = "PASS" if dup_count == 0 else "FAIL"
print(f'   Duplicate indices: {dup_count} -> {status}')
if dup_count != 0:
    all_pass = False

# 6. Index order check
print(f'\n6. INDEX ORDER CHECK:')
order_match = (submission['Index'].values == test['Index'].values).all() if rows_match else False
status = "PASS" if order_match else "FAIL"
print(f'   Indices in same order as test: {status}')

# 7. Distribution sanity
print(f'\n7. DISTRIBUTION SANITY:')
print(f'   Quantiles:')
for q in [0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99]:
    print(f'     {q*100:5.1f}%: {submission["demand"].quantile(q):.6f}')

# 8. Check for constant predictions
print(f'\n8. CONSTANT PREDICTION CHECK:')
nunique = submission['demand'].nunique()
status = "PASS" if nunique > 10 else "FAIL"
print(f'   Unique values: {nunique} -> {status}')

# Overall
print(f'\n{"=" * 60}')
overall = "ALL CHECKS PASSED" if all_pass else "SOME CHECKS FAILED"
print(f'OVERALL RESULT: {overall}')
print(f'{"=" * 60}')
