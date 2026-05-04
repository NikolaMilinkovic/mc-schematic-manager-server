const bcrypt = require("bcryptjs");
const User = require("../models/user");

const TARGET_USERNAME = "";
const NEW_PASSWORD = "";

async function resetPassword() {
  try {
    const user = await User.findOne({ username: TARGET_USERNAME });
    if (!user) {
      console.log(`[resetPassword] User "${TARGET_USERNAME}" not found.`);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

    user.password = hashedPassword;
    await user.save();

    console.log(
      `[resetPassword] Password for "${TARGET_USERNAME}" updated successfully.`,
    );
  } catch (err) {
    console.error("[resetPassword] Error:", err);
  }
}

module.exports = resetPassword;
