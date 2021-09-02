const axios = require('axios');
const qs = require('qs');


//En caso de error regresa un arreglo vacio para no interrumpir el flujo de las demás promises
const fetchEntities = endpoint => {
    return getToken(endpoint).then(token_data => {
        const {access_token} = token_data.data;
        const opts = {
            url: endpoint.entities_url,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer '+access_token,
            },
            json: true,
            timeout:process.env.TIMEOUT_DATA
        };
        return axios(opts).then(response => {
            return response.data
        }).catch(error => {
                    console.log(error);
                    return [];
                });
    }).catch(error => {
        console.log(error);
        return [];
    });
};

const fetchData = (endpoint, options) => {
    return getToken(endpoint).then(token_data => {
        const {access_token} = token_data.data;
        let opts = {
            url: endpoint.url,
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            data: options,
            json: true,
            timeout:process.env.TIMEOUT_DATA
        };
        return axios(opts).then(response => {
            let data = response.data;
            data.supplier_name = endpoint.supplier_name;
            data.supplier_id = endpoint.supplier_id;
            data.levels = endpoint.levels;
            data.endpoint_type = endpoint.type;
            return data;
        });
    });
};

const getToken = endpoint => {
    const opts = {
        url: endpoint.token_url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify({
            grant_type: 'password',
            username: endpoint.username,
            password: endpoint.password,
            client_id: endpoint.client_id,
            client_secret: endpoint.client_secret,
            scope:endpoint.scope
        }),
        json: true,
        timeout:process.env.TIMEOUT_TOKEN
    };
    return axios(opts);
};

module.exports = {
    fetchData,
    fetchEntities
};