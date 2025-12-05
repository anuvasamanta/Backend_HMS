const Joi = require("joi");

const userValidation = Joi.object({
  name: Joi.string().min(2).max(50).required(),

  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required(),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits"
    }),

  location: Joi.string().min(2).max(100).required(),

  password: Joi.string()
    .min(6)
    .required(),

  role: Joi.string()
    .valid("admin", "doctor", "nurse", "patient", "staff")
    .default("patient")
});
const loginValidation = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Invalid email format',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
});

const hospitalSettingsSchema = Joi.object({
  hospitalName: Joi.string().required().trim(),
  address: Joi.string().required().trim(),
  contactEmail: Joi.string().email().required().trim().lowercase(),
  contactPhone: Joi.string().required().trim(),
  workingHours: Joi.object({
    openingTime: Joi.string().required(),
    closingTime: Joi.string().required(),
  }),
  appointmentRules: Joi.object({
    maxAppointmentsPerDay: Joi.number().default(50),
    allowOnlineBooking: Joi.boolean().default(true),
  }),
  emergencySettings: Joi.object({
    ambulanceService: Joi.boolean().default(true),
    emergencyContact: Joi.string(),
  }),
});

const doctorProfileValidation = Joi.object({
  qualification: Joi.string().required(),
  experience: Joi.number().required(),
  timing: Joi.string().required(),
  language: Joi.string().required(),

});

const updateDoctorProfile = Joi.object({
  qualification: Joi.string(),
  experience: Joi.number(),
  timing: Joi.string(),
  language: Joi.string().required(),
});

module.exports = { userValidation, loginValidation, hospitalSettingsSchema, doctorProfileValidation, updateDoctorProfile };
