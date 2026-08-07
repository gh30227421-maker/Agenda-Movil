const https = require('https');
const fs = require('fs');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log("Fetching Venezuela GeoJSON...");
    const ve = await fetchJson('https://code.highcharts.com/mapdata/countries/ve/ve-all.geo.json');
    
    console.log("Fetching Guyana GeoJSON...");
    const gy = await fetchJson('https://code.highcharts.com/mapdata/countries/gy/gy-all.geo.json');

    // Identificar las regiones de Guyana que forman la Guayana Esequiba
    const esequiboCodes = ['gy-bw', 'gy-cu', 'gy-ps', 'gy-pt', 'gy-ut', 'gy-es'];
    
    const esequiboFeatures = gy.features.filter(f => {
      const code = f.properties['hc-key'];
      return esequiboCodes.includes(code);
    });

    // Cambiar propiedades para que se identifique como "Guayana Esequiba"
    esequiboFeatures.forEach(f => {
      f.properties.name = 'Guayana Esequiba';
      f.properties.hc_key = 've-esequibo'; // key inventada para que no falle
    });

    // Fusionar
    ve.features = ve.features.concat(esequiboFeatures);

    const outputPath = './public/venezuela-esequibo.json';
    fs.writeFileSync(outputPath, JSON.stringify(ve));
    console.log("Successfully created " + outputPath);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
