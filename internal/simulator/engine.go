package simulator

import (
	"math/rand"
)

type Engine struct {
	state EngineState
}

func NewEngine() *Engine {
	return &Engine{
		state: Uninitialized,
	}
}

var _ SimulatorEngine = (*Engine)(nil)

func (e *Engine) Init(shape ShapeData) error {
	panic("not implemented")
}

func (e *Engine) SetPhysicsParams(params PhysicsParams) error {
	panic("not implemented")
}

func (e *Engine) AddHeatPoint(point HeatPoint) (int, error) {
	panic("not implemented")
}

func (e *Engine) RemoveHeatPoint(id int) error {
	panic("not implemented")
}

func (e *Engine) SimulateNext(time float64) (*FailureEvent, error) {
	panic("not implemented")
}

func (e *Engine) Reset() error {
	panic("not implemented")
}

func (e *Engine) GetState() EngineState {
	panic("not implemented")
}

func (e *Engine) GetTime() float64 {
	panic("not implemented")
}

func (e *Engine) GetFailure() *FailureEvent {
	panic("not implemented")
}

func (e *Engine) GetGridView() (GridView, error) {
	const (
		size    = 5
		maxTemp = 1273
	)

	data := make([]float32, size*size*size)

	for i := range data {
		data[i] = float32(rand.Intn(maxTemp + 1))
	}

	return GridView{
		Grid: GridSpec{
			LengthX:   size,
			LengthY:   size,
			LengthZ:   size,
			CellSizeM: 1,
		},
		Data:      data,
		SolidMask: nil,
	}, nil
}

func (e *Engine) GetRenderSnapshot(stride int) (RenderSnapshot, error) {
	panic("not implemented")
}

func (e *Engine) GetPoint(position Point3D) (float64, bool) {
	panic("not implemented")
}
