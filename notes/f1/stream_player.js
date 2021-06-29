const playBtnClass = "play-btn";
const sliderClass = "slider";

const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="bi bi-play" viewBox="0 0 16 16">
  <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/>
</svg>`;
const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="bi bi-pause" viewBox="0 0 16 16">
  <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
</svg>`;

function maxIntegrationTime(poly) {
  const integrationTime = poly.getPointData().getArrayByName("IntegrationTime").getData();
  var maxt = -1;
  for (let i = 0; i < integrationTime.length; i++) {
    if (integrationTime[i] > maxt) {
      maxt = integrationTime[i];
    }
  }
  return maxt;
}

function filterPoly(poly, cutoff) {
  const polyData = vtk.Common.DataModel.vtkPolyData.newInstance();

  const points = new Float32Array(poly.getPoints().getNumberOfValues());
  points.set(poly.getPoints().getData());

  const polyLines = poly.getLines().getData();
  const pls = [];
  var lineLen = polyLines[0];
  var curLine = [];
  for (let i = 1; i < polyLines.length; i++) {
    if (curLine.length == lineLen) {
      pls.push(curLine);
      curLine = [];

      lineLen = polyLines[i];
      continue;
    }
    curLine.push(polyLines[i]);
  }
  pls.push(curLine);
  // Check that we extracted correctly.
  for (let i = 0; i < pls.length; i++) {
    if (pls[i].length != poly.getLines().getCellSizes()[i]) {
      alert();
    }
  }
  // Filter.
  const integrationTime = poly.getPointData().getArrayByName("IntegrationTime").getData();
  var filteredLines = [];
  for (let i = 0; i < pls.length; i++) {
    var filtered = [];
    for (let j = 0; j < pls[i].length; j++) {
      const igt = integrationTime[pls[i][j]];
      if (igt > cutoff) {
        break;
      }
      filtered.push(pls[i][j]);
    }
    filteredLines.push(filtered);
  }
  // Encode.
  var flattened = [];
  for (let i = 0; i < filteredLines.length; i++) {
    flattened.push(filteredLines[i].length);
    for (let j = 0; j < filteredLines[i].length; j++) {
      flattened.push(filteredLines[i][j]);
    }
  }
  const lines = new Int32Array(flattened);

  const uArr = poly.getPointData().getArrayByName("U");
  const uValues = new Float32Array(uArr.getNumberOfValues());
  uValues.set(uArr.getData());
  const u = vtk.Common.Core.vtkDataArray.newInstance({
    name: "U",
    numberOfComponents: 3,
    values: uValues,
  });

  polyData.getPoints().setData(points, 3);
  polyData.getLines().setData(lines, 1);
  polyData.getPointData().addArray(u);
  return polyData;
}

// Replaces HttpDataSetReader.
function newStreamSource(poly) {
  const source = vtk.macro.newInstance((publicAPI, model) => {
    model.poly = poly;
    model.integrationTime = 0;
    model.maxItgTime = maxIntegrationTime(poly);

    vtk.macro.obj(publicAPI, model);
    vtk.macro.algo(publicAPI, model, 0, 1);
    vtk.macro.get(publicAPI, model, ["maxItgTime"]);
    vtk.macro.setGet(publicAPI, model, ["integrationTime"]);
    publicAPI.requestData = (inData, outData) => {
      outData[0] = filterPoly(poly, model.integrationTime);
    };
  })();
  return source
}

function editStream(sceneLoader, idx) {
  // We pick the nth scene as defined in our vtkjs file.
  const scene = sceneLoader.getScene()[idx];
  // source is the vtkHttpDataSetReader.
  const source = scene.source;
  // Get the vtkPolyData that is being defined in the index.json of our vtkjs file.
  const poly = source.getOutputData();

  // Return if we haven't finished loaded yet.
  const numLines = poly.getLines().getNumberOfCells();
  if (numLines == 0) {
    return;
  }

  const streamSource = newStreamSource(poly);
  scene.mapper.setInputConnection(streamSource.getOutputPort());
  scene.mapper.modified();
  return streamSource;
}

function newPlayer(sceneLoader, streamSource, ui) {
  var player = {};

  player.setTime = function(t) {
    streamSource.setIntegrationTime(t);
    sceneLoader.getRenderer().getVTKWindow().render();
  };

  const animationCB = function(){
    if (player.paused) {
      return;
    }

    const curIgt = streamSource.getIntegrationTime();
    var itgT = 0;
    if (curIgt < streamSource.getMaxItgTime()) {
      const cycleDurationSecs = 5;
      // Assume requestAnimationFrame is running at 60Hz.
      const incrm = streamSource.getMaxItgTime() / cycleDurationSecs / 60;
      itgT = curIgt + incrm;
    }
    ui.querySelector(`.${sliderClass}`).value = itgT;
    player.setTime(itgT);

    window.requestAnimationFrame(animationCB);
  };

  player.play = function(){
    player.paused = false;
    window.requestAnimationFrame(animationCB);
  };
  return player;
}

function newUI(streamSource, root) {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.bottom = "5%";
  container.style.width = "80%";
  container.style.display = "flex";
  root.appendChild(container);

  const playBtn = document.createElement("div");
  playBtn.classList.add(playBtnClass);
  playBtn.innerHTML = pauseIcon;
  playBtn.style.color = "white";
  container.appendChild(playBtn);

  const sliderContainer = document.createElement("div");
  sliderContainer.style.flex = "auto";
  sliderContainer.style.display = "flex";
  container.appendChild(sliderContainer);
  var slider = document.createElement("input");
  slider.classList.add(sliderClass);
  slider.type = "range";
  slider.min = 0;
  slider.max = streamSource.getMaxItgTime();
  slider.step = "any";
  slider.value = 0;
  slider.style.width = "100%";
  sliderContainer.appendChild(slider);

  return container;
}

function setUI(ui, player) {
  const playBtn = ui.querySelector(`.${playBtnClass}`);
  playBtn.addEventListener("click", function(e){
    if (player.paused) {
      playBtn.innerHTML = pauseIcon;
      player.play();
    } else {
      playBtn.innerHTML = playIcon;
      player.paused = true;
    }
  });

  const slider = ui.querySelector(`.${sliderClass}`);
  slider.addEventListener("input", function(e){
    player.setTime(parseFloat(slider.value));
  });
}

export function New(sceneLoader, root, idx) {
  const streamSource = editStream(sceneLoader, idx);
  if (!streamSource) {
    return;
  }
  const ui = newUI(streamSource, root);
  const player = newPlayer(sceneLoader, streamSource, ui); 
  setUI(ui, player);
  player.play();
}
