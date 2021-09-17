import ApolloClient, {InMemoryCache} from "apollo-boost";
import {gql} from "apollo-boost";
import 'cross-fetch/polyfill';
import fs from "fs";

const fetchEntities = endpoint => {
    const client = new ApolloClient({
        uri: endpoint.url,
        cache: new InMemoryCache({
            addTypename: false
        }),
        headers: {
            authorization: endpoint.token
        }
    });

    return new Promise((resolve, reject) => {
        client.query({
            query: gql`
                query busca{
                    results_dependencias (ordenCampo:nombre, ordenSentido:desc){
                        nombre
                    }
                }
            `,
            fetchPolicy: 'no-cache',
        }).then(data => {
            try {
                const entities = data.data.results_dependencias.map(e => {
                    e.supplier_id = endpoint.supplier_id;
                    return e;
                });
                resolve(entities);
            } catch (e) {
                console.log("Error:", e);
                resolve([]);
            }
        }).catch(error =>{
            console.log("Error",error)
            resolve([])
        })
    });
};

const fetchData = (endpoint, options) => {
    const {pageSize, page, query,sort} = options;

    const client = new ApolloClient({
        uri: endpoint.url,
        cache: new InMemoryCache({
            addTypename: false
        }),
        headers: {
            authorization: endpoint.token
        }
    });

    let gql_query = gql`
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

    if(sort){
        let campo = Object.keys(sort)[0];
        let sentido = Object.values(sort)[0];

        if(campo === 'nombres' || campo === 'primerApellido'){
            variables.campoOrden = (campo === "primerApellido") ? "primer_apellido": campo
            variables.ordenSentido = sentido
        }
    }

    return new Promise((resolve, reject) => {
        client.query({
            query: gql_query,
            variables: variables,
            fetchPolicy: 'no-cache'
        }).then(result => {
            let {data} = result;
            data.supplier_name = endpoint.supplier_name;
            data.supplier_id = endpoint.supplier_id;
            data.levels = endpoint.levels;
            data.endpoint_type = endpoint.type;
            data.pagination = {
                pageSize:pageSize,
                page:page,
                totalRows: parseInt(data.total)
            };
            resolve(data);
        }).catch(error => {
            console.log("Error: ", error);
            reject(error)
        })
    });


};


const itera = (endpoint,options, idFile) => {
    if(!idFile){
        idFile = uuidv4();
        fs.mkdirSync(`./${idFile}`);
    }
    return fetchData(endpoint, options).then(async (res) => {
        let {pagination, results} = res;
        let path = `./${idFile}/${endpoint.supplier_id}_${pagination.page}.json`;
        let data = JSON.stringify(results);
        fs.writeFileSync(path, data);
        let hasNextPage = (Math.trunc(pagination.totalRows / (pagination.pageSize * pagination.page)));
        if (hasNextPage > 0) {
            options.page += 1;
            return itera(endpoint, options, idFile);
        } else{
            const zip = await generateZipForPath(`${idFile}`);
            return zip;
        }
    }).catch(error => {
        console.log(error)
        return null;
    });
};

const getBulk = async (endpoint,options) => {
    let data = await itera(endpoint,options);
    return data;
}

module.exports = {
    fetchEntities,
    fetchData,
    getBulk
};