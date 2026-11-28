
const express = require('express');
const router = express.Router();

const EmpleadosController = require('../controllers/EmpleadosController');

// Listar empleados
router.get('/', (req, res) =>
    EmpleadosController.listar(req, res)
);

// Obtener empleado por ID
router.get('/:id', (req, res) =>
    EmpleadosController.obtenerUno(req, res)
);

// Crear empleado
router.post('/', (req, res) =>
    EmpleadosController.crear(req, res)
);

// Actualizar empleado
router.put('/:id', (req, res) =>
    EmpleadosController.actualizar(req, res)
);

// Eliminar empleado
router.delete('/:id', (req, res) =>
    EmpleadosController.eliminar(req, res)
);

module.exports = router;
