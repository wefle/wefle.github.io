EXCEL_FILE = "output/stempel.xlsx"

//supporting methods
function filter_normal_stamps(elem){
  return elem.special == "nein";
}
function filter_special_stamps(elem){
  return elem.special == "ja";
}
function sort_stamps(elem_a, elem_b){
  return elem_a.stamp_name.replace('"', '') > elem_b.stamp_name.replace('"', '');
}
function mouseover_marker(elem, name){

  //if more than one locations exist -> show other locations as well 
  if(elem.attr("class").includes(name.replace(/\s|[()]|[0-9]/g, ''))){ 
    d3.selectAll("."+ name.replace(/\s|[()]|[0-9]/g, '')).transition()
    .duration(50)
    .attr("font-size", "20px")        
    .attr("transform", "translate(-4.5, 0)")
    .attr("cursor", "pointer");   
    d3.selectAll("."+ name.replace(/\s|[()]|[0-9]/g, '')).raise(); 
  }
  else{
    elem.transition()
      .duration(50)
      .attr("font-size", "20px")        
      .attr("transform", "translate(-4.5, 0)")
      .attr("cursor", "pointer");
    elem.raise();
    
  } 
}
function mouseover_text_window(name, special, sightseeing, trivia, lat, lng){
  //show info in the side window
  var text_con = d3.select(".text_container")
  //stamp_name
  text_con.append("h1").text(name).attr("class", "text")

  //special stamp (yes/no)
  text_con.append("i")
  .attr("class", "text fa-solid fa-star")
  .append("p").text("Sonderstempel: " + special) 
  .attr("id", "textspecial")

  if(special == "ja"){
    var sp = document.getElementById("textspecial");
    var url = "https://www.harzer-wandernadel.de/stempelstellen/sonderstempel/"
    var str = ""
    if(typeof trivia != 'undefined'){
      if(trivia[0].toLowerCase().includes('sonder') || trivia[0].toLowerCase().includes('stempel'))
          str = "<br> <a class='link' target='_blank' href='" + url + "'>" + trivia[0] + "</a>"                      
    }
    if(str == "")
      str = "<br> <a class='link' target='_blank' href='" + url + "'>mehr zu Sonderstempelstellen</a>"
    sp.innerHTML += str;
  }                  
  
  //special sightseeing (yes/no)
  text_con.append("i")
  .attr("class", "text fa-solid fa-eye")
  .append("p").text("Besondere Sehenswürdigkeit: " + sightseeing) 
  .attr("id", "textsight") 
  
  if(sightseeing == "ja"){
    var sight = document.getElementById("textsight");
    var str = ""
    var href = ""
    //url = href to same or extern site or id to article + website
    var url = ""
    if(trivia.length > 1) url = trivia[1]
    else url = trivia[0]

    url = url.replace(/[\[\]']+/g,'')
    url = url.split(',')
    url[1] = url[1].replace(/'| /g, "")

    var href =''
    if(url[0].toLowerCase().includes('<a')){
      //check if href contains extern 
      //href = href
      if(url[0].toLowerCase().includes('extern')){
        href = url[0].split('"')[3]
      }
      //href = website + href
      else{
        url[0] = url[0].split('"')[1]
        href = url[1] + url[0]
      }
    }
    //href = website + scroll to article
    else{
      url[0] = url[0].replace(/'/g, "")
      href = url[1] + "#" + url[0]
    }                       
                      
    str = "<br> <a class='link' target='_blank' href='" + href + "'>mehr zu " + name + "</a>"             
    sight.innerHTML += str;
  }
                        
  //stamp location(s)
  text_con.append("i")
  .attr("class", "text fa-solid fa-location-dot")
  .append("p").text("placeholder").attr("id", "placeholder")
  
  var str = ""
  for(var i = 0; i < lat.length; i++){
    str += "N" + lat[i] + "|" + "E" + lng[i] + "<br>"
    var href = 'https://www.google.com/maps/search/?api=1&query=' + lat[i] + ', ' + lng[i]
    str += "<a class='link' target='_blank' href='" + href + "'>Standort</a><br><br>"            
  }
  document.getElementById("placeholder").innerHTML = "Stempelstelle(n): " + str 

}
function mouseout_marker(clicked){
  if(!clicked){
    //change marker back 
    d3.selectAll(".marker").transition()                      
    .duration(50)
    .attr("font-size", "12px")        
    .attr("transform", "translate(0, 0)")
    //remove info
    d3.selectAll('.text').remove()
  }
}

//dimensions for viewBox
var width = 300;
var height = 300;

//projection of marker
var projection = d3.geoMercator()
    //Brocken -> center
    .center([10.8167, 51.7167])
    .translate([width/2, height/2])
    .scale(width + 90000 / (2 * Math.PI));
var _zoom = 8.2;

/************************default view******************************************/
//viewBox
var default_svg = d3.select("#default_container .map_container")
.append("svg")
.attr("viewBox", `0 0 ${width} ${height}`)
.classed("view_box", true);

//call functions (legend, background, marker)
function start_default(){
  //loading icon => tree
  default_svg.append("text")
  .text("\uf1bb")
  .attr("font-family", "FontAwesome")
  .attr("font-size", "100px")
  .attr("fill", "black")
  .attr("opacity", 0.5)
  .attr("id", "defloading")
  .attr("x", function(){ return projection([10.57998, 51.84165])[0] + 9})
  .attr("y", function(){ return projection([10.57998, 51.84165])[1] + 75})

  //animation (blinking) while loading map
  function start_loading_default(){
    if(d3.select("#defloading").attr("opacity") == 0.5){
      d3.select("#defloading").transition()
      .delay(20).duration(20)
      .attr("opacity", 0.3)
    }
    else{
      d3.select("#defloading").transition()
      .delay(20).duration(20)
      .attr("opacity", 0.5)
    }
  } 
  function stop_loading_default(){
    clearInterval(loading_interval);
    d3.select("#defloading").attr("display", "none")
  }

  var loading_interval = setInterval(start_loading_default , 500)

  //wait for background map to load until showing marker
  setTimeout(() => {
    setTimeout(() => { 
      extract_and_project_data_default() 
      set_up_legend_default()
    }, 1200)
    set_up_background_default()
    stop_loading_default()
  }, 1000)

  
}

//environmental methods (background, map, view ...)
function set_up_background_default(){
  //map View (background)
  var map = new maplibregl.Map({
    container: 'def_map',
    style: 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json',
    //Brocken -> center
    center: [10.8167, 51.7167],
    zoom: _zoom,
  });
  map.scrollZoom.disable();
  map.dragPan.disable();

  //remove credits
  var basemap = document.getElementById('def_map');
  basemap.removeChild(basemap.children[2]);
  var basemap_canvas = basemap.children[1].children[0];

  //set dimensions of map view container
  basemap.children[1].id = "map_container_container";

  basemap_canvas.width = basemap.children[0].getBoundingClientRect().width;
  basemap_canvas.style.width = basemap.children[0].getBoundingClientRect().width + "px";
  basemap_canvas.height = basemap.children[0].getBoundingClientRect().height;
  basemap_canvas.style.height = basemap.children[0].getBoundingClientRect().height + "px";

  const mapResizeObserver = new ResizeObserver(() => {
    map.resize();
  });
  mapResizeObserver.observe(basemap);

  //zoom function -> currently only zooming, target/center change
  basemap.addEventListener("wheel", function(e){
    _zoom = map.getZoom();
    var s = projection.scale();
    var marker = document.getElementsByClassName("marker");
    //scroll up -> zoom in
    if (e.deltaY < 0) {
      //change zoom from background map
      _zoom += .1;
      map.zoomTo(_zoom, {duration: 50});

      //change scale for marker positioning
      projection.scale(s * (Math.pow(1.022, Math.PI))); //exponential growth
      Array.from(marker).forEach(elem =>{
        if(elem.tagName == "text"){
          var y = elem.attributes.id.value.split(", ")[0];
          var x = elem.attributes.id.value.split(", ")[1];
          d3.select(elem).transition()
          .attr("x", function(){return projection([x, y])[0] - 6;})
          .attr("y", function(){return projection([x, y])[1];});
        }
      })
      
    }
    //scroll up -> zoom out
    else{
      //change zoom from background map
      _zoom -= .1;
      map.zoomTo(_zoom, {duration: 50});

       //change scale for marker positioning
      projection.scale(s / (Math.pow(1.022, Math.PI))); //exponential growth
      Array.from(marker).forEach(elem =>{
        if(elem.tagName == "text"){
          var y = elem.attributes.id.value.split(", ")[0];
          var x = elem.attributes.id.value.split(", ")[1];
          d3.select(elem).transition()
          .attr("x", function(){return projection([x, y])[0] - 6;})
          .attr("y", function(){return projection([x, y])[1];});
        }
      })
    }
  })
}
function set_up_legend_default(){
    var normal = document.getElementById("dnormal")
    var special = document.getElementById("dspecial")
    var sightseeing = document.getElementById("dsightseeing")

    normal.style.cursor = "pointer"
    
    normal.onclick = function(){
      if(normal.className == "fa-regular fa-square-check"){
        d3.selectAll(".normal").attr("display", "none")
        normal.className = "fa-regular fa-square"
        if(special.className == "fa-regular fa-square")
          sightseeing.className = "fa-regular fa-square"
      } 
      else{
        d3.selectAll(".normal").attr("display", null)
        normal.className = "fa-regular fa-square-check"
        if(sightseeing.className = "fa-regular fa-square")
          sightseeing.className = "fa-regular fa-square-check"
          //add only sightseeings that are normal
      }
    }

    special.style.cursor = "pointer"
    special.onclick = function(){
      if(special.className == "fa-regular fa-square-check"){
        d3.selectAll(".special").attr("display", "none")
        special.className = "fa-regular fa-square"
        if(normal.className == "fa-regular fa-square")
          sightseeing.className = "fa-regular fa-square"        
      } 
      else{
        d3.selectAll(".special").attr("display", null)
        special.className = "fa-regular fa-square-check"
        if(sightseeing.className = "fa-regular fa-square")
          sightseeing.className = "fa-regular fa-square-check"
          //add only sightseeings that are special
      }
    }

    sightseeing.style.cursor = "pointer"
    sightseeing.onclick = function(){
      if(sightseeing.className == "fa-regular fa-square-check"){
        d3.selectAll(".sightseeing").attr("display", "none")
        sightseeing.className = "fa-regular fa-square"   
      } 
      else{
        d3.selectAll(".sightseeing").attr("display", null)
        sightseeing.className = "fa-regular fa-square-check"
      }
    }
}

//data related methods
function extract_and_project_data_default() {
  //start http request
  var request = new XMLHttpRequest();

/************** extract data ********************/

  //open file
  request.open("GET", EXCEL_FILE, true);
  request.responseType = "arraybuffer";

  request.onload = function(e) {
    //get arraybuffer
    var arraybuffer = request.response;

    //convert data to binary string
    var raw_data = new Uint8Array(arraybuffer);
    var arr = new Array();
    for(var i = 0; i < raw_data.length; i++) 
      arr[i] = String.fromCharCode(raw_data[i]);
    var bin_str = arr.join("");

    //read bin_str
    var workbook = XLSX.read(bin_str, {type:"binary"});

    //get name of worksheet
    var first_sheet_name = workbook.SheetNames[0];

    //get worksheet
    var worksheet = workbook.Sheets[first_sheet_name];
    var data = XLSX.utils.sheet_to_json(worksheet,{raw:true});

/************** extract data ********************/
    // ---> data aquired :D
/************** project data ********************/   
    
    //as marker on map
    data.forEach(elem => {
        //get info of every element
        var name = elem.stamp_name;
        var lat = elem.latitude;
        var lng = elem.longitude;
        var special = elem.special;
        var sightseeing = elem.sightseeing;
        var trivia = elem.trivia;
        if(typeof trivia != 'undefined'){
          trivia = trivia.split(" | ");
        }         

        var clicked = false;
        var s = "marker"

        //if loction is not undefined -> project marker
        if(typeof lat != 'undefined' && typeof lng != 'undefined'){
            //get every location (if there is more than one)
            lat = lat.slice(0,-3).split(' | ');
            lng = lng.slice(0,-3).split(' | ');
          
            //place one marker for every location per stamp
          for(i = 0; i < lat.length; i++){
            default_svg.append("text")
                .attr("x", function(){ return projection([lng[i], lat[i]])[0] - 6})
                .attr("y", function(){ return projection([lng[i], lat[i]])[1] })    
                .attr("font-size", "12px")        
                //special color for special stamp
                .attr("fill", function(){
                    if(special == "nein") return "#308223"
                    else return "#6bc25d"
                })
                .attr("font-family", "FontAwesome")
                .text("\uf187")
                .attr("stroke", "black")
                .attr("stroke-width", 0.5)
                .attr("id", function(){ return lat[i] + ", " + lng[i];})
                .attr("class", function(){
                  
                  //different class for different stamps
                  if(special == "ja") s += " special"
                  else s += " normal"
                  if(sightseeing == "ja") s+= " sightseeing"
    
                  //extra class for stamps with multiple locations
                  if(lat.length > 1) return s + " " + name.replace(/\s|[()]|[0-9]/g, '');
                  else return s
                })
                
                .on("mouseover", function(){                   
                    //change marker back 
                    d3.selectAll(".marker").transition()                      
                    .duration(50)
                    .attr("font-size", "12px")        
                    .attr("transform", "translate(0, 0)")
                    //remove info
                    d3.selectAll('.text').remove()
                    
                    mouseover_marker(d3.select(this), name);                    

                    d3.select(this).on("click", function(){
                        clicked = true;                          
                    })
                    
                    mouseover_text_window(name, special, sightseeing, trivia, lat, lng);                    
                })
                .on("mouseout", function(){ 
                  mouseout_marker(clicked);                  
                })
          }
        }
    });
/************** project data ********************/ 
  }
  //end request
  request.send();
}
/************************default view******************************************/

/************************list view******************************************/
//viewBox
var spec_svg = d3.select("#spec_container .map_container")
.append("svg")
.attr("viewBox", `0 0 ${width} ${height}`)
.classed("view_box", true);

function start_spec(){
  //loading icon => tree
  spec_svg.append("text")
  .text("\uf1bb")
  .attr("font-family", "FontAwesome")
  .attr("font-size", "100px")
  .attr("fill", "black")
  .attr("opacity", 0.5)
  .attr("id", "specloading")
  .attr("x", function(){ return projection([10.57998, 51.84165])[0] + 9})
  .attr("y", function(){ return projection([10.57998, 51.84165])[1] + 75})

  //animation (blinking) while loading map
  function start_loading_spec(){
    if(d3.select("#specloading").attr("opacity") == 0.5){
      d3.select("#specloading").transition()
      .delay(20).duration(20)
      .attr("opacity", 0.3)
    }
    else{
      d3.select("#specloading").transition()
      .delay(20).duration(20)
      .attr("opacity", 0.5)
    }
  } 
  function stop_loading_spec(){
    clearInterval(loading_interval);
    d3.select("#specloading").attr("display", "none")
  }

  var loading_interval = setInterval(start_loading_spec , 500)

  //wait for background map to load until showing marker
  setTimeout(() => {
    setTimeout(() => { 
      extract_and_project_data_spec() 
      set_up_legend_spec()
    }, 1200)
    set_up_background_spec()
    stop_loading_spec()
  }, 1000)
  
}

//environmental methods (background, map, view ...)
function set_up_background_spec(){
  //map View (background)
  var map = new maplibregl.Map({
    container: 'spec_map',
    style: 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json',
    //Brocken -> center
    center: [10.8167, 51.7167],
    zoom: 8.2,
  });
  map.scrollZoom.disable();
  map.dragPan.disable();

  //remove credits
  var basemap = document.getElementById('spec_map');
  basemap.removeChild(basemap.children[2]);
  var basemap_canvas = basemap.children[1].children[0];

  //set dimensions of map view container
  basemap.children[1].id = "map_container_container";

  basemap_canvas.width = basemap.children[0].getBoundingClientRect().width;
  basemap_canvas.style.width = basemap.children[0].getBoundingClientRect().width + "px";
  basemap_canvas.height = basemap.children[0].getBoundingClientRect().height;
  basemap_canvas.style.height = basemap.children[0].getBoundingClientRect().height + "px";

  const mapResizeObserver = new ResizeObserver(() => {
    map.resize();
    //no zooming here yet
    map.zoomTo(_zoom);
  });
  mapResizeObserver.observe(basemap);
}
function set_up_legend_spec(){
  var normal = document.getElementById("snormal")
  var special = document.getElementById("sspecial")
  var sightseeing = document.getElementById("ssightseeing")

  normal.style.cursor = "pointer"
  
  normal.onclick = function(){
    //find rows of normal stamps
    var rows = Array.from(document.getElementsByClassName("normal"));
    //case: normal markers not hidden yet
    if(normal.className == "fa-regular fa-square-check"){
      //hide marker
      d3.selectAll(".normal").attr("display", "none");
      //filter and hide rows 
      rows = rows.filter(function(e){
        if(e.tagName == "TR") return true;
        else return false;
      });
      for(var i = 0; i < rows.length; i++){
        rows[i].style.display = "none";
      } 
      document.getElementById("type").innerHTML = "Sonderstempelstellen";    
      document.getElementById("empty_row").style.display = "none"; 
      //change check box
      normal.className = "fa-regular fa-square"

      //special marker already hidden -> change sightseeing check box as well
      if(special.className == "fa-regular fa-square")
        sightseeing.className = "fa-regular fa-square"
    }
    //case: normal markers hidden 
    else{
      //get markers back
      d3.selectAll(".normal").attr("display", null);
      //get rows back
      for(var i = 0; i < rows.length; i++){
        rows[i].style.display = null;
      }
      document.getElementById("type").innerHTML = "Normale Stempelstellen"; 
      document.getElementById("empty_row").style.display = null; 
      //change check box
      normal.className = "fa-regular fa-square-check"

      //change check box of sightseeing if it is unchecked -> 
      //some sightseeings come back with normal marker
      if(sightseeing.className == "fa-regular fa-square")
        sightseeing.className = "fa-regular fa-square-check"
    }
  }

  special.style.cursor = "pointer"
  special.onclick = function(){
    //find rows of special stamps
    var rows = Array.from(document.getElementsByClassName("special"));
    //case: special markers not hidden yet
    if(special.className == "fa-regular fa-square-check"){
      //hide marker
      d3.selectAll(".special").attr("display", "none");
      //filter and hide rows 
      rows = rows.filter(function(e){
        if(e.tagName == "TR") return true;
        else return false;
      });
      for(var i = 0; i < rows.length; i++){
        rows[i].style.display = "none";
      }
      document.getElementById("type").innerHTML = "Normale Stempelstellen";     
      document.getElementById("empty_row").style.display = "none"; 
      //change check box
      special.className = "fa-regular fa-square"

      //normal marker already hidden -> change sightseeing check box as well
      if(normal.className == "fa-regular fa-square")
        sightseeing.className = "fa-regular fa-square"        
    } 
    //case: special markers hidden
    else{
      //get markers back
      d3.selectAll(".special").attr("display", null);
      //get rows back
      for(var i = 0; i < rows.length; i++){
        rows[i].style.display = null;
      }      
      document.getElementById("empty_row").style.display = null; 
      //change check box
      special.className = "fa-regular fa-square-check"

      //change check box of sightseeing if it is unchecked -> 
      //some sightseeings come back with special marker
      if(sightseeing.className == "fa-regular fa-square"){
        sightseeing.className = "fa-regular fa-square-check"
        //case: special stamps are put back first
        document.getElementById("type").innerHTML = "Sonderstempelstellen";  
        document.getElementById("empty_row").style.display = "none";
      }  
    }
  }

  sightseeing.style.cursor = "pointer"
  sightseeing.onclick = function(){
    //find rows of sightseeing stamps
    var rows = Array.from(document.getElementsByClassName("sightseeing"));
    //case: sightseeing markers not hidden yet
    if(sightseeing.className == "fa-regular fa-square-check"){
      //hide marker
      d3.selectAll(".sightseeing").attr("display", "none");
      //filter and hide rows 
      rows = rows.filter(function(e){
        if(e.tagName == "TR") return true;
        else return false;
      });
      for(var i = 0; i < rows.length; i++){
        rows[i].style.display = "none";
      }      
      //change check box
      sightseeing.className = "fa-regular fa-square"   
    } 
    //case: sightseeing markers hidden 
    else{
      //get markers back
      d3.selectAll(".sightseeing").attr("display", null);
      //get rows back
      for(var i = 0; i < rows.length; i++){
        rows[i].style.display = null;
      }
      document.getElementById("empty_row").style.display = null; 
      //change check box
      sightseeing.className = "fa-regular fa-square-check"
    }
  }
}

//data related methods
function extract_and_project_data_spec(){
  //start http request
  var request = new XMLHttpRequest();

/************** extract data ********************/

  //open file
  request.open("GET", EXCEL_FILE, true);
  request.responseType = "arraybuffer";

  request.onload = function(e) {
    //get arraybuffer
    var arraybuffer = request.response;

    //convert data to binary string
    var raw_data = new Uint8Array(arraybuffer);
    var arr = new Array();
    for(var i = 0; i < raw_data.length; i++) 
      arr[i] = String.fromCharCode(raw_data[i]);
    var bin_str = arr.join("");

    //read bin_str
    var workbook = XLSX.read(bin_str, {type:"binary"});

    //get name of worksheet
    var first_sheet_name = workbook.SheetNames[0];

    //get worksheet
    var worksheet = workbook.Sheets[first_sheet_name];
    var data = XLSX.utils.sheet_to_json(worksheet,{raw:true});

/************** extract data ********************/
    // ---> data aquired :D
/************** project data ********************/   
    data.sort(sort_stamps);
    //as marker on map
    data.forEach(elem => {
      //get info of every element
      var name = elem.stamp_name;
      var lat = elem.latitude;
      var lng = elem.longitude;
      var special = elem.special;
      var sightseeing = elem.sightseeing;
      var trivia = elem.trivia;
      if(typeof trivia != 'undefined'){
        trivia = trivia.split(" | ");
      }        
      var s = "marker";

      if(typeof lat != "undefined" && typeof lng != "undefined"){
        //split in case there is more than one location
        lat = lat.slice(0,-3).split(" | ");
        lng = lng.slice(0,-3).split(" | ");

        //for every location on marker -> lng.length = lat.length
        for(var i = 0; i < lat.length; i++){
          spec_svg.append("text")
            .attr("x", function(){ return projection([lng[i], lat[i]])[0] - 6})
            .attr("y", function(){ return projection([lng[i], lat[i]])[1] })    
            .attr("font-size", "12px")        
            //special color for special stamp
            .attr("fill", function(){
              if(special == "nein") return "#308223"
              else return "#6bc25d"
            })
            .attr("font-family", "FontAwesome")
            .text("\uf187")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("id", function (){ return lat[i] + ", " + lng[i] })
            .attr("class", function(){                  
              //different class for different stamps
              if(special == "ja") s += " special"
              else s += " normal"
              if(sightseeing == "ja") s+= " sightseeing"

              //extra class for stamps with multiple locations
              if(lat.length > 1) return s + " " + name.replace(/\s|[()]|[0-9]/g, '');
              else return s
            });
        }
      }
    });

    //as table
    //table for table head
    var tab_head = document.getElementById("tab_head");
    var div = document.createElement("div");

    //headline - type stamps
    var stamp_type = document.createElement("h3");
    stamp_type.id = "type";
    stamp_type.innerHTML = "Normale Stempelstellen";
    
    //search field
    var icon = document.createElement("i");
    icon.className = "fa-solid fa-magnifying-glass";
    var search_field = document.createElement("INPUT");
    search_field.id = "search";
    search_field.setAttribute("type", "text");
    search_field.placeholder = "Suche...";

    //add children to div
    icon.append(search_field);
    div.append(stamp_type);
    div.append(icon);
    tab_head.append(div);
    
    var htable = document.createElement("table"); 
    tab_head.append(htable);

    //table head
    var head = htable.createTHead();
    var hrow0 = head.insertRow(0)

    var des_name = hrow0.insertCell(0);
    des_name.innerHTML = "Stempelstellenname";
    var des_lat = hrow0.insertCell(1);
    des_lat.style.textAlign = "center";
    des_lat.innerHTML = "Standort";
    var des_lng = hrow0.insertCell(2);
    des_lng.innerHTML = "Sehenswürdigkeit";
    des_lng.style.textAlign = "center";

    //table for table body
    var tab_body = document.getElementById("tab_body");
    var btable = document.createElement("table"); 
    tab_body.append(btable);   

    //table body
    var body = btable.createTBody();
    var i = 0;

    //normal stamps
    var norm_stamps = data.filter(filter_normal_stamps);
    norm_stamps.forEach(elem =>{
      var s = "marker normal";

      var row = body.insertRow(i);
      var name = row.insertCell(0);
      name.innerHTML = "<div class='tab_small'><label>Name:</label>" + elem.stamp_name + "</div>";      

      var location = row.insertCell(1);
      var lat = elem.latitude.slice(0,-3).split(' | ');
      var lng = elem.longitude.slice(0,-3).split(' | ');
      var str1 = "", str2 = "";
      for(var i = 0; i  < lat.length; i++){        
        str1 += "N" + lat[i] + "|<br>";
        str2 += "E" + lng[i] + "|<br>";
      }
      str1 = str1.slice(0,-4);
      str2 = str2.slice(0,-5);
      location.innerHTML = "<div class='tab_small'><label>Standort:</label><div><p>" + str1 + 
      "</p><p>" + str2 + "</p></div></div>";

      var sightseeing = row.insertCell(2);
      if(elem.sightseeing == "ja"){
        s += " sightseeing";
        var trivia = elem.trivia.split("|")[0];
        var url = trivia.replace(/[\[\]']+/g,"");
        url = url.split(",");
        url[1] = url[1].replace(/\s/g, '');
        var href="";
        if(url[0].includes("extern")){
          href = url[0].split('"')[3];
        }
        else if(url[0].includes("<a")){
          href = url[1] + url[0].split('"')[1];
        }
        else{
          href = url[1] + "#" + url[0];
        }
        sightseeing.innerHTML = 
        "<div class='tab_small'><label>Sehenswürdigkeit:</label><a href='" + href + "' target='_blank'>mehr zu " + 
        elem.stamp_name + "</a></div>";
      }
      else sightseeing.innerHTML = "<div class='tab_small'><label>Sehenswürdigkeit:</label>" + elem.sightseeing + "</div>";

      row.addEventListener("mouseover", function(){
        row.style.backgroundColor = "#308223";
        row.style.boxShadow = "0px 0px 10px #818281";
        row.style.color = "aliceblue";
        row.style.cursor = "pointer";        
        var marker = document.getElementsByClassName("marker");
        var searched_marker = Array.from(marker).filter(function(e){
          if(e.tagName == "text"){
            var _id = elem.latitude.slice(0,-3) + ", " + elem.longitude.slice(0,-3);
            var id = typeof e.attributes.id != "undefined" ? e.attributes.id.value : 'undefined';
            if(id == _id) return true;
            else return false;
          }          
        });
        //second marker -> first marker is on default map
        mouseover_marker(d3.select(searched_marker[1]), elem.stamp_name);
      });
      row.addEventListener("mouseout", function(){
        row.style.backgroundColor = "aliceblue";
        row.style.color = "black";
        row.style.boxShadow = "none";   
        mouseout_marker(false);
      });
      row.className = s;
      i += 1;
    });

    //empty_row
    var empty_row = body.insertRow(norm_stamps.length);
    empty_row.id = "empty_row";
    empty_row.style.height = "50px";

    i = norm_stamps.length + 1;
    //spec stamps
    var spec_stamps = data.filter(filter_special_stamps);
    spec_stamps.forEach(elem =>{
      var s = "marker special";

      var row = body.insertRow(i);
      var name = row.insertCell(0);
      name.innerHTML = "<div class='tab_small'><label>Name:</label>" + elem.stamp_name +"</div>";

      var location = row.insertCell(1);
      var lat = elem.latitude.slice(0,-3).split(' | ');
      var lng = elem.longitude.slice(0,-3).split(' | ');
      var str1 = "", str2 = "";
      for(var i = 0; i  < lat.length; i++){        
        str1 += "N" + lat[i] + "|<br>";
        str2 += "E" + lng[i] + "|<br>";
      }
      str1 = str1.slice(0,-4);
      str2 = str2.slice(0,-5);
      location.innerHTML = 
      "<div class='tab_small'><label>Standort:</label><p>" + str1 + 
      "</p><p>" + str2 + "</p></div>";

      var sightseeing = row.insertCell(2);
      if(elem.sightseeing == "ja"){
        s += " sightseeing";

        var trivia = elem.trivia.split("|").length > 1 ? 
        elem.trivia.split("|")[1] : elem.trivia.split("|")[0];
        var url = trivia.replace(/[\[\]']+/g,"");
        url = url.split(",");
        url[1] = url[1].replace(/\s/g, '');
        var href="";
        if(url[0].includes("extern")){
          href = url[0].split('"')[3];
        }
        else if(url[0].includes("<a")){
          href = url[1] + url[0].split('"')[1];
        }
        else{
          href = url[1] + "#" + url[0];
        }
        sightseeing.innerHTML = 
        "<div class='tab_small'><label>Sehenswürdigkeit:</label><a href='" + href + "' target='_blank'>mehr zu " + 
        elem.stamp_name + "</a></div>";
      }
      else sightseeing.innerHTML = "<div class='tab_small'><label>Sehenswürdigkeit:</label>" + elem.sightseeing + "</div>";

      row.addEventListener("mouseover", function(){
        row.style.backgroundColor = "#308223";
        row.style.boxShadow = "0px 0px 10px #818281";
        row.style.color = "aliceblue";
        row.style.cursor = "pointer";        
        var marker = document.getElementsByClassName("marker");
        var searched_marker = Array.from(marker).filter(function(e){
          if(e.tagName == "text"){
            var _id = elem.latitude.slice(0,-3).split(" | ")[0] + ", " + elem.longitude.slice(0,-3).split(" | ")[0];
            var id = typeof e.attributes.id != "undefined" ? e.attributes.id.value : 'undefined';
            if(id == _id) return true;
            else return false;
          }
        });
        //second marker -> first marker is on default map
        mouseover_marker(d3.select(searched_marker[1]), elem.stamp_name);
      });
      row.addEventListener("mouseout", function(){
        row.style.backgroundColor = "aliceblue";
        row.style.color = "black";
        row.style.boxShadow = "none";   
        mouseout_marker(false);
      });

      row.className = s;
      i += 1;
    });

    //scroll listener for table body
    tab_body.addEventListener("scroll", ()=>{
      var view_top = tab_body.scrollTop + 50;
      //var view_bottom = view_top + tab_body.clientHeight;
      var elem_top = empty_row.offsetTop;
      var elem_bottom = elem_top + empty_row.clientHeight;
      
      //change headline when empty row comes into view 
      //("touches" top border) -> start of special stamps
      if(elem_bottom > 0 && elem_bottom <= view_top){
        stamp_type.innerHTML = "Sonderstempelstellen";
        console.log("see me")
      }
      else{
        stamp_type.innerHTML = "Normale Stempelstellen";
        console.log("see me not")
      }
    });
    //search function
    search_field.addEventListener("keyup", search_function);

/************** project data ********************/ 
  };
  //end request
  request.send();
}
function search_function(){
  var list = [];

  if(document.getElementById("snormal").className == "fa-regular fa-square")
    list = document.getElementsByClassName("special");
  if(document.getElementById("sspecial").className == "fa-regular fa-square")
    list = document.getElementsByClassName("normal");
  if((document.getElementById("sspecial").className == "fa-regular fa-square" &&
    document.getElementById("snormal").className == "fa-regular fa-square") &&
    document.getElementById("ssightseeing").className == "fa-regular fa-square-check")
    list = document.getElementsByClassName("sightseeing");

  //hide markers and rows that are not searched for
  var rows = Array.from(list).filter(function(e){
    if(e.tagName == "TR") return true;
    return false;
  });

  rows.forEach(td => {
    var str = td.firstChild.innerHTML.replace(/[^äüö\w\s]/g, '');
    if(str.toLowerCase().startsWith(this.value.toLowerCase()) || 
      str.toLowerCase().includes(this.value.toLowerCase())){
      td.style.display = null;
    }
    else td.style.display = "none";
   
  });
}
/************************list view******************************************/

document.getElementById('spec_container').style.display = "none";
start_default();
start_spec();

var def_btn = document.querySelector('.spacing #dbutton');
def_btn.addEventListener("click", function(){
  //animation wechsel
  document.getElementById('default_container').style.display = "none";
  document.getElementById('spec_container').style.display = null;  
  
});
var sp_btn = document.querySelector('.spacing #sbutton');
sp_btn.addEventListener("click", function(){
  //animation wechsel
  document.getElementById('spec_container').style.display = "none";
  document.getElementById('default_container').style.display = null;  
});

//animation beim wechsel 6
//legend and search_function -> verbessern 7

//call python before loading data every other month (6 mon) 8
//verbessern von python 
//ref allgemeine links zur seite/karte 7
//links jeweils rechts unten 7
//info timer bevor wieder interagiert werden kann 7
//klicken <-> hovern bei tablet oder handy formaten 7
//art der seiten findung verbessern 7
//format positionen bei einigen stempeln seltsam 8
//format legende überarbeiten 8
//loading überarbeiten 8
//markieren wenn legenden betätigt wegmachen 9

/*default_svg.append("text")
    .attr("x", function(){ return projection([10.8167, 51.7167])[0] - 6})
    .attr("y", function(){ return projection([10.8167, 51.7167])[1] })
    .attr("font-size", "12px")  
    .attr("font-family", "FontAwesome")
    .text("\uf187")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5)
    .attr("fill", "red")
  
    default_svg.append("text")
    .attr("x", function(){ return projection([10.57998, 51.84165])[0] - 6})
    .attr("y", function(){ return projection([10.57998, 51.84165])[1] })
    .attr("font-size", "12px")  
    .attr("font-family", "FontAwesome")
    .text("\uf187")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5)
    .attr("fill", "red")


  //test marker
  new maplibregl.Marker().setLngLat([10.8167, 51.7167]) //Brocken
  .addTo(map);
  new maplibregl.Marker().setLngLat([10.57998, 51.84165]) //Eckertalsperre
  .addTo(map);*/

