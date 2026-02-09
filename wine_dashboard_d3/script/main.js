import * as d3 from "https://cdn.skypack.dev/d3@7";
import { scatterplot } from "./scatterplot.js";
import { barchart } from "./barchart.js";
import { lassoSelection } from "./lasso.js";

const unselectedColor = "#aaaaaa";

const labelToColor = {
  0: "#1f77b4",
  1: "#ff7f0e",
  2: "#2ca02c",
};

const messageActions = {
  passData: 0,
  passSelectionMeans: 1,
  passOverallMeans: 2,
};

const model = {
  data: undefined,
  featureNames: undefined,
  classNames: undefined,
  scatter: undefined,
  bar: undefined,
};

const prepareScatter = (data, featureNames, classNames) => {
  const container = d3.select("#view_scatter").node();
  const scatter = scatterplot(data, {
    svgId: "scatterplot",
    x: (d) => d.tsne_1,
    y: (d) => d.tsne_2,
    c: (d) => labelToColor[d.label],
    width: container.getBoundingClientRect().width,
    height: container.getBoundingClientRect().height,
    xLabel: "t-SNE 1",
    yLabel: "t-SNE 2",
    featureNames,
    classNames,
    labelToColor,
  });
  d3.select("#view_scatter").append(() => scatter);
  return scatter;
};

const prepareBar = (featureNames) => {
  const container = d3.select("#view_bar").node();
  const bar = barchart(featureNames, {
    svgId: "barchart",
    width: container.getBoundingClientRect().width,
    height: container.getBoundingClientRect().height - 30, // leave room for info text
  });
  d3.select("#view_bar").append(() => bar);
  return bar;
};

const prepareLasso = (scatter) => {
  const lasso = lassoSelection();
  const colors = model.data.map((d) => labelToColor[d.label]);

  lasso.on("end", () => {
    const selected = lasso.selected();

    if (!selected || Math.max(...selected) === 0) {
      // nothing selected — restore colors and request overall means
      scatter.update(colors);
      ws.send(
        JSON.stringify({
          action: messageActions.passOverallMeans,
          content: {},
        }),
      );
    } else {
      // dim unselected points
      const pointColors = selected.map((s, i) =>
        s ? colors[i] : unselectedColor,
      );
      scatter.update(pointColors);

      // collect selected indices
      const indices = [];
      selected.forEach((s, i) => {
        if (s) indices.push(i);
      });

      ws.send(
        JSON.stringify({
          action: messageActions.passSelectionMeans,
          content: { indices },
        }),
      );
    }
  });

  d3.select(scatter).call(
    lasso(scatter, d3.select(scatter).selectAll("circle").nodes()),
  );
};

// WebSocket connection
const websocketUrl = "ws://localhost:9000";
const ws = new WebSocket(websocketUrl);

ws.onopen = () => {
  ws.send(
    JSON.stringify({
      action: messageActions.passData,
      content: {},
    }),
  );
};

ws.onmessage = (event) => {
  const receivedData = JSON.parse(event.data);
  const action = receivedData.action;

  if (action === messageActions.passData) {
    model.data = JSON.parse(receivedData.content);
    model.featureNames = receivedData.featureNames;
    model.classNames = receivedData.classNames;

    // init views
    model.scatter = prepareScatter(
      model.data,
      model.featureNames,
      model.classNames,
    );
    model.bar = prepareBar(model.featureNames);

    // init lasso
    prepareLasso(model.scatter);

    // request overall means for initial bar chart
    ws.send(
      JSON.stringify({
        action: messageActions.passOverallMeans,
        content: {},
      }),
    );
  } else if (
    action === messageActions.passSelectionMeans ||
    action === messageActions.passOverallMeans
  ) {
    const means = receivedData.means;
    const count = receivedData.count;

    model.bar.update(means);

    const infoText =
      action === messageActions.passOverallMeans
        ? `Showing overall mean of all ${count} points. Select points in the scatterplot.`
        : `Showing mean of ${count} selected point(s).`;
    d3.select("#selection-info").text(infoText);
  }
};
