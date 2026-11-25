//go:build js && wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"github.com/Miwm64/dormouse/internal/simulator"
)

var engine simulator.SimulatorEngine

func main() {
	engine = simulator.NewEngine()

	js.Global().Set("Simulator", createAPI())
	select {}
}

func createAPI() js.Value {
	api := js.Global().Get("Object").New()

	api.Set("init", wrap(initEngine))
	api.Set("setPhysicsParams", wrap(setPhysicsParams))
	api.Set("addHeatPoint", wrap(addHeatPoint))
	api.Set("removeHeatPoint", wrap(removeHeatPoint))
	api.Set("simulateNext", wrap(simulateNext))
	api.Set("reset", wrap(reset))

	api.Set("getState", wrap(getState))
	api.Set("getTime", wrap(getTime))
	api.Set("getFailure", wrap(getFailure))
	api.Set("getGridView", wrap(getGridView))
	api.Set("getRenderSnapshot", wrap(getRenderSnapshot))
	api.Set("getPoint", wrap(getPoint))

	return api
}

func wrap(fn func(js.Value) (any, error)) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) == 0 {
			result, err := fn(js.Undefined())
			return response(result, err)
		}

		result, err := fn(args[0])
		return response(result, err)
	})
}

func response(result any, err error) any {
	if err != nil {
		obj := js.Global().Get("Object").New()
		obj.Set("error", err.Error())
		obj.Set("ok", false)
		return obj
	}

	obj := js.Global().Get("Object").New()
	obj.Set("ok", true)

	if result != nil {
		obj.Set("data", toJS(result))
	}

	return obj
}

func toJS(v any) any {
	data, err := json.Marshal(v)
	if err != nil {
		return nil
	}

	return js.Global().Get("JSON").Call("parse", string(data))
}

func fromJS[T any](value js.Value) (T, error) {
	var result T

	if value.IsUndefined() || value.IsNull() {
		return result, fmt.Errorf("missing argument")
	}

	data := js.Global().Get("JSON").Call("stringify", value)
	if data.IsUndefined() {
		return result, fmt.Errorf("argument is not JSON-serializable")
	}

	if err := json.Unmarshal([]byte(data.String()), &result); err != nil {
		return result, err
	}

	return result, nil
}

func requireEngine() error {
	if engine == nil {
		return fmt.Errorf("simulator is not initialized")
	}
	return nil
}

func initEngine(arg js.Value) (any, error) {
	shape, err := fromJS[simulator.ShapeData](arg)
	if err != nil {
		return nil, err
	}

	if engine == nil {
		// Replace with your actual constructor.
		panic("simulator constructor is not created")
	}

	if err := engine.Init(shape); err != nil {
		return nil, err
	}

	return nil, nil
}

func setPhysicsParams(arg js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	params, err := fromJS[simulator.PhysicsParams](arg)
	if err != nil {
		return nil, err
	}

	return nil, engine.SetPhysicsParams(params)
}

func addHeatPoint(arg js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	point, err := fromJS[simulator.HeatPoint](arg)
	if err != nil {
		return nil, err
	}

	id, err := engine.AddHeatPoint(point)
	return id, err
}

func removeHeatPoint(arg js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	id, err := fromJS[int](arg)
	if err != nil {
		return nil, err
	}

	return nil, engine.RemoveHeatPoint(id)
}

func simulateNext(arg js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	duration, err := fromJS[float64](arg)
	if err != nil {
		return nil, err
	}

	failure, err := engine.SimulateNext(duration)
	if err != nil {
		return nil, err
	}

	return failure, nil
}

func reset(_ js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	return nil, engine.Reset()
}

func getState(_ js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	return engine.GetState(), nil
}

func getTime(_ js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	return engine.GetTime(), nil
}

func getFailure(_ js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	return engine.GetFailure(), nil
}

func getGridView(_ js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	return engine.GetGridView()
}

func getRenderSnapshot(arg js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	stride, err := fromJS[int](arg)
	if err != nil {
		return nil, err
	}

	return engine.GetRenderSnapshot(stride)
}

func getPoint(arg js.Value) (any, error) {
	if err := requireEngine(); err != nil {
		return nil, err
	}

	position, err := fromJS[simulator.Point3D](arg)
	if err != nil {
		return nil, err
	}

	temp, ok := engine.GetPoint(position)

	return map[string]any{
		"temperature": temp,
		"ok":          ok,
	}, nil
}
