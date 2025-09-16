const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../module/Admin");

// Register Admin
exports.registerAdmin = async (req, res) => {
  try {
    // const { email, password } = req.body;
    //     console.log("email, password", email, password);

    // Default admin credentials
    const email = "admin@gmail.com";
    const password = "admin@123";

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }
    // console.log("email, password", email, password);
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Save admin
    const admin = await Admin.create({ email, password: hashedPassword });

    res.status(201).json({
      message: "Admin registered successfully",
      adminId: admin.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login Admin
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isPasswordValid = bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
