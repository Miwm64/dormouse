//go:build js && wasm

package main

import "syscall/js"

func add(this js.Value, args []js.Value) any {
	if len(args) != 2 {
		return js.Global().Get("Error").New("goAdd: expected 2 arguments")
	}
	return args[0].Int() + args[1].Int()
}

func main() {
	js.Global().Set("goAdd", js.FuncOf(add))
	select {}
}
