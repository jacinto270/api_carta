const divCarta = document.getElementById("carta");
const url = "http://localhost/api_carta/api/platos";

//realizar un allamada ala api para obtener los platos de la carta
fetch(url)
  .then(respuesta => {
    if (!respuesta.ok) {
      throw new Error(`Error ${respuesta.status} al descargar los platos`);
    }
    return respuesta.json();
  })
  .then(platos => {
    console.log(platos);
    mostrarPlatos(platos);
  })
  .catch(error => {
    console.error(error);
  });   

  function mostrarPlatos(platos) {
    platos.forEach(plato => {
      const divPlato = document.createElement("div");
      divPlato.classList.add("plato");
      divPlato.innerHTML = `
        <h3>${plato.nombre}</h3>
        <p>Precio: ${plato.precio} €</p>
      `;
      divCarta.appendChild(divPlato);
      }); 
}