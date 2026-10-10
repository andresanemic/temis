'use strict';
// Genera vectores/cf1.json SIN usar src/: las salidas esperadas son cadenas literales y el digest es sha256 sobre ellas.
// Si src/canonical.js y este archivo discrepan, uno de los dos esta mal; este es el arbitro.
// Este archivo se escribe con escapes explicitos (\\ y \u) y no por un heredoc de shell, que des-escapa las barras.
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const sha = (s) => createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex');

const positivos = [
  {
    nombre: 'V1 basico: claves en orden inverso, entero negativo, booleano, null, arreglo anidado, escapes',
    texto: '{"zeta":[3,{"b":true,"a":null}],"alfa":-12,"mid":"x\\ty\\"z\\\\"}',
    canonico: '{"alfa":-12,"mid":"x\\ty\\"z\\\\","zeta":[3,{"a":null,"b":true}]}',
  },
  {
    nombre: 'V2 discriminante: NFD frente a NFC, y orden por bytes UTF-8 frente a unidades UTF-16 (U+E000 antes que U+10000)',
    texto: '{"\\uE000":1,"\\ud800\\udc00":2,"cafe\\u0301":3}',
    canonico: '{"café":3,"":1,"\u{10000}":2}',
  },
  {
    nombre: 'V3 limites int64 y espacios de entrada que se descartan',
    texto: ' { "max" : 9223372036854775807 , "min" : -9223372036854775808 , "cero" : 0 } ',
    canonico: '{"cero":0,"max":9223372036854775807,"min":-9223372036854775808}',
  },
  {
    nombre: 'V4 escapes de control y solidus: u0001 en minuscula, solidus de entrada sin escapar a la salida, DEL y U+2028 literales',
    texto: '{"a":"\\u0001\\/\\u007f\\u2028"}',
    canonico: '{"a":"\\u0001/\u007f "}',
  },
].map((v) => ({ ...v, canonicoHex: Buffer.from(v.canonico, 'utf8').toString('hex'), digest: sha(v.canonico) }));

const negativos = [
  ['clave duplicada', '{"a":1,"a":2}'],
  ['clave duplicada tras NFC', '{"\\u00e9":1,"e\\u0301":2}'],
  ['fraccion', '{"a":1.5}'],
  ['uno punto cero', '{"a":1.0}'],
  ['exponente minuscula', '{"a":1e3}'],
  ['exponente mayuscula', '{"a":1E3}'],
  ['menos cero', '{"a":-0}'],
  ['mas explicito', '{"a":+1}'],
  ['cero a la izquierda', '{"a":01}'],
  ['NaN', '{"a":NaN}'],
  ['Infinity', '{"a":Infinity}'],
  ['sustituto suelto alto', '{"a":"\\ud800"}'],
  ['sustituto suelto bajo', '{"a":"\\udc00"}'],
  ['punto de codigo sin asignar U+0378', '{"a":"\\u0378"}'],
  ['entero sobre int64', '{"a":9223372036854775808}'],
  ['entero bajo int64', '{"a":-9223372036854775809}'],
  ['coma final en objeto', '{"a":1,}'],
  ['coma final en arreglo', '[1,2,]'],
  ['texto sobrante', '{"a":1} x'],
  ['control sin escapar en cadena (tabulador crudo)', '{"a":"x\ty"}'],
  ['BOM al inicio', '﻿{"a":1}'],
  ['comentario', '{"a":1 /* c */}'],
  ['comillas simples', "{'a':1}"],
  ['vacio', ''],
].map(([nombre, texto]) => ({ nombre, texto }));

fs.writeFileSync(__dirname + '/cf1.json', JSON.stringify({ forma: 'TEMIS-CF-1', positivos, negativos }, null, 2) + '\n');
console.log('vectores:', positivos.length, 'positivos,', negativos.length, 'negativos');
