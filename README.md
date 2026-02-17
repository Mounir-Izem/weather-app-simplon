Weather App – Technical Adaptation for Transport Display Scenario

![Weather App Screenshot](screenshotApp.png)

This project adapts an existing weather application to meet new technical constraints for public transport information screens.

Context
The original application allowed users to search for any city. This version removes the search functionality and uses a fixed location configuration. The weather data refreshes automatically every hour. The application is designed for screens where no user interaction is required.

Changes from Original Project
API Migration

Replaced OpenWeatherMap with Open-Meteo
Removed API key and environment variable configuration.
Changed from city-name queries to coordinate-based queries
Functionality Removal

Removed city search input
Removed search component and related files
Removed dynamic POST requests
Removed user-triggered data fetching
New Features

Fixed location via JSON configuration file
Automatic data refresh every hour
WMO weather code support for icons and descriptions
API Implementation
Endpoint:

https://api.open-meteo.com/v1/forecast
Parameters:

latitude and longitude from config.json
current: temperature_2m, apparent_temperature, relative_humidity_2m, visibility, wind_speed_10m, wind_direction_10m, weather_code
daily: sunrise, sunset
timezone: auto
Data Mapping:

The API returns data in a different format than the original. The code maps fields to maintain compatibility with existing UI components:

javascript
const data = {
  name: city,                                    // from config.json
  sys: {
    country,                                      // from config.json
    sunrise,                                      // from om.daily.sunrise[0]
    sunset,                                       // from om.daily.sunset[0]
  },
  main: {
    temp: om?.current?.temperature_2m,           // mapped to main.temp
    feels_like: om?.current?.apparent_temperature, // mapped to main.feels_like
    humidity: om?.current?.relative_humidity_2m, // mapped to main.humidity
  },
  wind: {
    speed: windMs,                               // converted from km/h to m/s
    deg: om?.current?.wind_direction_10m,        // mapped to wind.deg
  },
  visibility: om?.current?.visibility,         // mapped directly
  weather: [{ description, icon }],              // mapped from weather_code
  timezone: om.utc_offset_seconds,               // mapped directly
  dt: localSeconds,                              // from om.current.time
};
Weather Code Mapping:

Open-Meteo returns numeric WMO codes. The application maps these to descriptions and icons:

javascript
const weatherMap = {
  0: { description: "Clear sky", icon: "01d" },
  1: { description: "Mainly clear", icon: "01d" },
  2: { description: "Partly cloudy", icon: "02d" },
  3: { description: "Overcast", icon: "03d" },
  45: { description: "Fog", icon: "50d" },
  61: { description: "Slight rain", icon: "10d" },
  63: { description: "Moderate rain", icon: "10d" },
  71: { description: "Slight snow", icon: "13d" },
};
 
const code = om?.current?.weather_code ?? 0;
const weatherInfo = weatherMap[code] || { description: "Unknown", icon: "01d" };
Unit Conversion:

Open-Meteo returns wind speed in km/h. The application converts this to m/s:

javascript
const windKmh = om?.current?.wind_speed_10m;
const windMs = typeof windKmh === "number" ? Number((windKmh / 3.6).toFixed(1)) : null;
Configuration File
The location is set in config.json:

json
{
  "city": "Paris",
  "country": "France",
  "latitude": 48.856614,
  "longitude": 2.352222
}
The API route reads this file and uses the latitude and longitude for the Open-Meteo request. The city and country names are displayed in the UI.

Automatic Refresh
The frontend refreshes data every hour:

javascript
useEffect(() => {
  const getData = async () => {
    const res = await fetch("/api/data");
    const data = await res.json();
    setWeatherData({ ...data });
    console.log("API data:", data);
  };
 
  getData();                                    // Fetch immediately
  const interval = setInterval(getData, 3600000); // Then every hour
 
  return () => clearInterval(interval);          // Cleanup on unmount
}, []);
The interval is set to 3600000 milliseconds (1 hour). The cleanup function prevents memory leaks when the component unmounts.

Timezone Handling
Open-Meteo returns the current time as a string in the current.time field. The application converts this to a Unix timestamp:

javascript
const localSeconds = om?.current?.time
  ? Math.floor(new Date(om.current.time).getTime() / 1000)
  : Math.floor(Date.now() / 1000);
 
const dt = localSeconds;
The current.time field already contains the local time for the requested coordinates. The timestamp is derived directly from the Open-Meteo current.time field.

For sunrise and sunset times, the application extracts the first entries from the daily arrays:

javascript
const sunriseLocal = om?.daily?.sunrise?.[0]
  ? Math.floor(new Date(om.daily.sunrise[0]).getTime() / 1000)
  : localSeconds;
 
const sunsetLocal = om?.daily?.sunset?.[0]
  ? Math.floor(new Date(om.daily.sunset[0]).getTime() / 1000)
  : localSeconds;
 
const sunrise = sunriseLocal;
const sunset = sunsetLocal;
Project Structure
├── pages/
│   ├── index.js          # Main UI component
│   └── api/
│       └── data.js       # API proxy route
├── config.json           # Location configuration
├── components/           # UI components
│   ├── MainCard.js       # Primary display
│   ├── MetricsBox.js     # Secondary metrics
│   ├── DateAndTime.js    # Time display
│   ├── LoadingScreen.js  # Loading state
│   ├── ErrorScreen.js    # Error state
│   └── [others]
└── services/             # Utility functions
    ├── converters.js     # Unit conversions
    └── helpers.js        # Data formatting
Installation
Requirements:

Node.js 16.x
Git
Steps:

bash
# Clone the repository
git clone https://github.com/Mounir-Izem/weather-app-simplon.git
 
# Enter the project directory
cd weather-app-simplon
 
# Use Node 16
nvm use 16
 
# Install dependencies
npm install
 
# Start the development server
npm run dev
Access the application: Open http://localhost:3000 in your browser.

No API key required. The application uses Open-Meteo which does not require authentication.

Change the location: Edit config.json with your desired city coordinates.

Error Handling
The API route returns an error response if the Open-Meteo request fails:

javascript
if (!response.ok) {
  return res.status(response.status).json({ message: "error" });
}
The frontend displays an error screen when weatherData.message exists:

javascript
} : weatherData && weatherData.message ? (
  <ErrorScreen errorMessage="Unable to load weather data." >
  </ErrorScreen>
) : (
  <LoadingScreen loadingMessage="Loading data..." />
);
A loading screen displays while waiting for the initial data fetch.