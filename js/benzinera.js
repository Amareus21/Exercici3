//array amb les dades de totes les benzineres
let arrayBenzEspana = [];
//array amb les provincies d'Espanya
const provincies = [];
//map amb els municipis i provincies
const municipis = new Map();
//map amb els tipus de combustible i el nom de la variable
const tipusBenzina = new Map([
  ["Gasolina 95 E5", "Precio Gasolina 95 E5"],
  ["Gasolina 98 E5", "Precio Gasolina 98 E5"],
  ["Gasoleo A", "Precio Gasoleo A"],
  ["Gasoleo Premium", "Precio Gasoleo Premium"],
]);
//objecte map de leaflet
let map;
//url de l'api amb les dades de les benzineres
const url =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/";

function inici() {
  document
    .getElementById("list-provincies")
    .addEventListener("change", afegirMunicipis);
  document
    .getElementById("list-municipis")
    .addEventListener("change", afegirCarburants);
  document
    .getElementById("list-benzineres")
    .addEventListener("change", activarBotoBuscar);
  document
    .getElementById("aceptar")
    .addEventListener("click", buscarBenzineraMesBarata);
  map = L.map("map", {
    center: [40.4165, -3.70256],
    zoom: 6,
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  peticioAjax(url, mostrarDades);
}

//funcio per fer una crida Ajax passant per parametres la url i la funcio per processar les dades
function peticioAjax(url, funcio) {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == XMLHttpRequest.DONE && xhttp.status == 200) {
      funcio(this);
    }
  };
  xhttp.onprogress = (progress) => {
    if (progress.loaded === progress.total) {
      document.getElementById("div-carrega").style.display = "none";
      document.getElementById("map").style.display = "block";
      map.invalidateSize(false);
    }
  };
  xhttp.open("GET", url, true);

  xhttp.send();
}
//funcio que processa les dades rebudes
function mostrarDades(xhttp) {
  let dades = JSON.parse(xhttp.responseText);
  arrayBenzEspana = JSON.parse(JSON.stringify(dades.ListaEESSPrecio));
  let markers = L.markerClusterGroup();
  arrayBenzEspana.forEach((element) => {
    if (!provincies.includes(element.Provincia)) {
      provincies.push(element.Provincia);
    }

    municipis.set(element.Municipio, element.Provincia);

    let marker = marcadorsMap(element);
    marker.bindPopup(crearPopUp(element)).openPopup();
    marker.mesBarata = true;
    markers.addLayer(marker);
    map.addLayer(markers);
  });
  afegirProvincies();
}
//funcio que afegeix les provincies a la llista
function afegirProvincies() {
  for (let provincia of provincies) {
    afegirOpcions(provincia, "provincies");
  }
  document.getElementById("list-provincies").disabled = false;
}
//funcio que afegeix els municipis a la llista
function afegirMunicipis() {
  let provincia = document.getElementById("list-provincies").value;
  let datalist = document.getElementById("municipis");
  while (datalist.firstChild) {
    datalist.removeChild(datalist.firstChild);
  }
  if (provincies.includes(provincia)) {
    document.getElementById("list-municipis").disabled = false;
    document.getElementById("list-municipis").value = "";
    document.getElementById("list-benzineres").value = "";
    document.getElementById("list-benzineres").disabled = true;
    document.getElementById("aceptar").disabled = true;
    for (const [key, value] of municipis) {
      if (value === provincia) {
        afegirOpcions(key, "municipis");
      }
    }
  } else {
    document.getElementById("list-municipis").value = "";
    document.getElementById("list-benzineres").value = "";
    document.getElementById("list-benzineres").disabled = true;
    document.getElementById("list-municipis").disabled = true;
    document.getElementById("aceptar").disabled = true;
  }
}
//funcio que afegeix el tipus de carburant a la llista
function afegirCarburants() {
  let municipi = document.getElementById("list-municipis").value;
  let datalist = document.getElementById("benzineres");
  while (datalist.firstChild) {
    datalist.removeChild(datalist.firstChild);
  }
  if (municipis.has(municipi)) {
    document.getElementById("list-benzineres").value = "";
    document.getElementById("list-benzineres").disabled = false;
    document.getElementById("aceptar").disabled = true;
    for (const key of tipusBenzina.keys()) {
      afegirOpcions(key, "benzineres");
    }
  } else {
    document.getElementById("list-benzineres").value = "";
    document.getElementById("list-benzineres").disabled = true;
    document.getElementById("aceptar").disabled = true;
  }
}
//funcio per activar el boto de busqueda
function activarBotoBuscar() {
  let benzina = document.getElementById("list-benzineres").value;
  if (tipusBenzina.has(benzina)) {
    document.getElementById("aceptar").disabled = false;
  } else {
    document.getElementById("aceptar").disabled = true;
  }
}
//funcio per mostra la benzinera mes barata de un municipi
function buscarBenzineraMesBarata() {
  let municipi = document.getElementById("list-municipis").value;
  let tipus = document.getElementById("list-benzineres").value;
  let nomPreuBenzina = tipusBenzina.get(tipus);
  let benzinaMesBarata = mesBarata(municipi, nomPreuBenzina);
  if (benzinaMesBarata) {
    map.flyTo(
      [
        parseFloat(benzinaMesBarata["Latitud"].replace(",", ".")),
        parseFloat(benzinaMesBarata["Longitud (WGS84)"].replace(",", ".")),
      ],
      19
    );
  } else {
    Swal.fire({
      icon: "error",
      title: "Sense Combustible",
      text: "No hi ha cap gasolinera amb aquest combustible en el municipi",
    });
  }
}
//funcio per afegir les opcions a las llistes
function afegirOpcions(opcio, id) {
  let dataList = document.getElementById(id);
  let option = document.createElement("option");
  option.value = opcio;
  option.textContent = opcio;
  dataList.appendChild(option);
  document.getElementById("list-provincies").disabled = false;
}
//funcio que retorna un objecte Marker
function marcadorsMap(element) {
  return L.marker([
    parseFloat(element["Latitud"].replace(",", ".")),
    parseFloat(element["Longitud (WGS84)"].replace(",", ".")),
  ]);
}
//funcio per crear un popUp de leaflet
function crearPopUp(element) {
  let popup =
    `<h4><strong>${element["Rótulo"]}</strong></h4>` +
    `<h5>DIRECCIÓ: ${element["Dirección"]}</h5>` +
    `<h5>MUNICIPI: ${element["Municipio"]}</h5>` +
    `<p>Preu Gasolina 95: ${element["Precio Gasolina 95 E5"]}€</p>` +
    `<p>Preu Gasolina 98: ${element["Precio Gasolina 98 E5"]}€</p>` +
    `<p>Preu Gasoleo A: ${element["Precio Gasoleo A"]}€</p>` +
    `<p>Preu Gasoleo Premium: ${element["Precio Gasoleo Premium"]}€</p>`;
  return popup;
}
//funcio que retorna la benzinera mes barata rebent com a parametre el municipi i el tipus de benzina
function mesBarata(municipi, tipus) {
  let benzMesBarata = arrayBenzEspana
    .filter((x) => x.Municipio === municipi)
    .reduce(function (valoranterior, valoractual) {
      let actual = parseFloat(valoractual[tipus].replace(",", "."));
      let anterior = parseFloat(valoranterior[tipus].replace(",", "."));
      if (isNaN(actual)) {
        return valoranterior;
      }
      if (isNaN(anterior)) {
        return valoractual;
      }
      if (actual <= anterior) {
        return valoractual;
      } else {
        return valoranterior;
      }
    });
  if (benzMesBarata[tipus] === "") {
    return null;
  }
  return benzMesBarata;
}
