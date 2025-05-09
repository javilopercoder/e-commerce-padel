import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import productos from "../data/productos.json";
import palaspadel from "../assets/palaspadel.png";
import useInView from "../hooks/useInView";
import flechaIcon from "../assets/flecha.png"; // import arrow icon

// Componente con animación al aparecer en el viewport
const AnimateOnScroll = ({ children, animation = "fade-up", delay = 0, duration = 800, className = "", ...props }) => {
  const [ref, isVisible] = useInView({ threshold: 0.1 });
  
  const animations = {
    'fade-up': 'opacity-0 translate-y-10',
    'fade-down': 'opacity-0 -translate-y-10',
    'fade-left': 'opacity-0 translate-x-10',
    'fade-right': 'opacity-0 -translate-x-10',
    'zoom-in': 'opacity-0 scale-95',
    'zoom-out': 'opacity-0 scale-105',
  };

  return (
    <div
      ref={ref}
      className={`transition-all transform ${className} ${isVisible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : animations[animation]}`}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const PadelPage = () => {
  const location = useLocation();
  // Estados para filtros y búsqueda
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroMarca, setFiltroMarca] = useState("Todos");
  const [ordenPrecio, setOrdenPrecio] = useState("desc");
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosVisibles, setProductosVisibles] = useState([]);
  const [bannerVisible, setBannerVisible] = useState(false);
  
  const productosPorPagina = 20;

  // Lista de marcas únicas para el filtro de marcas - CORREGIDO
  const marcas = Array.from(new Set(productos
    .filter(p => p.atributos && p.atributos.Marca)
    .map(p => p.atributos.Marca)));

  // Efecto para la animación del banner
  useEffect(() => {
    const timer = setTimeout(() => {
      setBannerVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Leer parámetros tipo y marca de la URL y aplicar filtros
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tipoParam = params.get('tipo');
    const marcaParam = params.get('marca');
    
    if (tipoParam) {
      setFiltroTipo(tipoParam);
    }
    
    if (marcaParam) {
      setFiltroMarca(marcaParam);
    }

    setPaginaActual(1);
  }, [location.search]);

  // Hacer scroll suave al tope de la lista de productos al cambiar filtros (solo cuando hay query)
  useEffect(() => {
    if (location.search) {
      const params = new URLSearchParams(location.search);
      if (params.get('tipo') || params.get('marca')) {
        const el = document.getElementById('productos-lista');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.search]);

  // Añadir manejo de especificaciones y limpieza de datos
  const limpiarAtributos = (atributos) => {
    const atributosLimpios = {};
    for (const [clave, valor] of Object.entries(atributos)) {
      if (valor && valor.toLowerCase() !== "unknown" && valor.toLowerCase() !== "none") {
        atributosLimpios[clave] = valor;
      }
    }
    return atributosLimpios;
  };

  // Modificar la función de filtrado para usar los valores correctos del JSON
  const filtrarProductos = () => {
    let filtrados = productos.filter((producto) => {
      // Adecuar los valores del filtro a los valores del JSON
      let tipoCondicion = filtroTipo === "Todos";
      
      if (filtroTipo === "Principiante") {
        tipoCondicion = producto.atributos && 
          producto.atributos["Nivel de Juego"] && 
          (producto.atributos["Nivel de Juego"].toLowerCase().includes("iniciacion") || 
           producto.atributos["Nivel de Juego"].toLowerCase().includes("iniciación") ||
           producto.atributos["Nivel de Juego"].toLowerCase().includes("principiante"));
      } else if (filtroTipo === "Equilibrada") {
        tipoCondicion = producto.atributos && 
          producto.atributos["Tipo de Juego"] && 
          producto.atributos["Tipo de Juego"].toLowerCase().includes("polivalente");
      } else if (filtroTipo === "Ofensiva") {
        tipoCondicion = producto.atributos && 
          producto.atributos["Nivel de Juego"] && 
          producto.atributos["Nivel de Juego"].toLowerCase().includes("avanzado");
      } else if (filtroTipo === "Defensiva") {
        tipoCondicion = producto.atributos && 
          producto.atributos["Tipo de Juego"] && 
          producto.atributos["Tipo de Juego"].toLowerCase().includes("control");
      } else if (filtroTipo === "Potencia") {
        tipoCondicion = producto.atributos && 
          producto.atributos["Tipo de Juego"] && 
          producto.atributos["Tipo de Juego"].toLowerCase().includes("potencia");
      }
      
      // CORREGIDO: Comprobar la marca en el objeto atributos
      const marcaCondicion = filtroMarca === "Todos" || 
                            (producto.atributos && 
                             producto.atributos.Marca === filtroMarca);
      
      const busquedaCondicion = producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
      
      return tipoCondicion && marcaCondicion && busquedaCondicion;
    });

    // Ordenar por precio
    filtrados.sort((a, b) =>
      ordenPrecio === "asc" ? a.precio_actual - b.precio_actual : b.precio_actual - a.precio_actual
    );

    // Limpiar atributos de cada producto
    return filtrados.map((producto) => ({
      ...producto,
      atributos: limpiarAtributos(producto.atributos),
    }));
  };

  // count filtered products and pages
  const filteredCount = filtrarProductos().length;
  const paginas = Math.ceil(filteredCount / productosPorPagina);

  // Actualizar productos visibles cuando cambian los filtros o la página
  useEffect(() => {
    const productosFiltered = filtrarProductos();
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    setProductosVisibles(productosFiltered.slice(inicio, fin));
  }, [filtroTipo, filtroMarca, ordenPrecio, busqueda, paginaActual]);

  // Función para cambiar de página
  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
    // Scroll al inicio de los productos
    document.getElementById("productos-lista").scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner hero */}
      <div className="relative h-screen w-full flex items-center justify-center">
        <img 
          src={palaspadel} 
          alt="Palas de Pádel" 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${bannerVisible ? 'opacity-100' : 'opacity-80'}`}
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div 
            className={`text-center text-white transition-all duration-1000 transform ${
              bannerVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
            }`}
          >
            <h1 className="text-5xl font-bold mb-6 tracking-wide">Palas de Pádel</h1>
            <p className="text-xl max-w-2xl mx-auto mb-12">Encuentra la pala perfecta para tu juego con nuestra selección premium de las mejores marcas.</p>
            
            {/* Flecha animada hacia abajo */}
            <div 
              className="cursor-pointer animate-bounce mx-auto"
              onClick={() => document.getElementById("productos").scrollIntoView({ behavior: "smooth" })}
            >
              <svg 
                className="w-10 h-10 text-white opacity-80 hover:opacity-100 transition-opacity" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                >
                </path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div id="productos" className="container mx-auto p-8 md:p-12 bg-gray-50 flex-grow">
        <AnimateOnScroll animation="fade-up" duration={1000}>
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 space-y-4 md:space-y-0">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Explora Nuestras Palas</h2>
              <div className="w-24 h-1 bg-blue-600 mt-2"></div>
            </div>

            {/* Filtros y búsqueda con diseño mejorado */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <select
                  value={filtroTipo}
                  onChange={(e) => {
                    setFiltroTipo(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="appearance-none bg-white pl-4 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                >
                  <option value="Todos">Todos los niveles</option>
                  <option value="Principiante">Iniciación</option>
                  <option value="Equilibrada">Intermedio</option>
                  <option value="Ofensiva">Avanzado</option>
                  <option value="Defensiva">Control</option>
                  <option value="Potencia">Potencia</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={filtroMarca}
                  onChange={(e) => { setFiltroMarca(e.target.value); setPaginaActual(1); }}
                  className="appearance-none bg-white pl-4 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                >
                  <option value="Todos">Todas las marcas</option>
                  {marcas.map((marca) => (
                    <option key={marca} value={marca}>{marca}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              
              <div className="relative">
                <select
                  value={ordenPrecio}
                  onChange={(e) => setOrdenPrecio(e.target.value)}
                  className="appearance-none bg-white pl-4 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                >
                  <option value="desc">Precio: Mayor a Menor</option>
                  <option value="asc">Precio: Menor a Mayor</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar pala..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="pl-4 pr-10 py-2 w-full border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>

        {/* Lista de productos con animaciones */}
        <div id="productos-lista" className="mx-auto py-8 px-4 sm:px-6 w-full max-w-7xl bg-white rounded-xl shadow-sm">
          <div className="mx-auto">
            {/* Resultados encontrados */}
            <AnimateOnScroll animation="fade-up" className="mb-6 text-sm text-gray-500">
              {filtrarProductos().length} resultados encontrados
            </AnimateOnScroll>
            
            {/* Grid de productos */}
            <div className="mt-6">
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {productosVisibles.map((producto, index) => (
                  <AnimateOnScroll 
                    key={`${producto.id}-${index}`} 
                    animation="zoom-in" 
                    delay={index % 4 * 100}
                    className="group relative"
                  >
                    <Link 
                      to={`/palas-de-padel/${producto.id}`}
                      className="block h-full overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg border border-gray-100"
                    >
                      {/* Etiqueta de descuento si existe */}
                      {producto.descuento && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-block bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                            -{producto.descuento}%
                          </span>
                        </div>
                      )}
                      
                      {/* Imagen */}
                      <div className="aspect-square overflow-hidden bg-gray-50 p-4">
                        <img
                          src={producto.img.startsWith('/assets') ? producto.img : `/assets${producto.img}`}
                          alt={producto.nombre}
                          className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      
                      {/* Detalles */}
                      <div className="p-4 bg-white border-t border-gray-100">
                        <h3 className="text-sm text-gray-700 font-medium mb-1">{producto.nombre}</h3>
                        <div className="flex items-center">
                          <p className="text-base font-bold text-gray-900">{producto.precio_actual}€</p>
                          {producto.precio_antiguo && (
                            <p className="ml-2 text-sm line-through text-gray-500">{producto.precio_antiguo}€</p>
                          )}
                        </div>
                        
                        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="text-xs inline-flex items-center font-medium bg-blue-600 text-white px-3 py-1 rounded-full">
                            Ver detalles
                            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </AnimateOnScroll>
                ))}
              </ul>
            </div>
            
            {/* Paginación */}
            {paginas > 1 && (
            <AnimateOnScroll animation="fade-up" className="mt-12 flex justify-center">
              <nav className="flex items-center space-x-1">
                <button
                  onClick={() => paginaActual > 1 && cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className={`p-2 rounded-full ${
                    paginaActual === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-50 hover:text-blue-800'
                  }`}
                >
                  <span className="sr-only">Anterior</span>
                  <img src={flechaIcon} alt="" className="h-4 w-4 transform -scale-x-100" />
                </button>
                
                {[...Array(Math.min(3, paginas))].map((_, i) => {
                  let pageNum;
                  if (paginaActual === 1) {
                    pageNum = i + 1;
                  } else if (paginaActual === paginas) {
                    pageNum = paginas - 2 + i;
                  } else {
                    pageNum = paginaActual - 1 + i;
                  }
                  
                  if (pageNum > 0 && pageNum <= paginas) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => cambiarPagina(pageNum)}
                        className={`px-3 py-1 rounded-md ${
                          paginaActual === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={() => paginaActual < paginas && cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === paginas}
                  className={`p-2 rounded-full ${
                    paginaActual === paginas
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-50 hover:text-blue-800'
                  }`}
                >
                  <span className="sr-only">Siguiente</span>
                  <img src={flechaIcon} alt="" className="h-4 w-4" />
                </button>
              </nav>
            </AnimateOnScroll>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PadelPage;
