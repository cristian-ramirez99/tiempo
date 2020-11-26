const SOL = 1;
const NUBE = 2;
const LLUVIA = 3;

let municipios = [];

function loadEventsJSON() {

    //Barcelona
    loadJSONDesplegable("08");
    loadJSON("08019");

    //Girona
    loadJSONDesplegable("17");
    loadJSON("17079");
    //Lleida
    loadJSONDesplegable("25");
    loadJSON("25120");

    //Tarragona
    loadJSONDesplegable("43");
    loadJSON("43148");

}
function loadEvents() {
    loadMap();
    loadEventsJSON();
    document.getElementById("municipios").addEventListener('change', passCodIneToJSON);
    map.on("mousemove", changeCursor);
    map.on('click', goTo);
    inputEvents();
}

function loadMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY3Jpc3RpYW5yYW1pcmV6OTkiLCJhIjoiY2toNHBzbHgxMDBqMzJ2cDV0aTNraGo3YyJ9.0OsfMH_GY07BxQ7xks3dYA';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [2.17634927, 41.38424664],
        zoom: 6
    });
}
function getNearLocation(altitud, latitud) {
    geoCodingClient.reverseGeocode({
        query: [altitud, latitud]
    })
        .send()
        .then(response => {
            const match = response.body;
        });
}
function passCodIneToJSON() {
    var indexMunicipio = document.getElementById("municipios").options.selectedIndex - 1;

    //Si distinto de opcion vacia
    if (indexMunicipio >= 0) {
        var codINE = this.value;
        codINE = codINE.slice(0, 5);
        loadJSON(codINE);
    }
}
function addFeatures() {
    let i = 0;
    geojson.features.forEach(function (marker) {
        // create a DOM element for the marker
        var el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage =
            "url('../media/tiempo" + municipios[i].tiempo + ".png')";
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.width = 100 + 'px';
        el.style.height = 100 + 'px';

        //add marker to map
        new mapboxgl.Marker(el)
            .setLngLat(marker.geometry.coordinates)
            .addTo(map);
        i++;
    });
}
function loadImage() {
    var i = municipios.length;
    geojson = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'properties': {
                    'message': 'Tiempo' + i,
                    'iconSize': [40, 40]
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [municipios[i - 1].altitud, municipios[i - 1].latitud]
                }
            }
        ]
    };
}
function processJSONDesplegable() {
    if (this.readyState == 4 && this.status == 200) {
        var object = JSON.parse(this.responseText);
        var municipios = document.getElementById("municipios");
        var length = Object.keys(object.municipios).length;

        let codINE = 0;
        let i = 0;
        do {
            codINE = object.municipios[i].CODIGOINE;
            municipios.innerHTML += "<option value=" + codINE + ">" + object.municipios[i].NOMBRE + "</option>";
            i++;
        } while (length > i);
    }
}
function processJSONMunicipio() {
    if (this.readyState == 4 && this.status == 200) {
        let tiempoActual = null;
        var object = JSON.parse(this.responseText);
        var descripcion = object.stateSky.description;
        var altitud = object.municipio.LONGITUD_ETRS89_REGCAN95;
        var latitud = object.municipio.LATITUD_ETRS89_REGCAN95
        var lluvia = object.lluvia;

        if (lluvia > 0) {
            tiempoActual = LLUVIA;
        }
        else if (descripcion === "Despejado" || descripcion === "Poco nuboso") {
            tiempoActual = SOL;
        } else {
            tiempoActual = NUBE;
        }
        municipios.push(new Municipio(altitud, latitud, tiempoActual));

        loadImage();
        addFeatures();

        if (municipios.length > 4) {
            flying(altitud, latitud);
        }
    }
}
function changeMapStyle(input) {
    var menu = document.getElementById("menu");
    var inputs = document.getElementsByTagName("input");

    var inputID = input.target.id;
    map.setStyle('mapbox://styles/mapbox/' + inputID);
}
function flying(altitud, latitud) {
    map.flyTo({
        center: [altitud, latitud],
        zoom: 12,
        essential: true
    });
}
function changeCursor() {
    map.getCanvas().style.cursor = 'crosshair';
}

function goTo(e) {
    //var marker = new mapboxgl.Marker().setLngLat([e.lngLat.lng, e.lngLat.lat]).addTo(map);
    flying(e.lngLat.lng, e.lngLat.lat)
}

function inputEvents() {
    var inputs = document.getElementsByTagName("input");

    for (i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('click', changeMapStyle);
    }
}
function loadJSON(codigo) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = processJSONMunicipio;
    xmlhttp.open("GET", "https://www.el-tiempo.net/api/json/v2/provincias/[CODPROV]/municipios/" + codigo, true);
    xmlhttp.send();
}

function loadJSONDesplegable(codigo) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = processJSONDesplegable;
    xmlhttp.open("GET", "https://www.el-tiempo.net/api/json/v2/provincias/" + codigo + "/municipios", true);
    xmlhttp.send();
}

class Municipio {
    constructor(altitud, latitud, tiempo) {
        this.altitud = altitud;
        this.latitud = latitud;
        this.tiempo = tiempo;
    }
}
