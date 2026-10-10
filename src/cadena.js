'use strict';

// TEMIS-CF-1, capa de cadena: lineas, first-write-wins y reconstruccion por un
// tercero. Ver tramos/2/cadena.md.

const cf = require('./canonical.js');
const f = require('./firma.js');

class ErrorCadena extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorCadena';
  }
}

function fallar(mensaje) {
  throw new ErrorCadena(mensaje);
}

const EVENTOS = new Set([
  'acuerdo', 'hito_abierto', 'declaracion', 'contraste',
  'cierre', 'anulacion', 'incumplimiento', 'controversia',
]);
const ACCIONES = new Set(['aceptar', 'impugnar']);
const RESULTADOS = new Set(['cumplido', 'cumplido_no_confirmado']);
const HEX64 = /^[0-9a-f]{64}$/;
const CUENTA = /^G[A-Z2-7]{55}$/;
const INT64_MAX = 2n ** 63n - 1n;

function esTexto(valor) {
  return typeof valor === 'string' && valor.length > 0;
}

function esObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function esDigest(valor) {
  return typeof valor === 'string' && HEX64.test(valor);
}

function definir(objeto, clave, valor) {
  Object.defineProperty(objeto, clave, { value: valor, enumerable: true, writable: true, configurable: true });
  return objeto;
}

// --- la linea --------------------------------------------------------------

function versionDe(version) {
  if (typeof version === 'bigint') {
    if (version < 1n || version > INT64_MAX) fallar('version debe ser un entero >= 1');
    return version;
  }
  if (typeof version === 'number') {
    if (!Number.isSafeInteger(version) || version < 1) fallar('version debe ser un entero >= 1');
    return version;
  }
  return fallar('version debe ser un entero >= 1');
}

function construirLinea(argumento) {
  if (!esObjeto(argumento)) fallar('se esperaba un objeto de linea');
  const { expediente_id, hito, version, evento, anterior, contenido, anula } = argumento;
  if (!esTexto(expediente_id)) fallar('expediente_id debe ser una cadena no vacia');
  if (hito !== null && !esTexto(hito)) fallar('hito debe ser null o una cadena no vacia');
  if (!esTexto(evento) || !EVENTOS.has(evento)) fallar(`evento desconocido: ${String(evento)}`);
  if (!esObjeto(contenido)) fallar('contenido debe ser un objeto');
  if (anterior !== null && !esDigest(anterior)) fallar('anterior debe ser null o un digest de 64 hex minuscula');
  if (anula !== null && !esDigest(anula)) fallar('anula debe ser null o un digest de 64 hex minuscula');
  return {
    forma: 'TEMIS-CF-1',
    tipo: hito === null ? 'expediente' : 'hito',
    expediente_id,
    hito,
    version: versionDe(version),
    evento,
    anterior,
    contenido,
    anula,
  };
}

// Un cuerpo del archivo no es de fiar por venir en el archivo: reconstruir vuelve a comprobar su forma.
function versionValida(version) {
  if (typeof version === 'bigint') return version >= 1n && version <= INT64_MAX;
  if (typeof version === 'number') return Number.isSafeInteger(version) && version >= 1;
  return false;
}

function cuerpoValido(c) {
  if (!esObjeto(c) || c.forma !== 'TEMIS-CF-1') return false;
  if (!esTexto(c.expediente_id) || !EVENTOS.has(c.evento)) return false;
  if (c.hito !== null && !esTexto(c.hito)) return false;
  if (c.tipo !== (c.hito === null ? 'expediente' : 'hito')) return false;
  if (!versionValida(c.version)) return false;
  if (c.anterior !== null && !esDigest(c.anterior)) return false;
  if (c.anula !== null && !esDigest(c.anula)) return false;
  if (!esObjeto(c.contenido)) return false;
  // Lo que cada evento necesita para tener sentido. Que un contraste apunte a la declaracion vigente es otra cosa
  // (contraste_sin_objetivo): aqui solo se pide que diga quien responde y que.
  const k = c.contenido;
  if (c.evento === 'declaracion') return esTexto(k.parte);
  if (c.evento === 'contraste') return esTexto(k.parte) && ACCIONES.has(k.accion);
  if (c.evento === 'cierre') return RESULTADOS.has(k.resultado);
  return true;
}

// --- el archivo ------------------------------------------------------------

function digestDe(cuerpo) {
  try {
    return cf.digest(cuerpo);
  } catch {
    return null;
  }
}

function indiceArchivo(archivo) {
  const indice = new Map();
  for (const entrada of archivo) {
    if (!esObjeto(entrada) || !esTexto(entrada.digest)) continue;
    if (!indice.has(entrada.digest)) indice.set(entrada.digest, []);
    indice.get(entrada.digest).push(entrada);
  }
  return indice;
}

function digestDeEntrada(entrada) {
  if (!esObjeto(entrada)) return null;
  if (esTexto(entrada.digest)) return entrada.digest;
  return digestDe(entrada.cuerpo);
}

// Claves publicas que firman el sobre del cuerpo. null si el sobre no existe.
function firmantesValidos(cuerpo, firmas) {
  let sobre;
  try {
    sobre = f.sobreDeFirma(cuerpo);
  } catch {
    return null;
  }
  const claves = new Set();
  for (const s of firmas) {
    if (!esObjeto(s)) continue;
    if (typeof s.clave_publica !== 'string' || typeof s.firma !== 'string') continue;
    if (claves.has(s.clave_publica)) continue;
    if (f.verificar(s.clave_publica, sobre, s.firma).ok) claves.add(s.clave_publica);
  }
  return claves;
}

function firmada(firmados, clave) {
  return esTexto(clave) && firmados.has(clave);
}

// Lo que el acuerdo declara. null si no declara dos partes con claves distintas.
function acuerdoDe(contenido) {
  if (!Array.isArray(contenido.partes) || contenido.partes.length !== 2) return null;
  const partes = [];
  const porId = new Map();
  const claves = new Set();
  for (const p of contenido.partes) {
    if (!esObjeto(p) || !esTexto(p.clave_publica)) return null;
    partes.push({ ...p });
    claves.add(p.clave_publica);
    if (esTexto(p.id)) porId.set(p.id, p.clave_publica);
  }
  if (claves.size !== 2) return null;
  if (typeof contenido.cuenta_ancla !== 'string' || !CUENTA.test(contenido.cuenta_ancla)) return null;
  return {
    partes,
    operador: esTexto(contenido.operador) ? contenido.operador : null,
    cuentaAncla: contenido.cuenta_ancla,
    porId,
    claves,
  };
}

function claveDeParte(acuerdo, id) {
  if (!esTexto(id) || !acuerdo.porId.has(id)) return null;
  return acuerdo.porId.get(id);
}

// --- el libro --------------------------------------------------------------

function comparable(a, b) {
  if (a === b) return 0;
  const na = typeof a === 'bigint' ? a : Number(a);
  const nb = typeof b === 'bigint' ? b : Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na < nb ? -1 : 1;
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : 1;
  return 0;
}

function transaccionesDel(libro) {
  return libro
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => esObjeto(t) && t.exito === true && t.memo !== null && t.memo !== undefined)
    .sort((a, b) => comparable(a.t.ledger, b.t.ledger) || comparable(a.t.indice, b.t.indice) || a.i - b.i)
    .map(({ t }) => t);
}

// --- reconstruccion --------------------------------------------------------

function reconstruir(argumento) {
  if (!esObjeto(argumento)) fallar('se esperaba { libro, archivo }');
  const { libro, archivo } = argumento;
  if (!Array.isArray(libro)) fallar('libro debe ser una lista de transacciones');
  if (!Array.isArray(archivo)) fallar('archivo debe ser una lista de entradas');

  const indice = indiceArchivo(archivo);
  const acordados = new Map();
  const cadenas = new Map();
  const ganadoras = new Map();
  const hitosDe = new Map();
  const porDigest = new Map();
  const lineas = [];

  function listaDe(exp, hito) {
    const porHito = hitosDe.get(exp);
    if (porHito === undefined) return null;
    return porHito.get(hito) || null;
  }

  function declaracionVigente(exp, hito) {
    const lista = listaDe(exp, hito);
    if (lista === null) return null;
    for (let i = lista.length - 1; i >= 0; i -= 1) {
      if (!lista[i].anulada && lista[i].evento === 'declaracion') return lista[i];
    }
    return null;
  }

  function contrastesDe(exp, hito, digestDeclaracion) {
    const lista = listaDe(exp, hito);
    if (lista === null) return [];
    return lista.filter((r) => !r.anulada && r.evento === 'contraste' && r.contenido.declaracion === digestDeclaracion);
  }

  function firmaExigida(evento, contenido, acuerdo, firmados, exp, hito) {
    if (acuerdo === null) return false;
    if (evento === 'acuerdo') {
      const claves = acuerdo.partes.map((p) => p.clave_publica);
      return claves.every((k) => firmados.has(k));
    }
    if (evento === 'hito_abierto' || evento === 'cierre' || evento === 'incumplimiento') {
      return firmada(firmados, acuerdo.operador);
    }
    if (evento === 'declaracion') {
      const clave = claveDeParte(acuerdo, contenido.parte);
      return clave !== null && firmada(firmados, clave);
    }
    if (evento === 'contraste') {
      if (!ACCIONES.has(contenido.accion)) return false;
      const clave = claveDeParte(acuerdo, contenido.parte);
      if (clave === null || !firmada(firmados, clave)) return false;
      // Que apunte a la declaracion vigente se decide aparte (contraste_sin_objetivo); aqui, que no la haga la misma parte.
      const declaracion = declaracionVigente(exp, hito);
      return declaracion === null || declaracion.contenido.parte !== contenido.parte;
    }
    if (evento === 'controversia') {
      return [...firmados].some((k) => acuerdo.claves.has(k));
    }
    return [...firmados].some((k) => acuerdo.claves.has(k) || k === acuerdo.operador);
  }

  // La cadena de un expediente son las lineas que aceptó. Una linea cita como anterior cualquiera de ellas, no
  // necesariamente la ultima: el operador decide el orden del libro, y si cada linea de una parte dependiera de la
  // ultima de todas, intercalar una linea ajena bastaria para dejarla fuera de cadena.
  // Quien puede anular una linea: quien debia firmarla.
  function autoresDe(evento, contenido, acuerdo, firmados) {
    if (evento === 'declaracion' || evento === 'contraste') {
      const clave = claveDeParte(acuerdo, contenido.parte);
      return new Set(clave === null ? [] : [clave]);
    }
    if (evento === 'controversia') return new Set([...firmados].filter((k) => acuerdo.claves.has(k)));
    if (evento === 'hito_abierto' || evento === 'cierre' || evento === 'incumplimiento') {
      return new Set(acuerdo.operador === null ? [] : [acuerdo.operador]);
    }
    return new Set();
  }

  function enCadena(exp, esAcuerdo, anterior) {
    const aceptadas = cadenas.get(exp);
    if (esAcuerdo) return anterior === null && aceptadas === undefined;
    return esDigest(anterior) && aceptadas !== undefined && aceptadas.has(anterior);
  }

  // Un cierre se apoya en la declaracion vigente y en lo que las partes respondieron *a esa declaracion*:
  // cumplido pide una aceptacion y ninguna impugnacion; cumplido_no_confirmado pide que no haya respuesta.
  function cierreConRespaldo(contenido, exp, hito) {
    const resultado = contenido.resultado;
    if (!RESULTADOS.has(resultado)) return false;
    const declaracion = declaracionVigente(exp, hito);
    if (declaracion === null) return false;
    const respuestas = contrastesDe(exp, hito, declaracion.digest);
    if (resultado === 'cumplido') {
      return respuestas.some((r) => r.contenido.accion === 'aceptar') && !respuestas.some((r) => r.contenido.accion === 'impugnar');
    }
    return respuestas.length === 0;
  }

  function objetivoAnulable(objetivo, exp, hito, firmados) {
    if (!esDigest(objetivo)) return false;
    const victima = porDigest.get(objetivo);
    if (victima === undefined) return false;
    if (victima.exp !== exp || victima.hito !== hito) return false;
    if (victima.evento === 'acuerdo' || victima.evento === 'anulacion') return false;
    if (victima.item.estatus !== 'vigente') return false;
    // Solo el autor de una linea la anula: una parte no anula lo de la otra, ni el operador lo de una parte.
    return [...victima.autores].some((k) => firmados.has(k));
  }

  function anular(objetivo, exp, hito) {
    if (!esDigest(objetivo)) return;
    const victima = porDigest.get(objetivo);
    if (victima === undefined) return;
    if (victima.exp !== exp || victima.hito !== hito) return;
    if (victima.item.estatus !== 'vigente') return;
    victima.item.estatus = 'anulada';
    if (victima.registro !== null) victima.registro.anulada = true;
  }

  for (const tx of transaccionesDel(libro)) {
    const digest = tx.memo;
    const item = { digest, estatus: 'sin_cuerpo', hash: tx.hash, ledger: tx.ledger };
    lineas.push(item);

    const candidatas = indice.has(digest) ? indice.get(digest) : [];
    if (candidatas.length === 0) continue;
    const entrada = candidatas.find((e) => digestDe(e.cuerpo) === digest);
    if (entrada === undefined) {
      item.estatus = 'digest_no_coincide';
      continue;
    }

    const cuerpo = entrada.cuerpo;
    if (!cuerpoValido(cuerpo)) {
      item.estatus = 'cuerpo_invalido';
      continue;
    }
    const contenido = cuerpo.contenido;
    const evento = cuerpo.evento;
    const hito = cuerpo.hito;
    const exp = cuerpo.expediente_id;
    const esAcuerdo = evento === 'acuerdo';

    if (!esAcuerdo && !acordados.has(exp)) {
      item.estatus = 'sin_acuerdo';
      continue;
    }

    const acuerdo = esAcuerdo ? acuerdoDe(contenido) : acordados.get(exp);
    if (acuerdo === null) {
      item.estatus = 'cuerpo_invalido';
      continue;
    }
    // Solo cuenta lo que se ancló desde la cuenta que las partes firmaron en el acuerdo.
    if (tx.fuente !== acuerdo.cuentaAncla) {
      item.estatus = 'cuenta_no_autorizada';
      continue;
    }
    const firmas = Array.isArray(entrada.firmas) ? entrada.firmas : [];
    const firmados = firmantesValidos(cuerpo, firmas);
    if (firmados === null || !firmaExigida(evento, contenido, acuerdo, firmados, exp, hito)) {
      item.estatus = evento === 'anulacion' ? 'anulacion_no_valida' : 'firmas_insuficientes';
      continue;
    }

    // Una anulacion solo vale si apunta a una linea vigente del mismo expediente y hito que no sea ni el acuerdo
    // ni otra anulacion: anular el acuerdo dejaria un expediente acordado con su linea anulada, y anular una
    // anulacion reabriria lo que una correccion nunca reabre.
    if (evento === 'anulacion' && !objetivoAnulable(cuerpo.anula, exp, hito, firmados)) {
      item.estatus = 'anulacion_no_valida';
      continue;
    }

    // Un contraste apunta a la declaracion vigente del hito, no a cualquiera.
    if (evento === 'contraste') {
      const objetivo = declaracionVigente(exp, hito);
      if (objetivo === null || contenido.declaracion !== objetivo.digest) {
        item.estatus = 'contraste_sin_objetivo';
        continue;
      }
    }

    // first-write-wins: la clave ya ganada por una vigente anterior, aunque
    // esa vigente haya sido anulada despues. Se decide antes que la cadena.
    const clave = `${exp}\u0000${hito}\u0000${String(cuerpo.version)}\u0000${evento}`;
    if (ganadoras.has(clave)) {
      item.estatus = 'perdedora';
      continue;
    }
    if (!enCadena(exp, esAcuerdo, cuerpo.anterior)) {
      item.estatus = 'fuera_de_cadena';
      continue;
    }
    if (evento === 'cierre' && !cierreConRespaldo(contenido, exp, hito)) {
      item.estatus = 'cierre_sin_respaldo';
      continue;
    }

    item.estatus = 'vigente';
    if (!cadenas.has(exp)) cadenas.set(exp, new Set());
    cadenas.get(exp).add(digest);
    ganadoras.set(clave, digest);

    let registro = null;
    if (esAcuerdo) {
      acordados.set(exp, acuerdo);
    } else if (hito !== null) {
      const porHito = hitosDe.has(exp) ? hitosDe.get(exp) : new Map();
      const lista = porHito.has(hito) ? porHito.get(hito) : [];
      registro = { digest, evento, contenido, anulada: false };
      lista.push(registro);
      porHito.set(hito, lista);
      hitosDe.set(exp, porHito);
    }
    porDigest.set(digest, { item, registro, exp, hito, evento, autores: autoresDe(evento, contenido, acuerdo, firmados) });

    if (evento === 'anulacion') anular(cuerpo.anula, exp, hito);
  }

  const expedientes = {};
  for (const [exp, acuerdo] of acordados) {
    const hitos = {};
    const porHito = hitosDe.get(exp);
    if (porHito !== undefined) {
      for (const [hito, lista] of porHito) {
        const estado = estadoDeHito(lista);
        if (estado !== null) definir(hitos, hito, { estado });
      }
    }
    definir(expedientes, exp, { estado: 'acordado', partes: acuerdo.partes, operador: acuerdo.operador, hitos });
  }

  return { expedientes, lineas };
}

function estadoDeHito(lista) {
  const vivos = lista.filter((r) => !r.anulada);
  if (!vivos.some((r) => r.evento === 'hito_abierto')) return null;
  // Un cierre respaldado por las partes gana sobre un incumplimiento que solo firma el operador.
  const cierres = vivos.filter((r) => r.evento === 'cierre' && RESULTADOS.has(r.contenido.resultado));
  if (cierres.length > 0) return cierres[cierres.length - 1].contenido.resultado;
  if (vivos.some((r) => r.evento === 'incumplimiento')) return 'incumplido';
  const declaraciones = vivos.filter((r) => r.evento === 'declaracion');
  if (declaraciones.length === 0) return 'abierto';
  const vigente = declaraciones[declaraciones.length - 1];
  const respuestas = vivos.filter((r) => r.evento === 'contraste' && r.contenido.declaracion === vigente.digest);
  if (respuestas.some((r) => r.contenido.accion === 'impugnar')) return 'impugnado';
  if (respuestas.some((r) => r.contenido.accion === 'aceptar')) return 'acordado';
  return 'declarado_por_una_parte';
}

// --- cotejo con la copia de una parte ---------------------------------------

// Compara lo anclado con la copia de una parte. La copia puede ser el mismo archivo con que se reconstruyo o
// otro: una linea anclada cuyo cuerpo no esta en la copia es una diferencia aunque la reconstruccion la haya
// dejado sin_cuerpo, y un cuerpo cuyo digest no es el que la copia declara tambien lo es.
function compararConCopia(reconstruccion, copia) {
  if (!esObjeto(reconstruccion) || !Array.isArray(reconstruccion.lineas)) {
    fallar('se esperaba el resultado de reconstruir');
  }
  if (!Array.isArray(copia)) fallar('la copia debe ser una lista de entradas');

  const enCopia = new Map();
  for (const entrada of copia) {
    const declarado = digestDeEntrada(entrada);
    if (declarado === null) continue;
    const alterado = esObjeto(entrada) && entrada.cuerpo !== undefined && digestDe(entrada.cuerpo) !== declarado;
    if (!enCopia.has(declarado) || alterado) enCopia.set(declarado, { alterado });
  }

  const diferencias = [];
  const enHistorial = new Set();
  for (const linea of reconstruccion.lineas) {
    if (!esObjeto(linea) || !esTexto(linea.digest)) continue;
    if (enHistorial.has(linea.digest)) continue;
    enHistorial.add(linea.digest);
    const presente = enCopia.get(linea.digest);
    if (presente === undefined) diferencias.push({ digest: linea.digest, tipo: 'falta_en_la_copia' });
    else if (presente.alterado) diferencias.push({ digest: linea.digest, tipo: 'cuerpo_alterado' });
  }
  for (const digest of enCopia.keys()) {
    if (!enHistorial.has(digest)) diferencias.push({ digest, tipo: 'falta_en_el_historial' });
  }
  diferencias.sort((x, y) => comparable(x.digest, y.digest) || comparable(x.tipo, y.tipo));
  return { coincide: diferencias.length === 0, diferencias };
}

module.exports = {
  ErrorCadena,
  construirLinea,
  reconstruir,
  compararConCopia,
};