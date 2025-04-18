package main

import (
	"encoding/csv"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"math"
	"math/rand/v2"
	"os"
	"reflect"
	"slices"
	"strconv"
	"time"

	"github.com/pkg/errors"
)

var (
	testPath = flag.String("t", "", "test model path")
)

type Datum struct {
	Date     time.Time
	Price    float64
	Address  string
	Built    time.Time
	Land     float64
	Building float64
}

func parse(record []string) (Datum, error) {
	var d Datum
	var err error
	d.Date, err = time.Parse(time.DateOnly, record[0])
	if err != nil {
		return Datum{}, errors.Wrap(err, "")
	}

	d.Price, err = strconv.ParseFloat(record[1], 64)
	if err != nil {
		return Datum{}, errors.Wrap(err, "")
	}

	d.Address = record[2]

	d.Built, err = time.Parse(time.DateOnly, record[3])
	if err != nil {
		return Datum{}, errors.Wrap(err, "")
	}

	d.Land, err = strconv.ParseFloat(record[4], 64)
	if err != nil {
		return Datum{}, errors.Wrap(err, "")
	}

	d.Building, err = strconv.ParseFloat(record[5], 64)
	if err != nil {
		return Datum{}, errors.Wrap(err, "")
	}

	return d, nil
}

func readData(fpath string) ([]Datum, error) {
	f, err := os.Open(fpath)
	if err != nil {
		return nil, errors.Wrap(err, "")
	}
	defer f.Close()

	r := csv.NewReader(f)
	var rowID int
	// Header.
	rowID++
	if _, err := r.Read(); err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("%d", rowID))
	}

	data := make([]Datum, 0)
	for {
		rowID++
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("%d", rowID))
		}

		d, err := parse(record)
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("%d", rowID))
		}
		data = append(data, d)
	}

	return data, nil
}

type dataLoader struct {
	data []Datum

	indices []int
	cur     int
}

func newDataLoader(fpath string) (*dataLoader, error) {
	data := &dataLoader{}

	// Read data.
	var err error
	data.data, err = readData(fpath)
	if err != nil {
		return nil, errors.Wrap(err, "")
	}

	// Prepare indices.
	for i := range len(data.data) {
		data.indices = append(data.indices, i)
	}
	data.cur = -1
	rand.Shuffle(len(data.indices), func(i, j int) { data.indices[i], data.indices[j] = data.indices[j], data.indices[i] })

	return data, nil
}

func (d *dataLoader) get() Datum {
	d.cur++
	if d.cur >= len(d.indices) {
		d.cur = 0
		rand.Shuffle(len(d.indices), func(i, j int) { d.indices[i], d.indices[j] = d.indices[j], d.indices[i] })
	}

	idx := d.indices[d.cur]
	return d.data[idx]
}

func (d *dataLoader) len() int {
	return len(d.data)
}

type parameters struct {
	LandC        float64
	Land         float64
	BuildingC    float64
	Building     float64
	Depreciation float64
}

func newParameters() parameters {
	var p parameters
	p.LandC = rand.Float64()
	p.Land = rand.Float64()
	p.BuildingC = rand.Float64()
	p.Building = rand.Float64()
	p.Depreciation = rand.Float64()
	return p
}

type Model struct {
	param parameters
	grad  parameters
}

func newModel() *Model {
	m := &Model{}
	m.param = newParameters()

	return m
}

func (m *Model) forward(x xFloat) float64 {
	p := m.param
	var y float64
	y += x.Land * (0.5*p.Land*p.Land*x.T + 0.5*p.LandC*p.LandC)
	y += x.Building * (0.5*p.Building*p.Building*x.T + 0.5*p.BuildingC*p.BuildingC)
	y += x.Building * (p.Depreciation * x.Age)
	return y
}

func (m *Model) backward(d Datum) float64 {
	// Forward pass.
	x := m.x(d)
	pred := m.forward(x)
	loss := math.Abs(pred - x.Price)

	// Compute gradients.
	var sgn float64 = 1
	if pred < x.Price {
		sgn = -1
	}
	p := m.param
	m.grad.LandC = sgn * (x.Land * p.LandC)
	m.grad.Land = sgn * (x.Land * x.T * p.Land)
	m.grad.BuildingC = sgn * (x.Building * p.BuildingC)
	m.grad.Building = sgn * (x.Building * x.T * p.Building)
	m.grad.Depreciation = sgn * (x.Building * x.Age)

	return loss
}

type xFloat struct {
	Price    float64
	T        float64
	Land     float64
	Building float64
	Age      float64
}

func (m *Model) x(d Datum) xFloat {
	var x xFloat
	x.Price = d.Price / 10000

	t2000 := time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)
	x.T = d.Date.Sub(t2000).Hours() / 24 / 365 / 100

	x.Land = d.Land / 1000
	x.Building = d.Building / 1000

	x.Age = d.Date.Sub(d.Built).Hours() / 24 / 365 / 100

	return x
}

func (m *Model) save(fpath string) error {
	b, err := json.Marshal(m.param)
	if err != nil {
		return errors.Wrap(err, "")
	}
	if err := os.WriteFile(fpath, b, 0644); err != nil {
		return errors.Wrap(err, "")
	}
	return nil
}

type optimizer struct {
	learningRate float64
	momentum     float64
	velocity     parameters
}

func (o optimizer) step(m *Model) {
	param := reflect.ValueOf(&m.param)
	grad := reflect.ValueOf(m.grad)
	velocity := reflect.ValueOf(&o.velocity)
	for i := range reflect.Indirect(param).NumField() {
		p := param.Elem().Field(i).Float()
		g := grad.Field(i).Float()
		v := velocity.Elem().Field(i).Float()

		v = o.momentum*v + g
		p = p - o.learningRate*v

		param.Elem().Field(i).SetFloat(p)
		velocity.Elem().Field(i).SetFloat(v)
	}
}

type onlineStat struct {
	i    int
	mean float64
}

func (s *onlineStat) add(x float64) {
	s.mean += (x - s.mean) / float64(s.i+1)
	s.i++
}

func loadParam(p *parameters, fpath string) error {
	b, err := os.ReadFile(fpath)
	if err != nil {
		return errors.Wrap(err, "")
	}
	if err := json.Unmarshal(b, p); err != nil {
		return errors.Wrap(err, "")
	}
	return nil
}

func testModel(data *dataLoader, modelPath string) error {
	model := newModel()
	if err := loadParam(&model.param, modelPath); err != nil {
		return errors.Wrap(err, "")
	}

	// Print model params.
	param := reflect.ValueOf(&model.param)
	for i := range param.Elem().NumField() {
		name := param.Elem().Type().Field(i).Name
		p := param.Elem().Field(i).Float()

		switch {
		case slices.Contains([]string{"LandC", "Land", "BuildingC", "Building"}, name):
			p = 0.5 * p * p
		}

		log.Printf("%s %g", name, p)
	}

	// Evaluate model on data.
	dev := &onlineStat{}
	for i := range data.len() {
		d := data.data[i]
		x := model.x(d)
		pred := model.forward(x)

		dv := math.Abs(pred - x.Price)
		dev.add(dv)

		log.Printf("%f %f", x.Price, pred)
	}
	log.Printf("deviation %f", dev.mean)

	return nil
}

func main() {
	flag.Parse()
	log.SetFlags(log.LstdFlags | log.Lmicroseconds | log.Llongfile)
	if err := mainWithErr(); err != nil {
		log.Fatalf("%+v", err)
	}
}

func mainWithErr() error {
	dataPath := "data.csv"
	data, err := newDataLoader(dataPath)
	if err != nil {
		return errors.Wrap(err, "")
	}

	if *testPath != "" {
		return testModel(data, *testPath)
	}

	model := newModel()
	cpPath := "checkpoint.json"
	if err := loadParam(&model.param, cpPath); err != nil {
		log.Printf("no checkpoint")
	} else {
		log.Printf("loaded checkpoint")
	}
	optimizer := &optimizer{learningRate: 1e-5, momentum: 0.9}

	best := math.MaxFloat64
	for epoch := range math.MaxInt {
		loss := &onlineStat{}
		for range data.len() {
			d := data.get()
			l := model.backward(d)
			optimizer.step(model)

			loss.add(l)
		}

		if epoch%1000000 == 0 {
			log.Printf("%d loss %.6f", epoch, loss.mean)
		}
		if loss.mean < best {
			best = loss.mean
			model.save("best.json")
			log.Printf("best %d loss %.6f", epoch, loss.mean)
		}
	}

	return nil
}
