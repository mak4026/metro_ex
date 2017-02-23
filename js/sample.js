const API_ENDPOINT = 'https://api.tokyometroapp.jp/api/v2/';
const API_RAILWAY = API_ENDPOINT + 'datapoints?rdf:type=odpt:Railway'
const API_STATION = API_ENDPOINT + 'datapoints?rdf:type=odpt:Station'
const API_TRAIN = API_ENDPOINT + 'datapoints?rdf:type=odpt:Train'
const API_TRAINTIMETABLE = API_ENDPOINT + 'datapoints?rdf:type=odpt:TrainTimetable'
const TOKEN = '';
const PARAM_TOKEN = '&acl:consumerKey=' + TOKEN;
const LINE_COLOR = {
  'odpt.Railway:TokyoMetro.Ginza': '#FF9500', //銀座線
  'odpt.Railway:TokyoMetro.Marunouchi': '#F62E36', //丸ノ内線
  'odpt.Railway:TokyoMetro.MarunouchiBranch': '#F62E36', //丸ノ内線
  'odpt.Railway:TokyoMetro.Hibiya': '#B5B5AC',  //日比谷線
  'odpt.Railway:TokyoMetro.Tozai': '#009BBF', //東西線
  'odpt.Railway:TokyoMetro.Chiyoda': '#00BB85', //千代田線
  'odpt.Railway:TokyoMetro.Yurakucho': '#C1A470', //有楽町線
  'odpt.Railway:TokyoMetro.Hanzomon': '#8F76D6',  //半蔵門線
  'odpt.Railway:TokyoMetro.Namboku': '#00AC9B', //南北線
  'odpt.Railway:TokyoMetro.Fukutoshin': '#9C5E31'  //副都心線
};
// var railway_name;
const railway_name = {
  "odpt.Railway:TokyoMetro.Ginza": "銀座線",
  "odpt.Railway:TokyoMetro.Marunouchi":  "丸ノ内線",
  "odpt.Railway:TokyoMetro.Hibiya":  "日比谷線",
  "odpt.Railway:TokyoMetro.Tozai": "東西線",
  "odpt.Railway:TokyoMetro.Chiyoda": "千代田線",
  "odpt.Railway:TokyoMetro.Yurakucho": "有楽町線",
  "odpt.Railway:TokyoMetro.Hanzomon":  "半蔵門線",
  "odpt.Railway:TokyoMetro.Namboku": "南北線",
  "odpt.Railway:TokyoMetro.Fukutoshin":  "副都心線"
}

const train_type = {
  "odpt.TrainType:TokyoMetro.Local": "普通",
  "odpt.TrainType:TokyoMetro.SemiExpress": "準急",
  "odpt.TrainType:TokyoMetro.Express": "急行"
}

const rail_direction = {
  "odpt.RailDirection:TokyoMetro.Oshiage": "押上方面",
  "odpt.RailDirection:TokyoMetro.Shibuya": "渋谷方面"
}


var railways = {};
var stations = {};
var markers = {};
var timetables = {};

function loadRailwayList(){
  /* ローカルのファイルを読み込むとChromeに怒られる
  $.ajax( {
    type: 'GET',
    url: 'railway.json',
    dataType : 'json',
    // async: false,
    success: function(json) {
      railway_name = json;
    }
  });
  */
}

function initMap() {

  var mapStyles = [
  ];

  var dataStyle = function(feature) {
    return {
      strokeColor: LINE_COLOR[feature.getProperty('owl:sameAs')],
      strokeWeight: 6.0,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6.0,
        fillColor: 'white',
        fillOpacity: 1.0,
        strokeColor: LINE_COLOR[feature.getProperty('odpt:railway')],
        strokeWeight: 2.0,
        zIndex: 1
      }
    };
  };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 14,
    center: { lat: 35.7234044, lng: 139.748363 },
    styles: mapStyles
  });

  map.data.setStyle(dataStyle);

  // Set mouseover event for each feature.
  map.data.addListener('mouseover', function(event) {
    // map.data.revertStyle();
    if(event.feature.getProperty('@type') == 'odpt:Railway'){
      document.getElementById('info-box').innerHTML =
          railway_name[event.feature.getProperty('owl:sameAs')] + '<br/>'
    }else if(event.feature.getProperty('@type') == 'odpt:Station'){
      map.data.overrideStyle(event.feature, {
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12.0,
          fillColor: 'white',
          fillOpacity: 1.0,
          strokeColor: LINE_COLOR[event.feature.getProperty('odpt:railway')],
          strokeWeight: 4.0,
          zIndex: 1
        }
      });
      document.getElementById('info-box').innerHTML =
          railway_name[event.feature.getProperty('odpt:railway')] + '<br/>'
          + event.feature.getProperty('dc:title') + '駅';
    }
  });

  map.data.addListener('mouseout', function(event) {
    map.data.revertStyle();
  });
}

/*
$.getJSON(URL [,data] [,callback])
URLにGETを送り, callback関数に渡す
*/
function loadRailway() {
  $.getJSON(API_RAILWAY + PARAM_TOKEN, function(data) {
    console.log("loadRailway()", "Railway data loaded");
    for(var i = 0; i < data.length; i++){
      var railway = data[i];
      loadGeojson(railway, i * 500);
      railways[railway['owl:sameAs']] = railway;
    }
  })
  .error(function() {
    setTimeout(loadRailway(), 5000);
  });
}

function loadGeojson(railway, delay) {
  var apiGeojson = railway['ug:region'] + '?acl:consumerKey=' + TOKEN;
  setTimeout(function() {
    $.getJSON(apiGeojson, function(data) {
      var geojson = {
        'type' : 'Feature',
        'geometry' : data,
        'properties' : railway
      };
      map.data.addGeoJson(geojson);
    });
  }, delay);
}

function loadStation() {
  $.getJSON(API_STATION + PARAM_TOKEN, function(data) {
    for(var i = 0; i < data.length; i++) {
      var station = data[i];
      var lng = station['geo:long'];
      var lat = station['geo:lat'];
      stations[station['owl:sameAs']] = station;
      var geojson = {
        'type': 'Feature',
        'geometry': {
          'type' : 'Point',
          'coordinates' : [lng, lat]
        },
        'properties' : station
      };
      map.data.addGeoJson(geojson);
    }
  });
}

var trains;
function loadTrains() {
  $.getJSON(API_TRAIN + "&odpt:railway=" + "odpt.Railway:TokyoMetro.Hanzomon" + PARAM_TOKEN, function(data) {
    console.log("loadTrains()", "Trains data loaded");
    trains = data;

    trains.forEach(function(value){
      drawTrain(value);
    });
  });
}

function loadTimetable(){
  $.getJSON(API_TRAINTIMETABLE
            + "&odpt:railway=" + "odpt.Railway:TokyoMetro.Hanzomon" + PARAM_TOKEN, function(data) {
    console.log("loadTimetable()", "TimeTable data loaded");
    for(var i = 0; i < data.length; i++){
      var aTrainTimetable = data[i];
      if(aTrainTimetable["odpt:trainNumber"] in timetables == 0){
        timetables[aTrainTimetable["odpt:trainNumber"]] = {};
      }
      if(aTrainTimetable["owl:sameAs"].indexOf('Weekdays') != -1){
        timetables[aTrainTimetable["odpt:trainNumber"]]["weekdays"] = aTrainTimetable;
      }else{
        timetables[aTrainTimetable["odpt:trainNumber"]]["holidays"] = aTrainTimetable;
      }
    }
  })
  .error(function() {
    setTimeout(loadTimetable(), 5000);
  });
}

function drawTrain(train) {
  var from = stations[train['odpt:fromStation']];
  var position;
  var icon;

  var trainColor;
  if(train['odpt:trainType'] == "odpt.TrainType:TokyoMetro.Express"){
    trainColor = 'red';
  }else if(train['odpt:trainType'] == "odpt.TrainType:TokyoMetro.SemiExpress"){
    trainColor = 'green';
  }else{
    trainColor = 'blue';
  }

  if(train['odpt:toStation'] == null) {
    var lng = from['geo:long'];
    var lat = from['geo:lat'];
    position = new google.maps.LatLng(lat, lng);
    icon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6.0,
      fillColor: trainColor,
      fillOpacity: 0.5,
      strokeColor: trainColor,
      strokeWeight: 2.0,
      strokeOpacity: 1.0,
      zIndex: 2
    };
  } else {
    var to = stations[train['odpt:toStation']];
    var lng = (from['geo:long'] * 5 + to['geo:long']) / 6;
    var lat = (from['geo:lat'] * 5 + to['geo:lat']) / 6;
    var rotation = Math.atan2(to['geo:long'] - from['geo:long'], to['geo:lat'] - from['geo:lat']) * 180 / Math.PI;
    position = new google.maps.LatLng(lat, lng);
    icon = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 4.0,
      fillColor: trainColor,
      fillOpacity: 0.4,
      rotation: rotation,
      strokeColor: trainColor,
      strokeWeight: 2.0,
      strokeOpacity: 0.8,
      zIndex: 2
    };
  }
  var marker = markers[train['@id']];
  if(marker == null) {
    marker = new google.maps.Marker({
      position: position,
      map: map,
      icon: icon,
      properties: train
    });
    markers[train['@id']] = marker;
  } else {
    marker.set("properties", train);
    marker.setPosition(position);
    marker.setIcon(icon);
  }

  marker.addListener('mouseover', function(e){
    document.getElementById('train-box').innerHTML =
        train_type[this.properties['odpt:trainType']] + '<br/>'
        + rail_direction[this.properties['odpt:railDirection']] + '<br/>'
        + '遅延: ' + this.properties['odpt:delay'] + '秒' + '<br/>';
    getTimeTable(this.properties);
  });
}

function getTimeTable(train){
  /*
  $.getJSON(API_TRAINTIMETABLE + PARAM_TOKEN
              + "&odpt:railway=" + train['odpt:railway']
              + "&odpt:trainNumber=" + train['odpt:trainNumber']
    , function(data) {
  */
  var nowStation = train["odpt:fromStation"];
  var nextStation = train["odpt:toStation"];
  var data = timetables[train["odpt:trainNumber"]];
  var timeTable;
  if("weekdays" in data && data["weekdays"]["odpt:weekdays"].length > 0){
    timeTable = data["weekdays"]["odpt:weekdays"];
  }else if("odpt:saturdays" in data["holidays"] && data["holidays"]["odpt:saturdays"].length > 0){
    timeTable = data["holidays"]["odpt:saturdays"];
  }else if("odpt:holidays" in data["holidays"] && data["holidays"]["odpt:holidays"].length > 0){
    timeTable = data["holidays"]["odpt:holidays"];
  }else{
    return;
  }

  var nextIndex = 0;
  for(var i = 0; i < timeTable.length-1; i++){
    if(timeTable[i]["odpt:departureStation"] == nowStation){
      nextIndex = i+1;
      break;
    }
  }
  for(var i = 0; i < 3; i++){
    if(nextIndex + i >= timeTable.length)
      break;

    var stationName;
    if(nextIndex + i == timeTable.length - 1){
      stationName = stations[timeTable[nextIndex+i]["odpt:arrivalStation"]]["dc:title"];
      document.getElementById('train-box').innerHTML +=
          stationName + '  '
          + timeTable[nextIndex + i]["odpt:arrivalTime"] + '<br/>';
    }else{
      stationName = stations[timeTable[nextIndex+i]["odpt:departureStation"]]["dc:title"];
      document.getElementById('train-box').innerHTML +=
          stationName + '  '
          + timeTable[nextIndex + i]["odpt:departureTime"] + '<br/>';
    }
  }
  /*
    });
  */
}
