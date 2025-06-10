package main

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/pkg/errors"
)

func pkcs7Pad(plaintext []byte, blocksize int) []byte {
	n := blocksize - (len(plaintext) % blocksize)
	padded := make([]byte, len(plaintext)+n)
	copy(padded, plaintext)
	copy(padded[len(plaintext):], bytes.Repeat([]byte{byte(n)}, n))
	return padded
}

func aescbc(key, plaintext, iv []byte) ([]byte, error) {
	aesCipher, err := aes.NewCipher(key)
	if err != nil {
		return nil, errors.Wrap(err, "")
	}
	padded := pkcs7Pad(plaintext, aesCipher.BlockSize())

	enc := cipher.NewCBCEncrypter(aesCipher, []byte(iv))
	ciphertext := make([]byte, len(padded))
	enc.CryptBlocks(ciphertext, padded)
	return ciphertext, nil
}

func haoshijiaKey() (string, string, error) {
	now := strconv.FormatInt(time.Now().Unix(), 10)

	plaintext := []byte("ajdf45bmlk")
	plaintext = append(plaintext, ',')
	plaintext = append(plaintext, []byte(now)...)

	key := []byte("zyf2SRraTUBUXWhidTzL3T6_oKoCOV_x4ZJwX0kXxYI=")
	iv := []byte{75, 105, 83, 158, 196, 65, 236, 181, 61, 119, 220, 163, 224, 19, 51, 241}
	ciphertext, err := aescbc(key[:16], plaintext, iv)
	if err != nil {
		return "", "", errors.Wrap(err, "")
	}

	ciphertextb64 := base64.StdEncoding.EncodeToString(ciphertext)
	ivb64 := base64.StdEncoding.EncodeToString(iv)
	return ciphertextb64, ivb64, nil
}

func get() ([]byte, error) {
	// cachePath := "haoshijia.json"
	// rbody, err := os.ReadFile(cachePath)
	// if err != nil {
	// 	return nil, errors.Wrap(err, "")
	// }
	// return rbody, nil

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	encrypted, iv, err := haoshijiaKey()
	if err != nil {
		return nil, errors.Wrap(err, "")
	}

	// Prepare request.
	urlStr := "https://backend.houseplus.com.tw/api/get_pi_list"
	reqBody := bytes.NewBuffer(nil)
	req, err := http.NewRequestWithContext(ctx, "POST", urlStr, reqBody)
	if err != nil {
		return nil, errors.Wrap(err, "")
	}
	req.Header.Add("encrypted", encrypted)
	req.Header.Add("iv", iv)
	req.Header.Add("Content-Type", "application/json")

	// Do request.
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "")
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.Wrap(err, "")
	}

	// if err := os.WriteFile(cachePath, body, os.ModePerm); err != nil {
	// 	return nil, errors.Wrap(err, "")
	// }

	return body, nil
}

type Datum struct {
	Time  float64
	Value float64
}

func parseQuarter(pstr string) (float64, bool, error) {
	if len(pstr) != 5 {
		return -1, false, errors.Errorf("wrong length")
	}

	minguo, err := strconv.Atoi(pstr[:3])
	if err != nil {
		return -1, false, errors.Wrap(err, "")
	}
	year := float64(minguo + 1911)

	month, err := strconv.Atoi(pstr[3:])
	if err != nil {
		return -1, false, errors.Wrap(err, "")
	}

	switch month {
	case 3:
		return year + 0.125, true, nil
	case 6:
		return year + 0.375, true, nil
	case 9:
		return year + 0.625, true, nil
	case 12:
		return year + 0.875, true, nil
	default:
		return -1, false, nil
	}
}

func parse(body []byte) ([]Datum, error) {
	type Area struct {
		Area string `json:"area"`
		Data []struct {
			Year string `json:"year"`
			Val  string `json:"val"`
		} `json:"data"`
	}
	type Data struct {
		Dataset []Area `json:"dataset"`
	}
	var jdata Data
	if err := json.Unmarshal(body, &jdata); err != nil {
		return nil, errors.Wrap(err, "")
	}

	var quantai *Area
	for _, a := range jdata.Dataset {
		if a.Area == "全台" {
			quantai = &a
			break
		}
	}
	if quantai == nil {
		areas := make([]string, 0, len(jdata.Dataset))
		for _, a := range jdata.Dataset {
			areas = append(areas, a.Area)
		}
		return nil, errors.Errorf("not found in %#v", areas)
	}

	data := make([]Datum, 0, len(quantai.Data))
	for _, rd := range quantai.Data {
		if rd.Year == "" {
			continue
		}

		quarter, isQuarter, err := parseQuarter(rd.Year)
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("%#v", rd))
		}
		if !isQuarter {
			continue
		}

		v, err := strconv.ParseFloat(rd.Val, 64)
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("%#v", rd))
		}

		d := Datum{Time: quarter, Value: v}
		data = append(data, d)
	}
	return data, nil
}

func main() {
	flag.Parse()
	log.SetFlags(log.LstdFlags | log.Lmicroseconds | log.Llongfile)
	if err := mainWithErr(); err != nil {
		log.Fatalf("%+v", err)
	}
}

func mainWithErr() error {
	body, err := get()
	if err != nil {
		return errors.Wrap(err, "")
	}
	data, err := parse(body)
	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("\"%s\"", body))
	}

	fmt.Printf("t,value\n")
	for _, d := range data {
		fmt.Printf("%f,%f\n", d.Time, d.Value)
	}

	return nil
}
