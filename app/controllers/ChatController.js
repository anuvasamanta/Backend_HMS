
class ChatController {
  async chat(req, res) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        req.flash('error', 'Please login to access chat');
        return res.redirect('/auth/login');
      }
      
      // Get user information
      const userId = req.user.id.toString();
      const userName = req.user.name || req.user.username || 'User';
      const userRole = req.user.role || 'staff'; // Assuming role field exists
      const userEmail = req.user.email || '';
      
      // Determine if user is staff or patient
      const isStaff = userRole === 'staff' || userRole === 'doctor' || userRole === 'admin' || userRole === 'receptionist';
      
      if (isStaff) {
        // Render staff chat interface
        return res.render('staff_Management/chat', {
          title: "Staff Chat Dashboard",
          staffId: userId,
          staffName: userName,
          userRole: userRole,
          userEmail: userEmail,
          isStaff: true,
          user: req.user,
          // Add socket server URL for client-side
          socketServer: 'http://localhost:8400'
        });
      } else {
        // Render patient chat interface (if you have one)
        return res.render('patient/chat', {
          title: "Patient Chat",
          patientId: userId,
          patientName: userName,
          userRole: userRole,
          userEmail: userEmail,
          isStaff: false,
          user: req.user,
          socketServer: 'http://localhost:8400'
        });
      }
    } catch (error) {
      console.error('Error in chat controller:', error);
      req.flash('error', 'Error loading chat interface');
      return res.redirect('/');
    }
  }
}

module.exports = new ChatController();
