
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/ChatController');
const staffAuthCheck = require('../middleware/satffAuthCheck');

// Staff chat interface - CORRECTED: This route should match your EJS file
router.get('/staff/patients', staffAuthCheck, chatController.chat);

// Patient chat interface (if needed)
router.get('/patient/chat', (req, res) => {
  res.render('patient/chat', {
    title: 'Patient Chat',
    patientId: req.user?.id || 'patient-001',
    patientName: req.user?.name || 'Patient'
  });
});

module.exports = router;