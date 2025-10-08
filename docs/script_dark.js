
// Data file names (same as before)
const SCENARIO_FILE = 'data_scenarios.csv';
const HAPPINESS_DATA_FILE = 'happiness_data.csv';

// Global variables for data
let scenariosData = [];
let happinessData = [];

// Base Layout for Dark Theme Plots
const DARK_LAYOUT_BASE = {
    paper_bgcolor: 'rgb(44, 44, 44)', // --bg-light
    plot_bgcolor: 'rgb(60, 60, 60)', // --plot-bg
    font: {
        color: 'rgb(240, 240, 240)', // --text-light
        family: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    },
    title: {
        font: {
            color: 'rgb(76, 175, 80)' // --highlight-color
        }
    },
    xaxis: {
        gridcolor: 'rgb(70, 70, 70)',
        linecolor: 'rgb(100, 100, 100)',
        zerolinecolor: 'rgb(100, 100, 100)'
    },
    yaxis: {
        gridcolor: 'rgb(70, 70, 70)',
        linecolor: 'rgb(100, 100, 100)',
        zerolinecolor: 'rgb(100, 100, 100)'
    },
    legend: {
        bgcolor: 'rgb(44, 44, 44)'
    },
    margin: { t: 50, r: 20, b: 80, l: 80 }
};

// Function to load CSV data (same as before)
async function loadCSV(file) {
    const response = await fetch(file);
    const text = await response.text();
    return Papa.parse(text, { header: true, dynamicTyping: true }).data;
}

// Function to load all data (same as before)
async function loadAllData() {
    // Load PapaParse for CSV parsing
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js';
    document.head.appendChild(script);

    return new Promise(async (resolve) => {
        script.onload = async () => {
            scenariosData = await loadCSV(SCENARIO_FILE);
            happinessData = await loadCSV(HAPPINESS_DATA_FILE);
            // Filter out any rows where the 'Year' is null or not a number (common with raw data)
            happinessData = happinessData.filter(d => d.Year && !isNaN(d.Year));
            resolve();
        };
    });
}

// Function to render the scenario buttons (same as before)
function renderScenarios() {
    const scenariosList = document.getElementById('scenarios-list');
    scenariosList.innerHTML = '';

    scenariosData.forEach((scenario, index) => {
        const scenarioNumber = scenario.scenario.split('.')[0];
        const button = document.createElement('button');
        button.className = 'scenario-button';
        button.textContent = \`Scenario \${scenarioNumber}: \${scenario.scenario.split('. ')[1]}\`;
        button.setAttribute('data-index', index);
        button.onclick = () => handleScenarioClick(index);
        scenariosList.appendChild(button);
    });
}

// Function to handle scenario button click (same as before)
function handleScenarioClick(index) {
    const selectedScenario = scenariosData[index];
    document.getElementById('vis-title').textContent = selectedScenario.scenario;
    document.getElementById('vis-original').innerHTML = \`<strong>Original Plot Flaw:</strong> \${selectedScenario.original_plot}\`;
    document.getElementById('vis-redesign').innerHTML = \`<strong>Redesign Goal:</strong> \${selectedScenario.redesign_goal}\`;

    document.querySelectorAll('.scenario-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(\`.scenario-button[data-index="\${index}"]\`).classList.add('active');

    generatePlot(selectedScenario);
}

// --- PLOT GENERATION FUNCTIONS (Modified for Dark Theme Layout) ---
function generatePlot(scenario) {
    const plotArea = document.getElementById('plot-area');
    plotArea.innerHTML = '';
    plotArea.classList.remove('plot-placeholder');

    const scenarioNumber = parseInt(scenario.scenario.split('.')[0]);

    let data = [];
    let layout = {};

    switch (scenarioNumber) {
        case 1:
            // Scenario 1: Stacked Bar Chart (Composition)
            const latestYear = Math.max(...happinessData.map(d => d.Year));
            const latestData = happinessData.filter(d => d.Year === latestYear)
                .sort((a, b) => b['Life Ladder'] - a['Life Ladder'])
                .slice(0, 10);

            const factors = ['Log GDP Per Capita', 'Social Support', 'Healthy Life Expectancy At Birth', 'Freedom To Make Life Choices', 'Generosity', 'Perceptions Of Corruption'];
            const countries = latestData.map(d => d['Country Name']);

            // Define a color scale that works well on dark mode
            const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800'];

            data = factors.map((factor, i) => ({
                x: countries,
                y: latestData.map(d => d[factor] || 0),
                name: factor,
                type: 'bar',
                marker: { color: colors[i % colors.length] },
                hovertemplate: 'Factor: %{name}<br>Country: %{x}<br>Value: %{y:.2f}<extra></extra>'
            }));

            layout = {
                ...DARK_LAYOUT_BASE,
                title: \`Scenario 1: Factor Contribution for Top 10 Happiest Countries (\${latestYear})\`,
                barmode: 'stack',
                xaxis: { ...DARK_LAYOUT_BASE.xaxis, title: 'Country' },
                yaxis: { ...DARK_LAYOUT_BASE.yaxis, title: 'Factor Score (Approximation of Contribution)' },
                height: 650
            };
            break;

        case 2:
            // Scenario 2: Boxplot or Violin Plot by Region (Distribution)
            const regions = [...new Set(happinessData.map(d => d['Regional Indicator']))].filter(r => r);

            data = regions.map(region => {
                const regionData = happinessData.filter(d => d['Regional Indicator'] === region);
                return {
                    y: regionData.map(d => d['Life Ladder']),
                    name: region,
                    type: 'box',
                    boxpoints: 'all',
                    jitter: 0.3,
                    marker: { color: DARK_LAYOUT_BASE.title.font.color }, // Use highlight color
                    line: { color: DARK_LAYOUT_BASE.title.font.color },
                    hovertemplate: 'Region: %{name}<br>Life Ladder: %{y:.2f}<extra></extra>'
                };
            });

            layout = {
                ...DARK_LAYOUT_BASE,
                title: 'Scenario 2: Distribution of Happiness Score ("Life Ladder") by Region',
                xaxis: { ...DARK_LAYOUT_BASE.xaxis, title: 'Regional Indicator' },
                yaxis: { ...DARK_LAYOUT_BASE.yaxis, title: 'Life Ladder Score', zeroline: false },
                height: 650
            };
            break;

        case 3:
            // Scenario 3: Dot Plot (Cleavland Chart) with Comparison (Ranking & Context)
            const latestYear3 = Math.max(...happinessData.map(d => d.Year));
            const latestData3 = happinessData.filter(d => d.Year === latestYear3 && d['Life Ladder'] && d['Log GDP Per Capita'])
                .sort((a, b) => b['Life Ladder'] - a['Life Ladder']);

            const countries3 = latestData3.map(d => d['Country Name']);

            // Trace 1: Life Ladder (The main dot)
            const lifeLadderTrace = {
                x: latestData3.map(d => d['Life Ladder']),
                y: countries3,
                mode: 'markers',
                type: 'scatter',
                name: 'Life Ladder Score',
                marker: { size: 10, color: DARK_LAYOUT_BASE.title.font.color }, // Highlight color
                hovertemplate: 'Country: %{y}<br>Life Ladder: %{x:.2f}<extra></extra>'
            };

            // Trace 2: Log GDP Per Capita (The secondary dot)
            const gdpTrace = {
                x: latestData3.map(d => d['Log GDP Per Capita']),
                y: countries3,
                mode: 'markers',
                type: 'scatter',
                name: 'Log GDP Per Capita (Secondary Axis)',
                marker: { size: 10, color: '#FFEB3B', symbol: 'diamond' }, // Secondary color
                xaxis: 'x2',
                hovertemplate: 'Country: %{y}<br>Log GDP: %{x:.2f}<extra></extra>'
            };

            data = [lifeLadderTrace, gdpTrace];

            layout = {
                ...DARK_LAYOUT_BASE,
                title: \`Scenario 3: Life Ladder vs. Log GDP Per Capita (\${latestYear3})\`,
                xaxis: { ...DARK_LAYOUT_BASE.xaxis, title: 'Life Ladder Score', domain: [0, 0.45] },
                xaxis2: {
                    ...DARK_LAYOUT_BASE.xaxis,
                    title: 'Log GDP Per Capita',
                    overlaying: 'x',
                    side: 'right',
                    domain: [0.55, 1],
                },
                yaxis: { ...DARK_LAYOUT_BASE.yaxis, title: 'Country', automargin: true },
                height: 1200 // Tall chart for readability
            };
            break;

        case 4:
            // Scenario 4: Multivariate Bubble Chart (Correlation)
            const latestYear4 = Math.max(...happinessData.map(d => d.Year));
            const latestData4 = happinessData.filter(d => d.Year === latestYear4 && d['Log GDP Per Capita'] && d['Social Support'] && d['Healthy Life Expectancy At Birth'] && d['Regional Indicator']);

            // Plotly automatically handles color-mapping of regions well on dark themes
            const regions4 = [...new Set(latestData4.map(d => d['Regional Indicator']))];
            data = regions4.map(region => {
                const regionData = latestData4.filter(d => d['Regional Indicator'] === region);
                return {
                    x: regionData.map(d => d['Log GDP Per Capita']),
                    y: regionData.map(d => d['Social Support']),
                    text: regionData.map(d => d['Country Name']),
                    mode: 'markers',
                    type: 'scatter',
                    name: region,
                    marker: {
                        size: regionData.map(d => (d['Healthy Life Expectancy At Birth'] - 40) * 1.5),
                        sizemode: 'area',
                        sizeref: 2 * Math.max(...regionData.map(d => d['Healthy Life Expectancy At Birth'])) / (10**2),
                        sizemin: 4,
                        line: { width: 1, color: 'rgb(200, 200, 200)' }
                    },
                    hovertemplate: 'Country: %{text}<br>GDP: %{x:.2f}<br>Social Support: %{y:.2f}<br>Region: %{name}<extra></extra>'
                };
            });

            layout = {
                ...DARK_LAYOUT_BASE,
                title: \`Scenario 4: GDP vs. Social Support (Bubble Size = Life Expectancy) - \${latestYear4}\`,
                xaxis: { ...DARK_LAYOUT_BASE.xaxis, title: 'Log GDP Per Capita' },
                yaxis: { ...DARK_LAYOUT_BASE.yaxis, title: 'Social Support' },
                height: 650
            };
            break;

        case 5:
            // Scenario 5: Line Chart with Interactivity (Time Series)
            const latestYear5 = Math.max(...happinessData.map(d => d.Year));
            const topCountries5 = happinessData.filter(d => d.Year === latestYear5)
                .sort((a, b) => b['Life Ladder'] - a['Life Ladder'])
                .slice(0, 5)
                .map(d => d['Country Name']);
            
            // Use bright colors for lines on a dark background
            const lineColors = ['#4CAF50', '#03A9F4', '#FFEB3B', '#FF5722', '#673AB7'];

            data = topCountries5.map((country, i) => {
                const countryData = happinessData.filter(d => d['Country Name'] === country && d['Life Ladder'] && d.Year)
                    .sort((a, b) => a.Year - b.Year);

                return {
                    x: countryData.map(d => d.Year),
                    y: countryData.map(d => d['Life Ladder']),
                    mode: 'lines+markers',
                    type: 'scatter',
                    name: country,
                    marker: { color: lineColors[i % lineColors.length] },
                    line: { color: lineColors[i % lineColors.length] },
                    hovertemplate: 'Year: %{x}<br>Life Ladder: %{y:.2f}<extra></extra>'
                };
            });

            layout = {
                ...DARK_LAYOUT_BASE,
                title: 'Scenario 5: Life Ladder Over Time (Top 5 Happiest Countries)',
                xaxis: { ...DARK_LAYOUT_BASE.xaxis, title: 'Year', tickformat: 'd' },
                yaxis: { ...DARK_LAYOUT_BASE.yaxis, title: 'Life Ladder Score' },
                height: 650
            };
            break;

        default:
            plotArea.innerHTML = '<p>Plot generation for this scenario is not yet implemented.</p>';
            return;
    }

    Plotly.newPlot('plot-area', data, layout, { responsive: true });
}

// --- INITIALIZATION ---
loadAllData().then(() => {
    renderScenarios();
    handleScenarioClick(0);
});
