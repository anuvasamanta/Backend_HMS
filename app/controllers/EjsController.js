const HospitalSettings = require('../model/hospitalSetting.model')
const UserModel = require('../model/userModel')
const StatusCode = require("../helper/statusCode")
class EjsController {
  // login page
  async login(req, res) {
    try {
      return res.render('auth/login', { title: "Login_Page" })
    } catch (error) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "Internal server error!" })
    }
  }
  // create hospital form
  async hospitalForm(req, res) {
    try {
      return res.render('admin_Management/createHospital', { title: "Create_Hospital" })
    } catch (error) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "Internal server error!" })
    }
  }
  // edit hospital form
  async editForm(req, res) {
    try {
      const { id } = req.params;

      // Fetch the hospital data from database
      const hospital = await HospitalSettings.findById(id);

      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found!" });
      }

      return res.render('admin_Management/editHospital', {
        title: "Edit_Hospital",
        hospital: hospital
      });
    } catch (error) {
      console.error("Error in editForm:", error);
      return res.status(500).json({ message: "Internal server error!" });
    }
  }
  // create staff form
  async staffForm(req, res) {
    try {

      // Fetch all hospitals from DB
      const hospitals = await HospitalSettings.find();

      return res.render("admin_Management/createStaff", {
        title: "Create Hospital Staff",
        hospitals: hospitals   // pass to EJS
      });

    } catch (error) {
      console.log(error);
      return res.status(500).send("Internal Server Error");
    }
  }
  // shifting file
  async shifting(req, res) {
    try {
        const userId = req.params.id;
        const user = await UserModel.findById(userId);

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/list-staff");
        }

        return res.render("admin_Management/assignShift", {
            title: "Assign Shift & Department",
            user,
            success: req.flash("success"),
            error: req.flash("error")
        });

    } catch (error) {
        console.log("SHOW ASSIGN PAGE ERROR:", error);
        req.flash("error", "Something went wrong");
        return res.redirect("/admin/list-staff");
    }
  }

}

module.exports = new EjsController()
