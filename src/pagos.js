'use strict';

// Idempotencia durable del pago (whitepaper §4.4, §14 y §17, paso 7).
//
// Un pago se cobra una sola vez aunque se reintente, se reinicie el proceso, dos procesos lo intenten a la vez o la entrega
// del servicio falle despues de cobrar. Un cobro cuyo resultado se perdio no se reintenta a ciegas: queda `incierto` hasta
// que alguien lo reconcilia contra la red (`resolver`).
//
// DISENO. El estado es un registro de SOLO CREACION: cada hecho es un archivo nuevo que se crea de forma atomica y no se
// reescribe nunca. Un intento de cobro `n` deja `reserva-n` (quien la crea es el unico que cobra), despues `resultado-n`
// (lo escribe el dueño del intento) y, si hubo que reconciliarlo, `decision-n` (lo escribe quien reconcilia). El estado del
// pago se DERIVA leyendo esos archivos. Como nada se actualiza en el lugar, no hay candados ni actualizaciones que se pisen,
// y un cobro tardio no puede deshacer lo que otro ya registro. Lo que SI puede pasar es que el estado derivado diga
// `conflicto` (dos cobros confirmados) o que un `liquidado` lleve un aviso de intentos sin cerrar: la tabla DETECTA el doble
// cobro, no lo evita, y lo decide una persona.
//
// LA CLAVE. `pago` es la OBLIGACION que se paga (por ejemplo `h1:honorario`), no la autorizacion que la respalda: una
// autorizacion nueva para la misma obligacion es la misma clave y se rechaza (§14, «reintento con un pago nuevo»).
//
// FALLAR CERRADO. Si algun hecho de la clave no se puede leer (archivo vacio, truncado, corrupto), la tabla se detiene con
// `HECHO_ILEGIBLE` y nombra el archivo: no lo interpreta como un estado. Lo repara una persona.
//
// LO QUE NO HACE.
// - No despierta un proceso caido: una reserva sin resultado pasado el plazo se lee `incierta`.
// - Los relojes de los procesos que comparten el directorio tienen que estar razonablemente de acuerdo: el plazo se mide con `ahora()`.
// - Un cobrador mas lento que el plazo puede dejar que alguien reconcilie «no cobrado» y que despues llegue su cobro: eso se ve
//   como `conflicto`, no se impide. La proteccion de fondo (aceptar «no cobrado» solo cuando vence la autorizacion) no esta.
// - Necesita un sistema de archivos con enlaces duros (NTFS, ReFS, ext4, APFS). Donde no los hay, `crear` lanza y nunca cobra.
// - El contenido de cada hecho se fuerza a disco (`fsync`) pero la entrada de directorio no: Node en Windows no puede hacerlo.
//   Un corte de energia en los segundos que siguen a un cobro puede perder la reserva.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

class ErrorPagos extends Error {
  constructor(mensaje, extra = {}) {
    super(mensaje);
    this.name = 'ErrorPagos';
    Object.assign(this, extra);
  }
}

// Los errores que la tabla misma lanza al registrar un resultado se reconocen por identidad, no por su codigo: un error con el
// mismo codigo que venga de `ejecutar` es un fallo del cobro como cualquier otro.
const PROPIOS = new WeakSet();

const CAMPOS = ['acuerdo', 'capacidad', 'pago'];

function claveDe(clave) {
  for (const campo of CAMPOS) {
    if (typeof clave?.[campo] !== 'string' || clave[campo].length === 0) {
      throw new ErrorPagos(`la clave del pago necesita «${campo}»: texto no vacio`);
    }
  }
  const material = JSON.stringify(CAMPOS.map((campo) => clave[campo].normalize('NFC')));
  return crypto.createHash('sha256').update('TEMIS-PAGO-1\0').update(material).digest('hex');
}

const dormir = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const TRANSITORIOS = new Set(['EPERM', 'EBUSY', 'EACCES']);

// Windows puede negar una operacion un instante si un antivirus o un indexador tiene el archivo abierto.
function reintentando(fn, intentos = 60) {
  for (let i = 0; ; i += 1) {
    try {
      return fn();
    } catch (e) {
      if (!TRANSITORIOS.has(e.code) || i >= intentos) throw e;
      dormir(5);
    }
  }
}

// Crea `archivo` con `contenido` completo, de forma atomica: o aparece entero o no aparece, y si ya existe devuelve false.
// Se escribe un temporal, se fuerza a disco y se enlaza al nombre final (el enlace falla con EEXIST si alguien llego antes).
// Borrar el temporal es limpieza: si falla, el hecho ya existe y el resultado de `crear` no cambia.
function crear(archivo, contenido) {
  const temporal = `${archivo}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  const fd = fs.openSync(temporal, 'wx');
  try {
    fs.writeSync(fd, `${JSON.stringify(contenido)}\n`);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  let creado;
  try {
    reintentando(() => fs.linkSync(temporal, archivo));
    creado = true;
  } catch (e) {
    if (e.code !== 'EEXIST') {
      try { fs.rmSync(temporal, { force: true }); } catch { /* huerfano: lo barre abrirTablaPagos */ }
      throw e;
    }
    creado = false;
  }
  try { fs.rmSync(temporal, { force: true }); } catch { /* huerfano: lo barre abrirTablaPagos */ }
  return creado;
}

// Un hecho que existe y no se puede leer detiene la tabla: nunca se toma por un estado.
function leerHecho(archivo) {
  let texto;
  try {
    texto = reintentando(() => fs.readFileSync(archivo, 'utf8'));
  } catch (e) {
    throw new ErrorPagos(`no se puede leer el hecho ${path.basename(archivo)} (${e.code ?? 'error'}): la tabla se detiene hasta que una persona lo revise`, { codigo: 'HECHO_ILEGIBLE', archivo });
  }
  try {
    const valor = JSON.parse(texto);
    if (valor === null || typeof valor !== 'object') throw new Error('no es un objeto');
    return valor;
  } catch {
    throw new ErrorPagos(`el hecho ${path.basename(archivo)} esta vacio o corrupto: la tabla se detiene hasta que una persona lo revise`, { codigo: 'HECHO_ILEGIBLE', archivo });
  }
}

const TEMPORAL_VIEJO_MS = 10 * 60 * 1000;

function abrirTablaPagos(dir, { ahora = Date.now, ttlMs = 120000 } = {}) {
  fs.mkdirSync(dir, { recursive: true });

  // Los temporales que dejo un proceso muerto no son hechos (no terminan en .json): se barren los de mas de diez minutos.
  for (const nombre of fs.readdirSync(dir)) {
    if (!nombre.endsWith('.tmp')) continue;
    try {
      if (Date.now() - fs.statSync(path.join(dir, nombre)).mtimeMs > TEMPORAL_VIEJO_MS) fs.rmSync(path.join(dir, nombre), { force: true });
    } catch { /* otro proceso lo barrio o lo esta usando */ }
  }

  // Todos los hechos de una clave, agrupados por intento.
  function hechos(clave) {
    const cobros = new Map();
    const entregas = new Map();
    const patron = new RegExp(`^${clave}\\.(reserva|resultado|decision|entrega-reserva|entrega-resultado)-(\\d+)\\.json$`);
    for (const nombre of fs.readdirSync(dir)) {
      const m = patron.exec(nombre);
      if (!m) continue;
      const n = Number(m[2]);
      const tipo = m[1];
      const contenido = leerHecho(path.join(dir, nombre));
      const mapa = tipo.startsWith('entrega') ? entregas : cobros;
      const e = mapa.get(n) ?? {};
      e[tipo.replace('entrega-', '')] = contenido;
      mapa.set(n, e);
    }
    return { cobros, entregas };
  }

  const vencida = (reserva) => typeof reserva?.creada_en === 'number' && ahora() - reserva.creada_en > ttlMs;

  // Lo que dijo quien reconcilio, sin el registro interno.
  const limpio = (decision) => {
    const { clave: _c, intento: _i, decidida_en: _d, ...resto } = decision;
    return resto;
  };

  // El estado del cobro, derivado de los hechos. Nada se escribe aqui.
  function estadoCobro(cobros) {
    const intentos = [...cobros.keys()].sort((a, b) => a - b);
    if (intentos.length === 0) return { estado: 'sin_registro', ultimo: 0 };
    const confirmados = [];
    for (const n of intentos) {
      const h = cobros.get(n);
      const porDecision = typeof h.decision?.tx === 'string' ? limpio(h.decision) : null;
      const porCobro = h.resultado?.ok === true ? h.resultado.resultado : null;
      if (porDecision) confirmados.push({ intento: n, via: 'reconciliado', resultado: porDecision });
      // Si el operador reconcilio con un hash y el cobrador informa otro para el mismo intento, los dos cuentan.
      if (porCobro && (!porDecision || JSON.stringify(porCobro?.tx) !== JSON.stringify(porDecision.tx))) {
        confirmados.push({ intento: n, via: 'cobrado', resultado: porCobro });
      }
    }
    const ultimo = intentos[intentos.length - 1];
    if (confirmados.length >= 2) return { estado: 'conflicto', ultimo, cobros: confirmados };
    if (confirmados.length === 1) {
      // Un intento distinto del confirmado que nadie cerro (sin decision de «no cobrado») pudo haber cobrado tambien.
      const sinCerrar = intentos.filter((n) => n !== confirmados[0].intento && cobros.get(n).decision?.cobrado !== false);
      return {
        estado: 'liquidado',
        ultimo,
        resultado: confirmados[0].resultado,
        sin_cerrar: sinCerrar,
        alerta: sinCerrar.length ? `los intentos ${sinCerrar.join(', ')} no se cerraron como «no cobrado»: pudieron cobrar tambien, y si cobraron sera un conflicto` : null,
      };
    }
    const h = cobros.get(ultimo);
    if (h.decision?.cobrado === false) return { estado: 'libre', ultimo };
    if (h.resultado?.ok === false) return { estado: 'incierto', ultimo, error: h.resultado.error };
    if (!h.resultado && vencida(h.reserva)) {
      return { estado: 'incierto', ultimo, error: 'reserva abandonada: el proceso que cobraba no dejo resultado dentro del plazo; hay que reconciliar con la red' };
    }
    return { estado: 'en_curso', ultimo };
  }

  const salida = (st, clave, nueva) => {
    const base = { estado: st.estado, nueva, clave };
    if (st.estado === 'liquidado') return { ...base, resultado: st.resultado, ...(st.alerta ? { alerta: st.alerta, sin_cerrar: st.sin_cerrar } : {}) };
    if (st.estado === 'conflicto') return { ...base, cobros: st.cobros };
    if (st.estado === 'incierto') return { ...base, error: st.error };
    return base;
  };

  // El dueño de un intento registra su resultado. Si no logra escribirlo, el error lo lleva consigo: el cobro ya ocurrio y no se pierde.
  function registrarResultado(clave, n, contenido) {
    const archivo = path.join(dir, `${clave}.resultado-${n}.json`);
    try {
      crear(archivo, { clave, intento: n, ...contenido, registrado_en: ahora() });
    } catch (causa) {
      const error = new ErrorPagos('el cobro se ejecuto pero su resultado no se pudo registrar: reconciliar con la red', { codigo: 'RESULTADO_NO_REGISTRADO', resultado: contenido, causa });
      PROPIOS.add(error);
      throw error;
    }
  }

  async function liquidar(claveObj, ejecutar) {
    const clave = claveDe(claveObj);
    let st = estadoCobro(hechos(clave).cobros);
    if (st.estado === 'sin_registro' || st.estado === 'libre') {
      const n = st.ultimo + 1;
      if (crear(path.join(dir, `${clave}.reserva-${n}.json`), { clave, intento: n, creada_en: ahora() })) {
        try {
          const resultado = await ejecutar();
          registrarResultado(clave, n, { ok: true, resultado });
        } catch (e) {
          if (PROPIOS.has(e)) throw e;
          registrarResultado(clave, n, { ok: false, error: String(e?.message ?? e) });
        }
        return salida(estadoCobro(hechos(clave).cobros), clave, true);
      }
      st = estadoCobro(hechos(clave).cobros); // otro llego primero
    }
    return salida(st, clave, false);
  }

  // Reconcilia un intento contra la red: o se cobro (`tx`) o se confirmo que no (`cobrado: false`). Por defecto, el ultimo
  // intento de un pago incierto; con `{ intento }`, un intento anterior que quedo sin cerrar aunque otro ya este confirmado.
  async function resolver(claveObj, decision, { intento = null } = {}) {
    const clave = claveDe(claveObj);
    const cobrado = typeof decision?.tx === 'string' && decision.tx.length > 0;
    const noCobrado = decision?.cobrado === false;
    if (!cobrado && !noCobrado) throw new ErrorPagos('resolver necesita {tx: ...} si se cobro o {cobrado: false} si la red confirma que no');
    const { cobros } = hechos(clave);
    const st = estadoCobro(cobros);
    if (st.estado === 'sin_registro') throw new ErrorPagos('el pago no existe en la tabla');
    let n;
    if (intento !== null) {
      const h = cobros.get(intento);
      if (!h) throw new ErrorPagos(`el intento ${intento} no existe`);
      if (h.decision) throw new ErrorPagos(`el intento ${intento} ya se reconcilio`);
      if (h.resultado?.ok === true) throw new ErrorPagos(`el intento ${intento} ya esta liquidado: no se reescribe`);
      n = intento;
    } else {
      if (st.estado === 'liquidado') throw new ErrorPagos('el pago ya esta liquidado: no se reescribe');
      if (st.estado === 'conflicto') throw new ErrorPagos('el pago esta en conflicto (dos cobros confirmados): lo decide una persona, no se reconcilia solo');
      if (st.estado !== 'incierto') throw new ErrorPagos(`solo se resuelve un pago incierto, y este esta ${st.estado}`);
      n = st.ultimo;
    }
    if (!crear(path.join(dir, `${clave}.decision-${n}.json`), { clave, intento: n, ...decision, decidida_en: ahora() })) throw new ErrorPagos('el pago ya se reconcilio por otro lado');
    const despues = estadoCobro(hechos(clave).cobros);
    if (despues.estado === 'libre') return { estado: 'libre', clave };
    if (despues.estado === 'conflicto') return { estado: 'conflicto', cobros: despues.cobros, clave };
    return { estado: despues.estado, resultado: despues.resultado, clave, ...(despues.alerta ? { alerta: despues.alerta, sin_cerrar: despues.sin_cerrar } : {}) };
  }

  // Entrega el servicio de un pago liquidado. Su registro es aparte del del cobro: una entrega fallida no toca lo cobrado.
  async function entregar(claveObj, ejecutar) {
    const clave = claveDe(claveObj);
    const { cobros, entregas } = hechos(clave);
    const st = estadoCobro(cobros);
    if (st.estado !== 'liquidado') throw new ErrorPagos(`solo se entrega un pago liquidado, y este esta ${st.estado}`);
    const ya = [...entregas.entries()].find(([, e]) => e.resultado?.ok === true);
    if (ya) return { estado: 'entregado', nueva: false, resultado: ya[1].resultado.resultado, clave };
    const intentos = [...entregas.keys()].sort((a, b) => a - b);
    const ultimo = intentos[intentos.length - 1] ?? 0;
    const e = entregas.get(ultimo);
    if (e && !e.resultado && !vencida(e.reserva)) return { estado: 'entrega_en_curso', nueva: false, clave };
    const n = ultimo + 1;
    if (!crear(path.join(dir, `${clave}.entrega-reserva-${n}.json`), { clave, intento: n, creada_en: ahora() })) {
      return { estado: 'entrega_en_curso', nueva: false, clave };
    }
    let resultado;
    let fallo = null;
    try {
      resultado = await ejecutar();
    } catch (causa) {
      fallo = String(causa?.message ?? causa);
    }
    // Registrar el resultado va fuera del try de `ejecutar`: un fallo al escribir no se confunde con un fallo de la entrega.
    if (fallo === null) {
      crear(path.join(dir, `${clave}.entrega-resultado-${n}.json`), { clave, intento: n, ok: true, resultado, registrado_en: ahora() });
      return { estado: 'entregado', nueva: true, resultado, clave };
    }
    crear(path.join(dir, `${clave}.entrega-resultado-${n}.json`), { clave, intento: n, ok: false, error: fallo, registrado_en: ahora() });
    return { estado: 'entrega_pendiente', nueva: true, error: fallo, clave };
  }

  return { liquidar, resolver, entregar };
}

module.exports = { ErrorPagos, abrirTablaPagos, claveDe };
