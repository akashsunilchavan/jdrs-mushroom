const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Supervisor = require("../module/Supervisor");

// Register Admin
exports.registerSupervisor = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if email already exists
    const existing = await Supervisor.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create supervisor
    const supervisor = await Supervisor.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    // Remove password before sending response
    const { password: _, ...supervisorData } = supervisor.toJSON();

    res.status(201).json({
      success: true,
      message: "Supervisor registered successfully",
      supervisor: supervisorData,
    });
  } catch (error) {
    console.error("Error registering supervisor:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Login Admin
// exports.loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const admin = await Admin.findOne({ where: { email } });
//     if (!admin) {
//       return res.status(404).json({ message: "Admin not found" });
//     }

//     const isPasswordValid = bcrypt.compareSync(password, admin.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "Invalid password" });
//     }

//     const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, {
//       expiresIn: "1h",
//     });

//     res.json({
//       message: "Login successful",
//       adminId: admin.id,
//       token,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };
