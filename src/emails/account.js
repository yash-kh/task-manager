var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER_NAME,
        pass: process.env.PASS_WORD
    }
});

const welcomeEmail = (name, email) => {
    var mailOptions = {
        from: process.env.USER_NAME,
        to: email,
        subject: 'Welcome To Task Manager',
        text: `Hi ${name} Welcome to your new Task Manager app`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
    });
}
const deleteEmail = (name, email) => {
    var mailOptions = {
        from: process.env.USER_NAME,
        to: email,
        subject: 'Account removed Successfully',
        text: `Hi ${name} your account is removed sucessfully`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
    });
}

module.exports = {
    welcomeEmail,
    deleteEmail
}
