const SOL=1;
const NUBE=2;
const LLUVIA=3;

function initVariables(){

}
function loadEvents(){
    initVariables();
    loadMap();
    loadJSON("08019");
    loadJSON("17079");
    loadJSON("25120");
    loadJSON("43148");
    map.on("mousemove",changeCursor);
    map.on('click',addMarker);
    inputEvents();
}

function loadMap(){
    mapboxgl.accessToken = 'pk.eyJ1IjoiY3Jpc3RpYW5yYW1pcmV6OTkiLCJhIjoiY2toNHBzbHgxMDBqMzJ2cDV0aTNraGo3YyJ9.0OsfMH_GY07BxQ7xks3dYA';
    map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [2.17634927,41.38424664],
    zoom: 6
    });
}
function loadImage(tiempoActual,altitud,latitud){
    map.loadImage(
        'media/tiempo'+tiempoActual+'.jpg',
        function (error,image) {
        if (error) throw error;
        map.addImage('tiempo', image);
        map.addSource('point', {
        'type': 'geojson',
        'data': {
        'type': 'FeatureCollection',
        'features': [
        {
        'type': 'Feature',
        'geometry': {
        'type': 'Point',
        'coordinates': [altitud, latitud]
        }
        }
        ]
        }
        });
        map.addLayer({
        'id': 'points',
        'type': 'symbol',
        'source': 'point',
        'layout': {
        'icon-image': 'tiempo',
        'icon-size': 0.1
        }
        });
        }
        );
}
function processJSONMunicipio(){
    if(this.readyState==4 && this.status==200)
    {
        var tiempoActual=null;
        var perro=null;
        object=JSON.parse(this.responseText);
        var descripcion=object.stateSky.description;
        var altitud = object.municipio.LONGITUD_ETRS89_REGCAN95;
        var latitud = object.municipio.LATITUD_ETRS89_REGCAN95
        var lluvia= object.lluvia;

        if(lluvia>0){
            tiempoActual=LLUVIA;
        }
        else if(descripcion==="Despejado"){
            tiempoActual=SOL;
        }else{
            tiempoActual = NUBE;
        }
        loadImage(tiempoActual,altitud,latitud);
    }
}
function changeMapStyle(input){
    var menu=document.getElementById("menu");
    var inputs=document.getElementsByTagName("input");
    
    var inputID = input.target.id;
    map.setStyle('mapbox://styles/mapbox/'+inputID);
}

function changeCursor(){
    map.getCanvas().style.cursor = 'crosshair';
 }

function addMarker(e){
    var marker = new mapboxgl.Marker().setLngLat([e.lngLat.lng,e.lngLat.lat]).addTo(map);
}

function inputEvents(){
    var inputs = document.getElementsByTagName("input");

    for(i=0; i < inputs.length;i++){
        inputs[i].addEventListener('click',changeMapStyle);
    }
}
function loadJSON(codigo){
    var xmlhttp =new XMLHttpRequest();
    xmlhttp.onreadystatechange=processJSONMunicipio;
    xmlhttp.open("GET","https://www.el-tiempo.net/api/json/v2/provincias/[CODPROV]/municipios/"+codigo,true);
    xmlhttp.send();
}
