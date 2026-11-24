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
	X float64
	Y float64
	Z float64
}

// TablePoint stores the relation between current temperature and
// physics table value
type TablePoint struct {
	TemperatureK float64
	Value        float64
}

// Material contains the physical properties of body
type Material struct {
	// ID is material name
	ID MaterialID

	Density float64
	// теплоемкость
	SpecificHeat float64

	Conductivity []TablePoint

	LimitTemp   float64
	FailureKind FailureKind
}

// Environment defines environment exchange of heat with the body
type Environment struct {
	ID           EnvironmentID
	HeatTransfer []TablePoint
}

// GridSpec describes the cubic physics grid
type GridSpec struct {
	LengthX int
	LengthY int
	LengthZ int

	// CellSizeM is the length of cubic size
	CellSizeM float64
}

type ShapeData struct {
	Grid GridSpec

	// SolidMask shows whether cubic cell is part of the body
	SolidMask []uint8
}

// PhysicsParams specifies the global conditions
type PhysicsParams struct {
	MaterialID    MaterialID
	EnvironmentID EnvironmentID

	// InitialTempK is the temperature of the body at t=0
	InitialTempK float64

	// AmbientTempK is the temperature of the surrounding air
	AmbientTempK float64
}

// HeatPoint is a fixed-temperature source
type HeatPoint struct {
	Position Point3D

	TargetTempK float64

	// RadiusM should be at least one CellSizeM
	RadiusM float64

	DurationS float64
}

// FailureEvent is a valid physical result
type FailureEvent struct {
	Kind         FailureKind
	MaterialID   MaterialID
	Position     Point3D
	TemperatureK float64
	TimeS        float64
}

// GridView describes a full temperature grid
type GridView struct {
	Grid GridSpec

	// Data contains a temperature for every physical grid cell
	Data []float32

	// SolidMask shows whether cubic cell is part of the body
	SolidMask []uint8
}

// RenderSnapshot describes a partial temperature grid - every Nth stride
type RenderSnapshot struct {
	SourceGrid GridSpec
	Stride     int

	Data []float32
	// SolidMask shows whether cubic cell is part of the body
	SolidMask []uint8
}
