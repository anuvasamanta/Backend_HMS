const express = require('express')
const route = express.Router()
const AttendanceController = require("../controllers/AttendenceController")
const verifyToken = require('../middleware/verifyRoleToken')

/**
 * @swagger
 * /admin/attendence-table:
 *  get:
 *    summary: Get all the attendence from Database 
 *    tags:
 *       - admin
 *    produces:
 *      - application/json
 *    responses:
 *      '200':
 *        description: data fetched successfully.
 */
route.get('/admin/attendence-table', verifyToken("admin"), AttendanceController.getAttendance)

module.exports = route