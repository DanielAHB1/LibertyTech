const test = require('node:test');

const assert = require('node:assert/strict');

const {
    calcularISSS,
    calcularAFP,
    calcularISRQuincenal,
    calcularBoleta
} = require('../src/services/NominaService');

// PRUEBA 1: CALCULAR ISSS

test('Debe calcular correctamente el ISSS del 3%', () => {

    const resultado = calcularISSS(400);

    assert.equal(resultado, 12);

});

// PRUEBA 2: CALCULAR AFP

test('Debe calcular correctamente el AFP del 7.25%', () => {

    const resultado = calcularAFP(400);

    assert.equal(resultado, 29);

});

// PRUEBA 3: TECHO DEL ISSS

test('El ISSS no debe superar el techo de cotización', () => {

    const resultado = calcularISSS(700);

    assert.equal(resultado, 15);

});

// PRUEBA 4: CALCULAR ISR

test('Debe calcular correctamente el ISR quincenal', () => {

    assert.equal(calcularISRQuincenal(275), 0);

    assert.equal(calcularISRQuincenal(300), 11.33);

    assert.equal(calcularISRQuincenal(500), 40.48);

    assert.equal(calcularISRQuincenal(1100), 168.57);

});

// PRUEBA 5: GENERAR BOLETA

test('Debe generar correctamente una boleta quincenal', () => {

    const empleado = {

        id_empleado: 1,

        nombre: 'Ana',

        apellido: 'Perez',

        salario_mensual: 800

    };

    const resultado = calcularBoleta(empleado);

    assert.equal(resultado.salario_bruto, 400);

    assert.equal(resultado.deducciones.isss, 12);

    assert.equal(resultado.deducciones.afp, 29);

    assert.equal(resultado.deducciones.isr, 17.23);

    assert.equal(resultado.salario_neto, 341.77);

});

// PRUEBA 6: RECHAZAR SALARIO NEGATIVO

test('No debe aceptar salarios negativos', () => {

    assert.throws(() => {

        calcularBoleta({

            salario_mensual: -100

        });

    }, /mayor o igual a cero/);

});