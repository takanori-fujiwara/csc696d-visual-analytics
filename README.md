# CSC 696D — Visual Analytics

Examples of building interactive visual analytics applications, comparing a traditional approach (customizing existing code) with an AI-assisted approach (using Claude Code).

## Examples

### `scatter_d3_from_tutorial/` — Traditional Approach (No AI)

A D3.js scatterplot with canvas-based lasso selection and a Python WebSocket backend. Built by customizing examples from the [web-vis-tutorial](https://github.com/takanori-fujiwara/web-vis-tutorial) repository.

- **Frontend**: D3.js scatterplot with lasso selection
- **Backend**: Python async WebSocket server (serves data, computes network layout)
- **Data**: Wine dataset (t-SNE projection) and mtcars

**How to run:**
```bash
# Terminal 1: Start backend
cd scatter_d3_from_tutorial/backend
python ws_server.py

# Terminal 2: Serve frontend
cd scatter_d3_from_tutorial
python -m http.server 8080
```
Then open http://localhost:8080.

---

### `wine_dashboard_dash_with_claude/` — Claude-Assisted (Dash)

An interactive wine dataset dashboard built with Plotly Dash, developed entirely through conversation with Claude Code. Features a t-SNE scatterplot with lasso selection and a bar chart showing min-max normalized mean attribute values of the selection.

- **Stack**: Python (Dash, Plotly, scikit-learn, scipy)
- **Interactions**: Hover tooltips, lasso/box selection updating bar chart

**How to run:**
```bash
source .venv/bin/activate
python wine_dashboard_dash_with_claude/app.py
```
Then open http://127.0.0.1:8050.

**Claude conversation logs:** [`wine_dashboard_dash_with_claude/docs/`](wine_dashboard_dash_with_claude/docs/)
- `conversation-history.md` — Full conversation history with prompts and Claude's actions
- `session-summary.md` — Technical summary of what was built

## License

This project is licensed under the [BSD 3-Clause License](LICENSE).

Feel free to use these examples in lectures, courses, workshops, or any other context. If you do, I would appreciate it if you let me know how you utilize them.

---

### `wine_dashboard_d3_with_claude/` — Claude-Assisted (D3.js + Python WebSocket)

The same wine dashboard recreated with a D3.js frontend and Python WebSocket backend, also developed with Claude Code. This demonstrates Claude building the same application using a different technology stack.

- **Frontend**: D3.js scatterplot (with tooltips, legend, lasso selection) + bar chart (with animated transitions)
- **Backend**: Python async WebSocket server (serves data, computes normalized means)
- **Data**: Wine dataset (178 samples, 13 features, 3 classes)

**How to run:**
```bash
# Terminal 1: Start backend
cd wine_dashboard_d3_with_claude/backend
python ws_server.py

# Terminal 2: Serve frontend
cd wine_dashboard_d3_with_claude
python -m http.server 8080
```
Then open http://localhost:8080.

**Claude conversation logs:** [`wine_dashboard_d3_with_claude/docs/`](wine_dashboard_d3_with_claude/docs/)
- `conversation-history.md` — Full conversation history with prompts and Claude's actions
- `session-summary.md` — Technical summary of what was built