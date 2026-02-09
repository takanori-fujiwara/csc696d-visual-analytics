import * as d3 from "https://cdn.skypack.dev/d3@7";

const mapValue = (data, a) =>
  typeof a === "function"
    ? Object.assign(d3.map(data, a), { type: "function" })
    : Array.isArray(a)
      ? Object.assign([...a], { type: "array" })
      : Object.assign(
          data.map(() => a),
          { type: "constant" },
        );

export const scatterplot = (
  data,
  {
    svgId = "scatterplot",
    x = ([x]) => x,
    y = ([, y]) => y,
    r = 5,
    c = "#4D7AA7",
    stroke = "#CCCCCC",
    strokeWidth = 1,
    marginTop = 20,
    marginRight = 30,
    marginBottom = 30,
    marginLeft = 40,
    width = 640,
    height = width,
    xType = d3.scaleLinear,
    xDomain,
    xRange,
    yType = d3.scaleLinear,
    yDomain,
    yRange,
    xLabel,
    yLabel,
    featureNames = [],
    classNames = [],
    labelToColor = {},
  } = {},
) => {
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const C = mapValue(data, c);
  const I = d3.range(X.length);

  if (xDomain === undefined) xDomain = d3.extent(X);
  if (yDomain === undefined) yDomain = d3.extent(Y);
  if (xRange === undefined) xRange = [marginLeft, width - marginRight];
  if (yRange === undefined) yRange = [height - marginBottom, marginTop];

  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);
  const xAxis = d3.axisBottom(xScale).ticks(width / 80);
  const yAxis = d3.axisLeft(yScale).ticks(height / 50);

  const tooltip = d3.select("#tooltip");

  const svg = d3
    .create("svg")
    .attr("id", svgId)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  // x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(xAxis)
    .call((g) =>
      g
        .append("text")
        .attr("x", width)
        .attr("y", marginBottom - 4)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text(xLabel),
    );

  // y-axis
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis)
    .call((g) =>
      g
        .append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(yLabel),
    );

  // draw circles
  svg
    .append("g")
    .attr("stroke", stroke)
    .attr("stroke-width", strokeWidth)
    .selectAll("circle")
    .data(I)
    .join("circle")
    .attr("fill", (i) => C[i])
    .attr("cx", (i) => xScale(X[i]))
    .attr("cy", (i) => yScale(Y[i]))
    .attr("r", r)
    .on("mouseenter", (event, i) => {
      const d = data[i];
      let html = `<strong>Class: ${classNames[d.label] || d.label}</strong>`;
      for (const name of featureNames) {
        html += `<br>${name}: ${Number(d[name]).toFixed(2)}`;
      }
      tooltip.html(html).style("display", "block");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 10 + "px");
    })
    .on("mouseleave", () => {
      tooltip.style("display", "none");
    });

  // legend
  if (classNames.length > 0 && Object.keys(labelToColor).length > 0) {
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - marginRight - 100}, ${marginTop})`);

    classNames.forEach((name, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      row
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("fill", labelToColor[i]);
      row
        .append("text")
        .attr("x", 12)
        .attr("y", 4)
        .attr("font-size", "12px")
        .text(name);
    });
  }

  const update = (newC) => {
    const C = mapValue(data, newC);
    svg
      .selectAll("circle")
      .data(I)
      .attr("fill", (i) => C[i]);
  };

  return Object.assign(svg.node(), { update });
};
