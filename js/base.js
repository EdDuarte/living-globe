/**
 * 3D Earth v1.0.0
 * Authors: Ed Duarte - eduardo.miguel.duarte@gmail.com // Pedro Bordonhos - bordonhos@ua.pt
 * Date: 23 April 2015
 */

// external data that maps gray luminosity values with ISO 3166-1 country codes
var countryColorMap;

// camera zoom & tween target variables used on "animate()" method to move the
// camera to the target (a country that was selected)
var cameraIsMovingToTarget = false;
var cameraTargetX = 0;
var cameraTargetY = 1000;
var cameraTargetZ = 500;
var cameraTargetLX = 0;
var cameraTargetLY = 0;
var cameraTargetLZ = 0;

// mouse interaction variables
var lastMouseX = 0;
var lastMouseY = 0;
var isSelectingCountry = false;
var projector = new THREE.Projector();
var mouse2D = new THREE.Vector3(0, 0, 0.5);

// fixed variables that are obtained when reading the CSV data
var countryData = [];
var countryRepresented = [];
var countryBox = [];
var maxPopulation = 0;
var maxDensity = 0;
var maxBirths = 0;
var maxDeaths = 0;

// to filter data, the selection min and max values is used to scale down values
// for each country:
// - reducing the selected max increases the normalized values until >= fixed
//   max (above), in which case they are removed from view
// - increasing the selected min decreases the normalized values until <= 0, in
//   which case they are removed from view
var selectedMinPopulation = 0;
var selectedMaxPopulation = 0;
var selectedMinDensity = 0;
var selectedMaxDensity = 0;
var selectedMinBirths = 0;
var selectedMaxBirths = 0;
var selectedMinDeaths = 0;
var selectedMaxDeaths = 0;

// list of country names and capitals, used for the auto complete field
var autoCompleteLookup;

// data type can be 0 (population), 1 (density), 2 (birth rate) and 3 (death rate)
var selectedDataType = 0;

// sliders setup, used to filter data
var sPopulation = $('#sliderPopulation');
sPopulation.on({
	slide: function(){
		var newRange = sPopulation.val();
		selectedMinPopulation = newRange[0];
		selectedMaxPopulation = newRange[1];
		rebuildBars(countryData);
	}
});
var sDensity = $('#sliderDensity');
sDensity.on({
	slide: function(){
		var newRange = sDensity.val();
		selectedMinDensity = newRange[0];
		selectedMaxDensity = newRange[1];
		rebuildBars(countryData);
	}
});
var sBirths = $('#sliderBirth');
sBirths.on({
	slide: function(){
		var newRange = sBirths.val();
		selectedMinBirths = newRange[0];
		selectedMaxBirths = newRange[1];
		rebuildBars(countryData);
	}
});
var sDeaths = $('#sliderDeath');
sDeaths.on({
	slide: function(){
		var newRange = sDeaths.val();
		selectedMinDeaths = newRange[0];
		selectedMaxDeaths = newRange[1];
		rebuildBars(countryData);
	}
});

// buttons that select what data should be presented in the bars
$('#buttonPopulation').click(function(){
	sPopulation.show();
	sDensity.hide();
	sBirths.hide();
	sDeaths.hide();
	selectedDataType = 0;
	rebuildBars(countryData);
});
$('#buttonDensity').click(function(){
	sPopulation.hide();
	sDensity.show();
	sBirths.hide();
	sDeaths.hide();
	selectedDataType = 1;
	rebuildBars(countryData);
});
$('#buttonBirth').click(function(){
	sPopulation.hide();
	sDensity.hide();
	sBirths.show();
	sDeaths.hide();
	selectedDataType = 2;
	rebuildBars(countryData);
});
$('#buttonDeath').click(function(){
	sPopulation.hide();
	sDensity.hide();
	sBirths.hide();
	sDeaths.show();
	selectedDataType = 3;
	rebuildBars(countryData);
});

// scene
var scene = new THREE.Scene();

// camera
var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.set(0,250,250);
cameraPos0 = camera.position.clone()
cameraUp0 = camera.up.clone()
cameraZoom = camera.position.z
scene.add(camera);

// renderer
var renderer;
if (Detector.webgl) {
	renderer = new THREE.WebGLRenderer({ antialias:false });
} else {
	renderer = new THREE.CanvasRenderer();
}
renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
renderer.sortObjects = false;
renderer.generateMipmaps = false;
renderer.setClearColor(0x000000);
worldContainer.appendChild(renderer.domElement);

// mouse events
THREEx.WindowResize(renderer, camera);
// THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
renderer.domElement.addEventListener('mousewheel', onMouseWheel);
renderer.domElement.addEventListener('DOMMouseScroll', onMouseWheel);
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mouseup', onMouseUp);

// controls (OrbitControls with damping)
var controls = new THREE.OrbitControls(camera, worldIntercept);
controls.dynamicDampingFactor = 0.5;

// lights
var light1 = new THREE.PointLight(0xffffff);
light1.position.set(100,250,100);
scene.add(light1);
var light2 = new THREE.AmbientLight(0xffffff);
light2.position.set(100,250,100);
scene.add(light2);

// skybox
var imagePrefix = "img/nebula-",
directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"],
imageSuffix = ".png",
materialArray = [];
for (var i = 0; i < 6; i++)
	materialArray.push(new THREE.MeshBasicMaterial({
		map: THREE.ImageUtils.loadTexture(imagePrefix + directions[i] + imageSuffix),
		side: THREE.BackSide
	}));
var skyBox = new THREE.Mesh(new THREE.CubeGeometry(5000, 5000, 5000),
	new THREE.MeshFaceMaterial(materialArray));
scene.add(skyBox);


// "ratio texture", which contains colored pixels for each country
var ratioCanvas = document.createElement('canvas');
ratioCanvas.width = 256;
ratioCanvas.height = 1;
var ratioContext = ratioCanvas.getContext('2d');
var ratioTexture = new THREE.Texture(ratioCanvas);
ratioTexture.magFilter = THREE.NearestFilter;
ratioTexture.minFilter = THREE.NearestFilter;
ratioTexture.needsUpdate = true;

// "select texture", which fills pixels in white for the selected country
var selectCanvas = document.createElement('canvas');
selectCanvas.width = 256;
selectCanvas.height = 1;
var selectContext = selectCanvas.getContext('2d');
var selectTexture = new THREE.Texture(selectCanvas);
selectTexture.magFilter = THREE.NearestFilter;
selectTexture.minFilter = THREE.NearestFilter;
selectTexture.needsUpdate = true;

// lookup texture, where each country is colored with a different luminosity of
// gray. the country can be identified using the countryColorMap JSON file
var mapTexture = THREE.ImageUtils.loadTexture("img/earth-index-shifted-gray.png");
mapTexture.magFilter = THREE.NearestFilter;
mapTexture.minFilter = THREE.NearestFilter;
mapTexture.needsUpdate = true;

// satellite texture, used for aesthetic purposes only
var blendImage = THREE.ImageUtils.loadTexture("img/earth-day.jpg");

// the final material for the world object merges multiple layered textures
var planeMaterial = new THREE.ShaderMaterial({
	uniforms: {
		width:      { type: "f", value: window.innerWidth },
		height:     { type: "f", value: window.innerHeight },
		mapIndex:   { type: "t", value: mapTexture },
		outline:    { type: "t", value: 2 },
		ratio:     { type: "t", value: ratioTexture },
		select:     { type: "t", value: selectTexture },
		blendImage: { type: "t", value: blendImage }
	},
	vertexShader:   document.getElementById('globeVertexShader').textContent,
	fragmentShader: document.getElementById('globeFragmentShader').textContent
});

// world / sphere object
var geometry = new THREE.SphereGeometry(100, 64, 32);
var mesh = new THREE.Mesh(geometry, planeMaterial);
mesh.position.set(0,0,0);
scene.add(mesh);

// the map canvas, used to obtain the luminosity value of the lookup texture
var mapCanvas = document.createElement('canvas');
mapCanvas.width = 4096;
mapCanvas.height = 2048;
var mapContext = mapCanvas.getContext('2d');
var imageObj = new Image();
imageObj.onload = function() {
	mapContext.drawImage(imageObj, 0, 0);
};
imageObj.src = 'img/earth-index-shifted-gray.png';

// post-processing flag
renderer.autoClear = false;

// anti-aliasing setup
var composer = new THREE.EffectComposer(renderer);
var renderModel = new THREE.RenderPass(scene, camera);
var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
var width = window.innerWidth || 2;
var height = window.innerHeight || 2;
effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);

var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
effectCopy.renderToScreen = true;

composer.addPass(renderModel);
composer.addPass(effectFXAA);
composer.addPass(effectCopy);

var searchfield = $('#searchfield');

$.getJSON('iso3166_gray_codes.json', function(json) {
	countryColorMap = json;

	// reads data from the csv file "data.csv" using ajax
	$(document).ready(function() {
		$.ajax({
			type: "GET",
			url: "data.csv",
			dataType: "text",
			success: function(data) {
				countryData = CSVToArray(data);
				analyseData();
				searchfield.on('focus', function() {
					var $this = $(this)
					.one('mouseup.mouseupSelect', function() {
						$this.select();
						return false;
					})
					.one('mousedown', function() {
           				// compensate for untriggered 'mouseup' caused by focus via tab
           				$this.off('mouseup.mouseupSelect');
           			})
					.select();
				}).val("").devbridgeAutocomplete({
					minChars: 1,
					width: 430,
					autoSelectFirst: true,
					triggerSelectOnValidInput: false,
					preventBadQueries: false,
					lookup: autoCompleteLookup,
					onSelect: function (suggestion) {
						select(suggestion.data);
						// searchfield.blur();
					}
				});
				rebuildBars(countryData);
			}
		});
	});
});

// start animation loop
animate();


// --- FUNCTIONS ---

// function that analyses data in the array "countryData" to discover the
// maximum and minimum population, density, birth-rate and death-rate. These
// values are used to produce normalized scales on the function "rebuildBars"
// and to setup the filter sliders
function analyseData() {

	// data is listed in a second array with the format
	// [{value: capital + country name, data: ISO-3166 country code}, ...],
	// which is then used as the input of dev-bridge auto-complete plugin
	autoCompleteLookup = [];

	for (var i = 1; i < countryData.length-1; i++) {
		var c = countryData[i];

		// add country names and capitals to be used on auto complete search field
		autoCompleteLookup.push({ value: c[1] + " (" + c[0] + ")", data: c[15] });

		var population = parseInt(c[5]);
		var density = parseInt(c[6]);
		var births = parseInt(c[8]);
		var deaths = parseInt(c[12]);

		// finds the maximum population
		if (maxPopulation < population) {
			maxPopulation = population;
		}

		// finds the maximum density
		if (maxDensity < density) {
			maxDensity = density;
		}

		// finds the maximum birth-rate
		if (maxBirths < births) {
			maxBirths = births;
		}

		// finds the maximum death-rate
		if (maxDeaths < deaths) {
			maxDeaths = deaths;
		}
	}

	selectedMinPopulation = 0;
	selectedMaxPopulation = maxPopulation;
	selectedMinDensity = 0;
	selectedMaxDensity = maxDensity;
	selectedMinBirths = 0;
	selectedMaxBirths = maxBirths;
	selectedMinDeaths = 0;
	selectedMaxDeaths = maxDeaths;

	// setup the range for the sliders, based on the obtained max values
	sPopulation.noUiSlider({
		start: [selectedMinPopulation, selectedMaxPopulation],
		orientation: 'vertical',
		direction: 'rtl',
		steps: maxPopulation,
		connect: true,
		range: {
			'min': 0,
			'max': maxPopulation
		}
	}, true);
	sPopulation.noUiSlider_pips({
		mode: 'steps',
		density: 5
	});
	sDensity.noUiSlider({
		start: [selectedMinDensity, selectedMaxDensity],
		orientation: 'vertical',
		direction: 'rtl',
		steps: 10,
		connect: true,
		range: {
			'min': 0,
			'max': maxDensity
		}
	}, true);
	sDensity.noUiSlider_pips({
		mode: 'steps',
		density: 5
	});
	sBirths.noUiSlider({
		start: [selectedMinBirths, selectedMaxBirths],
		orientation: 'vertical',
		direction: 'rtl',
		steps: 10,
		connect: true,
		range: {
			'min': 0,
			'max': maxBirths
		}
	}, true);
	sBirths.noUiSlider_pips({
		mode: 'steps',
		density: 5
	});
	sDeaths.noUiSlider({
		start: [selectedMinDeaths, selectedMaxDeaths],
		orientation: 'vertical',
		direction: 'rtl',
		steps: 10,
		connect: true,
		range: {
			'min': 0,
			'max': maxDeaths
		}
	}, true);
	sDeaths.noUiSlider_pips({
		mode: 'steps',
		density: 5
	});
}

function onMouseMove(event) {
	event.preventDefault();

	mouse2D.x =   (event.clientX / window.innerWidth) * 2 - 1;
	mouse2D.y = - (event.clientY / window.innerHeight) * 2 + 1;

	// xdiff and ydiff represent the mouse distance between the current mouse
	// position and the mouse position when the mouse button was last pressed
	var xdiff = lastMouseX - mouse2D.x;
	if(xdiff < 0) {
		xdiff = -xdiff;
	}

	var ydiff = lastMouseY - mouse2D.y;
	if(ydiff < 0) {
		ydiff = -ydiff;
	}

	// if the distance measured above exceeds 0.05, mouseUp measures to check
	// intersecting bars or countries is ignored, since it could have been a
	// mouse drag instead of a mouse click
	if(xdiff > 0.05 || ydiff > 0.05) {
		isSelectingCountry = false;
	} else {
		isSelectingCountry = true;
	}
}

function onMouseWheel(event) {
	cameraIsMovingToTarget = false;
}

function onMouseDown(event) {
	event.preventDefault();

	lastMouseX =   (event.clientX / window.innerWidth) * 2 - 1;
	lastMouseY = - (event.clientY / window.innerHeight) * 2 + 1;

	isSelectingCountry = true;
	cameraIsMovingToTarget = false;
}

function onMouseUp(event) {
	event.preventDefault();

	mouse2D.x =   (event.clientX / window.innerWidth) * 2 - 1;
	mouse2D.y = - (event.clientY / window.innerHeight) * 2 + 1;

	if(!isSelectingCountry){
		return;
	}
	var rayCaster = projector.pickingRay(mouse2D.clone(), camera);
	var selectedABar = false;

	for (var i = 0; i < countryBox.length; i++) {
		var selectedObject = countryBox[i];
		var intersects = rayCaster.intersectObject(selectedObject);
		if (intersects.length) {
			// mouse click intersected the bar i, so select it and the corresponding country
			cameraTargetX = selectedObject.position.x;
			cameraTargetY = selectedObject.position.y;
			cameraTargetZ = selectedObject.position.z;
			cameraIsMovingToTarget = true;
			var c = countryRepresented[i];
			detailsContainer.innerHTML = getDetails(c);
			var countryCode = c[15];
			var countryColor = countryColorMap[countryCode];
			if(countryColor != 0) {
				selectContext.clearRect(0,0,256,1);
				selectContext.fillStyle = "#666666";
				selectContext.fillRect(countryColor, 0, 1, 1);
				selectTexture.needsUpdate = true;
				selectedABar = true;
				searchfield.blur();
			}
		}
	}

	if(!selectedABar) {
		// mouse did not intersect a bar, so check if it intersected a country
		var countryColor = -1;
		var intersectionList = rayCaster.intersectObject(mesh);
		if (intersectionList.length > 0) {
			data = intersectionList[0];
			var d = data.point.clone().normalize();
			var u = Math.round(4096 * (1 - (0.5 + Math.atan2(d.z, d.x) / (2 * Math.PI))));
			var v = Math.round(2048 * (0.5 - Math.asin(d.y) / Math.PI));
			var p = mapContext.getImageData(u,v,1,1).data;
			countryColor = p[0];
			if(countryColor != 0) { // countryColor == 0 is the sea, so we ignore it

				// a country was clicked, but we need to ignore it if its details were filtered
				var hasDetails = false;
				for (var i = 0; i < countryRepresented.length; i++) {
					var c = countryRepresented[i];
					var countryCode = c[15];
					if(countryColorMap[countryCode] == countryColor) {
						// the country was clicked and had details, so select it
						detailsContainer.innerHTML = getDetails(c);
						var selectedObject = countryBox[i];
						cameraTargetX = selectedObject.position.x;
						cameraTargetY = selectedObject.position.y;
						cameraTargetZ = selectedObject.position.z;
						cameraIsMovingToTarget = true;
						hasDetails = true;
						break;
					}
				}

				if(hasDetails) {
					selectContext.clearRect(0,0,256,1);
					selectContext.fillStyle = "#666666";
					selectContext.fillRect(countryColor, 0, 1, 1);
					selectTexture.needsUpdate = true;
					searchfield.blur();
				}
			}

		}
	}
}

// function that returns text details for a given country
function getDetails(countryLine) {
	text = "<h1>" + countryLine[1] + "</h1><h4>(" +countryLine[0] + ")</h4>" +
	"<h5><span>" + numeral(countryLine[4]).format('0,0') + " km²</span></h5>" +
	"<h5>Population <span class='label label-info'>" + numeral(countryLine[5]).format('0,0') + "</span></h5>" +
	"<h5>Density <span class='label label-primary'>" + numeral(countryLine[6]).format('0,0') + "</span></h5>" +
	"<h5>Births <span class='label label-success'>" + numeral(countryLine[8]).format('0,0') + "</span></h5>" +
	"<h5>Deaths <span class='label label-warning'>" + numeral(countryLine[12]).format('0,0') + "</span></h5>";
	return text;
}

// function that select a country with the specified ISO-3166 country code (used by auto-complete)
function select(countryCodeToSelect) {
	if(countryColor != 0) {
		for (var i = 0; i < countryRepresented.length; i++) {
			var c = countryRepresented[i];
			var countryCode = c[15];
			if(countryCode == countryCodeToSelect) {
				var selectedObject = countryBox[i];
				cameraTargetX = selectedObject.position.x;
				cameraTargetY = selectedObject.position.y;
				cameraTargetZ = selectedObject.position.z;
				cameraIsMovingToTarget = true;
				detailsContainer.innerHTML = getDetails(c);
				hasDetails = true;
				break;
			}
		}

		if(hasDetails) {
			var countryColor = countryColorMap[countryCode];
			selectContext.clearRect(0,0,256,1);
			selectContext.fillStyle = "#666666";
			selectContext.fillRect(countryColor, 0, 1, 1);
			selectTexture.needsUpdate = true;
		}
	}
}

// function that rebuilds (or, if they didn't exist before, creates) all of the
// bars shown on the globe according to new selection boundaries (different
// selected max and min values or different shown type)
function rebuildBars(countryData) {

	// remove previous bars
	for (var i = 0 ; i < countryBox.length; i++) {
		scene.remove(countryBox[i])
	}

	// clears all colored countries
	ratioContext.clearRect(0,0,256,1);

	// arrays that will contain all our new bars
	countryRepresented = [];
	countryBox = [];
	var ratioArray = [];
	var countryCodeArray = [];

	for (var i = 1; i < countryData.length-1; i++) {

		var c = countryData[i];

		// get the data, and set the offset, we need to do this since the x,y coordinates
		var countryCode = c[15];
		var lat = parseInt(c[2]);
		var lon = parseInt(c[3]);
		var population = parseInt(c[5]);
		var density = parseInt(c[6]);
		var births = parseInt(c[8]);
		var birthPerSecond = parseInt(c[9]);
		var deaths = parseInt(c[12]);

		var value = 0;

		if (selectedDataType == 0 && population >= selectedMinPopulation && population <= selectedMaxPopulation) {
			value = scaleDown(selectedMinPopulation, selectedMaxPopulation, 0, 95, population);

		} else if (selectedDataType == 1 && density >= selectedMinDensity && density <= selectedMaxDensity) {
			value = scaleDown(selectedMinDensity, selectedMaxDensity, 0, 95, density);

		} else if (selectedDataType == 2 && births >= selectedMinBirths && births <= selectedMaxBirths) {
			value = scaleDown(selectedMinBirths, selectedMaxBirths, 0, 95, births);

		} else if (selectedDataType == 3 && deaths >= selectedMinDeaths && deaths <= selectedMaxDeaths) {
			value = scaleDown(selectedMinDeaths, selectedMaxDeaths, 0, 95, deaths);
		}

		if (value == 0) {
			// if the value has been scaled down to 0, do not show bar and
			// color, and remove interaction
			continue;
		}

		ratioArray.push(births - deaths);
		countryCodeArray.push(countryCode);

		// find the color of the bar for the capital, which is a color picked
		// from a gradient of yellow to blue associated with a scale between 0
		// and 1. This value within that scale is obtained by scaling down the
		// density value.
		var scaledDensity = scaleDown(selectedMinDensity, selectedMaxDensity, 0, 1, density);
		var scale = chroma.scale(['#D4B36A', '#505F8F']); 
		var barColor = scale(scaledDensity).hex();

		// setup the bar material with the obtained color above
		var barMat = new THREE.MeshBasicMaterial({ color: barColor, wireframe: false});

		// a CubeGeometry is used for the bar geometry instead of a BoxGeometry
		// because we are using a old version of three.js (version 62)
		var barGeom = new THREE.CubeGeometry(0.5, 0.5, value);
		var mesh = new THREE.Mesh(barGeom, barMat);


		// converts the country capital lat-lng position into a vector in the
		// three-dimensional space
		var position = latLongToVector3(lat, lon, 100, 1);
		mesh.position.x = position.x;
		mesh.position.y = position.y;
		mesh.position.z = position.z;
		mesh.lookAt(new THREE.Vector3(0,0,0));

		// the bar is added to the scene and lookup-array
		scene.add(mesh);
		countryBox.push(mesh);
		countryRepresented.push(c);
	}

	var maxRatio = Math.max.apply(Math, ratioArray);
	var minRatio = Math.min.apply(Math, ratioArray);
	for(var i = 0; i < ratioArray.length; i++) {
		var ratio = ratioArray[i];
		var code = countryCodeArray[i];
		var scaleValue = scaleDown(minRatio, maxRatio, 0, 1, ratio);
		var scale = chroma.scale(['#AA4439', '#2B803E']);
		var color = scale(scaleValue).hex();
		colorCountry(countryColorMap[code], color);
	}
}

// function that colors a country with the specified ISO-3166 code with the
// specified color
function colorCountry(countryCode, color) {
	ratioContext.fillStyle = color;
	ratioContext.fillRect(countryCode, 0, 1, 1);
	ratioTexture.needsUpdate = true;
}

// utility function that converts latitude and longitude variables to a vector
// in the three-dimensional space, according to a specific radius. For this
// implementation, the radius of the sphere is 100.
function latLongToVector3(lat, lon, radius, heigth) {
	var phi = (lat) * Math.PI / 180;
	var theta = (lon-180) * Math.PI / 180;

	var x = -(radius+heigth) * Math.cos(phi) * Math.cos(theta);
	var y = (radius+heigth) * Math.sin(phi);
	var z = (radius+heigth) * Math.cos(phi) * Math.sin(theta);

	return new THREE.Vector3(x,y,z);
}

// utility function that scales down a input value that exists within a range
// [oldMin, oldMax] to fit in a new range [newMin, newMax]
function scaleDown(oldMin, oldMax, newMin, newMax, input) {
	var percent = (input - oldMin) / (oldMax - oldMin);
	return percent * (newMax - newMin) + newMin;
}

// three.js animation function that is recursively called using
// "requestAnimationFrame". Every time this function is executed, we check if
// the camera should be moving to a target and if it is positioned on top of
// said target. If not, then move the camera 0.1 pixels in its direction.
function animate() {
	if(cameraIsMovingToTarget && (cameraTargetX != camera.position.x || cameraTargetY != camera.position.y || cameraTargetZ != camera.position.z)) {
		moveCamera();
	} else {
		cameraIsMovingToTarget = false;
	}
	if (camera.position.length() < 300) camera.position.setLength(300);
	if (camera.position.length() > 1000) camera.position.setLength(1000);

	requestAnimationFrame(animate);
	render();
	controls.update();
}

// function that sets a new target for the camera
function moveCamera() {
	var speed = 0.1;
	var target_x = (cameraTargetX - camera.position.x) * speed;
	var target_y = (cameraTargetY - camera.position.y) * speed;
	var target_z = (cameraTargetZ - camera.position.z) * speed;

	camera.position.x += target_x;
	camera.position.y += target_y;
	camera.position.z += target_z;

	camera.lookAt({x: cameraTargetLX, y: 0, z: cameraTargetLZ });
}

// three.js render function that is recursively called
function render() {
	skyBox.rotation.y += 0.0003;
	renderer.clear();
	renderer.render(scene, camera);
	composer.render();
}
