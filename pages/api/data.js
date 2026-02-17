import config from "../../config.json";

export default async function handler(req, res) {
  try {
    const { city, country, latitude, longitude } = config;

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${encodeURIComponent(latitude)}` +
      `&longitude=${encodeURIComponent(longitude)}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,visibility,wind_speed_10m,wind_direction_10m` +
      `&daily=sunrise,sunset` +
      `&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ message: "error" });
    }

    const om = await response.json();

    const timezone =
      typeof om?.utc_offset_seconds === "number" ? om.utc_offset_seconds : 0;

    const localSeconds = om?.current?.time
      ? Math.floor(new Date(om.current.time).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    const dt = localSeconds - timezone;

    const sunriseLocal = om?.daily?.sunrise?.[0]
      ? Math.floor(new Date(om.daily.sunrise[0]).getTime() / 1000)
      : localSeconds;

    const sunsetLocal = om?.daily?.sunset?.[0]
      ? Math.floor(new Date(om.daily.sunset[0]).getTime() / 1000)
      : localSeconds;

    const sunrise = sunriseLocal - timezone;
    const sunset = sunsetLocal - timezone;

    // wind speed conversion: km/h -> m/s (si ton UI affiche m/s)
    const windKmh = om?.current?.wind_speed_10m;
    const windMs =
      typeof windKmh === "number" ? Number((windKmh / 3.6).toFixed(1)) : null;

    const data = {
      name: city,
      sys: {
        country,
        sunrise,
        sunset,
      },
      main: {
        temp: om?.current?.temperature_2m ?? null,
        feels_like: om?.current?.apparent_temperature ?? null,
        humidity: om?.current?.relative_humidity_2m ?? null,
      },
      wind: {
        speed: windMs,
        deg: om?.current?.wind_direction_10m ?? null,
      },
      visibility: om?.current?.visibility ?? null,
      weather: [{ description: "N/A", icon: "01d" }],
      timezone,
      dt,
    };

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ message: "error" });
  }
}
