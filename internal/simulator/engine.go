package simulator

import (
	"fmt"
	"math/rand"
)

type Engine struct {
	state EngineState

	grid         GridSpec
	solidMask    []uint8
	physics      PhysicsParams
	temperatures []float32

	time    float64 // seconds
	failure *FailureEvent
}

func NewEngine() *Engine {
	return &Engine{
		state: Uninitialized,
	}
}

var _ SimulatorEngine = (*Engine)(nil)

func (e *Engine) Init(shape ShapeData) error {
	if shape.Grid.LengthX <= 0 ||
		shape.Grid.LengthY <= 0 ||
		shape.Grid.LengthZ <= 0 ||
		shape.Grid.CellSize <= 0 {
		return fmt.Errorf("invalid grid dimensions")
	}

	cellCount := shape.Grid.LengthX *
		shape.Grid.LengthY *
		shape.Grid.LengthZ

	if len(shape.SolidMask) != cellCount {
		return fmt.Errorf(
			"solid mask length is %d, expected %d",
			len(shape.SolidMask),
			cellCount,
		)
	}

	if e.state == Running {
		return fmt.Errorf("cannot initialize engine while running")
	}

	e.state = Ready
	e.grid = shape.Grid
	e.solidMask = append([]uint8(nil), shape.SolidMask...)
	return nil
}

func (e *Engine) SetPhysicsParams(params PhysicsParams) error {
	if e.state != Ready && e.state != MaterialFailed {
		return fmt.Errorf(
			"cannot set physics parameters in state %d",
			e.state,
		)
	}

	if !isValidMaterial(params.MaterialID) {
		return fmt.Errorf("unknown material: %q", params.MaterialID)
	}

	if !isValidEnvironment(params.EnvironmentID) {
		return fmt.Errorf("unknown environment: %q", params.EnvironmentID)
	}

	if params.InitialTemp <= 0 {
		return fmt.Errorf("initial temperature must be positive")
	}

	if params.AmbientTemp <= 0 {
		return fmt.Errorf("ambient temperature must be positive")
	}

	temperatures := make([]float32, len(e.solidMask))
	for i, solid := range e.solidMask {
		if solid != 0 {
			temperatures[i] = float32(params.InitialTemp)
		} else {
			temperatures[i] = float32(params.AmbientTemp)
		}
	}

	e.physics = params
	e.temperatures = temperatures
	e.time = 0
	e.failure = nil
	e.state = Ready

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
	return e.state
}

func (e *Engine) GetTime() float64 {
	return e.time
}

func (e *Engine) GetFailure() *FailureEvent {
	if e.failure == nil {
		return nil
	}

	failure := *e.failure
	return &failure
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
			LengthX:  size,
			LengthY:  size,
			LengthZ:  size,
			CellSize: 1,
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

func isValidMaterial(id MaterialID) bool {
	switch id {
	case MaterialAluminum,
		MaterialCopper,
		MaterialIron,
		MaterialNickel,
		MaterialPlatinum,
		MaterialGold,
		MaterialSilver,
		MaterialLead,
		MaterialMagnesium,
		MaterialZinc,
		MaterialGlass,
		MaterialConcrete,
		MaterialGranite:
		return true
	default:
		return false
	}
}

func isValidEnvironment(id EnvironmentID) bool {
	switch id {
	case EnvironmentAir, EnvironmentVacuum:
		return true
	default:
		return false
	}
}
