'use strict';
async function loadWasm(): Promise<void> {
    const go = new Go();

    const { instance } = await WebAssembly.instantiateStreaming(
        fetch("main.wasm"),
        go.importObject
    );

    go.run(instance);
}

async function main(): Promise<void> {
    await loadWasm();
}

main().catch(console.error);
