'use strict';

// TEMIS-CF-1: forma canonica. Ver tramos/1/forma-canonica.md.
//
// Entrada: texto JSON leido con un lector propio y estricto (no JSON.parse).
// Salida: texto sin espacios en blanco, claves ordenadas por sus bytes UTF-8,
// enteros en el rango int64, cadenas en NFC, digest SHA-256 en 64 hex.

const { createHash } = require('node:crypto');

const INT64_MIN = -(2n ** 63n);
const INT64_MAX = 2n ** 63n - 1n;
const SIN_ASIGNAR = /\p{Cn}/u;
const ESPACIO = new Set([0x20, 0x09, 0x0a, 0x0d]);
const HEX4 = /^[0-9a-fA-F]{4}$/;

class ErrorCF1 extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorCF1';
  }
}

function fallar(mensaje) {
  throw new ErrorCF1(mensaje);
}

// Lector estricto. Un solo valor por llamada; sin coma final, sin comentarios,
// sin BOM, sin texto sobrante, sin control sin escapar, sin claves duplicadas.
class Lector {
  constructor(texto) {
    if (typeof texto !== 'string') fallar('la entrada debe ser texto');
    this.texto = texto;
    this.pos = 0;
    if (this.texto.charCodeAt(0) === 0xfeff) fallar('BOM al inicio');
  }

  fin() {
    return this.pos >= this.texto.length;
  }

  actual() {
    return this.pos < this.texto.length ? this.texto[this.pos] : undefined;
  }

  saltarEspacios() {
    while (this.pos < this.texto.length && ESPACIO.has(this.texto.charCodeAt(this.pos))) this.pos += 1;
  }

  donde() {
    return `en la posicion ${this.pos}`;
  }

  esperar(caracter) {
    this.saltarEspacios();
    if (this.actual() !== caracter) fallar(`se esperaba ${JSON.stringify(caracter)} ${this.donde()}`);
    this.pos += 1;
  }

  valor() {
    this.saltarEspacios();
    const c = this.actual();
    if (c === undefined) fallar(`falta un valor ${this.donde()}`);
    if (c === '{') return this.objeto();
    if (c === '[') return this.arreglo();
    if (c === '"') return this.cadena();
    if (c === '-' || (c >= '0' && c <= '9')) return this.numero();
    if (this.texto.startsWith('true', this.pos)) { this.pos += 4; return true; }
    if (this.texto.startsWith('false', this.pos)) { this.pos += 5; return false; }
    if (this.texto.startsWith('null', this.pos)) { this.pos += 4; return null; }
    fallar(`caracter inesperado ${JSON.stringify(c)} ${this.donde()}`);
    return undefined;
  }

  objeto() {
    this.pos += 1;
    const salida = {};
    const vistas = new Set();
    this.saltarEspacios();
    if (this.actual() === '}') { this.pos += 1; return salida; }
    for (;;) {
      this.saltarEspacios();
      if (this.actual() !== '"') fallar(`se esperaba una clave entre comillas ${this.donde()}`);
      const clave = this.cadena();
      if (vistas.has(clave)) fallar(`clave duplicada ${JSON.stringify(clave)}`);
      vistas.add(clave);
      this.esperar(':');
      const valor = this.valor();
      // defineProperty y no asignacion: '__proto__' debe ser una clave propia.
      Object.defineProperty(salida, clave, {
        value: valor, enumerable: true, writable: true, configurable: true,
      });
      this.saltarEspacios();
      const c = this.actual();
      if (c === ',') { this.pos += 1; continue; }
      if (c === '}') { this.pos += 1; return salida; }
      fallar(`se esperaba ',' o '}' ${this.donde()}`);
    }
  }

  arreglo() {
    this.pos += 1;
    const salida = [];
    this.saltarEspacios();
    if (this.actual() === ']') { this.pos += 1; return salida; }
    for (;;) {
      salida.push(this.valor());
      this.saltarEspacios();
      const c = this.actual();
      if (c === ',') { this.pos += 1; continue; }
      if (c === ']') { this.pos += 1; return salida; }
      fallar(`se esperaba ',' o ']' ${this.donde()}`);
    }
  }

  numero() {
    const inicio = this.pos;
    if (this.actual() === '-') this.pos += 1;
    const c = this.actual();
    if (c === '0') {
      this.pos += 1;
      const siguiente = this.actual();
      if (siguiente >= '0' && siguiente <= '9') fallar(`cero a la izquierda ${this.donde()}`);
    } else if (c >= '1' && c <= '9') {
      while (this.actual() >= '0' && this.actual() <= '9') this.pos += 1;
    } else {
      fallar(`numero mal formado ${this.donde()}`);
    }
    const siguiente = this.actual();
    if (siguiente === '.' || siguiente === 'e' || siguiente === 'E') {
      fallar(`no se admiten fracciones ni exponentes ${this.donde()}`);
    }
    const entero = BigInt(this.texto.slice(inicio, this.pos));
    if (entero === 0n && this.texto[inicio] === '-') fallar('menos cero');
    if (entero < INT64_MIN || entero > INT64_MAX) fallar(`entero fuera de int64: ${entero}`);
    return entero;
  }

  cadena() {
    this.pos += 1;
    let salida = '';
    for (;;) {
      if (this.pos >= this.texto.length) fallar('cadena sin cerrar');
      const c = this.actual();
      if (c === '"') { this.pos += 1; break; }
      if (c === '\\') { salida += this.escape(); continue; }
      const cc = this.texto.charCodeAt(this.pos);
      if (cc < 0x20) fallar(`caracter de control sin escapar ${this.donde()}`);
      if (cc >= 0xd800 && cc <= 0xdbff) {
        const baja = this.texto.charCodeAt(this.pos + 1);
        if (!(baja >= 0xdc00 && baja <= 0xdfff)) fallar(`sustituto suelto ${this.donde()}`);
        salida += c + this.texto[this.pos + 1];
        this.pos += 2;
        continue;
      }
      if (cc >= 0xdc00 && cc <= 0xdfff) fallar(`sustituto suelto ${this.donde()}`);
      salida += c;
      this.pos += 1;
    }
    return revisarCadena(salida);
  }

  escape() {
    this.pos += 1;
    const e = this.actual();
    const corto = {
      '"': '"', '\\': '\\', '/': '/',
      b: '\b', f: '\f', n: '\n', r: '\r', t: '\t',
    };
    if (Object.prototype.hasOwnProperty.call(corto, e)) {
      this.pos += 1;
      return corto[e];
    }
    if (e !== 'u') fallar(`escape desconocido ${JSON.stringify('\\' + (e === undefined ? '' : e))} ${this.donde()}`);
    this.pos += 1;
    const alto = this.texto.slice(this.pos, this.pos + 4);
    if (!HEX4.test(alto)) fallar(`escape \\u incompleto ${this.donde()}`);
    this.pos += 4;
    const unidad = parseInt(alto, 16);
    if (unidad >= 0xdc00 && unidad <= 0xdfff) fallar(`sustituto suelto ${this.donde()}`);
    if (unidad < 0xd800 || unidad > 0xdbff) return String.fromCharCode(unidad);
    if (this.actual() !== '\\' || this.texto[this.pos + 1] !== 'u') fallar(`sustituto suelto ${this.donde()}`);
    const bajo = this.texto.slice(this.pos + 2, this.pos + 6);
    if (!HEX4.test(bajo)) fallar(`sustituto suelto ${this.donde()}`);
    const unidadBaja = parseInt(bajo, 16);
    if (unidadBaja < 0xdc00 || unidadBaja > 0xdfff) fallar(`sustituto suelto ${this.donde()}`);
    this.pos += 6;
    return String.fromCharCode(unidad, unidadBaja);
  }
}

// Toda cadena (de texto o de memoria) pasa por aqui: sin sustituto suelto,
// sin punto de codigo sin asignar, en NFC.
function revisarCadena(texto) {
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto.charCodeAt(i);
    if (c < 0xd800 || c > 0xdfff) continue;
    const baja = texto.charCodeAt(i + 1);
    if (c >= 0xdc00 || !(baja >= 0xdc00 && baja <= 0xdfff)) {
      fallar('sustituto suelto en una cadena');
    }
    i += 1;
  }
  const nfc = texto.normalize('NFC');
  if (SIN_ASIGNAR.test(nfc)) fallar('punto de codigo sin asignar');
  return nfc;
}

// Salida de cadena: solo se escapan '"', '\\' y los controles U+0000-U+001F.
function escribirCadena(texto) {
  let salida = '"';
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto.codePointAt(i);
    if (c === 0x22) salida += '\\"';
    else if (c === 0x5c) salida += '\\\\';
    else if (c === 0x08) salida += '\\b';
    else if (c === 0x09) salida += '\\t';
    else if (c === 0x0a) salida += '\\n';
    else if (c === 0x0c) salida += '\\f';
    else if (c === 0x0d) salida += '\\r';
    else if (c < 0x20) salida += `\\u${c.toString(16).padStart(4, '0')}`;
    else { salida += String.fromCodePoint(c); if (c > 0xffff) i += 1; }
  }
  return `${salida}"`;
}

function enteroCanonico(valor) {
  if (typeof valor === 'bigint') {
    if (valor < INT64_MIN || valor > INT64_MAX) fallar(`entero fuera de int64: ${valor}`);
    return valor.toString();
  }
  if (typeof valor === 'number') {
    if (!Number.isSafeInteger(valor)) fallar(`no es un entero seguro: ${valor}`);
    if (Object.is(valor, -0)) fallar('menos cero');
    return String(valor);
  }
  return fallar(`no es un entero: ${typeof valor}`);
}

function canonicalizar(valor) {
  if (valor === null) return 'null';
  const tipo = typeof valor;
  if (tipo === 'boolean') return valor ? 'true' : 'false';
  if (tipo === 'bigint' || tipo === 'number') return enteroCanonico(valor);
  if (tipo === 'string') return escribirCadena(revisarCadena(valor));
  if (Array.isArray(valor)) return `[${valor.map((v) => canonicalizar(v)).join(',')}]`;
  if (tipo === 'object') {
    const proto = Object.getPrototypeOf(valor);
    if (proto !== Object.prototype && proto !== null) {
      fallar('los objetos deben tener prototipo normal o nulo');
    }
    const vistas = new Set();
    const entradas = Object.keys(valor).map((clave) => {
      const normalizada = revisarCadena(clave);
      if (vistas.has(normalizada)) fallar(`clave duplicada ${JSON.stringify(normalizada)}`);
      vistas.add(normalizada);
      return { propia: clave, clave: normalizada };
    });
    entradas.sort((a, b) => Buffer.compare(Buffer.from(a.clave, 'utf8'), Buffer.from(b.clave, 'utf8')));
    const cuerpo = entradas.map(({ propia, clave }) => `${escribirCadena(clave)}:${canonicalizar(valor[propia])}`);
    return `{${cuerpo.join(',')}}`;
  }
  return fallar(`tipo no admitido: ${tipo}`);
}

function parseTexto(texto) {
  const lector = new Lector(texto);
  const valor = lector.valor();
  lector.saltarEspacios();
  if (lector.fin()) return valor;
  return fallar(`texto sobrante en la posicion ${lector.pos}`);
}

function bytesCanonicosDeTexto(texto) {
  return Buffer.from(canonicalizar(parseTexto(texto)), 'utf8');
}

function digestDeTexto(texto) {
  return createHash('sha256').update(bytesCanonicosDeTexto(texto)).digest('hex');
}

function digest(valor) {
  return createHash('sha256').update(Buffer.from(canonicalizar(valor), 'utf8')).digest('hex');
}

module.exports = {
  ErrorCF1,
  parseTexto,
  canonicalizar,
  bytesCanonicosDeTexto,
  digestDeTexto,
  digest,
};