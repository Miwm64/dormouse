package simulator

/*
Units:
- Time and duration: seconds.
- Temperature: Kelvins.
- Size: metres.
*/

type EngineState uint8

const (
	// Uninitialized means no grid, shape, physical parameters
	Uninitialized EngineState = iota

	// Ready means geometry and physical parameters are set
	Ready

	// Running means at least one succesfull step
	Running

	// MaterialFailed means at least one voxel reached its material limit
	MaterialFailed
)

// FailureKind explains why a material is no longer solid
type FailureKind string

const (
	FailureMelt    FailureKind = "melt"
	FailureDestroy FailureKind = "destroy"
)

type MaterialID string
type EnvironmentID string

const (
	MaterialAluminum  MaterialID = "aluminum"
	MaterialCopper    MaterialID = "copper"
	MaterialIron      MaterialID = "iron"
	MaterialNickel    MaterialID = "nickel"
	MaterialPlatinum  MaterialID = "platinum"
	MaterialGold      MaterialID = "gold"
	MaterialSilver    MaterialID = "silver"
	MaterialLead      MaterialID = "lead"
	MaterialMagnesium MaterialID = "magnesium"
	MaterialZinc      MaterialID = "zinc"
	MaterialGlass     MaterialID = "glass"
	MaterialConcrete  MaterialID = "concrete"
	MaterialGranite   MaterialID = "granite"
)

const (
	EnvironmentAir    EnvironmentID = "air"
	EnvironmentVacuum EnvironmentID = "vacuum"
)

// Point3D is a point in world coordinates, in metres
type Point3D struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

// TablePoint stores the relation between current temperature and
// physics table value
type TablePoint struct {
	Temperature float64 `json:"temperature"`
	Value       float64 `json:"value"`
}

// Material contains the physical properties of body
type Material struct {
	// ID is material name
	ID MaterialID `json:"id"`

	Density float64 `json:"density"`
	// теплоемкость
	SpecificHeat float64 `json:"specificHeat"`

	Conductivity []TablePoint `json:"conductivity"`

	LimitTemp   float64     `json:"limitTemp"`
	FailureKind FailureKind `json:"failureKind"`
}

// Environment defines environment exchange of heat with the body
type Environment struct {
	ID           EnvironmentID `json:"id"`
	HeatTransfer []TablePoint  `json:"heatTransfer"`
}

// GridSpec describes the cubic physics grid
type GridSpec struct {
	LengthX int `json:"lengthX"`
	LengthY int `json:"lengthY"`
	LengthZ int `json:"lengthZ"`

	// CellSize is the length of cubic size
	CellSize float64 `json:"cellSize"`
}

type ShapeData struct {
	Grid GridSpec `json:"grid"`

	// SolidMask shows whether cubic cell is part of the body
	SolidMask []uint8 `json:"solidMask"`
}

// PhysicsParams specifies the global conditions
type PhysicsParams struct {
	MaterialID    MaterialID    `json:"materialId"`
	EnvironmentID EnvironmentID `json:"environmentId"`

	// InitialTemp is the temperature of the body at t=0
	InitialTemp float64 `json:"initialTemp"`

	// AmbientTemp is the temperature of the surrounding air
	AmbientTemp float64 `json:"ambientTemp"`
}

// HeatPoint is a fixed-temperature source
type HeatPoint struct {
	Position Point3D `json:"position"`

	TargetTemp float64 `json:"targetTemp"`

	// Radius should be at least one CellSize
	Radius float64 `json:"radius"`

	Duration float64 `json:"duration"`
}

// FailureEvent is a valid physical result
type FailureEvent struct {
	Kind        FailureKind `json:"kind"`
	MaterialID  MaterialID  `json:"materialId"`
	Position    Point3D     `json:"position"`
	Temperature float64     `json:"temperature"`
	Time        float64     `json:"time"`
}

// GridView describes a full temperature grid
type GridView struct {
	Grid GridSpec `json:"grid"`

	// Data contains a temperature for every physical grid cell
	Data []float32 `json:"data"`

	// SolidMask shows whether cubic cell is part of the body
	SolidMask []uint8 `json:"solidMask"`
}

// RenderSnapshot describes a partial temperature grid - every Nth stride
type RenderSnapshot struct {
	SourceGrid GridSpec `json:"sourceGrid"`
	Stride     int      `json:"stride"`

	Data []float32 `json:"data"`
	// SolidMask shows whether cubic cell is part of the body
	SolidMask []uint8 `json:"solidMask"`
}
