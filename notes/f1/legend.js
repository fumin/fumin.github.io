function updateColorCanvas(colorTransferFunction, width, height, rangeToUse) {
  const workCanvas = document.createElement('canvas');
  workCanvas.setAttribute('width', width);
  workCanvas.setAttribute('height', height);
  const ctx = workCanvas.getContext('2d');

  // const colorLength = width;
  const colorLength = height;
  const rgba = colorTransferFunction.getUint8Table(
    rangeToUse[0],
    rangeToUse[1],
    colorLength,
    true
  );
  const pixelsArea = ctx.getImageData(0, 0, width, height);

  // Horizontal.
  // for (let lineIdx = 0; lineIdx < height; lineIdx++) {
  //   pixelsArea.data.set(rgba, lineIdx * 4 * width);
  // }
  // Vertical.
  for (let lineIdx = 0; lineIdx < width; lineIdx++) {
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < 4; j++) {
        pixelsArea.data[(i*width+lineIdx)*4+j] = rgba[(rgba.length/4-1-i)*4+j];
      }
    }
  }

  const nbValues = height * width * 4;
  const lineSize = width * 4;
  for (let i = 3; i < nbValues; i += 4) {
    // pixelsArea.data[i] = 255 - Math.floor(i / lineSize);
    pixelsArea.data[i] = 255;
  }

  ctx.putImageData(pixelsArea, 0, 0);
  return workCanvas;
}

function newPalette(presetName, titleHeight, width, height, margin) {
  const vtkColorMaps = vtk.Rendering.Core.vtkColorTransferFunction.vtkColorMaps;
  const preset = vtkColorMaps.getPresetByName(presetName);
  const colorTransferFunction = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();
  colorTransferFunction.applyColorMap(preset);
  colorTransferFunction.setMappingRange(0, 100);
  colorTransferFunction.updateRange();
  const rangeToUse = colorTransferFunction.getMappingRange();
  const canvas = updateColorCanvas(colorTransferFunction, width, height, rangeToUse);
  colorTransferFunction.delete();
  canvas.style["margin-bottom"] = margin;
  canvas.style.position = "absolute";
  canvas.style.left = titleHeight+5;
  canvas.style.top = margin;
  return canvas;
}

function newLegendTicks(container, titleHeight, width, height, paletteWidth, annotations, dec, margin) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  container.appendChild(svg);
  svg.setAttribute("width", width);
  svg.setAttribute("height", height+margin*2);
  svg.style.position = "absolute";
  svg.style.left = titleHeight+5;

  const smallest = annotations[0];
  const largest = annotations[annotations.length-1];
  for (let i = 0; i < annotations.length; i++) {
    const a = annotations[i];
    const y = (1 - (a - smallest) / (largest - smallest)) * height + margin;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", -5+paletteWidth);
    line.setAttribute("y1", y);
    line.setAttribute("x2", paletteWidth);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "black");
    svg.appendChild(line);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.appendChild(document.createTextNode(a.toFixed(dec)));
    txt.setAttribute("x", 5+paletteWidth);
    txt.setAttribute("y", y);
    txt.setAttribute("dominant-baseline", "middle");
    svg.appendChild(txt);

    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    var bb = txt.getBBox();
    rect.setAttribute("x", bb.x);
    rect.setAttribute("y", bb.y);
    rect.setAttribute("width", bb.width);
    rect.setAttribute("height", bb.height);
    rect.setAttribute("fill", "white");
    svg.insertBefore(rect, txt);
  }
  return svg;
}

function measureSentence(sentence, fontSize) {
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  context.font = "bold" + " " + fontSize + "px " + "arial";
  return context.measureText(sentence);
}

function newTitle(titleWidth, titleHeight, legendHeight, title) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(title));
  div.style.position = "absolute";
  div.style.width = titleWidth;
  div.style.rotate = "-90deg";
  div.style.left = -titleWidth/2 + titleHeight/2;
  div.style.top = legendHeight/2 - titleHeight/2;
  div.style["background-color"] = "white";
  div.style.rotate = "-90deg";
  div.style["padding-left"] = titleHeight / 4;
  return div;
}

function longestAnno(annotations, decimalPlaces) {
  var longestIdx = -1;
  for (let i = 0; i < annotations.length; i++) {
    var a = annotations[i];
    var str = a.toFixed(decimalPlaces);
    if (str.length > longestIdx) {
      longestIdx = i;
    }
  }
  return longestIdx;
}

export function New(titleStr, titleStrClean, presetName, annotations, decimalPlaces, titleHeight, paletteWidth, paletteHeight) {
  const container = document.createElement("div");
  container.style.position = "relative";
  container.style["font-size"] = titleHeight;
  document.body.appendChild(container);

  const titleBB = measureSentence(titleStrClean, titleHeight);
  const titleWidth = titleBB.width;
  const marginTop = titleHeight/2;
  const title = newTitle(titleWidth, titleHeight, paletteHeight+2*marginTop, titleStr);
  container.appendChild(title);

  const palette = newPalette(presetName, titleHeight, paletteWidth, paletteHeight, marginTop);
  container.appendChild(palette);

  const longestAnnoIdx = longestAnno(annotations, decimalPlaces);
  const longestAnnoStr = annotations[longestAnnoIdx].toFixed(decimalPlaces);
  const AnnoBB = measureSentence(longestAnnoStr, titleHeight);
  var ticksWidth = AnnoBB.width + paletteWidth + 5;
  newLegendTicks(container, titleHeight, ticksWidth, paletteHeight, paletteWidth, annotations, decimalPlaces, marginTop);

  return container;
}
