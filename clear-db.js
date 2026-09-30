const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearDB() {
  console.log("Iniciando limpieza de la base de datos...");
  
  // Borrar tracking
  const { error: err1 } = await supabase
    .from('event_rentability_tracking')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (err1) console.error("Error limpiando event_rentability_tracking:", err1);
  else console.log("Tabla event_rentability_tracking limpiada.");

  // Borrar metricas
  const { error: err3 } = await supabase
    .from('event_metrics')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (err3) console.error("Error limpiando event_metrics:", err3);
  else console.log("Tabla event_metrics limpiada.");

  // Borrar eventos
  const { error: err2 } = await supabase
    .from('events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (err2) console.error("Error limpiando events:", err2);
  else console.log("Tabla events limpiada.");

  console.log("Limpieza completada.");
}

clearDB();
