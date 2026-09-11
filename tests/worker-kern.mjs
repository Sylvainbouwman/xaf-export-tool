// Gedeelde laadhulp voor de tests. Haalt de workercode uit index.html en draait die
// in een geisoleerde vm-context: nooit de app, de imports of de worker-handler.
// Een optioneel bronpad laat dezelfde regressies tegen een oudere kern draaien.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const source = process.env.XAF_TEST_SOURCE || fileURLToPath(new URL('../index.html', import.meta.url));
const html = readFileSync(source, 'utf8');
const worker = html.match(/<script\b[^>]*id="worker-src"[^>]*>([\s\S]*?)<\/script>/);
assert.ok(worker, 'worker-src must exist');
export const workerSource = worker[1];

const handler = workerSource.indexOf('self.onmessage =');
assert.ok(handler > 0, 'worker handler boundary must exist');

// Alleen de rekenkern, zonder de handler die bestanden leest.
export function laadKern() {
  const core = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(workerSource.slice(0, handler), core, { timeout: 1000 });
  return core;
}

// Een synthetisch bestandsobject: precies de vier dingen die de worker aanraakt.
// De knippunten bepalen op welke bytegrenzen de stroom in stukken uiteenvalt.
function maakBestand(xml, cuts = []) {
  const bytes = new TextEncoder().encode(xml);
  const boundaries = [0, ...cuts, bytes.length];
  return {
    size: bytes.length,
    slice: (start, end) => ({ arrayBuffer: async () => bytes.slice(start, end).buffer }),
    stream: () => new ReadableStream({ start(controller) {
      for (let i = 1; i < boundaries.length; i++) controller.enqueue(bytes.slice(boundaries[i - 1], boundaries[i]));
      controller.close();
    } }),
  };
}

// Draait de echte worker op een al gebouwde lading en geeft het done-bericht terug.
async function draai(payload) {
  const messages = [];
  const context = vm.createContext({
    self: { postMessage: value => messages.push(value) }, TextDecoderStream,
  }, { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(workerSource, context, { timeout: 1000 });
  await context.self.onmessage({ data: payload });
  assert.equal(messages.find(message => message.type === 'error'), undefined);
  const done = messages.filter(message => message.type === 'done');
  assert.equal(done.length, 1);
  return done[0];
}

// De volledige echte worker met synthetische bytestromen, zonder app of I/O.
// Een los bestandsobject, zoals de app bij een enkel bestand doorgeeft.
export async function runWorker(xml, cuts = []) {
  return draai(maakBestand(xml, cuts));
}

// Meerdere bestanden in een keer, zoals de app doet bij een gesplitste export.
// De worker voegt ze samen tot een done-bericht, dus de kolomkop en de opvulling
// gelden over het geheel en niet per bestand.
export async function runWorkerFiles(xmls) {
  return draai(xmls.map(xml => maakBestand(xml)));
}
