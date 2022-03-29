require("dotenv").config();

const getAPICode = function (walletID) {
    return new Promise((resolve) => {
      resolve({ code: "5VyoBsmmw6VaNgKzP", secret: "2RsX43axozrbkUMRQa1p8kM8hMc1" });
    });
}

module.exports = {
  getAPICode
}