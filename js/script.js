const SOL = 1;
const NUBE = 2;
const LLUVIA = 3;

haveToFly = false;
let municipios = [];
let municipiosTotales = [];

function loadEventsProvincias() {

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
    loadEventsProvincias();
    document.getElementById("municipios").addEventListener('change', passCodIneToJSON);

    map.on("mousemove", changeCursor);
    map.on('click', goTo);

    //no es resize
    //map.on('resize', checkBoundsOfVisibleRegion);

    map.on('drag', checkBoundsOfVisibleRegion);

    inputEvents();
}
function loadMap() {
    //Cargamos el mapa 
    mapboxgl.accessToken = 'pk.eyJ1IjoiY3Jpc3RpYW5yYW1pcmV6OTkiLCJhIjoiY2toNHBzbHgxMDBqMzJ2cDV0aTNraGo3YyJ9.0OsfMH_GY07BxQ7xks3dYA';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [2.17634927, 41.38424664],
        zoom: 6
    });
}
function passCodIneToJSON() {
    var indexMunicipio = document.getElementById("municipios").options.selectedIndex - 1;

    //Si distinto de opcion vacia
    if (indexMunicipio >= 0) {
        //Manipulamos codINE
        var codINE = this.value;
        codINE = codINE.slice(0, 5);

        //Fly
        haveToFly = true;

        //Cargamos el municipio 
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
    //Carga los municipios en el desplegable
    if (this.readyState == 4 && this.status == 200) {
        var object = JSON.parse(this.responseText);
        var e = document.getElementById("municipios");
        var length = Object.keys(object.municipios).length;

        let codINE = 0;
        let i = 0;

        do {
            //Datos de JSON
            var altitud = object.municipios[i].LONGITUD_ETRS89_REGCAN95;
            var latitud = object.municipios[i].LATITUD_ETRS89_REGCAN95;
            codINE = object.municipios[i].CODIGOINE;

            //Guardamos en un array todos los municipios
            municipiosTotales.push(new Municipio(altitud, latitud, null, false));

            //Añdimos municipios la desplegable
            e.innerHTML += "<option value=" + codINE + ">" + object.municipios[i].NOMBRE + "</option>";

            i++;
        } while (length > i);
    }
}
function processJSONMunicipio() {
    if (this.readyState == 4 && this.status == 200) {

        var object = JSON.parse(this.responseText);

        //Datos JSON
        var altitud = object.municipio.LONGITUD_ETRS89_REGCAN95;
        var latitud = object.municipio.LATITUD_ETRS89_REGCAN95

        //Si son las 4 provincias o el municipio no se muestra todavia en el mapa
        if (municipios.length < 4 || !isMunicipioLoaded(altitud, latitud)) {
            let tiempoActual = null;

            //Datos JSON
            var descripcion = object.stateSky.description;
            var lluvia = object.lluvia;

            //GetWeather 
            if (lluvia > 0) {
                tiempoActual = LLUVIA;
            }
            else if (descripcion === "Despejado" || descripcion === "Poco nuboso") {
                tiempoActual = SOL;
            } else {
                tiempoActual = NUBE;
            }

            //Añadir el municipio a cargar en el array 
            municipios.push(new Municipio(altitud, latitud, tiempoActual, true));

            //Añadir imagen al mapa
            loadImage();
            addFeatures();
        }

        //Fly
        if (haveToFly) {
            flying(altitud, latitud);
            haveToFly = false;
        }
    }
}
function isMunicipioLoaded(alt, lat) {
    //Mira si imagen del municipio ya cargada
    for (let i = 0; municipios.length > i; i++) {
        var altMun = municipios[i].altitud;
        var latMun = municipios[i].latitud;

        if (altMun == alt && latMun == lat) {
            return true;
        }
    }
    return false;
}
function changeMapStyle(input) {
    //Cambia mapa a calle o satelite 
    var menu = document.getElementById("menu");
    var inputs = document.getElementsByTagName("input");

    var inputID = input.target.id;
    map.setStyle('mapbox://styles/mapbox/' + inputID);
}
function flying(altitud, latitud) {
    //Fly
    map.flyTo({
        center: [altitud, latitud],
        zoom: 12,
        essential: true
    });
}
function changeCursor() {
    map.getCanvas().style.cursor = 'crosshair';
}
function checkBoundsOfVisibleRegion(e) {
    var zoom = map.getZoom();
    console.log(zoom);
    var minZoom = 12.5;

    //Si zoom > 12.5 carga municipios que actualmente se ven en el mapa 
    if (zoom > minZoom) {
        //Bounds de mi actual posicion
        var camara = map.getBounds();
        console.log(camara);

        let i = 0;

        do {
            var municipio = new mapboxgl.LngLat(municipiosTotales[i].altitud, municipiosTotales[i].latitud);

            if (camara.contains(municipio)) {
                var codigo = document.getElementById("municipios").options.item(i + 1).value;
                codigo = codigo.slice(0, 5);
                loadJSON(codigo);
            }
            i++;
        } while (municipiosTotales.length > i);
    }
}
function checkBounds(e) {
    //Comprueba si hay municipio cercano al clickar 
    var bounds = 0.1;
    var posicionActual = new mapboxgl.LngLat(e.lngLat.lng, e.lngLat.lat);

    let i = 0;
    do {
        var municipioBounds = new mapboxgl.LngLatBounds(
            new mapboxgl.LngLat(municipiosTotales[i].altitud - bounds, municipiosTotales[i].latitud - bounds),
            new mapboxgl.LngLat(municipiosTotales[i].altitud + bounds, municipiosTotales[i].latitud + bounds)
        );
        if (municipioBounds.contains(posicionActual)) {
            var codigo = document.getElementById("municipios").options.item(i + 1).value;
            codigo = codigo.slice(0, 5);
            haveToFly = true;
            loadJSON(codigo);
            break;
        }
        i++;
    } while (municipiosTotales.length > i);
}
function goTo(e) {
    checkBounds(e);
    flying(e.lngLat.lng, e.lngLat.lat);
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
    constructor(altitud, latitud, tiempo, visible) {
        this.altitud = altitud;
        this.latitud = latitud;
        this.tiempo = tiempo;
        this.visible = visible;
    }
}

