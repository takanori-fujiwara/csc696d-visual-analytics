# Session Summary: Wine Dataset Interactive Dashboard

## Original Prompt

> I want to make an interactive visual analysis interface using Dash. Here are the specifications:
> - This interface is to analyze the wine dataset available in scikit-learn's datasets.
> - The interface consists of two views: the scatterplot view and the bar chart view.
>   - The scatterplot view shows a t-SNE result of the wine dataset (note: apply Z-score normalization to the dataset before applying t-SNE).
>     - The scatterplot view supports two interactions: an instance-level interaction and a group-level interaction
>       - Instance-level interaction: hovering each point shows a tooltip of each point's attribute information
>       - Group-level interaction: Dash's lasso or rectangle selection on this view triggers computation of the mean value for each attribute of the selected points
>   - The bar chart view shows the mean value for each attribute of the points selected in the scatterplot view

## Objective

Build an interactive visual analysis interface using Dash (Plotly Dash) to explore the wine dataset from scikit-learn.

## Steps Performed

### 1. Environment Setup

- Checked for Python and required packages (`dash`, `plotly`, `scikit-learn`, `numpy`, `scipy`)
- None were installed; system Python (3.14.2 via Homebrew) blocked direct `pip install` due to PEP 668
- Created a virtual environment at `.venv/` and installed all dependencies:
  - `dash` 4.0.0
  - `plotly` 6.5.2
  - `scikit-learn` 1.8.0
  - `numpy` 2.4.2
  - `scipy` 1.17.0

### 2. Dataset Inspection

- Loaded the wine dataset: **178 samples, 13 features, 3 classes** (class_0, class_1, class_2)
- Features: alcohol, malic_acid, ash, alcalinity_of_ash, magnesium, total_phenols, flavanoids, nonflavanoid_phenols, proanthocyanins, color_intensity, hue, od280/od315_of_diluted_wines, proline

### 3. App Development (`wine_dashboard/app.py`)

**Data pipeline:**
- Applied Z-score normalization (`scipy.stats.zscore`) to the 13 features
- Ran t-SNE (`sklearn.manifold.TSNE`, perplexity=30, random_state=42) to project data to 2D

**Layout — two side-by-side views:**

| View | Description |
|------|-------------|
| **Scatterplot (left)** | t-SNE 2D projection, points colored by wine class |
| **Bar Chart (right)** | Mean attribute values for selected points |

**Interactions implemented:**
- **Instance-level (hover):** Tooltip on each scatterplot point displays all 13 attribute values and the class label
- **Group-level (lasso/box select):** Selecting points in the scatterplot computes the mean of each attribute for the selection and updates the bar chart. Unselected points fade to 30% opacity. When nothing is selected, the bar chart shows the overall dataset mean.

### 4. Verification

- Confirmed all imports, t-SNE computation, and callback logic run without errors
- Confirmed the Dash app object constructs successfully

### 5. Bug Fix — Lasso Selection Not Updating Bar Chart

**Prompt:**
> I selected points with lasso in the scatterplot view. But even after selection, I see "Showing overall mean (no valid selection)."

**Root cause:** The initial implementation stored original row indices in Plotly's `customdata` property on each scatter trace. However, Dash/Plotly's `selectedData` callback did not include `customdata` in the returned point dictionaries — only `curveNumber`, `pointIndex`, `x`, `y`, and `text` were present.

**Debugging:** Added a temporary debug print to log the raw `selectedData` points to the terminal, which confirmed `customdata` was absent.

**Fix applied:**
- Removed reliance on `customdata`
- Precomputed a `class_indices` lookup table mapping each class (curve) to its original row indices in the dataset
- In the callback, used `curveNumber` + `pointIndex` (always present in `selectedData`) to look up the correct original row index via `class_indices[curveNumber][pointIndex]`
- Also moved the scatter figure creation inline (`figure=make_scatter_figure()` in `dcc.Graph`) instead of mutating the layout tree after construction

## How to Run

```bash
source .venv/bin/activate
python wine_dashboard/app.py
```

Then open http://127.0.0.1:8050 in a browser.

## File Structure

```
csc696d-visual-analytics/
├── .venv/                       # Python virtual environment
├── wine_dashboard/
│   ├── app.py                   # Dash application
│   └── docs/
│       └── session-summary.md   # This file
└── ...
```
