let nodemailer = require('nodemailer')
let moment = require('moment')

let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
})

function sendEmail(mailOptions) {
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) console.log(err)
  })
}

function createAndSendEmail(options) {
  let contentHTML = composeEmail(options)
  const mailOptions = {
    from: process.env.GMAIL_USERNAME,
    to: options.form.data['Email'],
    subject: 'HMFIK UPH Medan',
    html: contentHTML
  }
  sendEmail(mailOptions)
}

function composeEmail(options) {
  if (options.form.status === 'ACCEPTED') {
    return `
      <div style="margin:auto">
        <section style="max-width:480px; margin:0 auto; padding:0; box-sizing:border-box; border-style:inset;">
          <header style="background-color: rgb(0, 255, 255) ; text-align: center; padding: 12px 0;" >${options.event.name}</header>
          <div class="row" style="border-style: solid; border-width:thin;  ">
              <h1 style="text-align: center">Status : <span style="color:lightgreen;">Accepted</span></h1>
              <strong><p style="text-align: center">Description : Congratulation , you've completed the payment</p></strong>
          </div>
          <div class="row" style="border-style: solid; border-width: thin; ">
            <u><h1 style="text-align: center">Student Detail</h1></u>
            <p style="text-align: center;">
              Student ID : ${options.form.data['Student ID']}
            </p>
            <p style="text-align: center;">
              Name : ${options.form.data['Full Name']}
            </p>
            <p style="text-align: center;">
              Study Program : ${options.form.data['Study Program']}
            </p>
          </div>
        </section>
      </body>
    `
  } else if (options.form.status === 'CONFIRMATION') { 
    return `
    <div>
      <section style="max-width: 480px; margin:0 auto; padding:0; box-sizing: border-box; border-style:inset;">
          <header style="background-color: rgb(9, 228, 9) ; text-align: center; padding: 12px 0;" >${options.event.name}</header>
          <div class="row" style="border-style: solid; border-width:thin;  ">
              <h1 style="text-align: center">Status : WAITING FOR PAYMENT</h1>
              <strong><p style="text-align: center">Description : Please pay Rp. ${options.form.price.toLocaleString()} before ${moment(options.event.paymentDate).format('dddd, Do MMMM YYYY [at] HH:mm')} to ensure your
              participation</p></strong>
          </div>
          <div class="row" style="border-style: solid; border-width: thin; ">
            <u><h1 style="text-align: center">Student Detail</h1></u>
            <p style="text-align: center;">
              Student ID : ${options.form.data['Student ID']}
            </p>
            <p style="text-align: center;">
              Name : ${options.form.data['Full Name']}
            </p>
            <p style="text-align: center;">
              Study Program : ${options.form.data['Study Program']}
            </p>
          </div>
      </section>
    </div>
    `
  } else if (options.form.status === 'WAITING') { 
    return `
    <div>
        <section style="max-width: 480px ;
        margin: 0 auto ;padding: 0;
        box-sizing: border-box; 
        border-style: inset;">
            <header style="background-color: rgb(119, 0, 255) ; text-align: center; padding: 12px 0;" >${options.event.name}</header>
            <div class="row" style="border-style: solid; border-width:thin;  ">
                <h1 style="text-align: center">Status : IN WAITING LIST</h1>
                <strong><p style="text-align: center">Description : Sorry the available seat is full, you got the ${options.formatOrderedNumber(options.form.slotNumber)} place in the waiting list</p></strong>
            </div>
            <div class="row" style="border-style: solid; border-width: thin; ">
              <u><h1 style="text-align: center">Student Detail</h1></u>
              <p style="text-align: center;">
                Student ID : ${options.form.data['Student ID']}
              </p>
              <p style="text-align: center;">
                Name : ${options.form.data['Full Name']}
              </p>
              <p style="text-align: center;">
                Study Program : ${options.form.data['Study Program']}
              </p>
            </div>
        </section>
    </div>
    `
  } else if (options.form.status === 'REJECTED') { 
    return `
    <div>
        <section class="verify" style="max-width: 480px ;
        margin: 0 auto ;padding: 0;
        box-sizing: border-box; 
        border-style: inset;">
          <header style="background-color: rgb(255, 8, 0) ; text-align: center; padding: 12px 0;" >${options.event.name}</header>
          <div class="row" style="border-style: solid; border-width:thin;  ">
              <h1 style="text-align: center">Status : <span style="color:red;">REJECTED</span></h1>
              <strong><p style="text-align: center">Description : Sorry, but you can't participate in this event</p></strong>
          </div>
          <div class="row" style="border-style: solid; border-width: thin; ">
            <u><h1 style="text-align: center">Student Detail</h1></u>
            <p style="text-align: center;">
              Student ID : ${options.form.data['Student ID']}
            </p>
            <p style="text-align: center;">
              Name : ${options.form.data['Full Name']}
            </p>
            <p style="text-align: center;">
              Study Program : ${options.form.data['Study Program']}
            </p>
          </div>
        </section>
    </div>
    `
  }
}

module.exports = {
  createAndSendEmail
}