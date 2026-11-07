'use strict';

async function loadWasm() {
    const go = new Go();
    const { instance } = await WebAssembly.instantiateStreaming(
        fetch("main.wasm"), go.importObject
    );
    go.run(instance);
}

async function main() {
    await loadWasm();
    console.log("Result from Go:", goAdd(10, 20));
}

main().catch(console.error);