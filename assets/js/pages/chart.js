/**
 * Chart.js Implementation
 * Creates a responsive bar chart with monthly sales data
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get the canvas element
  const canvas = document.getElementById('myChart');
  
  // Check if canvas exists in the DOM
  if (!canvas) {
    console.error('Chart canvas element not found in DOM');
    return;
  }
  
  // Get the current theme (light or dark) from the HTML element
  const isLightMode = document.documentElement.classList.contains('light-mode');
  
  // Set colors based on theme
  const textColor = isLightMode ? '#121212' : '#ffffff';
  const gridColor = isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
  
  try {
    // Sample data for the chart
    const data = {
      labels: ["January", "February", "March", "April", "May", "June"],
      datasets: [{
        label: 'Monthly Sales',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          'rgba(0, 188, 212, 0.7)', // Cyan
          'rgba(156, 39, 176, 0.7)', // Purple
          'rgba(233, 30, 99, 0.7)',  // Pink
          'rgba(255, 193, 7, 0.7)',  // Yellow
          'rgba(76, 175, 80, 0.7)',  // Green
          'rgba(33, 150, 243, 0.7)'  // Blue
        ],
        borderColor: [
          'rgba(0, 188, 212, 1)',
          'rgba(156, 39, 176, 1)',
          'rgba(233, 30, 99, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(33, 150, 243, 1)'
        ],
        borderWidth: 1,
        borderRadius: 5,
        hoverOffset: 4
      }]
    };
    
    // Chart configuration options
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            font: {
              family: "'Montserrat', sans-serif",
              size: 12
            }
          }
        },
        title: {
          display: false // We're using an HTML title instead
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFont: {
            family: "'Montserrat', sans-serif",
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            family: "'Montserrat', sans-serif",
            size: 13
          },
          padding: 10,
          cornerRadius: 6,
          displayColors: true
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            font: {
              family: "'Montserrat', sans-serif"
            }
          }
        },
        x: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            font: {
              family: "'Montserrat', sans-serif"
            }
          }
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeOutQuart'
      }
    };
    
    // Initialize the chart
    const myChart = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: options
    });
    
    // Update chart colors on theme toggle
    document.addEventListener('themeToggle', () => {
      const updatedIsLightMode = document.documentElement.classList.contains('light-mode');
      const updatedTextColor = updatedIsLightMode ? '#121212' : '#ffffff';
      const updatedGridColor = updatedIsLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
      
      // Update legend text color
      myChart.options.plugins.legend.labels.color = updatedTextColor;
      
      // Update axis colors
      myChart.options.scales.y.ticks.color = updatedTextColor;
      myChart.options.scales.x.ticks.color = updatedTextColor;
      myChart.options.scales.y.grid.color = updatedGridColor;
      myChart.options.scales.x.grid.color = updatedGridColor;
      
      // Update the chart
      myChart.update();
    });
    
    // Log success message
    console.log('Chart initialized successfully');
    
  } catch (error) {
    // Error handling
    console.error('Failed to initialize chart:', error);
    
    // Display error message
    const container = canvas.closest('.chart-container');
    if (container) {
      container.innerHTML = `
        <div class="fallback-message" style="display: block;">
          <h2>Unable to load chart</h2>
          <p>There was an error initializing the chart. Please try refreshing the page.</p>
          <p class="error-details" style="color: var(--accent); font-size: 0.9rem; margin-top: 1rem;">Error: ${error.message}</p>
        </div>
      `;
    }
  }
});
