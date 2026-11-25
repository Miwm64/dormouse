package simulator

type SimulatorEngine interface {
	// Init sets or replaces the object geometry
	// Allowed: Uninitialized, Ready, MaterialFailed.
	// Rejected: Running.
	Init(shape ShapeData) error

	// SetPhysicsParams selects material and medium, validates their IDs, fills
	// solid cells with InitialTemp, and sets simulation time to zero
	// Allowed: Ready and MaterialFailed.
	SetPhysicsParams(params PhysicsParams) error

	// AddHeatPoint creates a heat point
	// Allowed: Ready and Running.
	AddHeatPoint(point HeatPoint) (id int, err error)

	// RemoveHeatPoint immediately stops a heat point
	// Allowed: Ready and Running.
	RemoveHeatPoint(id int) error

	// SimulateNext advances physical time by time. backend splits into stable steps
	SimulateNext(time float64) (failure *FailureEvent, err error)

	// Reset returns the simulation. Geometry/material/environment remain selected.
	Reset() error

	GetState() EngineState
	GetTime() float64
	GetFailure() *FailureEvent
	GetGridView() (GridView, error)
	GetRenderSnapshot(stride int) (RenderSnapshot, error)
	GetPoint(position Point3D) (temperature float64, ok bool)
}
