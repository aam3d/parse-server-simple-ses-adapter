var ses = require('node-ses');
const hbs = require("handlebars");
const fs = require("fs");
const path = require("path");

var SimpleSESAdapter = sesOptions => {

  if (!sesOptions || !sesOptions.apiKey || !sesOptions.apiSecret || !sesOptions.domain || !sesOptions.fromAddress) {
    throw 'SimpleSESAdapter requires an API Key, domain, and fromAddress.';
  }
  
  if(!sesOptions.amazon){
    sesOptions.amazon = 'https://email.us-east-1.amazonaws.com';
  }

  if(!sesOptions.verificationTemplate){
    sesOptions.verificationTemplate = './templates/verificationTemplate.html';
  }

  if(!sesOptions.amazon){
    sesOptions.passwordResetTemplate = './templates/passwordResetTemplate.html';
  }
  
  var client = ses.createClient({ key: sesOptions.apiKey, secret: sesOptions.apiSecret, amazon : sesOptions.amazon });

  var sendMail = mail => {
    var data = {
      to: mail.to,
      from: sesOptions.fromAddress,
      subject: mail.subject,
    };

    if (sesOptions.format === 'text') {
      data.altText = mail.text;
    } else {
      data.message = mail.text;
    }

    return new Promise((resolve, reject) => {
      client.sendEmail(data, function(err, body, res) {
        if (typeof err !== 'undefined' && err) {
          console.log(err);
          reject(err);
        }
        resolve(body);
      });
    });
  };
  
  const sendVerificationEmail = data => {
    const { user, appName } = data;
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(__dirname, sesOptions.verificationTemplate), "utf-8", (error, buffer) => {
        if (error) {
          reject(error);
        } else {
          const template = hbs.compile(buffer);
          resolve(sendMail({to: data.to, subject: data.subject, text: template(data)}));
        }
      });
    });
  }
  
  const sendPasswordResetEmail = data => {
      const { user, appName } = data;
      return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname,sesOptions.passwordResetTemplate), "utf-8", (error, buffer) => {
          if (error) {
            reject(error);
          } else {
            const template = hbs.compile(buffer);
            resolve(sendMail({to: data.to, subject: data.subject, text: template(data)}));
          }
        });
      });
  }

  return Object.freeze({
    sendMail: sendMail,
    sendVerificationEmail,
    sendPasswordResetEmail
  });
};

module.exports = SimpleSESAdapter;
