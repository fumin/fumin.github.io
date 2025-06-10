package main

import (
	"cmp"
	"context"
	"flag"
	"fmt"
	"log"
	"slices"
	"strconv"
	"time"

	"github.com/chromedp/cdproto/input"
	"github.com/chromedp/chromedp"
	"github.com/pkg/errors"
)

type Datum struct {
	Time  float64
	Value float64
}

func parseQuarter(pstr string) (float64, bool, error) {
	yearStr := pstr[:4]
	monthStr := string([]rune(pstr[4:])[1:3])

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		return -1, false, errors.Wrap(err, "")
	}

	month, err := strconv.Atoi(monthStr)
	if err != nil {
		return -1, false, errors.Wrap(err, "")
	}

	switch month {
	case 3:
		return float64(year) + 0.125, true, nil
	case 6:
		return float64(year) + 0.375, true, nil
	case 9:
		return float64(year) + 0.625, true, nil
	case 12:
		return float64(year) + 0.875, true, nil
	default:
		return -1, false, nil
	}
}

func parse(price map[string]string) ([]Datum, error) {
	data := make([]Datum, 0, len(price))
	for k, v := range price {
		var d Datum
		var isQ bool
		var err error
		d.Time, isQ, err = parseQuarter(k)
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("\"%s\" \"%s\"", k, v))
		}
		if !isQ {
			continue
		}

		d.Value, err = strconv.ParseFloat(v, 64)
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("\"%s\" \"%s\"", k, v))
		}
		data = append(data, d)
	}

	slices.SortFunc(data, func(a, b Datum) int { return cmp.Compare(a.Time, b.Time) })

	// Check if we missed any quarter.
	prev := data[0]
	for _, d := range data[1:] {
		if d.Time-prev.Time != 0.25 {
			return nil, errors.Errorf("%#v %#v", prev, d)
		}
		prev = d
	}

	return data, nil
}

func query() (map[string]string, error) {
	eopts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.WindowSize(1920, 1080),
		chromedp.Flag("headless", true))
	actx, acancel := chromedp.NewExecAllocator(context.Background(), eopts...)
	defer acancel()
	opts := []chromedp.ContextOption{chromedp.WithLogf(func(string, ...any) {})}
	ctx, cancel := chromedp.NewContext(actx, opts...)
	defer cancel()

	price := make(map[string]string)
	err := chromedp.Run(ctx,
		chromedp.Navigate(`https://www.houseplus.com.tw/reportIndex`),
		chromedp.Evaluate(`document.querySelector('[class^="indexChart"] canvas').scrollIntoView()`, nil),
		chromedp.ActionFunc(func(ctx context.Context) error {
			for x := 1292; x >= 415; x-- {
				if err := chromedp.MouseEvent(input.MouseMoved, float64(x), 150).Do(ctx); err != nil {
					return errors.Wrap(err, "")
				}
				var dt, v string
				if err := chromedp.Evaluate(`document.querySelector('[class^="indexChart"] > :nth-child(3) > :nth-child(2) > :nth-child(1)').textContent`, &dt).Do(ctx); err != nil {
					return errors.Wrap(err, fmt.Sprintf("%d", x))
				}
				if err := chromedp.Evaluate(`document.querySelector('[class^="indexChart"] > :nth-child(3) > :nth-child(2) > :nth-child(2) > span').textContent`, &v).Do(ctx); err != nil {
					return errors.Wrap(err, fmt.Sprintf("%d", x))
				}
				price[dt] = v
			}
			return nil
		}),
		chromedp.Sleep(1*time.Millisecond),
	)
	if err != nil {
		return nil, errors.Wrap(err, "")
	}

	return price, nil
}

func main() {
	flag.Parse()
	log.SetFlags(log.Lmicroseconds | log.Llongfile | log.LstdFlags)

	if err := mainWithErr(); err != nil {
		log.Fatalf("%+v", err)
	}
}

func mainWithErr() error {
	price, err := query()
	if err != nil {
		return errors.Wrap(err, "")
	}

	data, err := parse(price)
	if err != nil {
		return errors.Wrap(err, "")
	}

	fmt.Printf("t,value\n")
	for _, d := range data {
		fmt.Printf("%f,%f\n", d.Time, d.Value)
	}

	return nil
}
