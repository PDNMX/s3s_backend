const {tiposFalta, tiposSancion} = require('./code_lists.js');
const leyenda = "Dato no proporcionado";

const rest = data => {
    data.results.forEach(d => {
        d.fechaCaptura = d.fechaCaptura.substring(0,10);
        d.expediente = d.expediente ? d.expediente : leyenda;
        d.servidorPublicoSancionado.segundoApellido = d.servidorPublicoSancionado.segundoApellido ? d.servidorPublicoSancionado.segundoApellido : '';
        d.autoridadSancionadora = d.autoridadSancionadora ? d.autoridadSancionadora : leyenda;
        d.tipoFalta ={
            clave: d.tipoFalta.clave,
            valor: d.tipoFalta.clave === "OTRO" ? 'OTRO' + (d.tipoFalta.descripcion ? ' ('+d.tipoFalta.descripcion+')' : '') : tiposFalta.find(element => element.clave === d.tipoFalta.valor)
        };
        d.tipoSancion = d.tipoSancion.map(element => {
            let temporal = tiposSancion.find(e => e.clave === element.clave);
            return temporal ? temporal : element;
        });

        d.multa= {
            monto: (d.multa && d.multa.monto) ? d.multa.monto : leyenda,
            moneda:  {
                clave: (d.multa && d.multa.moneda && d.multa.moneda.clave) ? d.multa.moneda.clave : '',
                valor: (d.multa && d.multa.moneda && d.multa.moneda.valor) ? d.multa.moneda.valor : ''
            }
        };
        d.inhabilitacion = {
            plazo : d.inhabilitacion && d.inhabilitacion.plazo ? d.inhabilitacion.plazo : leyenda,
            fechaInicial: d.inhabilitacion && d.inhabilitacion.fechaInicial ? d.inhabilitacion.fechaInicial : '-',
            fechaFinal: d.inhabilitacion && d.inhabilitacion.fechaFinal ? d.inhabilitacion.fechaFinal : '-',
        }
        d.resolucion= {
            fechaResolucion: d. resolucion && d.resolucion.fecha_notificacion ? d.resolucion.fecha_notificacion : leyenda
        } ;

    });
    return data;
};

let createData = (item) => {

    return {
        fechaCaptura: item.fecha_captura ? item.fecha_captura : leyenda,
        expediente: item.expediente ? item.expediente : leyenda,
        institucionDependencia: {
            nombre: item.institucion_dependencia ? item.institucion_dependencia.nombre : leyenda,
            siglas: (item.institucion_dependencia.siglas && item.institucion_dependencia.siglas.trim()) ? item.institucion_dependencia.siglas : ''
        },
        servidorPublicoSancionado: {
            nombres: item.nombres ? item.nombres : leyenda,
            primerApellido: item.primer_apellido ? item.primer_apellido : leyenda,
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
        multa: {
            monto: (item.multa && item.multa.monto) ? item.multa.monto : leyenda,
            moneda:  {
                clave: item.multa && item.multa.moneda ? item.multa.moneda : '',
                valor: item.multa && item.multa.moneda ? item.multa.moneda : ''
            }
        } ,
        inhabilitacion:  {
            fechaInicial: (item.inhabilitacion && item.inhabilitacion.fecha_inicial && item.inhabilitacion.fecha_inicial.trim()) ? item.inhabilitacion.fecha_inicial : leyenda,
            fechaFinal: (item.inhabilitacion && item.inhabilitacion.fecha_final && item.inhabilitacion.fecha_final.trim()) ? item.inhabilitacion.fecha_final : leyenda,
            plazo: item.inhabilitacion && item.inhabilitacion.plazo ? item.inhabilitacion.plazo : leyenda
        },
        observaciones: (item.inhabilitacion && item.inhabilitacion.observaciones) ? item.inhabilitacion.observaciones.trim() : leyenda
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