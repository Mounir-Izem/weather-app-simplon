import config from "../../config.json";

export default async function handler(req, res) {
  try {
    const { city, country, latitude, longitude } = config;

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,wind_speed_10m` +
      `&timezone=auto`;

    const response = await fetch(url);
    const om = await response.json();

    const data = {
      name: city,
      sys: { country },
      main: {
        temp: om.current.temperature_2m,
        feels_like: om.current.apparent_temperature,
      },
      wind: {
        speed: om.current.wind_speed_10m,
      },
      weather: [{ description: "N/A" }],
      timezone: om.utc_offset_seconds,
      dt: Math.floor(Date.now() / 1000),
    };

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}