package simulator

import (
	"fmt"
	"math"
)

type Engine struct {
	state EngineState

	grid         GridSpec
	solidMask    []uint8
	physics      PhysicsParams
	temperatures []float32

	time    float64 // seconds
	failure *FailureEvent

	heatPoints      map[int]activeHeatPoint
	nextHeatPointID int
}

func NewEngine() *Engine {
	return &Engine{
		state:      Uninitialized,
		heatPoints: make(map[int]activeHeatPoint),
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
	return nil
}

func (e *Engine) AddHeatPoint(point HeatPoint) (int, error) {
	if e.state != Ready && e.state != Running {
		return 0, fmt.Errorf("cannot add heat point in state %d", e.state)
	}

	if point.Radius < e.grid.CellSize {
		return 0, fmt.Errorf(
			"heat point radius must be at least %g",
			e.grid.CellSize,
		)
	}

	if point.Duration <= 0 {
		return 0, fmt.Errorf("heat point duration must be positive")
	}

	if point.TargetTemp <= 0 {
		return 0, fmt.Errorf("target temperature in kelvins must be positive")
	}

	id := e.nextHeatPointID
	e.heatPoints[id] = activeHeatPoint{point, point.Duration}
	e.nextHeatPointID++

	return id, nil
}

func (e *Engine) RemoveHeatPoint(id int) error {
	if e.state != Ready && e.state != Running {
		return fmt.Errorf(
			"cannot remove heat point in state %d",
			e.state,
		)
	}

	if _, exists := e.heatPoints[id]; !exists {
		return fmt.Errorf("heat point %d does not exist", id)
	}

	delete(e.heatPoints, id)
	return nil
}

func (e *Engine) SimulateNext(time float64) (*FailureEvent, error) {
	panic("not implemented")
}

func (e *Engine) Reset() error {
	if e.state == Uninitialized {
		return fmt.Errorf("engine is not initialized")
	}

	if len(e.temperatures) != len(e.solidMask) {
		return fmt.Errorf("physics parameters are not set")
	}

	for i, solid := range e.solidMask {
		if solid != 0 {
			e.temperatures[i] = float32(e.physics.InitialTemp)
		} else {
			e.temperatures[i] = float32(e.physics.AmbientTemp)
		}
	}

	e.time = 0
	e.failure = nil
	e.heatPoints = make(map[int]activeHeatPoint)
	e.nextHeatPointID = 0
	e.state = Ready

	return nil
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
	if len(e.temperatures) != len(e.solidMask) || len(e.temperatures) == 0 {
		return GridView{}, fmt.Errorf("physics parameters are not set")
	}

	return GridView{
		Grid:      e.grid,
		Data:      append([]float32(nil), e.temperatures...),
		SolidMask: append([]uint8(nil), e.solidMask...),
	}, nil
}

func (e *Engine) GetRenderSnapshot(stride int) (RenderSnapshot, error) {
	if stride <= 0 {
		return RenderSnapshot{}, fmt.Errorf("stride must be positive")
	}

	if len(e.temperatures) != len(e.solidMask) || len(e.temperatures) == 0 {
		return RenderSnapshot{}, fmt.Errorf("physics parameters are not set")
	}

	lengthX := (e.grid.LengthX + stride - 1) / stride
	lengthY := (e.grid.LengthY + stride - 1) / stride
	lengthZ := (e.grid.LengthZ + stride - 1) / stride
	cellCount := lengthX * lengthY * lengthZ

	data := make([]float32, 0, cellCount)
	solidMask := make([]uint8, 0, cellCount)

	for z := 0; z < e.grid.LengthZ; z += stride {
		for y := 0; y < e.grid.LengthY; y += stride {
			for x := 0; x < e.grid.LengthX; x += stride {
				index := x + e.grid.LengthX*(y+e.grid.LengthY*z)
				data = append(data, e.temperatures[index])
				solidMask = append(solidMask, e.solidMask[index])
			}
		}
	}

	return RenderSnapshot{
		SourceGrid: e.grid,
		Stride:     stride,
		Data:       data,
		SolidMask:  solidMask,
	}, nil
}

func (e *Engine) GetPoint(position Point3D) (float64, bool) {
	if len(e.temperatures) != len(e.solidMask) || len(e.temperatures) == 0 {
		return 0, false
	}

	if math.IsNaN(position.X) || math.IsInf(position.X, 0) ||
		math.IsNaN(position.Y) || math.IsInf(position.Y, 0) ||
		math.IsNaN(position.Z) || math.IsInf(position.Z, 0) {
		return 0, false
	}

	if position.X < 0 || position.X >= float64(e.grid.LengthX)*e.grid.CellSize ||
		position.Y < 0 || position.Y >= float64(e.grid.LengthY)*e.grid.CellSize ||
		position.Z < 0 || position.Z >= float64(e.grid.LengthZ)*e.grid.CellSize {
		return 0, false
	}

	return e.interpolateTemperature(position), true
}

func (e *Engine) interpolateTemperature(position Point3D) float64 {
	gridCoordinate := func(value float64, length int) (int, int, float64) {
		coordinate := value/e.grid.CellSize - 0.5
		coordinate = math.Max(0, math.Min(coordinate, float64(length-1)))

		lower := int(math.Floor(coordinate))
		upper := min(lower+1, length-1)
		return lower, upper, coordinate - float64(lower)
	}

	x0, x1, tx := gridCoordinate(position.X, e.grid.LengthX)
	y0, y1, ty := gridCoordinate(position.Y, e.grid.LengthY)
	z0, z1, tz := gridCoordinate(position.Z, e.grid.LengthZ)

	temperature := func(x, y, z int) float64 {
		index := x + e.grid.LengthX*(y+e.grid.LengthY*z)
		return float64(e.temperatures[index])
	}

	c000 := temperature(x0, y0, z0)
	c100 := temperature(x1, y0, z0)
	c010 := temperature(x0, y1, z0)
	c110 := temperature(x1, y1, z0)
	c001 := temperature(x0, y0, z1)
	c101 := temperature(x1, y0, z1)
	c011 := temperature(x0, y1, z1)
	c111 := temperature(x1, y1, z1)

	lerp := func(a, b, t float64) float64 {
		return a + (b-a)*t
	}

	c00 := lerp(c000, c100, tx)
	c10 := lerp(c010, c110, tx)
	c01 := lerp(c001, c101, tx)
	c11 := lerp(c011, c111, tx)
	c0 := lerp(c00, c10, ty)
	c1 := lerp(c01, c11, ty)

	return lerp(c0, c1, tz)
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
