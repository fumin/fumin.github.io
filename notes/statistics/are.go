package main

import (
	"flag"
	"fmt"
	"log"
	"math"
	"math/rand/v2"

	"github.com/aclements/go-moremath/stats"
)

var (
	p       = flag.Float64("p", 0.01, "probability of outlier")
	n       = flag.Int("n", 1000, "number of data in sample")
	nSample = flag.Int("nSample", 1000, "number of samples")
)

type Distribution struct {
	p float64
	a float64
}

func (d Distribution) sample() float64 {
	if rand.Float64() < d.p {
		return rand.NormFloat64() * (1 + d.a)
	}
	return rand.NormFloat64()
}

type Sample struct {
	data []float64
}

func newSample(n int) *Sample {
	s := &Sample{data: make([]float64, n)}
	return s
}

func (s *Sample) populate(d Distribution) {
	for i := range s.data {
		s.data[i] = d.sample()
	}
}

func (s *Sample) Std() float64 {
	return stats.StdDev(s.data)
}

func (s *Sample) Mad() float64 {
	mean := stats.Mean(s.data)
	var mad float64 = 0
	for _, d := range s.data {
		mad += math.Abs(d - mean)
	}
	return mad / float64(len(s.data))
}

type ARE struct {
	std []float64
	mad []float64
}

func newARE(n int) *ARE {
	are := &ARE{}
	are.std = make([]float64, n)
	are.mad = make([]float64, n)
	return are
}

func (a *ARE) compute() float64 {
	stdMean := stats.Mean(a.std)
	stdVar := stats.Variance(a.std)
	madMean := stats.Mean(a.mad)
	madVar := stats.Variance(a.mad)

	std := stdVar / stdMean / stdMean
	mad := madVar / madMean / madMean
	return std / mad
}

func main() {
	flag.Parse()
	log.SetFlags(log.LstdFlags | log.Lmicroseconds | log.Llongfile)
	if err := mainWithErr(); err != nil {
		log.Fatalf("%+v", err)
	}
}

func mainWithErr() error {
	are := newARE(*nSample)
	sample := newSample(*n)

	ares := make([][2]float64, 0)
	for a := 0.0; a < 20.0; a += 0.5 {
		for i := range are.std {
			d := Distribution{p: *p, a: a}
			sample.populate(d)
			are.std[i] = sample.Std()
			are.mad[i] = sample.Mad()
		}

		ares = append(ares, [2]float64{a, are.compute()})
	}

	fmt.Printf("a,are\n")
	for _, are := range ares {
		fmt.Printf("%f,%f\n", are[0], are[1])
	}
	return nil
}
