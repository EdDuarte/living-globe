/*
 * Copyright 2015 University of Aveiro
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Living Globe v3.0.0
 * Authors: Eduardo Duarte (ed@edduarte.com) and Pedro Bordonhos (bordonhos@ua.pt)
 */

$('#info-modal').modal('show').modal('hide');
$('#config-modal').modal('show').modal('hide');

var chart1 = nv.models.boxPlotChart()
    .x(function(d) { return d.label })
    .y(function(d) { return d.values.Q3 })
    .width(120)
    .height(150)
    .margin({"left":10,"right":0,"top":5,"bottom":5})
    .noData("No data")
    .duration(0)
    .showXAxis(false)
    .showYAxis(false)
    .maxBoxWidth(75);
d3.select('#chart1 svg')
    .call(chart1);
nv.utils.windowResize(chart1.update);

var chart2 = nv.models.boxPlotChart()
    .x(function(d) { return d.label })
    .y(function(d) { return d.values.Q3 })
    .width(120)
    .height(150)
    .margin({"left":10,"right":0,"top":5,"bottom":5})
    .noData("No data")
    .duration(0)
    .showXAxis(false)
    .showYAxis(false)
    .maxBoxWidth(75);
d3.select('#chart2 svg')
    .call(chart2);
nv.utils.windowResize(chart2.update);

var chart3 = nv.models.boxPlotChart()
    .x(function(d) { return d.label })
    .y(function(d) { return d.values.Q3 })
    .width(120)
    .height(150)
    .margin({"left":10,"right":0,"top":5,"bottom":5})
    .noData("No data")
    .duration(0)
    .showXAxis(false)
    .showYAxis(false)
    .maxBoxWidth(75);
d3.select('#chart3 svg')
    .call(chart3);
nv.utils.windowResize(chart3.update);

nv.addGraph(function() {
    return chart1;
});
nv.addGraph(function() {
    return chart2;
});
nv.addGraph(function() {
    return chart3;
});

// constant values
var tooltipOffset = 1;
var defaultSelectedYear = 2013;
var selectedIndicator1Id = "SP.POP.GROW";
var selectedIndicator2Id = "SP.DYN.LE00.IN";
var selectedIndicator3Id = "SP.DYN.CBDRT.IN";
//var minimumDragDistance = 0.04;
var barWidth = 0.5;
var barNoDataColor = '#747474';
var barNoDataHeight = 40;
var maxBarHeight = 40;


// camera zoom & tween target variables used on "animate()" method to move
// the camera to the target (a country that was selected)
var cameraIsBeingDragged = false;
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
//var isSelectingCountry = false;
var projector = new THREE.Projector();
var mouse2D = new THREE.Vector3(0, 0, 0.5);


// external data that maps gray luminosity values with ISO 3166 alpha-3
// country codes
var ISOCodeToIndexColorMap = {};


// external data that maps ISO 3166 alpha-3 country codes to country names
// and centroid location
var ISOCodeToDetailsMap = {};


// external data that maps indicator unique ids to indicator names
var indicatorIdToDetailsMap = {};


// constant list of all available indicators
var indicatorIdArray = [];


// list of country names and capitals, used for the auto complete field
var autoCompleteLookup;


// variables collected when analysing the input data and used to interpret
// selection
var inputData = {};
var shownCountries = [];
var shownBarsData = [];
var selectedYear = defaultSelectedYear;
var selectedYearJson = {};
var selectedCountryCode = -1;
var selectedCountryLineIndex = -1;

var anchorCountryDetailsToMouse = false;
var anchorCountryDetailsToMouseCheckbox = document.getElementById("anchorCountryDetailsToMouseCheckbox");
anchorCountryDetailsToMouseCheckbox.checked = anchorCountryDetailsToMouse;

var keepBoundsOnYearChange = false;
var keepBoundsCheckbox = document.getElementById("keepBoundsCheckbox");
keepBoundsCheckbox.checked = keepBoundsOnYearChange;


// to filter data, the selection min and max values is used to scale down values
// for each country:
// - reducing the selected max increases the normalized values until >= fixed
//   max (above), in which case they are removed from view
// - increasing the selected min decreases the normalized values until <= 0, in
//   which case they are removed from view
// initial values are automatically adjusted when a new real scale is found
var realMinIndicator1 = 0;
var selectedMinIndicator1 = 0;
var realMaxIndicator1 = 0;
var selectedMaxIndicator1 = 0;
var realMinIndicator2 = 0;
var selectedMinIndicator2 = 0;
var realMaxIndicator2 = 0;
var selectedMaxIndicator2 = 0;
var realMinIndicator3 = 0;
var selectedMinIndicator3 = 0;
var realMaxIndicator3 = 0;
var selectedMaxIndicator3 = 0;


// loading
var loading = $('#loading').addClass('loading-ring-css');
var loadingContainer = $('#loadingContainer').show();


// custom color pickers
var barColorScaleStart = '#007aff';
var barColorScaleEnd = '#ffd500';
var barColorScale = chroma.scale([barColorScaleStart, barColorScaleEnd]);
var countryColorScaleStart = '#FF2A2A';
var countryColorScaleEnd = '#23D723';
var countryColorScale = chroma.scale([countryColorScaleStart, countryColorScaleEnd]);
var sliderIndicator2MinColorPicker = $('#sliderIndicator2-min-color-picker');
var sliderIndicator2MaxColorPicker = $('#sliderIndicator2-max-color-picker');
var sliderIndicator3MinColorPicker = $('#sliderIndicator3-min-color-picker');
var sliderIndicator3MaxColorPicker = $('#sliderIndicator3-max-color-picker');
sliderIndicator2MinColorPicker.colorpicker({
    format: 'hsl',
    color: barColorScaleStart
}).on('changeColor.colorpicker', function(event){
    barColorScaleStart = event.color.toHex();
    barColorScale = chroma.scale([barColorScaleStart, barColorScaleEnd]);
    $('#sliderIndicator2 .noUi-connect')
        .css('background', '-webkit-linear-gradient(left, #007aff , #ffd500);') /* For Safari 5.1 to 6.0 */
        .css('background', '-o-linear-gradient(right, #007aff, #ffd500);') /* For Opera 11.1 to 12.0 */
        .css('background', '-moz-linear-gradient(right, #007aff, #ffd500);') /* For Firefox 3.6 to 15 */
        .css('background', 'linear-gradient(to right, #007aff , #ffd500);'); /* Standard syntax (must be last) */
    $(this).css("background-color", barColorScaleStart);
    //updateIndicator2Slider();
    rebuildComponents1And2();
}).css("background-color", barColorScaleStart);
sliderIndicator2MaxColorPicker.colorpicker({
    format: 'hsl',
    color: barColorScaleEnd
}).on('changeColor.colorpicker', function(event){
    barColorScaleEnd = event.color.toHex();
    barColorScale = chroma.scale([barColorScaleStart, barColorScaleEnd]);
    $(this).css("background-color", barColorScaleEnd);
    rebuildComponents1And2();
}).css("background-color", barColorScaleEnd);
sliderIndicator3MinColorPicker.colorpicker({
    format: 'hsl',
    color: countryColorScaleStart
}).on('changeColor.colorpicker', function(event){
    countryColorScaleStart = event.color.toHex();
    countryColorScale = chroma.scale([countryColorScaleStart, countryColorScaleEnd]);
    $(this).css("background-color", countryColorScaleStart);
    rebuildComponents3();
}).css("background-color", countryColorScaleStart);
sliderIndicator3MaxColorPicker.colorpicker({
    format: 'hsl',
    color: countryColorScaleEnd
}).on('changeColor.colorpicker', function(event){
    countryColorScaleEnd = event.color.toHex();
    countryColorScale = chroma.scale([countryColorScaleStart, countryColorScaleEnd]);
    $(this).css("background-color", countryColorScaleEnd);
    rebuildComponents3();
}).css("background-color", countryColorScaleEnd);


// sliders setup, used to filter data
var timelineContainer = $('#timelineContainer');
var timeline = document.getElementById('timeline');
noUiSlider.create(timeline, {
    start: 0,
    tooltips: false,
    range: {
        'min': 0,
        'max': 0
    },
    pips: { // Show a scale with the slider
        mode: 'range',
        density: 5
    }
});
var indicator1Slider = document.getElementById('sliderIndicator1');
noUiSlider.create(indicator1Slider, {
    start: [selectedMinIndicator1, selectedMaxIndicator1],
    connect: true,
    tooltips: false,
    range: {
        'min': realMinIndicator1,
        'max': realMaxIndicator1
    }
});
indicator1Slider.setAttribute('disabled', true);
var indicator2Slider = document.getElementById('sliderIndicator2');
noUiSlider.create(indicator2Slider, {
    start: [selectedMinIndicator2, selectedMaxIndicator2],
    connect: true,
    tooltips: false,
    range: {
        'min': realMinIndicator2,
        'max': realMaxIndicator2
    }
});
indicator2Slider.setAttribute('disabled', true);
var indicator3Slider = document.getElementById('sliderIndicator3');
noUiSlider.create(indicator3Slider, {
    start: [selectedMinIndicator3, selectedMaxIndicator3],
    connect: true,
    tooltips: false,
    range: {
        'min': realMinIndicator3,
        'max': realMaxIndicator3
    }
});
indicator3Slider.setAttribute('disabled', true);


// dropdown setup, used to map indicators to components
var indicator1Name = $('#indicator1Name');
var dropdownIndicator1 = $('#dropdownIndicator1');
var dropdownIndicator1Container = $('#dropdownIndicator1Container');
var dropdownIndicator1Toggle = dropdownIndicator1Container.find('.dropdown-toggle');
var dropdownIndicator1Text = dropdownIndicator1Container.find('.dropdownIndicatorText');
dropdownIndicator1Container.on('click', '.dropdown-menu li a', function() {
    var id = "";
    var name = "None";

    var selectedText = $(this).text();
    for(var k in indicatorIdToDetailsMap) {
        var indicatorName = indicatorIdToDetailsMap[k].name;
        if(indicatorName == selectedText) {
            id = k;
            name = selectedText;
            break;
        }
    }

    selectedIndicator1Id = id;
    dropdownIndicator1Text.html(name);
    indicator1Name.html(name);
    dropdownIndicator1Toggle.blur();
    updateIndicator1Slider();
    rebuildComponents1And2();
});
var indicator2Name = $('#indicator2Name');
var dropdownIndicator2 = $('#dropdownIndicator2');
var dropdownIndicator2Container = $('#dropdownIndicator2Container');
var dropdownIndicator2Toggle = dropdownIndicator2Container.find('.dropdown-toggle');
var dropdownIndicator2Text = dropdownIndicator2Container.find('.dropdownIndicatorText');
dropdownIndicator2Container.on('click', '.dropdown-menu li a', function() {
    var id = "";
    var name = "None";

    var selectedText = $(this).text();
    for(var k in indicatorIdToDetailsMap) {
        var indicatorName = indicatorIdToDetailsMap[k].name;
        if(indicatorName == selectedText) {
            id = k;
            name = selectedText;
            break;
        }
    }

    selectedIndicator2Id = id;
    dropdownIndicator2Text.html(name);
    indicator2Name.html(name);
    dropdownIndicator2Toggle.blur();
    updateIndicator2Slider();
    rebuildComponents1And2();
});
var indicator3Name = $('#indicator3Name');
var dropdownIndicator3 = $('#dropdownIndicator3');
var dropdownIndicator3Container = $('#dropdownIndicator3Container');
var dropdownIndicator3Toggle = dropdownIndicator3Container.find('.dropdown-toggle');
var dropdownIndicator3Text = dropdownIndicator3Container.find('.dropdownIndicatorText');
dropdownIndicator3Container.on('click', '.dropdown-menu li a', function() {
    var id = "";
    var name = "None";

    var selectedText = $(this).text();
    for(var k in indicatorIdToDetailsMap) {
        var indicatorName = indicatorIdToDetailsMap[k].name;
        if(indicatorName == selectedText) {
            id = k;
            name = selectedText;
            break;
        }
    }

    selectedIndicator3Id = id;
    dropdownIndicator3Text.html(name);
    indicator3Name.html(name);
    dropdownIndicator3Toggle.blur();
    updateIndicator3Slider();
    rebuildComponents3();
});


// scene
var globeScene = new THREE.Scene();


// camera
var worldContainer = document.getElementById('worldContainer');
var VIEW_ANGLE = 47;
var ASPECT = worldContainer.offsetWidth / worldContainer.offsetHeight;
var NEAR = 0.5;
var FAR = 20000;
var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.set(0,300,300);
cameraPos0 = camera.position.clone();
cameraUp0 = camera.up.clone();
cameraZoom = camera.position.z;
globeScene.add(camera);


// renderer
var renderer;
if (Detector.webgl) {
    renderer = new THREE.WebGLRenderer({
        antialias:true
    });
} else {
    renderer = new THREE.CanvasRenderer();
}
renderer.setSize(worldContainer.offsetWidth, worldContainer.offsetHeight);
renderer.sortObjects = false;
renderer.generateMipmaps = false;
renderer.setClearColor(0x000000, 0);
THREEx.WindowResize(renderer, camera, worldContainer);


// mouse events
var rendererDom = renderer.domElement;
rendererDom.addEventListener('mousewheel', onMouseWheel, false);
rendererDom.addEventListener('DOMMouseScroll', onMouseWheel, false);
rendererDom.addEventListener('mousemove', onMouseMove, false);
rendererDom.addEventListener('mousedown', onMouseDown, false);
rendererDom.addEventListener('mouseup', onMouseUp, false);
rendererDom.addEventListener('touchstart', onTouchStart, false);
rendererDom.addEventListener('touchmove', onTouchMove, false);
//var detailsContainer = document.getElementById('detailsContainer');
var detailsContainerJQuery = $("#detailsContainer");
//detailsContainer.addEventListener('mousewheel', onMouseWheel);
//detailsContainer.addEventListener('DOMMouseScroll', onMouseWheel);
//detailsContainer.addEventListener('mousemove', onMouseMove);
//detailsContainer.addEventListener('mousedown', onMouseDown);
//detailsContainer.addEventListener('mouseup', onMouseUp);
var parameters = document.getElementById('parameters');
parameters.addEventListener('mousewheel', onMouseWheel);
parameters.addEventListener('DOMMouseScroll', onMouseWheel);
parameters.addEventListener('mousemove', onMouseMove);
parameters.addEventListener('mousedown', onMouseDown);
parameters.addEventListener('mouseup', onMouseUp);
worldContainer.appendChild(rendererDom);


// controls (OrbitControls with damping)
var controls = new THREE.OrbitTrackballControls(camera, worldContainer);
controls.dynamicDampingFactor = 0.7;
controls.rotateSpeed = 0.3;
controls.userPan = false;
controls.userRotateSpeed = 0.3;

// lights
var light1 = new THREE.PointLight(0xffffff);
light1.position.set(100,100,100);
globeScene.add(light1);
//var light2 = new THREE.AmbientLight(0xffffff);
//light2.position.set(0,250,0);
//globeScene.add(light2);


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
var highlightCanvas = document.createElement('canvas');
highlightCanvas.width = 256;
highlightCanvas.height = 1;
var highlightContext = highlightCanvas.getContext('2d');
var highlightTexture = new THREE.Texture(highlightCanvas);
highlightTexture.magFilter = THREE.NearestFilter;
highlightTexture.minFilter = THREE.NearestFilter;
highlightTexture.needsUpdate = true;


// lookup texture, where each country is colored with a different luminosity of
// gray. the country can be identified using the ISOCodeToIndexColorMap JSON file
var mapTexture = THREE.ImageUtils.loadTexture("img/index.png");
mapTexture.magFilter = THREE.NearestFilter;
mapTexture.minFilter = THREE.NearestFilter;
mapTexture.needsUpdate = true;


// satellite texture, used for aesthetic purposes only
var blendImage = THREE.ImageUtils.loadTexture("img/outline5-comp2.png");


// outline texture, used for aesthetic purposes only
var outlineTexture = THREE.ImageUtils.loadTexture("img/outline10-comp2.png");
outlineTexture.needsUpdate = true;


// the final material for the world object merges multiple layered textures
var worldSphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
        width:        { type: "f", value: worldContainer.offsetWidth },
        height:       { type: "f", value: worldContainer.offsetHeight },
        mapIndex:     { type: "t", value: mapTexture },
        outline:      { type: "t", value: outlineTexture },
        outlineLevel: { type: 'f', value: 1 },
        ratio:        { type: "t", value: ratioTexture },
        select:       { type: "t", value: highlightTexture },
        blendImage:   { type: "t", value: blendImage }
    },
    vertexShader:   document.getElementById('globeVertexShader').textContent,
    fragmentShader: document.getElementById('globeFragmentShader').textContent
});


// world / sphere object
var worldSphereGeometry = new THREE.SphereGeometry(100, 64, 32);
var worldSphereMesh = new THREE.Mesh(worldSphereGeometry, worldSphereMaterial);
worldSphereMesh.position.set(0,0,0);
worldSphereMesh.visible = false;
globeScene.add(worldSphereMesh);


//// create secondary scene to add atmosphere effect
//var atmosphereScene = new THREE.Scene();
//var atmosphereCamera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
//atmosphereCamera.position = camera.position;
//atmosphereCamera.rotation = camera.rotation;
//atmosphereScene.add(atmosphereCamera);
//
//
//var atmosphereMesh = new THREE.Mesh(worldSphereGeometry.clone(), worldSphereMaterial);
//atmosphereMesh.scale.x = atmosphereMesh.scale.y = atmosphereMesh.scale.z = 1.2;
//// atmosphere should provide light from behind the sphere, so only render the
//// back side
//atmosphereMesh.material.side = THREE.BackSide;
//atmosphereScene.add(atmosphereMesh);
//
//
//// clone earlier sphere worldSphereGeometry to block light correctly
//// and make it a bit smaller so that light blends into surface a bit
//var lightSphereMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
//var lightSphereMesh = new THREE.Mesh(worldSphereGeometry.clone(), lightSphereMaterial);
//lightSphereMesh.scale.x = lightSphereMesh.scale.y = lightSphereMesh.scale.z = 1;
//atmosphereScene.add(lightSphereMesh);
//
//
var renderTargetParameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
    stencilBuffer: false
};
var renderTarget = new THREE.WebGLRenderTarget(worldContainer.offsetWidth, worldContainer.offsetHeight, renderTargetParameters);
//var atmosphereComposer = new THREE.EffectComposer(renderer, renderTarget );
//
//// prepare the secondary render's passes
//var atmosphereRenderPass = new THREE.RenderPass(atmosphereScene, atmosphereCamera);
//atmosphereComposer.addPass(atmosphereRenderPass);

// the map canvas, used to obtain the luminosity value of the lookup texture
var mapCanvas = document.createElement('canvas');
mapCanvas.width = 4096;
mapCanvas.height = 2048;
var mapContext = mapCanvas.getContext('2d');
var imageObj = new Image();
imageObj.onload = function() {
    mapContext.drawImage(imageObj, 0, 0);
};
imageObj.src = 'img/index.png';


// anti-aliasing setup
renderer.autoClear = false;
var composer = new THREE.EffectComposer(renderer, renderTarget);
var renderModel = new THREE.RenderPass(globeScene, camera);
//var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
//var width = worldContainer.offsetWidth || 2;
//var height = worldContainer.offsetHeight || 2;
//effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);
//var effectBlend = new THREE.ShaderPass(THREE.AdditiveBlendShader, "tDiffuse1");
//effectBlend.uniforms[ 'tDiffuse2' ].value = atmosphereComposer.renderTarget2;
//effectBlend.renderToScreen = true;
//var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
//effectCopy.renderToScreen = true;
composer.addPass(renderModel);
//composer.addPass(effectFXAA);
////composer.addPass(effectBlend);
//composer.addPass(effectCopy);


// search field setup
var searchField = $('#searchField');
readJsonFile('data/countries.json', function(countries) {
    ISOCodeToDetailsMap = countries;
    // data is listed in a second array with the format
    // [{value: country name, data: ISO-3166 country code}, ...],
    // which is then used as the input of dev-bridge auto-complete plugin
    autoCompleteLookup = [];
    for (var c in countries) {
        // add country names and capitals to be used on auto complete search field
        autoCompleteLookup.push({
            value: countries[c].name,
            data: c
        });
    }
    searchField.on('focus', function() {
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
            searchField.val('');
            searchField.blur();
        }
    });
    $('#search').show();
});


// read map of ISO-3166 alpha 3 country codes to gray index levels of lookup
// texture
readJsonFile('data/gray_codes.json', function(gray_codes) {
    ISOCodeToIndexColorMap = gray_codes;

    // read map of indicator keys (from TheWorldBank DataBank) to indicator
    // names and measuring units
    readJsonFile('data/indicators.json', function(indicators) {
        indicatorIdToDetailsMap = indicators;
        indicatorIdArray = [];
        var addItem = function(txt) {
            dropdownIndicator1.append("<li><a href='#'>" + txt + "</a></li>");
            dropdownIndicator2.append("<li><a href='#'>" + txt + "</a></li>");
            dropdownIndicator3.append("<li><a href='#'>" + txt + "</a></li>");
        };

        // adds to dropdown the available indicators for the user to pick /
        // map to components
        addItem("None");
        for(var k in indicators) {
            indicatorIdArray.push(k);
            addItem(indicatorIdToDetailsMap[k].name);
        }

        // read data arrays separated by year and by indicator key
        readJsonFile('data/data.json', function(data) {
            inputData = data;

            var yearArray = [];
            var maxYear = 0;
            var minYear = 0;
            var isFirstIteration = true;
            for (var year in inputData) {
                yearArray.push(year);
                if(isFirstIteration) {
                    maxYear = year;
                    minYear = year;
                    isFirstIteration = false;
                } else if (maxYear < year) {
                    maxYear = year;
                } else if(minYear > year) {
                    minYear = year;
                }
            }
            selectedYear = defaultSelectedYear;
            selectedYearJson = inputData[defaultSelectedYear];

            // setup the range for the year slider, based on the obtained max
            // and min values
            timeline.noUiSlider.destroy();
            var timelineSlider = noUiSlider.create(timeline, {
                animate: true,
                start: defaultSelectedYear,
                tooltips: true,
                step: 1,
                range: {
                    min: Number(minYear),
                    max: Number(maxYear)
                },
                format: wNumb({
                    decimals: 0,
                    thousand: ''
                }),
                pips: { // Show a scale with the slider
                    mode: 'range',
                    density: 5
                }
            });
            timelineSlider.on('slide', function(values, handle, unencoded) {
                var newSelectedYear = unencoded;
                if(selectedYear == newSelectedYear) {
                    // year was not changed, ignore
                    return;
                }
                selectedYear = newSelectedYear;
                selectedYearJson = inputData[selectedYear];
                updateIndicators(true, true, true, !keepBoundsOnYearChange);
                rebuildAllComponents();
                if(selectedCountryCode!=-1 && selectedCountryCode!=-1) {
                    //detailsContainer.innerHTML = getDetails(selectedCountryCode, selectedCountryLineIndex);
                }
            });
            //slider.on('change', function(values, handle, unencoded) {
            //});

            var name1 = indicatorIdToDetailsMap[selectedIndicator1Id].name;
            dropdownIndicator1Container.find('.dropdownIndicatorText').html(name1);
            indicator1Name.html(name1);

            var name2 = indicatorIdToDetailsMap[selectedIndicator2Id].name;
            dropdownIndicator2Container.find('.dropdownIndicatorText').html(name2);
            indicator2Name.html(name2);

            var name3 = indicatorIdToDetailsMap[selectedIndicator3Id].name;
            dropdownIndicator3Container.find('.dropdownIndicatorText').html(name3);
            indicator3Name.html(name3);

            updateIndicators(true, true, true, true);

            // once data is fully loaded, fade in hidden components
            timelineContainer.fadeIn('slow', function() {
            });
            $('.parameter').fadeIn('slow', function() {
                rebuildAllComponents();
                worldSphereMesh.visible = true;
                worldSphereMesh.needsUpdate = true;
                loadingContainer.hide();
                loading.removeClass('loading-ring-css');
            });
        });
    });
});


// start animation loop
animate();


// --- FUNCTIONS ---

// reads a json file asynchronously, providing the necessary mime-types and
// content-types to avoid console warnings
function readJsonFile(path, successCallback) {
    $.ajax({
        type: "GET",
        url: path,
        mimeType: "application/json",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: successCallback,
        error: function (xhr, textStatus, errorThrown) {
            console.log(xhr.responseText+":"+errorThrown);

        }
    });
}


// analyses data in "inputData" to discover the maximum and
// minimum values of the default indicators.
// These values are used to produce normalized scales on the
// function "rebuildAllComponents" and to setup the filter sliders
function updateIndicator1Slider() {
    updateIndicators(true, false, false, true);
}

function updateIndicator2Slider() {
    updateIndicators(false, true, false, true);
}

function updateIndicator3Slider() {
    updateIndicators(false, false, true, true);
}

function updateIndicators(update1, update2, update3, resetSelected) {
    searchField.blur();
    if(update1) {
        realMinIndicator1 = -1;
        realMaxIndicator1 = -1;
    }
    if(update2) {
        realMinIndicator2 = -1;
        realMaxIndicator2 = -1;
    }
    if(update3) {
        realMinIndicator3 = -1;
        realMaxIndicator3 = -1;
    }

    var indicator1Array = selectedYearJson[selectedIndicator1Id];
    var indicator2Array = selectedYearJson[selectedIndicator2Id];
    var indicator3Array = selectedYearJson[selectedIndicator3Id];
    if (typeof indicator1Array === 'undefined' || indicator1Array.length == 0) {
        update1 = false;
        if (!indicator1Slider.hasAttribute('disabled')) {
            indicator1Slider.setAttribute('disabled', true);
            indicator1Slider.noUiSlider.destroy();
            noUiSlider.create(indicator1Slider, {
                start: 0,
                tooltips: false,
                connect: false,
                range: {
                    'min': 0,
                    'max': 0
                }
            });
        }
    }
    if (typeof indicator2Array === 'undefined' || indicator2Array.length == 0) {
        update2 = false;
        if (!indicator2Slider.hasAttribute('disabled')) {
            indicator2Slider.setAttribute('disabled', true);
            indicator2Slider.noUiSlider.destroy();
            noUiSlider.create(indicator2Slider, {
                start: 0,
                tooltips: false,
                connect: false,
                range: {
                    'min': 0,
                    'max': 0
                }
            });
        }
    }
    if (typeof indicator3Array === 'undefined' || indicator3Array.length == 0) {
        update3 = false;
        if (!indicator3Slider.hasAttribute('disabled')) {
            indicator3Slider.setAttribute('disabled', true);
            indicator3Slider.noUiSlider.destroy();
            noUiSlider.create(indicator3Slider, {
                start: 0,
                tooltips: false,
                connect: false,
                range: {
                    'min': 0,
                    'max': 0
                }
            });
        }
    }
    var length = 0;

    if(update1) {
        length = indicator1Array.length;
    } else if (update2) {
        length = indicator2Array.length;
    } else if(update3) {
        length = indicator3Array.length;
    }

    for (var j = 0; j < length; j++) {
        var v1, value1, v2, value2, v3, value3;
        if(update1) {
            v1 = indicator1Array[j];
            value1 = Number(v1.value);
        }
        if(update2) {
            v2 = indicator2Array[j];
            value2 = Number(v2.value);
        }
        if(update3) {
            v3 = indicator3Array[j];
            value3 = Number(v3.value);
        }

        var countryCode;
        if(update1) {
            countryCode = v1.countryCode;
        } else if(update2) {
            countryCode = v2.countryCode;
        } else if(update3) {
            countryCode = v3.countryCode;
        }
        var countryDetails = ISOCodeToDetailsMap[countryCode];
        if(countryDetails == null) {
            continue;
        }

        // finds the maximum and minimum values
        if(j == 0) {
            if(update1 && v1.value.length != 0) {
                realMaxIndicator1 = value1;
                realMinIndicator1 = value1;
            }
            if(update2 && v2.value.length != 0) {
                realMaxIndicator2 = value2;
                realMinIndicator2 = value2;
            }
            if(update3 && v3.value.length != 0) {
                realMaxIndicator3 = value3;
                realMinIndicator3 = value3;
            }
            continue;
        }

        if(update1) {
            if (v1.value.length != 0 && realMaxIndicator1 < value1) {
                realMaxIndicator1 = value1;
            }
            if (v1.value.length != 0 && realMinIndicator1 > value1) {
                realMinIndicator1 = value1;
            }
        }

        if(update2) {
            if (v2.value.length != 0 && realMaxIndicator2 < value2) {
                realMaxIndicator2 = value2;
            }
            if (v2.value.length != 0 && realMinIndicator2 > value2) {
                realMinIndicator2 = value2;
            }
        }

        if(update3) {
            if (v3.value.length != 0 && realMaxIndicator3 < value3) {
                realMaxIndicator3 = value3;
            }
            if (v3.value.length != 0 && realMinIndicator3 > value3) {
                realMinIndicator3 = value3;
            }
        }
    }
    var settings;


    if(update1) {
        // setup the range for the indicator 1 slider, based on the obtained
        // max and min values
        if(resetSelected || selectedMinIndicator1 == selectedMaxIndicator1) {
            selectedMinIndicator1 = realMinIndicator1;
            selectedMaxIndicator1 = realMaxIndicator1;
        } else {
            if(selectedMinIndicator1 < realMinIndicator1 ||
                selectedMinIndicator1 > realMaxIndicator1) {
                selectedMinIndicator1 = realMinIndicator1;
            }
            if(selectedMaxIndicator1 > realMaxIndicator1 || selectedMaxIndicator1 < realMinIndicator1) {
                selectedMaxIndicator1 = realMaxIndicator1;
            }
        }

        var indicator1Data = indicatorIdToDetailsMap[selectedIndicator1Id];
        if(realMinIndicator1 == realMaxIndicator1) {
            settings = {
                start: 0,
                tooltips: false,
                connect: false,
                range: {
                    'min': 0,
                    'max': 0
                }
            };
            indicator1Slider.setAttribute('disabled', true);
        } else {
            var decimals = 3;
            var step = 0.001;
            if(indicator1Data.unit === "people" && indicator1Data.unit === "people/km²") {
                decimals = 0;
                step = 1;
            }
            settings = {
                start: [selectedMinIndicator1, selectedMaxIndicator1],
                tooltips: true,
                connect: true,
                step: step,
                range: {
                    'min': realMinIndicator1,
                    'max': realMaxIndicator1
                },
                format: wNumb({
                    decimals: decimals,
                    thousand: '&nbsp;',
                    postfix: '&nbsp;'+indicator1Data.unit
                })
            };
            indicator1Slider.removeAttribute('disabled');
        }
        indicator1Slider.noUiSlider.destroy();
        var indicator1noUISlider = noUiSlider.create(indicator1Slider, settings);
        indicator1noUISlider.on('slide', function(values, handle, unencoded) {
            selectedMinIndicator1 = unencoded[0];
            selectedMaxIndicator1 = unencoded[1];
            rebuildComponents1And2();
        });
    }


    if(update2) {
        // setup the range for the indicator 2 slider, based on the obtained
        // max and min values
        if(resetSelected || selectedMinIndicator2 == selectedMaxIndicator2) {
            selectedMinIndicator2 = realMinIndicator2;
            selectedMaxIndicator2 = realMaxIndicator2;
        } else {
            if(selectedMinIndicator2 < realMinIndicator2 || selectedMinIndicator2 > realMaxIndicator2) {
                selectedMinIndicator2 = realMinIndicator2;
            }
            if(selectedMaxIndicator2 > realMaxIndicator2 || selectedMaxIndicator2 < realMinIndicator2) {
                selectedMaxIndicator2 = realMaxIndicator2;
            }
        }

        var indicator2Data = indicatorIdToDetailsMap[selectedIndicator2Id];
        if (realMinIndicator2 == realMaxIndicator2) {
            settings = {
                start: 0,
                tooltips: false,
                connect: false,
                range: {
                    'min': 0,
                    'max': 0
                }
            };
            indicator2Slider.setAttribute('disabled', true);
        } else {
            var decimals = 3;
            if(indicator2Data.unit === "people" && indicator2Data.unit === "people/km²") {
                decimals = 0;
            }
            settings = {
                start: [selectedMinIndicator2, selectedMaxIndicator2],
                tooltips: true,
                connect: true,
                range: {
                    'min': realMinIndicator2,
                    'max': realMaxIndicator2
                },
                format: wNumb({
                    decimals: decimals,
                    thousand: '&nbsp;',
                    postfix: '&nbsp;' + indicator2Data.unit
                })
            };
            indicator2Slider.removeAttribute('disabled');
        }
        indicator2Slider.noUiSlider.destroy();
        var indicator2noUISlider = noUiSlider.create(indicator2Slider, settings);
        indicator2noUISlider.on('slide', function (values, handle, unencoded) {
            selectedMinIndicator2 = unencoded[0];
            selectedMaxIndicator2 = unencoded[1];
            rebuildComponents1And2();
        });
    }


    if(update3) {
        // setup the range for the indicator 3 slider, based on the obtained
        // max and min values
        if(resetSelected || selectedMinIndicator3 == selectedMaxIndicator3) {
            selectedMinIndicator3 = realMinIndicator3;
            selectedMaxIndicator3 = realMaxIndicator3;
        } else {
            if(selectedMinIndicator3 < realMinIndicator3 || selectedMinIndicator3 > realMaxIndicator3) {
                selectedMinIndicator3 = realMinIndicator3;
            }
            if(selectedMaxIndicator3 > realMaxIndicator3 || selectedMaxIndicator3 < realMinIndicator3) {
                selectedMaxIndicator3 = realMaxIndicator3;
            }
        }

        var indicator3Data = indicatorIdToDetailsMap[selectedIndicator3Id];
        if(realMinIndicator3 == realMaxIndicator3) {
            settings = {
                start: 0,
                tooltips: false,
                connect: false,
                range: {
                    'min': 0,
                    'max': 0
                }
            };
            indicator3Slider.setAttribute('disabled', true);
        } else {
            var decimals = 3;
            if(indicator3Data.unit === "people" && indicator3Data.unit === "people/km²") {
                decimals = 0;
            }
            settings = {
                start: [selectedMinIndicator3, selectedMaxIndicator3],
                tooltips: true,
                connect: true,
                range: {
                    'min': realMinIndicator3,
                    'max': realMaxIndicator3
                },
                format: wNumb({
                    decimals: decimals,
                    thousand: '&nbsp;',
                    postfix: '&nbsp;'+indicator3Data.unit
                })
            };
            indicator3Slider.removeAttribute('disabled');
        }
        indicator3Slider.noUiSlider.destroy();
        var indicator3noUISlider = noUiSlider.create(indicator3Slider, settings);
        indicator3noUISlider.on('slide', function(values, handle, unencoded) {
            selectedMinIndicator3 = unencoded[0];
            selectedMaxIndicator3 = unencoded[1];
            rebuildComponents3();
        });
    }
}


// function that rebuilds (removing previously used and creating new)
// elements from all components (bar height, bar color and country color) shown
// on the globe according to new selection boundaries (selected max and min
// values, selected year, selected indicator)
function rebuildAllComponents() {
    rebuildComponents(true, true);
}


// function that rebuilds (removing previously used and creating new)
// elements of the first and second components (bar height and bar color)
// shown on the globe according to new selection boundaries (selected max and
// min values, selected year, selected indicator)
function rebuildComponents1And2() {
    rebuildComponents(true, false);
}


// function that rebuilds (removing previously used and creating new)
// elements of the third component (country color) shown on the globe
// according to new selection boundaries (selected max and min values, selected
// year, selected indicator)
function rebuildComponents3() {
    rebuildComponents(false, true);
}

function rebuildComponents(rebuild1And2, rebuild3) {

    //if(rebuild1And2) {
    //    // remove previous bars
    //    for (var i = 0 ; i < shownBarsData.length; i++) {
    //        var barData = shownBarsData[i];
    //        globeScene.remove(barData.bar);
    //        barData.bar.geometry.dispose();
    //        barData.bar.material.dispose();
    //        //barData.bar.texture.dispose()
    //    }
    //
    //    // empty arrays to add the new bars
    //    shownBarsData = [];
    //}

    if(rebuild3) {
        // clears all colored countries
        ratioContext.clearRect(0,0,256,1);
        ratioTexture.needsUpdate = true;
    }

    var indicator1Array = selectedYearJson[selectedIndicator1Id];
    var indicator2Array = selectedYearJson[selectedIndicator2Id];
    var indicator3Array = selectedYearJson[selectedIndicator3Id];
    var has1 = rebuild1And2;
    var has2 = rebuild1And2;
    var has3 = rebuild3;
    var length = 0;

    if (has1 && (typeof indicator1Array === 'undefined' || indicator1Array.length == 0)) {
        has1 = false;
    }
    if (has2 && (typeof indicator2Array === 'undefined' || indicator2Array.length == 0)) {
        has2 = false;
    }
    if (has3 && (typeof indicator3Array === 'undefined' || indicator3Array.length == 0)) {
        has3 = false;
    }

    if(has1) {
        length = indicator1Array.length;
    } else if (has2) {
        length = indicator2Array.length;
    } else if(has3) {
        length = indicator3Array.length;
    }

    // if the data to rebuild for all components is from invalid
    // indicators, ignore it
    if(length == 0) {
        return;
    }

    // empty countries array to update with new data
    shownCountries = [];

    var originalIndicator1Values = [];
    var originalIndicator2Values = [];
    var originalIndicator3Values = [];
    var filteredIndicator1Values = [];
    var filteredIndicator2Values = [];
    var filteredIndicator3Values = [];
    for (var j = 0; j < length; j++) {
        var i1, i1NumberValue, i2, i2NumberValue, i3, i3NumberValue, countryCode;

        if(has1) {
            i1 = indicator1Array[j];
            i1NumberValue = Number(i1.value);
            var v = parseFloat(parseFloat(i1NumberValue).toFixed(4));
            if(v <= realMaxIndicator1 && v >= realMinIndicator1) {
                originalIndicator1Values.push(v);
            }
            if(v <= selectedMaxIndicator1 && v >= selectedMinIndicator1) {
                filteredIndicator1Values.push(v);
            }
        }
        if(has2) {
            i2 = indicator2Array[j];
            i2NumberValue = Number(i2.value);
            var v = parseFloat(parseFloat(i2NumberValue).toFixed(4));
            if(v <= realMaxIndicator2 && v >= realMinIndicator2) {
                originalIndicator2Values.push(v);
            }
            if(v <= selectedMaxIndicator2 && v >= selectedMinIndicator2) {
                filteredIndicator2Values.push(v);
            }
        }
        if(has3) {
            i3 = indicator3Array[j];
            i3NumberValue = parseFloat(i3.value);
            var v = parseFloat(parseFloat(i3NumberValue).toFixed(4));
            if(v <= realMaxIndicator3 && v >= realMinIndicator3) {
                originalIndicator3Values.push(v);
            }
            if(v <= selectedMaxIndicator3 && v >= selectedMinIndicator3) {
                filteredIndicator3Values.push(v);
            }
        }

        // get the data, and set the offset, we need to do this since the x,y
        // coordinates
        if(has1) {
            countryCode = i1.countryCode;
        } else if(has2) {
            countryCode = i2.countryCode;
        } else if(has3) {
            countryCode = i3.countryCode;
        }

        shownCountries.push({
            countryCode: countryCode,
            lineIndex: j
        });

        var countryDetails = ISOCodeToDetailsMap[countryCode];
        if(countryDetails != null) {
            var value1, value2, value3;

            i1NumberValue = parseFloat(parseFloat(i1NumberValue).toFixed(4));
            if(has1 && i1.value.length != 0 && i1NumberValue <= selectedMaxIndicator1 && i1NumberValue >= selectedMinIndicator1) {
                value1 = normalize(selectedMinIndicator1, selectedMaxIndicator1, 0, maxBarHeight, i1NumberValue);
            } else {
                value1 = 0;
            }
            if(has2){
                if(!has1) {
                    // show bar with a default height anyway so that the
                    // second indicator can still be observed
                    value1 = barNoDataHeight;
                }
                i2NumberValue = parseFloat(parseFloat(i2NumberValue).toFixed(4));
                if(i2.value.length != 0 && i2NumberValue <= selectedMaxIndicator2 && i2NumberValue >= selectedMinIndicator2) {
                    value2 = normalize(selectedMinIndicator2, selectedMaxIndicator2, 0, 1, i2NumberValue);
                } else {
                    value2 = -1;
                }
            } else {
                value2 = -1;
            }

            i3NumberValue = parseFloat(parseFloat(i3NumberValue).toFixed(4));
            if(has3 && i3.value.length != 0 && i3NumberValue <= selectedMaxIndicator3 && i3NumberValue >= selectedMinIndicator3) {
                value3 = normalize(selectedMinIndicator3, selectedMaxIndicator3, 0, 1, i3NumberValue);
            } else {
                value3 = -1;
            }

            if(rebuild1And2) {
                // find the color of the bar for the country, which is a color picked
                // from a gradient of blue to yello associated with a scale between 0
                // and 1. This value within that scale is obtained by scaling down the
                // density value.
                var barColor;
                if(value2 == -1) {
                    barColor = barNoDataColor;
                } else {
                    barColor = barColorScale(value2).hex();
                }

                var hasBar = false;
                // TODO: WE ARE NO LONGER REBUILDING BARS, SO OPTIMIZE THIS TO
                // CREATE ONE ON STARTUP AND ADD THEM TO A MAP BY COUNTRYCODE
                for (var i = 0 ; i < shownBarsData.length; i++) {
                    var barData = shownBarsData[i];
                    if(barData.countryCode == countryCode) {
                        hasBar = true;

                        // change the material color
                        var mesh1 = barData.bar;
                        mesh1.material.color.setStyle(barColor);

                        var lat1 = countryDetails.latitude;
                        var lon1 = countryDetails.longitude;
                        var position1 = latLongToVector3(lat1, lon1, 100 + value1 / 2 - 2, 1);
                        mesh1.scale.x = barWidth;
                        mesh1.scale.y = barWidth;
                        if (value1 == 0) {
                            mesh1.scale.z = -1;
                        } else {
                            mesh1.scale.z = value1;
                        }
                        mesh1.position.x = position1.x;
                        mesh1.position.y = position1.y;
                        mesh1.position.z = position1.z;

                        break;
                    }
                }

                if(!hasBar) {

                    // setup the bar material with the obtained color above
                    var barMat = new THREE.MeshBasicMaterial({ color: barColor, wireframe: false});

                    // a CubeGeometry is used for the bar geometry instead of a BoxGeometry
                    // because we are using a old version of three.js (version 62)
                    var barGeom = new THREE.CubeGeometry(1, 1, 1);
                    var mesh2 = new THREE.Mesh(barGeom, barMat);

                    // converts the country country lat-lng position into a vector in the
                    // three-dimensional space
                    var lat2 = countryDetails.latitude;
                    var lon2 = countryDetails.longitude;
                    var position2 = latLongToVector3(lat2, lon2, 100 + value1/2 - 2, 1);
                    mesh2.scale.x = barWidth;
                    mesh2.scale.y = barWidth;
                    if (value1 == 0) {
                        mesh2.scale.z = -1;
                    } else {
                        mesh2.scale.z = value1;
                    }
                    mesh2.position.x = position2.x;
                    mesh2.position.y = position2.y;
                    mesh2.position.z = position2.z;
                    mesh2.lookAt(new THREE.Vector3(0,0,0));
                    mesh2.visible = false;

                    // the bar is added to the scene and lookup-array
                    globeScene.add(mesh2);
                    shownBarsData.push({
                        bar: mesh2,
                        countryCode: countryCode
                    });

                }
            }

            if(value3 != -1) {
                var countryColor = countryColorScale(value3).hex();
                colorCountry(ISOCodeToIndexColorMap[countryCode], countryColor);
            }
        }
    }

    if(rebuild1And2) {
        if(!has1 || originalIndicator1Values.length == 0) {
            var svg = d3.select('#chart1 svg');
            svg.selectAll("*").remove();
            svg.datum([]).call(chart1);

        } else {
            d3.select('#chart1 svg')
                .datum(getChartData(
                    originalIndicator1Values,
                    filteredIndicator1Values,
                    realMinIndicator1,
                    realMaxIndicator1,
                    selectedMinIndicator1,
                    selectedMaxIndicator1))
                .call(chart1);
        }
    }

    if(rebuild1And2) {
        if (!has2 || originalIndicator2Values.length == 0) {
            var svg = d3.select('#chart2 svg');
            svg.selectAll("*").remove();
            svg.datum([]).call(chart2);

        } else {
            d3.select('#chart2 svg')
                .datum(getChartData(
                    originalIndicator2Values,
                    filteredIndicator2Values,
                    realMinIndicator2,
                    realMaxIndicator2,
                    selectedMinIndicator2,
                    selectedMaxIndicator2))
                .call(chart2);
        }
    }

    if(rebuild3) {
        if (!has3 || originalIndicator3Values.length == 0) {
            var svg = d3.select('#chart3 svg');
            svg.selectAll("*").remove();
            svg.datum([]).call(chart3);

        } else {
            d3.select('#chart3 svg')
                .datum(getChartData(
                    originalIndicator3Values,
                    filteredIndicator3Values,
                    realMinIndicator3,
                    realMaxIndicator3,
                    selectedMinIndicator3,
                    selectedMaxIndicator3))
                .call(chart3);
        }
    }

    for(var m in shownBarsData) {
        var barToShow = shownBarsData[m].bar;
        barToShow.visible = true;
    }
}


function getChartData(originalData, filteredData, realMin, realMax, selectedMin, selectedMax) {

    var originalDataStats = stats(originalData);
    var originalQ1 = originalDataStats.q1();
    var originalQ2 = originalDataStats.median();
    var originalQ3 = originalDataStats.q3();

    var filteredDataStats = stats(filteredData);
    var filteredQ1 = filteredDataStats.q1();
    var filteredQ2 = filteredDataStats.median();
    var filteredQ3 = filteredDataStats.q3();

    return  [
        {
            label: "Original",
            color: '#aaa',
            values: {
                Q1: originalQ1,
                Q2: originalQ2,
                Q3: originalQ3,
                whisker_low: realMin,
                whisker_high: realMax
            }
        },
        {
            label: "Filtered",
            color: '#aaa',
            values: {
                Q1: filteredQ1,
                Q2: filteredQ2,
                Q3: filteredQ3,
                whisker_low: selectedMin,
                whisker_high: selectedMax
            }
        }
    ];
}


// function that colors a country with the specified ISO-3166 code with the
// specified color
function colorCountry(countryCode, color) {
    ratioContext.fillStyle = color;
    ratioContext.fillRect(countryCode, 0, 1, 1);
    ratioTexture.needsUpdate = true;
}



function onAnchorCountryDetailsToMouseCheckboxChange() {
    anchorCountryDetailsToMouse = anchorCountryDetailsToMouseCheckbox.checked;
    if(anchorCountryDetailsToMouse) {
        detailsContainerJQuery.addClass('details-dark');
        detailsContainerJQuery.removeClass('details-light');
    } else {
        detailsContainerJQuery.removeClass('details-dark');
        detailsContainerJQuery.addClass('details-light');
    }
}



function onAnchorCountryDetailsToMouseLabelClick() {
    anchorCountryDetailsToMouseCheckbox.checked = !anchorCountryDetailsToMouseCheckbox.checked;
    anchorCountryDetailsToMouse = anchorCountryDetailsToMouseCheckbox.checked;
    if(anchorCountryDetailsToMouse) {
        detailsContainerJQuery.addClass('details-dark');
        detailsContainerJQuery.removeClass('details-light');
    } else {
        detailsContainerJQuery.removeClass('details-dark');
        detailsContainerJQuery.addClass('details-light');
    }
}



function onKeepBoundsCheckboxChange() {
    keepBoundsOnYearChange = keepBoundsCheckbox.checked;
}



function onKeepBoundsLabelClick() {
    keepBoundsCheckbox.checked = !keepBoundsCheckbox.checked;
    keepBoundsOnYearChange = keepBoundsCheckbox.checked;
}


function attemptShowDetailsOfCountry(x, y) {
    if(cameraIsBeingDragged) {
        highlightContext.clearRect(0, 0, 256, 1);
        highlightTexture.needsUpdate = true;
        detailsContainer.innerHTML = "";
        detailsContainerJQuery.hide();
        return;
    }

    var rayCaster = projector.pickingRay(mouse2D.clone(), camera);
    var countryIndexColor = -1;
    var hoveredABar = false;
    var hoveredACountry = false;

    for (var i = 0; i < shownBarsData.length; i++) {
        var selectedBarData = shownBarsData[i];
        var intersects = rayCaster.intersectObject(selectedBarData.bar);
        if (intersects.length) {
            // mouse hover intersected the bar i, so select it and the corresponding country
            //cameraTargetX = selectedBarData.position.x;
            //cameraTargetY = selectedBarData.position.y;
            //cameraTargetZ = selectedBarData.position.z;
            //cameraIsMovingToTarget = true;
            for (var j = 0; j < shownCountries.length; j++) {
                var c1 = shownCountries[j];
                if(c1.countryCode == selectedBarData.countryCode) {
                    countryIndexColor = ISOCodeToIndexColorMap[c1.countryCode];
                    if (countryIndexColor > 0) {
                        // the country was hovered and had details, so select it
                        detailsContainer.innerHTML = getDetails(c1.countryCode, c1.lineIndex);
                        if(anchorCountryDetailsToMouse) {
                            detailsContainerJQuery.offset({
                                left: x + tooltipOffset,
                                top: y + tooltipOffset
                            });
                        } else {
                            detailsContainerJQuery.offset({
                                left: window.innerWidth - detailsContainer.offsetWidth,
                                top: 50
                            });
                            detailsContainerJQuery.removeClass('details-dark');
                            detailsContainerJQuery.addClass('details-light');
                        }
                        detailsContainerJQuery.show();
                        //var countryDetails = ISOCodeToDetailsMap[c1.countryCode];
                        //var lat = countryDetails.latitude;
                        //var lon = countryDetails.longitude;
                        //var position = latLongToVector3(lat, lon, 100, 1);
                        //cameraTargetX = position.x;
                        //cameraTargetY = position.y;
                        //cameraTargetZ = position.z;
                        //cameraIsMovingToTarget = true;

                        highlightContext.clearRect(0, 0, 256, 1);
                        highlightContext.fillStyle = "#666666";
                        highlightContext.fillRect(countryIndexColor, 0, 1, 1);
                        highlightTexture.needsUpdate = true;
                        searchField.blur();
                        hoveredABar = true;
                    }
                    break;
                }
            }
            break;
        }
    }

    if (!hoveredABar) {
        // mouse did not intersect a bar, so check if it intersected a country
        var intersectionList = rayCaster.intersectObject(worldSphereMesh);
        if (intersectionList.length > 0) {
            var data = intersectionList[0];
            var d = data.point.clone().normalize();
            var u = Math.round(4096 * (1 - (0.5 + Math.atan2(d.z, d.x) / (2 * Math.PI))));
            var v = Math.round(2048 * (0.5 - Math.asin(d.y) / Math.PI));
            var p = mapContext.getImageData(u, v, 1, 1).data;
            countryIndexColor = p[0];
            // countryIndexColor 0 is the sea and -1 is invalid, so ignore
            // those instances
            if (countryIndexColor > 0) {
                // a country was hovered, but we need to ignore it if its
                // details were filtered
                for (var k = 0; k < shownCountries.length; k++) {
                    var c2 = shownCountries[k];
                    if (ISOCodeToIndexColorMap[c2.countryCode] == countryIndexColor) {
                        // the country was hovered and had details, so select it
                        detailsContainer.innerHTML = getDetails(c2.countryCode, c2.lineIndex);
                        if(anchorCountryDetailsToMouse) {
                            detailsContainerJQuery.offset({
                                left: x + tooltipOffset,
                                top: y + tooltipOffset
                            });
                        } else {
                            detailsContainerJQuery.offset({
                                left: window.innerWidth - 425,
                                top: 50
                            });
                        }
                        detailsContainerJQuery.show();
                        //var countryDetails = ISOCodeToDetailsMap[c2.countryCode];
                        //var lat = countryDetails.latitude;
                        //var lon = countryDetails.longitude;
                        //var position = latLongToVector3(lat, lon, 100, 1);
                        //cameraTargetX = position.x;
                        //cameraTargetY = position.y;
                        //cameraTargetZ = position.z;
                        //cameraIsMovingToTarget = true;

                        highlightContext.clearRect(0, 0, 256, 1);
                        highlightContext.fillStyle = "#666666";
                        highlightContext.fillRect(countryIndexColor, 0, 1, 1);
                        highlightTexture.needsUpdate = true;
                        searchField.blur();
                        hoveredACountry = true;
                        break;
                    }
                }
            }
        }
    }

    if(!hoveredABar && !hoveredACountry) {
        highlightContext.clearRect(0, 0, 256, 1);
        highlightTexture.needsUpdate = true;
        detailsContainer.innerHTML = "";
        detailsContainerJQuery.hide();
    }
}


// mouse movement callback which detects the distance between the last
// mouseDown event and determines if the country selection action should still
// be triggered when the mouseUp event occurs, by observing if a minimum drag
// distance was exceeded
function onMouseMove(event) {
    event.preventDefault();

    mouse2D.x =   (event.clientX / worldContainer.offsetWidth) * 2 - 1;
    mouse2D.y = - (event.clientY / worldContainer.offsetHeight) * 2 + 1;

    //// xdiff and ydiff represent the mouse distance between the current mouse
    //// position and the mouse position when the mouse button was last pressed
    //var xdiff = lastMouseX - mouse2D.x;
    //if(xdiff < 0) {
    //    xdiff = -xdiff;
    //}
    //
    //var ydiff = lastMouseY - mouse2D.y;
    //if(ydiff < 0) {
    //    ydiff = -ydiff;
    //}
    //
    //// if the distance measured above exceeds a minimum value (defined as a
    //// constant), then the country selection action is ignored, performing
    //// only the globe drag
    //isSelectingCountry = !(xdiff > minimumDragDistance || ydiff > minimumDragDistance);

    attemptShowDetailsOfCountry(event.pageX, event.pageY);
}


// mouse movement callback which interrupts camera selection movement
function onMouseWheel(event) {
    cameraIsMovingToTarget = false;
    highlightContext.clearRect(0, 0, 256, 1);
    highlightTexture.needsUpdate = true;
    detailsContainer.innerHTML = "";
    detailsContainerJQuery.hide();
}


// mouse movement callback which stores the mouse position, allowing the
// mouseMove event to calculate if a minimum drag distance was exceeded
function onMouseDown(event) {
    event.preventDefault();
    cameraIsBeingDragged = true;

    lastMouseX =   (event.clientX / worldContainer.offsetWidth) * 2 - 1;
    lastMouseY = - (event.clientY / worldContainer.offsetHeight) * 2 + 1;

    cameraIsMovingToTarget = false;
}


// mouse movement callback which triggers country selection if the minimum
// drag distance was not exceeded
function onMouseUp(event) {
    event.preventDefault();
    cameraIsBeingDragged = false;
    mouse2D.x = (event.clientX / worldContainer.offsetWidth) * 2 - 1;
    mouse2D.y = -(event.clientY / worldContainer.offsetHeight) * 2 + 1;
}


// TODO
function onTouchStart(event) {
    event.preventDefault();
    cameraIsMovingToTarget = false;
}


// TODO
function onTouchMove(event) {
    event.preventDefault();
}


// function that select a country with the specified ISO-3166 alpha 3 country
// code (used by auto-complete)
function select(countryCodeToSelect) {
    var countryDetails = ISOCodeToDetailsMap[countryCodeToSelect];
    var lat = countryDetails.latitude;
    var lon = countryDetails.longitude;
    var position = latLongToVector3(lat, lon, 100, 1);
    cameraTargetX = position.x;
    cameraTargetY = position.y;
    cameraTargetZ = position.z;
    cameraIsMovingToTarget = true;

    var countryIndexColor = ISOCodeToIndexColorMap[countryCodeToSelect];
    blinkCountry(countryIndexColor);

    //for (var i = 0; i < shownCountries.length; i++) {
    //    var c = shownCountries[i];
    //    if (ISOCodeToIndexColorMap[c.countryCode] == countryIndexColor) {
    //        // the country was hovered and had details, so select it
    //        detailsContainer.innerHTML = getDetails(c.countryCode, c.lineIndex);
    //        detailsContainerJQuery.offset({
    //            left: Math.floor(worldContainer.offsetWidth/2) + tooltipOffset,
    //            top: Math.floor(worldContainer.offsetHeight/2) + tooltipOffset
    //        }).show(1000);
    //        break;
    //    }
    //}
}

function blinkCountry(countryIndexColor) {
    blinkCountryAux(countryIndexColor, 0, 4)
}

function blinkCountryAux(countryIndexColor, count, max) {
    highlightContext.clearRect(0,0,256,1);
    highlightTexture.needsUpdate = true;
    if(count >= max) {
        return;
    }
    setTimeout(function () {
        highlightContext.fillStyle = "#fff";
        highlightContext.fillRect(countryIndexColor, 0, 1, 1);
        highlightTexture.needsUpdate = true;
        setTimeout(function (){
            blinkCountryAux(countryIndexColor, count+1, max)
        }, 200);
    }, 200);
}

// function that returns text details for a given country
function getDetails(countryCode, countryLineIndex) {
    selectedCountryCode = countryCode;
    selectedCountryLineIndex = countryLineIndex;

    var countryDetails = ISOCodeToDetailsMap[countryCode];
    var countryName;
    if(countryDetails == null) {
        countryName = "";
    } else {
        countryName = countryDetails.name;
    }

    var s = "<h4>" + countryName + " <span>(" + countryCode + ")</span></h4>";

    for(var i = 0; i < indicatorIdArray.length; i++) {
        var id = indicatorIdArray[i];
        var indicatorData = selectedYearJson[id][countryLineIndex];
        var indicatorDetails = indicatorIdToDetailsMap[id];

        // optional, style labels by indicator subset
        var labelStyle = "label-success";
        if(id == "SM.POP.NETM") {
            labelStyle = "label-warning";
        } else if(id == "SP.DYN.CBRT.IN" || id == "SP.DYN.CDRT.IN" || id == "SP.DYN.CBDRT.IN" || id == "SP.DYN.LE00.IN") {
            labelStyle = "label-info";
        }

        var value;
        if(indicatorData.value.length == 0) {
            value = "No Data";
            labelStyle = "label-danger";
        } else {
            value = round(indicatorData.value, 2) + " " + indicatorDetails.unit;
        }

        s = s + "<p>"+indicatorDetails.name+" <span class='label "+ labelStyle +"'>" + value + "</span></p>";
    }

    return s;
}


// function that formats a number using a fixed-point notation while avoiding
// floating point decimals issue found in some browsers
function round(value, exp) {
    if (typeof exp === 'undefined' || +exp === 0)
        return Math.round(value);

    value = +value;
    exp  = +exp;

    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
        return NaN;

    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
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
function normalize(oldMin, oldMax, newMin, newMax, input) {
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

    if (camera.position.length() < 300){
        camera.position.setLength(300);
    }

    if (camera.position.length() > 1000) {
        camera.position.setLength(1000);
    }

    requestAnimationFrame(animate);
    render();
    controls.update();
}

// function that sets a new target for the camera
function moveCamera() {
    var speed = 0.15;
    var target_x = ((cameraTargetX - camera.position.x) * speed);
    var target_y = ((cameraTargetY - camera.position.y) * speed);
    var target_z = ((cameraTargetZ - camera.position.z) * speed);

    camera.position.x += target_x;
    camera.position.y += target_y;
    camera.position.z += target_z;

    camera.lookAt({x: cameraTargetLX, y: cameraTargetLY, z: cameraTargetLZ });
}

// three.js render function that is recursively called
function render() {
    renderer.clear();
    renderer.render(globeScene, camera);
    composer.render();
}
