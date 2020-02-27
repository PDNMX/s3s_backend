const {tiposFalta, tiposSancion} = require('./code_lists.js');

const rest = data => {
    data.results.forEach(d => {
        d.tipoFalta = d.tipoFalta.clave==="OTRO"?d.tipoFalta:tiposFalta.find(element => element.clave===d.tipoFalta.clave);
        d.tipoSancion = d.tipoSancion.map(element => {
            let temporal = tiposSancion.find(e => e.clave === element.clave);
            return temporal ? temporal : element;
        });
        d.fechaCaptura = d.fechaCaptura.substring(0,10);
    });
    return data;
};

let createData = (item) => {
    let leyenda = "Dato no proporcionado";
    return {
        fechaCaptura: item.fecha_captura ? item.fecha_captura : leyenda,
        expediente: item.expediente ? item.expediente : leyenda,
        institucionDependencia: item.institucion_dependencia ? {
            nombre: item.institucion_dependencia.nombre ? item.institucion_dependencia.nombre : leyenda,
            siglas: (item.institucion_dependencia.siglas && item.institucion_dependencia.siglas.trim()) ? item.institucion_dependencia.siglas : null
        } : leyenda,
        servidorPublicoSancionado: {
            nombres: item.nombres ? item.nombres : '',
            primerApellido: item.primer_apellido ? item.primer_apellido : '',
            segundoApellido: item.segundo_apellido ? item.segundo_apellido : '',
            puesto: item.puesto ? item.puesto : leyenda
        },
        autoridadSancionadora: item.autoridad_sancionadora ? item.autoridad_sancionadora : leyenda,
        tipoFalta: {
            clave: "",
            valor: item.tipo_falta.trim() ? item.tipo_falta : leyenda
        },
        tipoSancion: (item.tipo_sancion && item.tipo_sancion==="INHABILITACION") ?[
            {
                clave: "I",
                valor: "INHABILITADO"
            }
        ]:[],
        causaMotivoHechos: item.causa ? item.causa : leyenda,
        resolucion: item.resolucion ? {
            fechaResolucion: item.resolucion.fecha_notificacion ? item.resolucion.fecha_notificacion : leyenda
        } : leyenda,
        multa: item.multa ? {
            monto: (item.multa.hasOwnProperty("monto") && item.multa.monto) ? item.multa.monto : leyenda,
            moneda: item.multa.hasOwnProperty("moneda")? {
                clave: item.multa.moneda,
                valor: item.multa.moneda
            } : {}
        } : leyenda,
        inhabilitacion: item.inhabilitacion ? {
            fechaInicial: (item.inhabilitacion.fecha_inicial && item.inhabilitacion.fecha_inicial.trim()) ? item.inhabilitacion.fecha_inicial : leyenda,
            fechaFinal: (item.inhabilitacion.fecha_final && item.inhabilitacion.fecha_final.trim()) ? item.inhabilitacion.fecha_final : leyenda,
            plazo: leyenda
        } : leyenda,
        observaciones: (item.inhabilitacion && item.inhabilitacion.observaciones) ?item.inhabilitacion.observaciones.trim():leyenda
    };
};

const sfp = data => {
    let data_ = data.results.map(item => {
        return createData(item)
    })
    data.results = data_;
    return data;
};

module.exports = {
    rest,
    sfp
};