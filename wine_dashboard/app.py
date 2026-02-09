import numpy as np
from dash import Dash, html, dcc, Input, Output, callback
import plotly.graph_objects as go
from sklearn.datasets import load_wine
from sklearn.manifold import TSNE
from scipy.stats import zscore

# --- Data preparation ---
wine = load_wine()
X = wine.data  # (178, 13)
y = wine.target
feature_names = wine.feature_names
class_names = wine.target_names

# Z-score normalization then t-SNE
X_norm = zscore(X, axis=0)
tsne = TSNE(n_components=2, random_state=42, perplexity=30)
X_tsne = tsne.fit_transform(X_norm)

# Build hover text: show all attributes for each point
hover_texts = []
for i in range(len(X)):
    lines = [f"<b>Class: {class_names[y[i]]}</b>"]
    for j, name in enumerate(feature_names):
        lines.append(f"{name}: {X[i, j]:.2f}")
    hover_texts.append("<br>".join(lines))

# Color map for classes
color_map = {0: "#1f77b4", 1: "#ff7f0e", 2: "#2ca02c"}

# Precompute original row indices per class (curve)
# class_indices[i] gives the array of original row indices for class i
class_indices = [np.where(y == cls)[0] for cls in range(len(class_names))]

# Min-max normalization parameters (per attribute)
X_min = X.min(axis=0)
X_max = X.max(axis=0)

def make_scatter_figure():
    fig = go.Figure()
    for cls_idx, cls_name in enumerate(class_names):
        mask = y == cls_idx
        fig.add_trace(
            go.Scatter(
                x=X_tsne[mask, 0],
                y=X_tsne[mask, 1],
                mode="markers",
                marker=dict(size=8, color=color_map[cls_idx], opacity=0.8),
                name=cls_name,
                text=[hover_texts[i] for i in range(len(y)) if y[i] == cls_idx],
                hoverinfo="text",
                selected=dict(marker=dict(opacity=1.0)),
                unselected=dict(marker=dict(opacity=0.3)),
            )
        )
    fig.update_layout(
        dragmode="lasso",
        plot_bgcolor="white",
        xaxis=dict(title="t-SNE 1", gridcolor="#eee", zeroline=False),
        yaxis=dict(title="t-SNE 2", gridcolor="#eee", zeroline=False),
        legend=dict(title="Class"),
        margin=dict(l=40, r=20, t=20, b=40),
    )
    return fig


# --- App layout ---
app = Dash(__name__)

app.layout = html.Div(
    style={"fontFamily": "Arial, sans-serif", "padding": "20px"},
    children=[
        html.H2("Wine Dataset — Interactive Visual Analysis"),
        html.Div(
            style={"display": "flex", "gap": "20px"},
            children=[
                # Scatterplot view
                html.Div(
                    style={"flex": "1"},
                    children=[
                        html.H4("t-SNE Scatterplot"),
                        html.P(
                            "Hover for details. Use lasso or box select to update the bar chart.",
                            style={"fontSize": "13px", "color": "#666"},
                        ),
                        dcc.Graph(id="scatter", figure=make_scatter_figure(), style={"height": "600px"}),
                    ],
                ),
                # Bar chart view
                html.Div(
                    style={"flex": "1"},
                    children=[
                        html.H4("Mean Attribute Values of Selection"),
                        html.P(
                            id="selection-info",
                            style={"fontSize": "13px", "color": "#666"},
                        ),
                        dcc.Graph(id="bar-chart", style={"height": "600px"}),
                    ],
                ),
            ],
        ),
    ],
)


@callback(
    Output("bar-chart", "figure"),
    Output("selection-info", "children"),
    Input("scatter", "selectedData"),
)
def update_bar_chart(selected_data):
    if selected_data is None or len(selected_data.get("points", [])) == 0:
        # Show overall mean when nothing is selected
        means = X.mean(axis=0)
        info_text = "Showing overall mean (no selection). Select points in the scatterplot."
    else:
        # Map (curveNumber, pointIndex) back to original row indices
        # Each curve corresponds to a class; pointIndex is the index within that class
        indices = []
        for pt in selected_data["points"]:
            curve = pt["curveNumber"]
            point_idx = pt["pointIndex"]
            # class_indices[curve] holds the original row indices for that class
            indices.append(int(class_indices[curve][point_idx]))
        means = X[indices].mean(axis=0)
        info_text = f"Showing mean of {len(indices)} selected point(s)."

    # Min-max normalize means to 0–1 range
    means_normalized = (means - X_min) / (X_max - X_min)

    fig = go.Figure(
        go.Bar(
            x=list(feature_names),
            y=means_normalized,
            marker_color="#4a90d9",
        )
    )
    fig.update_layout(
        plot_bgcolor="white",
        xaxis=dict(title="Attribute", tickangle=-45, gridcolor="#eee"),
        yaxis=dict(title="Normalized Mean Value", range=[0, 1], gridcolor="#eee"),
        margin=dict(l=50, r=20, t=20, b=120),
    )
    return fig, info_text


if __name__ == "__main__":
    app.run(debug=True)
