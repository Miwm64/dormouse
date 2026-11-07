.PHONY: build run clean

build:
	cp "$$(go env GOROOT)/lib/wasm/wasm_exec.js" frontend/
	GOOS=js GOARCH=wasm go build -o frontend/main.wasm ./cmd

run: build
	python3 -m http.server 8080 -d frontend

clean:
	rm -f frontend/main.wasm frontend/wasm_exec.js