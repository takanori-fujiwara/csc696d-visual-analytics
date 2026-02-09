import * as d3 from "https://cdn.skypack.dev/d3@7";

export const barchart = (
  featureNames,
  {
    svgId = "barchart",
    marginTop = 20,
    marginRight = 20,
    marginBottom = 120,
    marginLeft = 50,
    width = 640,
    height = 600,
    barColor = "#4a90d9",
  } = {},
) => {
  const xScale = d3
    .scaleBand()
    .domain(featureNames)
    .range([marginLeft, width - marginRight])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([0, 1])
    .range([height - marginBottom, marginTop]);

  const svg = d3
    .create("svg")
    .attr("id", svgId)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // y-axis
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(yScale).ticks(5))
    .call((g) =>
      g
        .append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("Normalized Mean"),
    );

  // bars group
  const barsGroup = svg.append("g");

  // initialize with zero-height bars
  barsGroup
    .selectAll("rect")
    .data(featureNames)
    .join("rect")
    .attr("x", (d) => xScale(d))
    .attr("y", yScale(0))
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .attr("fill", barColor);

  const update = (newMeans) => {
    barsGroup
      .selectAll("rect")
      .data(newMeans)
      .transition()
      .duration(300)
      .attr("y", (d) => yScale(d))
      .attr("height", (d) => yScale(0) - yScale(d));
  };

  return Object.assign(svg.node(), { update });
};
