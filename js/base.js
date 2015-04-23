/**
 * 3D Earth v1.0.0
 * Authors: Ed Duarte - eduardo.miguel.duarte@gmail.com // Pedro Bordonhos - bordonhos@ua.pt
 * Date: 23 April 2015
 */

// external data that maps gray luminosity values with ISO 3166-1 country codes
var countryColorMap = {
	"PE":1, "BF":2,"FR":3,"LY":4,"BY":5,"PK":6,"ID":7,"YE":8,"MG":9,"BO":10,
	"CI":11,"DZ":12,"CH":13,"CM":14,"MK":15,"BW":16,"UA":17,"KE":18,"TW":19,
	"JO":20,"MX":21,"AE":22,"BZ":23,"BR":24,"SL":25,"ML":26,"CD":27,"IT":28,
	"SO":29,"AF":30,"BD":31,"DO":32,"GW":33,"GH":34,"AT":35,"SE":36,"TR":37,
	"UG":38,"MZ":39,"JP":40,"NZ":41,"CU":42,"VE":43,"PT":44,"CO":45,"MR":46,
	"AO":47,"DE":48,"SD":49,"TH":50,"AU":51,"PG":52,"IQ":53,"HR":54,"GL":55,
	"NE":56,"DK":57,"LV":58,"RO":59,"ZM":60,"IR":61,"MM":62,"ET":63,"GT":64,
	"SR":65,"EH":66,"CZ":67,"TD":68,"AL":69,"FI":70,"SY":71,"KG":72,"SB":73,
	"OM":74,"PA":75,"AR":76,"GB":77,"CR":78,"PY":79,"GN":80,"IE":81,"NG":82,
	"TN":83,"PL":84,"NA":85,"ZA":86,"EG":87,"TZ":88,"GE":89,"SA":90,"VN":91,
	"RU":92,"HT":93,"BA":94,"IN":95,"CN":96,"CA":97,"SV":98,"GY":99,"BE":100,
	"GQ":101,"LS":102,"BG":103,"BI":104,"DJ":105,"AZ":106,"MY":107,"PH":108,
	"UY":109,"CG":110,"RS":111,"ME":112,"EE":113,"RW":114,"AM":115,"SN":116,
	"TG":117,"ES":118,"GA":119,"HU":120,"MW":121,"TJ":122,"KH":123,"KR":124,
	"HN":125,"IS":126,"NI":127,"CL":128,"MA":129,"LR":130,"NL":131,"CF":132,
	"SK":133,"LT":134,"ZW":135,"LK":136,"IL":137,"LA":138,"KP":139,"GR":140,
	"TM":141,"EC":142,"BJ":143,"SI":144,"NO":145,"MD":146,"LB":147,"NP":148,
	"ER":149,"US":150,"KZ":151,"AQ":152,"SZ":153,"UZ":154,"MN":155,"BT":156,
	"NC":157,"FJ":158,"KW":159,"TL":160,"BS":161,"VU":162,"FK":163,"GM":164,
	"QA":165,"JM":166,"CY":167,"PR":168,"PS":169,"BN":170,"TT":171,"CV":172,
	"PF":173,"WS":174,"LU":175,"KM":176,"MU":177,"FO":178,"ST":179,"AN":180,
	"DM":181,"TO":182,"KI":183,"FM":184,"BH":185,"AD":186,"MP":187,"PW":188,
	"SC":189,"AG":190,"BB":191,"TC":192,"VC":193,"LC":194,"YT":195,"VI":196,
	"GD":197,"MT":198,"MV":199,"KY":200,"KN":201,"MS":202,"BL":203,"NU":204,
	"PM":205,"CK":206,"WF":207,"AS":208,"MH":209,"AW":210,"LI":211,"VG":212,
	"SH":213,"JE":214,"AI":215,"MF_1_":216,"GG":217,"SM":218,"BM":219,"TV":220,
	"NR":221,"GI":222,"PN":223,"MC":224,"VA":225,"IM":226,"GU":227,"SG":228
};

CAMERA_SHOULD_MOVE = false;
CAMERA_X    = 0;
CAMERA_Y    = 1000;
CAMERA_Z    = 500;
CAMERA_LX   = 0;
CAMERA_LY   = 0;
CAMERA_LZ   = 0;

// global variables
var lastMouseX = 0;
var lastMouseY = 0;
var selectCountry = false;
var countryData = [];
var countryRepresented = [];
var countryBox = [];
var maxPopulation = 0;
var maxDensity = 0;
var maxBirths = 0;
var maxDeaths = 0;
var selectedMinPopulation = 0;
var selectedMaxPopulation = 0;
var selectedMinDensity = 0;
var selectedMaxDensity = 0;
var selectedMinBirths = 0;
var selectedMaxBirths = 0;
var selectedMinDeaths = 0;
var selectedMaxDeaths = 0;

var camera       // camera
var cameraPos0   // initial camera position
var cameraUp0    // initial camera up
var cameraZoom   // camera zoom
var iniQ         // initial quaternion
var endQ         // target quaternion
var curQ         // temp quaternion during slerp
var vec3         // generic vector object
var tweenValue   // tweenable value 

// list of country names and capitals used for auto complete
var autoCompleteLookup;

// data type can be 0 (population), 1 (density), 2 (birth rate) and 3 (death rate)
var selectedDataType = 0;

// setup sliders
var sPopulation = $('#sliderPopulation');
sPopulation.on({
	slide: function(){
		var newRange = sPopulation.val();
		selectedMinPopulation = newRange[0];
		selectedMaxPopulation = newRange[1];
		filterData(countryData);
	}
});
var sDensity = $('#sliderDensity');
sDensity.on({
	slide: function(){
		var newRange = sDensity.val();
		selectedMinDensity = newRange[0];
		selectedMaxDensity = newRange[1];
		filterData(countryData);
	}
});
var sBirths = $('#sliderBirth');
sBirths.on({
	slide: function(){
		var newRange = sBirths.val();
		selectedMinBirths = newRange[0];
		selectedMaxBirths = newRange[1];
		filterData(countryData);
	}
});
var sDeaths = $('#sliderDeath');
sDeaths.on({
	slide: function(){
		var newRange = sDeaths.val();
		selectedMinDeaths = newRange[0];
		selectedMaxDeaths = newRange[1];
		filterData(countryData);
	}
});

$('#buttonPopulation').click(function(){
	sPopulation.show();
	sDensity.hide();
	sBirths.hide();
	sDeaths.hide();
	selectedDataType = 0;
	filterData(countryData);
});
$('#buttonDensity').click(function(){
	sPopulation.hide();
	sDensity.show();
	sBirths.hide();
	sDeaths.hide();
	selectedDataType = 1;
	filterData(countryData);
});
$('#buttonBirth').click(function(){
	sPopulation.hide();
	sDensity.hide();
	sBirths.show();
	sDeaths.hide();
	selectedDataType = 2;
	filterData(countryData);
});
$('#buttonDeath').click(function(){
	sPopulation.hide();
	sDensity.hide();
	sBirths.hide();
	sDeaths.show();
	selectedDataType = 3;
	filterData(countryData);
});

var projector = new THREE.Projector();
var mouse2D = new THREE.Vector3(0, 0, 0.5);

// scene
var scene = new THREE.Scene();

// camera
var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
var camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.set(0,250,250);
// camera.position = new THREE.Vector3(0, 0, 80)
cameraPos0 = camera.position.clone()
cameraUp0 = camera.up.clone()
cameraZoom = camera.position.z
// camera.lookAt(scene.position);
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

// mouse events
THREEx.WindowResize(renderer, camera);
// THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
renderer.domElement.addEventListener('mousewheel', onMouseWheel);
renderer.domElement.addEventListener('DOMMouseScroll', onMouseWheel);
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mouseup', onMouseUp);

// controls
worldContainer.appendChild(renderer.domElement);
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
	materialArray.push( new THREE.MeshBasicMaterial({
		map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
		side: THREE.BackSide
	}));
var skyBox = new THREE.Mesh(new THREE.CubeGeometry( 5000, 5000, 5000 ), new THREE.MeshFaceMaterial( materialArray ));
scene.add(skyBox);


// "ratio texture", which contains a colored pixel for each country
//  -- the pixel at (x,1) is the color of the country labelled with gray RGB_Color(x,x,x,1).
var ratioCanvas = document.createElement('canvas');
ratioCanvas.width = 256;
ratioCanvas.height = 1;
var ratioContext = ratioCanvas.getContext('2d');
var ratioTexture = new THREE.Texture(ratioCanvas);
ratioTexture.magFilter = THREE.NearestFilter;
ratioTexture.minFilter = THREE.NearestFilter;
ratioTexture.needsUpdate = true;

// "select texture", which fills a pixel for the selected country
var selectCanvas = document.createElement('canvas');
selectCanvas.width = 256;
selectCanvas.height = 1;
var selectContext = selectCanvas.getContext('2d');
var selectTexture = new THREE.Texture(selectCanvas);
selectTexture.magFilter = THREE.NearestFilter;
selectTexture.minFilter = THREE.NearestFilter;
selectTexture.needsUpdate = true;

var mapTexture = THREE.ImageUtils.loadTexture("img/earth-index-shifted-gray.png");
mapTexture.magFilter = THREE.NearestFilter;
mapTexture.minFilter = THREE.NearestFilter;
mapTexture.needsUpdate = true;

var blendImage = THREE.ImageUtils.loadTexture("img/earth-day.jpg");

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
	vertexShader:   document.getElementById( 'globeVertexShader'   ).textContent,
	fragmentShader: document.getElementById( 'globeFragmentShader' ).textContent
});

// world / sphere object
var geometry = new THREE.SphereGeometry(100, 64, 32);
var mesh = new THREE.Mesh( geometry, planeMaterial );
mesh.position.set(0,0,0);
scene.add(mesh);

var mapCanvas = document.createElement('canvas');
mapCanvas.width = 4096;
mapCanvas.height = 2048;
var mapContext = mapCanvas.getContext('2d');
var imageObj = new Image();
imageObj.onload = function() {
	mapContext.drawImage(imageObj, 0, 0);
};
imageObj.src = 'img/earth-index-shifted-gray.png';

// post-processing
renderer.autoClear = false;

// anti-aliasing
var composer = new THREE.EffectComposer( renderer );

var renderModel = new THREE.RenderPass( scene, camera );

var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
var width = window.innerWidth || 2;
var height = window.innerHeight || 2;
effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width, 1 / height );

var effectCopy = new THREE.ShaderPass( THREE.CopyShader );
effectCopy.renderToScreen = true;

composer.addPass( renderModel );
composer.addPass( effectFXAA );
composer.addPass( effectCopy );

// Initialize data

$(document).ready(function() {
	$.ajax({
		type: "GET",
		url: "data.csv",
		dataType: "text",
		success: function(data) {
			countryData = CSVToArray(data);
			analyseData();
			$('#searchfield').val("").devbridgeAutocomplete({
				minChars: 1,
				autoSelectFirst: true,
				triggerSelectOnValidInput: false,
				preventBadQueries: false,
				lookup: autoCompleteLookup,
				onSelect: function (suggestion) {
					select(suggestion.data);
				}
			});
			filterData(countryData);
		}
	});
});

animate();

function analyseData() {
	// get all max values to have normalized scales
	var birthsArray = [];
	var deathsArray = [];
	autoCompleteLookup = [];
	for (var i = 1; i < countryData.length-1; i++) {
		var c = countryData[i];

		// add country names and capitals to be used on auto complete search field
		autoCompleteLookup.push({ value: c[1] + " (" + c[0] + ")", data: c[15] });

		var population = parseInt(c[5]);
		var density = parseInt(c[6]);
		var births = parseInt(c[8]);
		var deaths = parseInt(c[12]);

		if (maxPopulation < population) {
			maxPopulation = population;
		}

		if (maxDensity < density) {
			maxDensity = density;
		}

		birthsArray.push(births);
		deathsArray.push(deaths);
	}

	maxBirths = Math.max.apply(Math, birthsArray);
	maxDeaths = Math.max.apply(Math, deathsArray);

	selectedMinPopulation = 0;
	selectedMaxPopulation = maxPopulation;
	selectedMinDensity = 0;
	selectedMaxDensity = maxDensity;
	selectedMinBirths = 0;
	selectedMaxBirths = maxBirths;
	selectedMinDeaths = 0;
	selectedMaxDeaths = maxDeaths;

	// get the range for the sliders based on the max values
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


// set a new target for the camera
function moveCamera() {
	var speed = 0.1;
	var target_x = (this.CAMERA_X - this.camera.position.x) * speed;
	var target_y = (this.CAMERA_Y - this.camera.position.y) * speed;
	var target_z = (this.CAMERA_Z - this.camera.position.z) * speed;

	camera.position.x += target_x;
	camera.position.y += target_y;
	camera.position.z += target_z;

	camera.lookAt( {x: CAMERA_LX, y: 0, z: CAMERA_LZ } );
}

function onMouseMove(event) {
	event.preventDefault();

	mouse2D.x =   ( event.clientX / window.innerWidth  ) * 2 - 1;
	mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	var xdiff = lastMouseX - mouse2D.x;
	if(xdiff < 0) {
		xdiff = -xdiff;
	}

	var ydiff = lastMouseY - mouse2D.y;
	if(ydiff < 0) {
		ydiff = -ydiff;
	}

	if(xdiff > 0.05 || ydiff > 0.05) {
		// it was a mouse drag, ignore and skip click event
		selectCountry = false;
	} else {
		selectCountry = true;
	}
}

function onMouseWheel(event) {
	CAMERA_SHOULD_MOVE = false;
}

function onMouseDown(event) {
	event.preventDefault();

	lastMouseX =   ( event.clientX / window.innerWidth  ) * 2 - 1;
	lastMouseY = - ( event.clientY / window.innerHeight ) * 2 + 1;

	selectCountry = true;
	CAMERA_SHOULD_MOVE = false;
}

function select(countryCodeToSelect) {
	if(countryColor != 0) {
		for (var i = 0; i < countryRepresented.length; i++) {
			var c = countryRepresented[i];
			var countryCode = c[15];
			if(countryCode == countryCodeToSelect) {
				var selectedObject = countryBox[i];
				CAMERA_X = selectedObject.position.x;
				CAMERA_Y = selectedObject.position.y;
				CAMERA_Z = selectedObject.position.z;
				CAMERA_SHOULD_MOVE = true;
				detailsContainer.innerHTML = getDetails(c);
				hasDetails = true;
				break;
			}
		}

		if(hasDetails) {
			var countryColor = countryColorMap[countryCode];
			selectContext.clearRect(0,0,256,1);
			selectContext.fillStyle = "#666666";
			selectContext.fillRect( countryColor, 0, 1, 1 );
			selectTexture.needsUpdate = true;
		}
	}
}

function onMouseUp(event) {
	event.preventDefault();

	mouse2D.x =   ( event.clientX / window.innerWidth  ) * 2 - 1;
	mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	if(!selectCountry){
		return;
	}
	var rayCaster = projector.pickingRay(mouse2D.clone(), camera);
	var selectedABar = false;

	for (var i = 0; i < countryBox.length; i++) {
		var selectedObject = countryBox[i];
		var intersects = rayCaster.intersectObject(selectedObject);
		if (intersects.length) {
			// mouse click intersected the bar i, so select it and the corresponding country
			CAMERA_X = selectedObject.position.x;
			CAMERA_Y = selectedObject.position.y;
			CAMERA_Z = selectedObject.position.z;
			CAMERA_SHOULD_MOVE = true;
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
			}
		}
	}

	if(!selectedABar) {
		// mouse did not intersect a bar, so check if it intersected a country
		var countryColor = -1;
		var intersectionList = rayCaster.intersectObject( mesh );
		if (intersectionList.length > 0) {
			data = intersectionList[0];
			var d = data.point.clone().normalize();
			var u = Math.round(4096 * (1 - (0.5 + Math.atan2(d.z, d.x) / (2 * Math.PI))));
			var v = Math.round(2048 * (0.5 - Math.asin(d.y) / Math.PI));
			var p = mapContext.getImageData(u,v,1,1).data;
			countryColor = p[0];
			if(countryColor != 0) { // countryColor == 0 is the sea
				// a country was clicked, but we need to ignore it if its details were filtered
				var hasDetails = false;
				for (var i = 0; i < countryRepresented.length; i++) {
					var c = countryRepresented[i];
					var countryCode = c[15];
					if(countryColorMap[countryCode] == countryColor) {
						// the country was clicked and had details, so select it
						detailsContainer.innerHTML = getDetails(c);
						var selectedObject = countryBox[i];
						CAMERA_X = selectedObject.position.x;
						CAMERA_Y = selectedObject.position.y;
						CAMERA_Z = selectedObject.position.z;
						CAMERA_SHOULD_MOVE = true;
						hasDetails = true;
						break;
					}
				}

				if(hasDetails) {
					selectContext.clearRect(0,0,256,1);
					selectContext.fillStyle = "#666666";
					selectContext.fillRect( countryColor, 0, 1, 1 );
					selectTexture.needsUpdate = true;
				}
			}

		}
	}
}

function getDetails(countryLine) {
	text = "<h1>" + countryLine[1] + "</h1><h4>(" +countryLine[0] + ")</h4>" +
	"<h5><span>" + numeral(countryLine[4]).format('0,0') + " km²</span></h5>" +
	"<h5>Population <span class='label label-info'>" + numeral(countryLine[5]).format('0,0') + "</span></h5>" +
	"<h5>Density <span class='label label-primary'>" + numeral(countryLine[6]).format('0,0') + "</span></h5>" +
	"<h5>Births <span class='label label-success'>" + numeral(countryLine[8]).format('0,0') + "</span></h5>" +
	"<h5>Deaths <span class='label label-warning'>" + numeral(countryLine[12]).format('0,0') + "</span></h5>";
	return text;
}

function filterData(countryData) {

	// remove previous cubes
	for (var i = 0 ; i < countryBox.length; i++) {
		scene.remove(countryBox[i])
	}

	// clears all colored countries
	ratioContext.clearRect(0,0,256,1);

	// arrays that will contain all our cubes
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
			value = scaleDown(selectedMaxPopulation, selectedMinPopulation, 95, 0, population);

		} else if (selectedDataType == 1 && density >= selectedMinDensity && density <= selectedMaxDensity) {
			value = scaleDown(selectedMaxDensity, selectedMinDensity, 95, 0, density);

		} else if (selectedDataType == 2 && births >= selectedMinBirths && births <= selectedMaxBirths) {
			value = scaleDown(selectedMaxBirths, selectedMinBirths, 95, 0, births);

		} else if (selectedDataType == 3 && deaths >= selectedMinDeaths && deaths <= selectedMaxDeaths) {
			value = scaleDown(selectedMaxDeaths, selectedMinDeaths, 95, 0, deaths);
		}

		if (value == 0) {
			continue;
		}

		ratioArray.push(births - deaths);
		countryCodeArray.push(countryCode);

		var position = latLongToVector3(lat, lon, 100, 1);

		// find the color of the bar for the capital, which should be the density scaled between 0 and 1
		// this value between 0 and 1 is then used to collect a color between yellow and blue
		var scaledDensity = scaleDown(selectedMaxDensity, selectedMinDensity, 1, 0, density);
		var scale = chroma.scale(['#D4B36A', '#505F8F']); 
		var barColor = scale(scaledDensity).hex();

		// setup the bar with the obtained color above and the latlng position of the capital
		var cubeMat = new THREE.MeshBasicMaterial({ color: barColor, wireframe: false});

		// a CubeGeometry is used instead of a BoxGeometry because we are using a old version of three.js (version 62)
		var box = new THREE.CubeGeometry(0.5, 0.5, value);
		var mesh = new THREE.Mesh(box, cubeMat);
		mesh.position.x = position.x;
		mesh.position.y = position.y;
		mesh.position.z = position.z;
		mesh.lookAt(new THREE.Vector3(0,0,0));

		scene.add(mesh);

		// add the mesh to an array, so it can be easily looked up
		countryBox.push(mesh);
		countryRepresented.push(c);
	}

	var maxRatio = Math.max.apply(Math, ratioArray);
	var minRatio = Math.min.apply(Math, ratioArray);
	for(var i = 0; i < ratioArray.length; i++) {
		var ratio = ratioArray[i];
		var code = countryCodeArray[i];
		var scaleValue = scaleDown(maxRatio, minRatio, 1, 0, ratio);
		var scale = chroma.scale(['#AA4439', '#2B803E']);
		var color = scale(scaleValue).hex();
		colorCountry(countryColorMap[code], color);
	}
}

function colorCountry(countryCode, color) {
	ratioContext.fillStyle = color;
	ratioContext.fillRect( countryCode, 0, 1, 1 );
	ratioTexture.needsUpdate = true;
}

function addCountryData(lat,lon,value) {
	var position = latLongToVector3(lat, lon, 100, 1);

	// cube / bar
	var cubeMat = new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 0.6, emissive: 0xffffff});
	var cubeMat = new THREE.MeshBasicMaterial({color: 'red'} );


	var box = new THREE.CubeGeometry( 0.5, 0.5,  value );
	var cube = new THREE.Mesh(box, cubeMat);

	// position it according to the vector made from the latitude and longitude
	cube.position.x = position.x;
	cube.position.y = position.y;
	cube.position.z = position.z;
	cube.lookAt( new THREE.Vector3(0,0,0) );

	// add bar to the scene and lookup-array
	scene.add(cube);
	countryBox.push (cube);
}

function findCountryCode(countryName){
	countryName = countryName.toUpperCase();
	for( var i in countryratio ){
		if( countryratio[i] === countryName )
			return i;
	}
	return 'not found';
}

function latLongToVector3(lat, lon, radius, heigth) {
	var phi = (lat) * Math.PI / 180;
	var theta = (lon-180) * Math.PI / 180;

	var x = -(radius+heigth) * Math.cos(phi) * Math.cos(theta);
	var y = (radius+heigth) * Math.sin(phi);
	var z = (radius+heigth) * Math.cos(phi) * Math.sin(theta);

	return new THREE.Vector3(x,y,z);
}

function scaleDown(oldRangeMax, oldRangeMin, newRangeMax, newRangeMin, input) {
	var percent = (input - oldRangeMin) / (oldRangeMax - oldRangeMin);
	return percent * (newRangeMax - newRangeMin) + newRangeMin;
}

function animate() {
	if(CAMERA_SHOULD_MOVE && (CAMERA_X != camera.position.x || CAMERA_Y != camera.position.y || CAMERA_Z != camera.position.z)) {
		moveCamera();
	} else {
		CAMERA_SHOULD_MOVE = false;
	}
	if (camera.position.length() < 300) camera.position.setLength(300);
	if (camera.position.length() > 1000) camera.position.setLength(1000);

	requestAnimationFrame(animate);
	render();
	update();
}

function update() {
	controls.update();
}

function render() {
	skyBox.rotation.y += 0.0003;
	renderer.clear();
	renderer.render(scene, camera);
	composer.render();
}
