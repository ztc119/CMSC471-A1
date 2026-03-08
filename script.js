const margin = {top: 60, right: 150, bottom: 70, left: 70};
const width = 850 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 20)
    .style('text-anchor', 'middle')
    .style('font-family', 'sans-serif')
    .text('Crime Type');

svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 25)
    .style('text-anchor', 'middle')
    .style('font-family', 'sans-serif')
    .text('Average Monthly Incidents');

const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "10px")
    .style("border-radius", "4px")
    .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.1)")
    .style("font-family", "sans-serif");

d3.csv("data/summary_crime.csv").then(data => {
    data.forEach(d => {
        d.before = +d.before;
        d.during = +d.during;
        d.after = +d.after;
    });

    const periods = ['before', 'during', 'after'];
    const color = d3.scaleOrdinal()
        .domain(periods)
        .range(["#4e79a7", "#f28e2c", "#e15759"]);

    const x0 = d3.scaleBand().rangeRound([0, width]).paddingInner(0.2);
    const x1 = d3.scaleBand().domain(periods).padding(0.05);
    const y = d3.scaleLinear().range([height, 0]);

    const xAxisG = svg.append("g").attr("transform", `translate(0,${height})`);
    const yAxisG = svg.append("g");

    function update(filteredData) {
        x0.domain(filteredData.map(d => d.category));
        x1.rangeRound([0, x0.bandwidth()]);
        y.domain([0, d3.max(filteredData, d => Math.max(d.before, d.during, d.after))]).nice();

        xAxisG.transition().duration(500).call(d3.axisBottom(x0));
        yAxisG.transition().duration(500).call(d3.axisLeft(y));

        const groups = svg.selectAll(".crime-group")
            .data(filteredData, d => d.category);

        groups.exit().remove();

        const groupsEnter = groups.enter().append("g")
            .attr("class", "crime-group");

        const combinedGroups = groupsEnter.merge(groups)
            .transition().duration(500)
            .attr("transform", d => `translate(${x0(d.category)},0)`);

        const rects = groupsEnter.merge(groups).selectAll("rect")
            .data(d => periods.map(key => ({category: d.category, key, value: d[key]})));

        rects.enter().append("rect")
            .merge(rects)
            .attr("x", d => x1(d.key))
            .attr("width", x1.bandwidth())
            .attr("fill", d => color(d.key))
            .on("mouseover", function(event, d) {
                d3.select(this).style("opacity", 0.7); 
                tooltip.style("visibility", "visible")
                    .html(`<strong>${d.category}</strong><br>Period: ${d.key.charAt(0).toUpperCase() + d.key.slice(1)}<br>Avg: ${d.value.toFixed(2)}`);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 1); 
                tooltip.style("visibility", "hidden");
            })
            .transition().duration(500)
            .attr("y", d => y(d.value))
            .attr("height", d => height - y(d.value));
            
        rects.exit().remove();
    }

    const filterContainer = d3.select("#controls");
    data.forEach(d => {
        const label = filterContainer.append("label").style("display", "block");
        label.append("input")
            .attr("type", "checkbox")
            .attr("checked", true)
            .attr("value", d.category)
            .on("change", function() {
                const checked = filterContainer.selectAll("input:checked").nodes().map(n => n.value);
                update(data.filter(item => checked.includes(item.category)));
            });
        label.append("span").text(" " + d.category);
    });

    update(data);
    
    renderLegend(svg, width, color, periods);
});

function renderLegend(svg, width, color, periods) {
    const legend = svg.append("g").attr("transform", `translate(${width + 20}, 0)`);
    periods.forEach((p, i) => {
        const g = legend.append("g").attr("transform", `translate(0,${i * 25})`);
        g.append("rect").attr("width", 18).attr("height", 18).attr("fill", color(p));
        g.append("text").attr("x", 25).attr("y", 14).style("text-transform", "capitalize").text(p);
    });
}