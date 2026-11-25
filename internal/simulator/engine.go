package simulator

import (
	"math/rand"
)

type MockEngine struct{}

var _ SimulatorEngine = (*MockEngine)(nil)

func (e *MockEngine) Init(shape ShapeData) error {
	panic("not implemented")
}

func (e *MockEngine) SetPhysicsParams(params PhysicsParams) error {
	panic("not implemented")
}

func (e *MockEngine) AddHeatPoint(point HeatPoint) (int, error) {
	panic("not implemented")
}

func (e *MockEngine) RemoveHeatPoint(id int) error {
	panic("not implemented")
}

func (e *MockEngine) SimulateNext(time float64) (*FailureEvent, error) {
	panic("not implemented")
}

func (e *MockEngine) Reset() error {
	panic("not implemented")
}

func (e *MockEngine) GetState() EngineState {
	panic("not implemented")
}

func (e *MockEngine) GetTime() float64 {
	panic("not implemented")
}

func (e *MockEngine) GetFailure() *FailureEvent {
	panic("not implemented")
}

func (e *MockEngine) GetGridView() (GridView, error) {
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

func (e *MockEngine) GetRenderSnapshot(stride int) (RenderSnapshot, error) {
	panic("not implemented")
}

func (e *MockEngine) GetPoint(position Point3D) (float64, bool) {
	panic("not implemented")
}
