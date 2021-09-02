var express = require('express');
var cors = require ('cors');

var router = express.Router();
router.use(cors());

const endpoints = require('../../endpoints');
const rest_data = require('./rest_data');
const graphql_data = require('./graphql_data');
const dt = require('./data_transformation');

let makeFiltros = (body)=> {
    const params = [
        'nombres',
        'primerApellido',
        'segundoApellido',
        'institucionDependencia',
        'curp',
        'rfc',
        'tipoSancion'
    ];
    let filtros = body.query ? body.query : {};
    let query = {};

    for (const k of params){
        if (filtros.hasOwnProperty(k) && typeof filtros[k] !== 'undefined' && filtros[k] !== null && filtros[k] !== '') {
            query[k] = filtros[k];
        }
    }
    return query;
}

router.post('/entities', (req, res) => {
    /* entidades de uno o más proveedores de información
    las entidades debería traer:
    nivel de gobierno
    supplier_id
    un proveedor de información podría traer de varios niveles*/
    const {nivel_gobierno} = req.body;
    let endpoints_ = [];

    if (typeof nivel_gobierno !== 'undefined' && nivel_gobierno !== null && nivel_gobierno !== '') {
        endpoints_ = endpoints.filter(e => e.levels.includes(nivel_gobierno));
    } else {
        endpoints_ = endpoints;
    }

    let promises = endpoints_.map( endpoint => {
        if (endpoint.type === 'REST') {
            return rest_data.fetchEntities(endpoint);
        } else if (endpoint.type === 'GRAPHQL'){
            return graphql_data.fetchEntities(endpoint)
        }
    });

    let entities = [];
    const cfn = (a, b) => {
        if(a.nombre < b.nombre) { return -1; }
        if(a.nombre > b.nombre) { return 1; }
        return 0;
    };
    Promise.all(promises).then( data => {
        // asignar supplier_id
        const dl = data.length;
        for (let i=0; i < dl; i++){
            if(Array.isArray(data[i])){
                entities = entities.concat(data[i].map(entity => {
                    entity.supplier_id = i;
                    return entity;
                }));
            }
        }
        res.json(entities.sort(cfn));
    }).catch(error => {
        console.error(error);
        res.json(entities.sort(cfn));
    });

});

router.post('/summary', (req, res)=> {
    // búsqueda general
    const { body } =  req;
    const { nivel_gobierno } = body;

    let options = {
        page: 1,
        pageSize: 1,
        query : {}
    };

    options.query = makeFiltros(body);
    //si seleccionó nivel, filtrar endpoints
    let endpoints_ = [];

    if (typeof nivel_gobierno !== 'undefined'&& nivel_gobierno !== null && nivel_gobierno !== ''){
        endpoints_ = endpoints.filter(e => e.levels.includes(nivel_gobierno));
    } else {
        endpoints_ = endpoints;
    }

    let queries = endpoints_.map( endpoint => {
        let options_ = JSON.parse(JSON.stringify(options));
        if (endpoint.type === 'REST'){
            return rest_data.fetchData(endpoint, options_).catch( error => ({
                supplier_id: endpoint.supplier_id,
                supplier_name: endpoint.supplier_name,
                levels: endpoint.levels,
                error: true
            }) );
        } else if (endpoint.type === 'GRAPHQL'){
            return graphql_data.fetchData(endpoint, options_).catch( error => ({
                supplier_id: endpoint.supplier_id,
                supplier_name: endpoint.supplier_name,
                levels: endpoint.levels,
                error: true
            }));
        }
    });

    Promise.all(queries).then( data => {
        let summary = data.map (d => {
            if (typeof d.error !== 'undefined'){
                return d;
            } else {
                return {
                    supplier_id: d.supplier_id,
                    supplier_name: d.supplier_name,
                    levels: d.levels,
                    totalRows: d.pagination.totalRows
                }
            }
        });
        res.json(summary);
    }).catch(error => {
        console.log(error);
        res.status(500).json({
            error: "Algo salio mal..."
        });
    });
});

router.post('/search', (req, res) => {
    const { body } = req;
    const { supplier_id } = body;
    let {
        page,
        pageSize
    } =  body;

    if (typeof page === 'undefined' || page === null || isNaN(page)){
        page = 1;
    }

    if (typeof pageSize === 'undefined' || pageSize === null || isNaN(pageSize)){
        pageSize = 10;
    }

    let endpoint = endpoints.find(d => d.supplier_id === supplier_id);

    let options = {
        page,
        pageSize,
        query: {}
    };

    options.query = makeFiltros(body);
    options.sort = body.sort;

    if (endpoint.type === 'REST') {
        rest_data.fetchData(endpoint, options).then(data => {
            res.json(dt.rest(data));
        }).catch( e => {
            console.log(e);
            res.status(500).json({
                error: "Algo salio mal..."
            });
        });
    } else if (endpoint.type === 'GRAPHQL'){
        graphql_data.fetchData(endpoint, options).then(data => {
            res.json(dt.sfp(data));
        }).catch( e => {
            console.log(e);
            res.status(500).json({
                error: "Algo salio mal"
            });
        });
    }

});

module.exports = router;