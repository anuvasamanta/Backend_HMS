const express=require('express')
const EjsController=require("../controllers/EjsController")
const verifyToken=require('../middleware/verifyRoleToken')
const route=express.Router()

route.get('/staff-login',EjsController.login)
route.get('/admin/create-hospital',verifyToken("admin"),EjsController.hospitalForm)
route.get('/admin/edit/hospital/:id',verifyToken("admin"),EjsController.editForm)
route.get('/admin/create-staff',verifyToken("admin"),EjsController.staffForm)
route.get('/admin/assign/shifting/:id',verifyToken("admin"),EjsController.shifting)
module.exports=route