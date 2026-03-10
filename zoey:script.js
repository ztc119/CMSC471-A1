// Check that D3 is loaded
console.log('D3 Version:', d3.version);


let allData = [];
let currentCrime = "THEFT";
let crimeData = [];
let extremeData = [];

// Set margins
const margin = {top: 80, right: 40, bottom: 60, left: 80};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG canvas
const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let xScale, yScale;

const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
];

window.addEventListener("load", init);

// Extreme points
const extremePointLayer = svg.append("g");

// Hoverline to y-axis
const hoverLine = svg.append("line")
    .attr("class","hover-line")
    .attr("stroke","gray")
    .attr("stroke-dasharray","4,4")
    .style("opacity",0);

function init(){
    // Load data
    d3.csv("crime_monthly_stats.csv", function(d){

      return {
        crime: d.crime_type,
        month: +d.month,
        month_name: d.month_name,
        avg: +d.avg_count,
        max_count: +d.max_count,
        min_count: +d.min_count,
        max_year: +d.max_year,
        min_year: +d.min_year
      }
    }).then(data => {
        // Initial setup
        allData = data;
        crimeData = allData.filter(d => d.crime === currentCrime);  
        crimeData.sort((a,b) => a.month - b.month); // Sort by month
        setupSelector()
        updateAxes();
        updateVis();
  });
}

const crimes = ["THEFT","ROBBERY","BURGLARY"];
// For dropdown text
const dropdownText = {
    THEFT: "Theft",
    ROBBERY: "Robbery",
    BURGLARY: "Burglary",
}

function setupSelector() {
    
    // Dropdown button
    d3.select("#crimeSelector")
    .selectAll("option")
    .data(crimes)
    .enter()
    .append("option")
    .text(d => dropdownText[d]) // Text displayed on dropdown
    .attr("value", d => d); // Value used in code

    d3.select("#crimeSelector")
    .on("change", function(){
        // On selecting the dropdown button,
        // log the selected value
        console.log(d3.select(this).property("value"))
        currentCrime = d3.select(this).property("value");
        // Filter the dataset for entries with a matching type
        crimeData = allData.filter(d => d.crime === currentCrime);
        crimeData.sort((a,b) => a.month - b.month); 
        // Update chart
        updateAxes();
        updateVis();
    });
}

function updateAxes() {
    // Clear old axes
    svg.selectAll('.axis').remove()
    svg.selectAll('.labels').remove()

    // Set scales for axes
    xScale = d3.scaleLinear()
        .domain([0.5,12.5])
        .range([0,width]);

    yScale = d3.scaleLinear()
        .domain([0, d3.max(crimeData, d => d.max_count)])
        .range([height,0]);

    // x-axis
    const xAxis = d3.axisBottom(xScale)
        .ticks(12)
        .tickFormat(d => months[d-1]);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    // y-axis
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("class", "axis")
        .call(yAxis);

    // Axes labels
    svg.append("text")
        .attr("x", width/2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text("Month")
        .attr('class', 'labels');

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x",-height/2)
        .attr("y", -margin.left + 28)
        .attr("text-anchor","middle")
        .text("Monthly Crime Count")
        .attr('class', 'labels');

}

function updateVis() {

    const points = svg.selectAll(".point")
    .data(crimeData, d => d.month);

    // Enter/update to create new circles
    points.join(
    enter => enter.append("circle")
    .attr("class","point")
    .attr("cx", d => xScale(d.month))
    .attr("cy", d => yScale(d.avg))
    .attr("r",0)
    .attr("fill", "black")
    // Mouse events
    .on("mouseover", function(event,d){
        console.log(d)
        d3.select("#tooltip")
        .style("display","block") // Make tooltip visible
        .html( // Change <div> HTML content
            // need to fix
        `<strong>${d.month_name}</strong><br>
        Count: ${d.avg}<br>`
        ) 
        .style("left",(event.pageX + 15)+ "px")
        .style("top",(event.pageY - 20) + "px");

        // Highlight point
        d3.select(this)
        .attr("r",5)
        .attr("fill","black")
        .attr("fill-opacity",0.6)
        .transition()
        .duration(200)
        .attr("r",8);


        hoverLine
        .attr("x1",0)
        .attr("x2",xScale(d.month))
        .attr("y1",yScale(d.avg))
        .attr("y2",yScale(d.avg))
        .style("opacity",0)
        .transition()
        .duration(200)
        .style("opacity",1);
    })
    .on("mouseout", function(){ // When mouse leaves
        d3.select("#tooltip")
        .style("display","none");
    
        // Remove point highlight
        d3.select(this)
        .transition()
        .duration(200)
        .attr("r",5)
        .attr("fill","black")
        .attr("fill-opacity",1);

        hoverLine
        .transition()
        .duration(200)
        .style("opacity",0);
    })
    .transition()
    .delay((d,i) => i * 80)   // stagger points
    .duration(400)
    .attr("r",5),

    update => update
    .transition()
    .delay((d,i) => i * 80)
    .duration(400)
    .attr("cx", d => xScale(d.month))
    .attr("cy", d => yScale(d.avg))
    );

     // Create line generator
    const line = d3.line()
    .x(d => xScale(d.month))
    .y(d => yScale(d.avg));

    // Generate line
    svg.selectAll(".line")
    .data([crimeData])
    .join(
        enter => enter.append("path")
        .attr("class","line")
        .attr("fill","none")
        .attr("stroke","steelblue")
        .attr("stroke-width",3)
        .attr("d", line),

    update => update
        .transition()
        .duration(1000)
        .attr("d", line)
    );

    // Extreme data points
    extremeData = crimeData.flatMap(d => [

        {
            month:d.month,
            month_name:d.month_name,
            value:d.max_count,
            year:d.max_year,
            type:"max"
        },

        {
            month:d.month,
            month_name:d.month_name,
            value:d.min_count,
            year:d.min_year,
            type:"min"
        }

    ]);

   extremePointLayer.selectAll(".extreme-point")
    .data(extremeData, d => d.month + d.type)
    .join(

    enter => enter.append("circle")
    .attr("class","extreme-point")
    .attr("cx", d=>xScale(d.month))
    .attr("cy", height)        // start from bottom
    .attr("r",0)
    .attr("fill", d => d.type === "max" ? "red" : "green")
    .on("mouseover", function(event,d){
        console.log(d)
        d3.select("#tooltip")
        .style("display","block")
        .html(`
            <strong> ${d.month_name} </strong><br>
            Count: ${d.value}<br>
            Year: ${d.year}`)
        .style("left",(event.pageX+15)+"px")
        .style("top",(event.pageY-20)+"px");
        // Highlight point
        d3.select(this)
        .attr("r",5)
        .attr("fill", d => d.type === "max" ? "red" : "green")
        .attr("fill-opacity",0.6)
        .transition()
        .duration(200)
        .attr("r",8);

        hoverLine
        .attr("x1",0)
        .attr("x2",xScale(d.month))
        .attr("y1",yScale(d.value))
        .attr("y2",yScale(d.value))
        .style("opacity",0)
        .transition()
        .duration(200)
        .style("opacity",1);
    })
    .on("mouseout", function(){ // When mouse leaves
        d3.select("#tooltip")
        .style("display","none");
        
        // Remove point highlight
        d3.select(this)
        .transition()
        .duration(200)
        .attr("r",5)
        .attr("fill", d => d.type === "max" ? "red" : "green")
        .attr("fill-opacity",1);

        hoverLine
        .transition()
        .duration(200)
        .style("opacity",0);
    })
    .transition()
    .delay((d,i) => i * 40)   // stagger points
    .duration(400)
    .attr("cy", d => yScale(d.value))
    .attr("r",5),

    update => update
    .transition()
    .delay((d,i) => i * 40)
    .duration(400)
    .attr("cx", d=>xScale(d.month))
    .attr("cy", d=>yScale(d.value)),

    exit => exit
    .transition()
    .duration(200)
    .attr("r",0)
    .remove()
);

}


const legendSvg = d3.select("#vis")
    .append("svg")
    .attr("width",150)
    .attr("height",100);

const legend = legendSvg.append("g")
    .attr("transform","translate(10,20)");

legend.append("circle")
    .attr("cx",0)
    .attr("cy",0)
    .attr("r",5)
    .attr("fill","black");

legend.append("text")
    .attr("x",12)
    .attr("y",4)
    .text("Average");

legend.append("circle")
    .attr("cx",0)
    .attr("cy",20)
    .attr("r",5)
    .attr("fill","red");

legend.append("text")
    .attr("x",12)
    .attr("y",24)
    .text("Maximum");

legend.append("circle")
    .attr("cx",0)
    .attr("cy",40)
    .attr("r",5)
    .attr("fill","green");

legend.append("text")
    .attr("x",12)
    .attr("y",44)
    .text("Minimum");

legend.append("line")
    .attr("x1",-5)
    .attr("x2",5)
    .attr("y1",60)
    .attr("y2",60)
    .attr("stroke","steelblue")
    .attr("stroke-width",3);

legend.append("text")
    .attr("x",12)
    .attr("y",64)
    .text("Average line");
