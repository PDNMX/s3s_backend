const axios = require('axios');
const GQL_REQUEST_TIMEOUT = parseInt(process.env.GQL_REQUEST_TIMEOUT || 30000, 10);

const fetchEntities = endpoint => {
    const query = `query busca{
                    results_dependencias (ordenCampo:nombre, ordenSentido:desc){
                        nombre
                    }
                }`;

    const opts = {
        url: endpoint.url,
        method: "POST",
        timeout: GQL_REQUEST_TIMEOUT,
        headers: {
            authorization: endpoint.token
        },
        data: JSON.stringify({
            query: query,
            variables: {},
        })
    };


    return new Promise((resolve, reject) => {
        try {
            return axios(opts).then(response => {
                let {data} = response;
                const entities = data.data.results_dependencias.map(e => {
                    e.supplier_id = endpoint.supplier_id;
                    return e;
                });
                resolve(entities);
            }).catch(e => {
                console.error(e);
                resolve([])
            })
        } catch (e) {
            console.log("Error:", e);
            resolve([]);
        }
    });

};

const fetchData = (endpoint, options) => {
    const {pageSize, page, query, sort} = options;
    let gql_query = `
        query busca($filtros : FiltrosInput, $limit : Int, $offset : Int, $ordenCampo: ORDEN_CAMPO, $ordenSentido: ORDEN_SENTIDO){
            results(filtros : $filtros, limit : $limit, offset : $offset, ordenCampo: $ordenCampo, ordenSentido: $ordenSentido){
                nombres
                primer_apellido
                segundo_apellido
                institucion_dependencia{
                    nombre
                    siglas
                }
                autoridad_sancionadora
                expediente
                resolucion{
                    fecha_notificacion
                }
                tipo_sancion
                tipo_falta
                inhabilitacion{
                    fecha_inicial
                    fecha_final
                    observaciones
                }
                multa{
                    monto
                    moneda
                }
                causa
                puesto
            }
            total(filtros: $filtros)
        }
    `;


    if (query.hasOwnProperty('institucionDependencia')) {
        query.nombre = query.institucionDependencia;
        delete (query.institucionDependencia)
    }
    if (query.hasOwnProperty('primerApellido')) {
        query.primer_apellido = query.primerApellido;
        delete (query.primerApellido)
    }
    if (query.hasOwnProperty('segundoApellido')) {
        query.segundo_apellido = query.segundoApellido;
        delete (query.segundoApellido)
    }
    if (query.hasOwnProperty('tipoSancion')) {
        if (query.tipoSancion.includes("I"))
            query.tipo_sancion = "INHABILITACION";
        else
            query.tipo_sancion = query.tipoSancion.join(",")
        delete (query.tipoSancion)
    }


    let variables = {
        "limit": pageSize,
        "offset": pageSize * (page - 1),
        "filtros": query
    };

    if (sort) {
        let campo = Object.keys(sort)[0];
        let sentido = Object.values(sort)[0];

        if (campo === 'nombres' || campo === 'primerApellido') {
            variables.campoOrden = (campo === "primerApellido") ? "primer_apellido" : campo
            variables.ordenSentido = sentido
        }
    }
    const opts = {
        url: endpoint.url,
        method: 'POST',
        timeout: GQL_REQUEST_TIMEOUT,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            authorization: endpoint.token
        },
        data: JSON.stringify({
            query: gql_query,
            variables: variables,
        })
    };

    return new Promise((resolve, reject) => {
        return axios(opts).then(response => {
            const {data} = response;
            try {
                data.supplier_name = endpoint.supplier_name;
                data.supplier_id = endpoint.supplier_id;
                data.levels = endpoint.levels;
                data.endpoint_type = endpoint.type;
                data.pagination = {
                    pageSize: pageSize,
                    page: page,
                    totalRows: parseInt(data.total)
                };
                resolve(data);
            } catch (e) {
                console.log("Error: ", e);
                reject(e)
            }

        }).catch(e => {
            console.log("Error: ", e);
            reject(e)
        });
    })

};

module.exports = {
    fetchEntities,
    fetchData
};